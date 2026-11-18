import socket
import time
from typing import Dict, Any, Optional, Tuple
import certifi
import dns.resolver
from pymongo import MongoClient, ASCENDING
from pymongo.database import Database
from app.core.config import settings
from app.core.logging import logger

_mongo_client: Optional[MongoClient] = None
_dns_patched = False
_dns_cache: Dict[str, Tuple[str, float]] = {}
_DNS_CACHE_TTL_SECONDS = 300.0


def _install_mongodb_dns_resilience() -> None:
    """
    Harden DNS resolution for *.mongodb.net hosts against flaky ISP / hotspot DNS resolvers
    ([Errno 11001] getaddrinfo failed) by caching resolved IPs and falling back to 8.8.8.8 / 1.1.1.1.
    """
    global _dns_patched
    if _dns_patched:
        return
    _dns_patched = True

    # 1. Ensure dnspython SRV lookups also fall back to public DNS servers
    try:
        resolver = dns.resolver.get_default_resolver()
        for ns in ("8.8.8.8", "1.1.1.1"):
            if ns not in resolver.nameservers:
                resolver.nameservers.append(ns)
        resolver.lifetime = max(float(getattr(resolver, "lifetime", 5.0)), 8.0)
    except Exception:
        pass

    # 2. Wrap socket.getaddrinfo ONLY for *.mongodb.net hostnames
    orig_getaddrinfo = socket.getaddrinfo
    fallback_resolver = dns.resolver.Resolver(configure=False)
    fallback_resolver.nameservers = ["8.8.8.8", "1.1.1.1"]
    fallback_resolver.lifetime = 4.0

    def _resilient_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
        is_mongo_host = isinstance(host, str) and host.lower().endswith(".mongodb.net")
        if not is_mongo_host:
            return orig_getaddrinfo(host, port, family, type, proto, flags)

        now = time.monotonic()
        try:
            res = orig_getaddrinfo(host, port, family, type, proto, flags)
            if res:
                # Cache first resolved IPv4/IPv6 address
                ip = res[0][4][0]
                _dns_cache[host] = (ip, now + _DNS_CACHE_TTL_SECONDS)
            return res
        except socket.gaierror:
            # Check in-memory cache first
            cached = _dns_cache.get(host)
            if cached and cached[1] > now:
                ip = cached[0]
                return orig_getaddrinfo(ip, port, family, type, proto, flags)

            # Resolve via public DNS (8.8.8.8 / 1.1.1.1)
            try:
                answers = fallback_resolver.resolve(host, "A")
                if answers:
                    ip = answers[0].address
                    _dns_cache[host] = (ip, now + _DNS_CACHE_TTL_SECONDS)
                    return orig_getaddrinfo(ip, port, family, type, proto, flags)
            except Exception:
                # Last resort: use stale cached IP if one exists
                if cached:
                    return orig_getaddrinfo(cached[0], port, family, type, proto, flags)
            raise

    socket.getaddrinfo = _resilient_getaddrinfo  # type: ignore[assignment]


def get_mongo_client() -> MongoClient:
    """Create or return cached PyMongo client configured strictly from MONGODB_URI in .env."""
    global _mongo_client
    if _mongo_client is None:
        uri = (settings.MONGODB_URI or "").strip()
        if not uri:
            raise RuntimeError(
                "MONGODB_URI is not configured. Please set MONGODB_URI in backend/.env or environment variables."
            )
        _install_mongodb_dns_resilience()
        _mongo_client = MongoClient(
            uri,
            tlsCAFile=certifi.where(),
            retryReads=True,
            retryWrites=True,
            readPreference="primaryPreferred",
            serverSelectionTimeoutMS=20000,
            connectTimeoutMS=15000,
            socketTimeoutMS=30000,
            heartbeatFrequencyMS=10000,
            maxIdleTimeMS=45000,
            maxPoolSize=20,
        )
    return _mongo_client


def get_mongo_db() -> Database:
    """Return the active MongoDB database handle (MONGODB_DB_NAME from .env)."""
    client = get_mongo_client()
    return client[settings.MONGODB_DB_NAME]


def ensure_mongo_indexes(db: Optional[Database] = None) -> None:
    """Ensure all MongoDB collections have primary integer-id and domain indexes."""
    database = db if db is not None else get_mongo_db()

    collections = [
        "tenants",
        "tenant_settings",
        "subscription_plans",
        "subscriptions",
        "users",
        "otp_verifications",
        "departments",
        "branches",
        "employees",
        "shifts",
        "employee_shifts",
        "attendances",
        "leave_types",
        "leave_requests",
        "uniform_items",
        "uniform_distributions",
        "notifications",
        "audit_logs",
        "work_breaks",
        "work_updates",
        "support_tickets",
        "daily_uniforms",
        "company_bank_accounts",
        "employee_salary_profiles",
    ]

    for col in collections:
        database[col].create_index([("id", ASCENDING)], unique=True)

    # Unique business keys & tenant-scoped query indexes
    database["tenants"].create_index([("subdomain", ASCENDING)], unique=True, sparse=True)
    database["tenant_settings"].create_index([("tenant_id", ASCENDING)], unique=True)
    database["subscription_plans"].create_index([("code", ASCENDING)], unique=True)
    database["subscriptions"].create_index([("tenant_id", ASCENDING)], unique=True)
    database["users"].create_index([("email", ASCENDING)], unique=True)
    database["users"].create_index([("tenant_id", ASCENDING)])
    database["otp_verifications"].create_index([("email", ASCENDING)])
    database["departments"].create_index([("tenant_id", ASCENDING)])
    database["branches"].create_index([("tenant_id", ASCENDING)])
    database["employees"].create_index([("user_id", ASCENDING)], unique=True)
    database["employees"].create_index([("tenant_id", ASCENDING), ("employee_id_number", ASCENDING)])
    database["shifts"].create_index([("tenant_id", ASCENDING)])
    database["employee_shifts"].create_index([("tenant_id", ASCENDING), ("employee_id", ASCENDING)])
    database["attendances"].create_index([("tenant_id", ASCENDING), ("employee_id", ASCENDING), ("date", ASCENDING)])
    database["leave_types"].create_index([("tenant_id", ASCENDING)])
    database["leave_requests"].create_index([("tenant_id", ASCENDING), ("employee_id", ASCENDING)])
    database["uniform_items"].create_index([("tenant_id", ASCENDING)])
    database["uniform_distributions"].create_index([("tenant_id", ASCENDING), ("employee_id", ASCENDING)])
    database["notifications"].create_index([("tenant_id", ASCENDING), ("is_read", ASCENDING)])
    database["audit_logs"].create_index([("tenant_id", ASCENDING), ("created_at", ASCENDING)])
    database["work_breaks"].create_index([("tenant_id", ASCENDING), ("employee_id", ASCENDING), ("date", ASCENDING)])
    database["work_updates"].create_index([("tenant_id", ASCENDING), ("employee_id", ASCENDING), ("date", ASCENDING)])
    database["support_tickets"].create_index([("tenant_id", ASCENDING), ("employee_id", ASCENDING), ("status", ASCENDING)])
    database["daily_uniforms"].create_index([("tenant_id", ASCENDING), ("date", ASCENDING)])
    database["company_bank_accounts"].create_index([("tenant_id", ASCENDING)], unique=True)
    database["employee_salary_profiles"].create_index([("tenant_id", ASCENDING), ("employee_id", ASCENDING)], unique=True)


def check_db_connection() -> Dict[str, Any]:
    """Verify MongoDB connectivity via admin ping and return server metadata."""
    try:
        client = get_mongo_client()
        client.admin.command("ping")
        server_info = client.server_info()
        db = get_mongo_db()
        return {
            "connected": True,
            "database": settings.MONGODB_DB_NAME,
            "engine": "MongoDB",
            "version": server_info.get("version", "unknown"),
            "collections": db.list_collection_names(),
        }
    except Exception as e:
        logger.error(f"MongoDB connection check failed: {e}")
        return {
            "connected": False,
            "error": str(e),
        }
