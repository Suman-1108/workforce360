from __future__ import annotations

import copy
import re
from datetime import date, datetime, time, timezone
from decimal import Decimal
from typing import Any, Callable, Dict, List, Optional, Sequence, Tuple, Type, Union

from pymongo import ASCENDING, DESCENDING, ReturnDocument
from pymongo.database import Database

from app.database.connection import get_mongo_db

# Global registry mapping model class names -> MongoDocument subclasses
_MODEL_REGISTRY: Dict[str, Type["MongoDocument"]] = {}


# ---------------------------------------------------------------------------
# BSON Serialization / Hydration Helpers
# ---------------------------------------------------------------------------

def _serialize_value(value: Any) -> Any:
    """Convert Python types to clean BSON-compatible MongoDB values."""
    if value is None:
        return None
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, time):
        return value.strftime("%H:%M:%S")
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, list):
        return [_serialize_value(v) for v in value]
    if isinstance(value, dict):
        return {k: _serialize_value(v) for k, v in value.items()}
    return value


def _deserialize_value(value: Any, field_type: Optional[Type]) -> Any:
    """Hydrate BSON MongoDB values back into expected Python domain types."""
    if value is None:
        return None
    if field_type is datetime:
        if isinstance(value, datetime):
            return value if value.tzinfo is not None else value.replace(tzinfo=timezone.utc)
        if isinstance(value, str):
            dt = datetime.fromisoformat(value)
            return dt if dt.tzinfo is not None else dt.replace(tzinfo=timezone.utc)
    if field_type is date:
        if isinstance(value, datetime):
            return value.date()
        if isinstance(value, date):
            return value
        if isinstance(value, str):
            return date.fromisoformat(value[:10])
    if field_type is time:
        if isinstance(value, time):
            return value
        if isinstance(value, str):
            parts = [int(p) for p in value.split(":")]
            return time(parts[0], parts[1], parts[2] if len(parts) > 2 else 0)
    if field_type is float and isinstance(value, (int, Decimal)):
        return float(value)
    if field_type is int and isinstance(value, bool):
        return int(value)
    return value


def _ilike_to_regex(pattern: str) -> Dict[str, Any]:
    """Translate SQL ILIKE wildcard pattern (%foo%) to a safe MongoDB case-insensitive regex."""
    starts_wild = pattern.startswith("%")
    ends_wild = pattern.endswith("%")
    inner = pattern.strip("%")
    escaped = re.escape(inner).replace(r"\%", ".*").replace(r"\_", ".")
    if not starts_wild:
        escaped = "^" + escaped
    if not ends_wild:
        escaped = escaped + "$"
    return {"$regex": escaped, "$options": "i"}


# ---------------------------------------------------------------------------
# Filter, Sort, and Aggregation Expressions
# ---------------------------------------------------------------------------

class SortSpec:
    def __init__(self, field_name: str, direction: int):
        self.field_name = field_name
        self.direction = direction


class FilterNode:
    """Abstract query filter expression compilable to MongoDB filter dicts."""

    def to_mongo(self, primary_model: Type["MongoDocument"], session: "MongoSession") -> Dict[str, Any]:
        raise NotImplementedError


class ComparisonNode(FilterNode):
    def __init__(self, model: Type["MongoDocument"], field_name: str, op: str, value: Any):
        self.model = model
        self.field_name = field_name
        self.op = op
        self.value = value

    def _build_local(self) -> Dict[str, Any]:
        val = _serialize_value(self.value)
        if self.op == "eq":
            return {self.field_name: val}
        if self.op == "ne":
            return {self.field_name: {"$ne": val}}
        if self.op == "lt":
            return {self.field_name: {"$lt": val}}
        if self.op == "lte":
            return {self.field_name: {"$lte": val}}
        if self.op == "gt":
            return {self.field_name: {"$gt": val}}
        if self.op == "gte":
            return {self.field_name: {"$gte": val}}
        if self.op == "in":
            return {self.field_name: {"$in": [_serialize_value(v) for v in self.value]}}
        if self.op == "ilike":
            return {self.field_name: _ilike_to_regex(str(self.value))}
        raise ValueError(f"Unsupported filter operator: {self.op}")

    def to_mongo(self, primary_model: Type["MongoDocument"], session: "MongoSession") -> Dict[str, Any]:
        if self.model is primary_model:
            return self._build_local()

        # Cross-collection filter (from .join(TargetModel)): resolve target IDs from MongoDB
        target_col = session.db[self.model.__collection__]
        local_filter = self._build_local()
        matched_ids = [doc["id"] for doc in target_col.find(local_filter, {"id": 1}) if "id" in doc]

        # Infer foreign key on primary_model pointing to self.model
        fk_field = _find_fk_field(primary_model, self.model)
        return {fk_field: {"$in": matched_ids}}


class CombinatorNode(FilterNode):
    def __init__(self, logic_op: str, children: Sequence[FilterNode]):
        self.logic_op = logic_op  # "$or" or "$and"
        self.children = list(children)

    def to_mongo(self, primary_model: Type["MongoDocument"], session: "MongoSession") -> Dict[str, Any]:
        compiled = [c.to_mongo(primary_model, session) for c in self.children]
        if not compiled:
            return {}
        return {self.logic_op: compiled}


def or_(*clauses: FilterNode) -> FilterNode:
    return CombinatorNode("$or", clauses)


def and_(*clauses: FilterNode) -> FilterNode:
    return CombinatorNode("$and", clauses)


class AggregateExpr:
    def __init__(self, agg_type: str, field_expr: "FieldExpr"):
        self.agg_type = agg_type  # "count" or "sum"
        self.model = field_expr.model
        self.field_name = field_expr.field_name


class _FuncNamespace:
    def count(self, field_expr: "FieldExpr") -> AggregateExpr:
        return AggregateExpr("count", field_expr)

    def sum(self, field_expr: "FieldExpr") -> AggregateExpr:
        return AggregateExpr("sum", field_expr)


func = _FuncNamespace()


class FieldExpr:
    """Class-level field proxy enabling Pythonic MongoDB filter & sort expressions."""

    def __init__(self, model: Type["MongoDocument"], field_name: str, field_type: Optional[Type]):
        self.model = model
        self.field_name = field_name
        self.field_type = field_type

    def __eq__(self, other: Any) -> FilterNode:  # type: ignore[override]
        return ComparisonNode(self.model, self.field_name, "eq", other)

    def __ne__(self, other: Any) -> FilterNode:  # type: ignore[override]
        return ComparisonNode(self.model, self.field_name, "ne", other)

    def __lt__(self, other: Any) -> FilterNode:
        return ComparisonNode(self.model, self.field_name, "lt", other)

    def __le__(self, other: Any) -> FilterNode:
        return ComparisonNode(self.model, self.field_name, "lte", other)

    def __gt__(self, other: Any) -> FilterNode:
        return ComparisonNode(self.model, self.field_name, "gt", other)

    def __ge__(self, other: Any) -> FilterNode:
        return ComparisonNode(self.model, self.field_name, "gte", other)

    def ilike(self, pattern: str) -> FilterNode:
        return ComparisonNode(self.model, self.field_name, "ilike", pattern)

    def in_(self, values: Sequence[Any]) -> FilterNode:
        return ComparisonNode(self.model, self.field_name, "in", list(values))

    def is_(self, other: Any) -> FilterNode:
        return ComparisonNode(self.model, self.field_name, "eq", other)

    def asc(self) -> SortSpec:
        return SortSpec(self.field_name, ASCENDING)

    def desc(self) -> SortSpec:
        return SortSpec(self.field_name, DESCENDING)


# ---------------------------------------------------------------------------
# Document Field & Relation Descriptors
# ---------------------------------------------------------------------------

class Field:
    """Descriptor defining a typed MongoDB document field with optional defaults."""

    def __init__(
        self,
        field_type: Optional[Type] = None,
        default: Any = None,
        onupdate: Optional[Callable[[], Any]] = None,
        primary_key: bool = False,
        fk_target: Optional[str] = None,
    ):
        self.field_type = field_type
        self.default = default
        self.onupdate = onupdate
        self.primary_key = primary_key
        self.fk_target = fk_target
        self.name: str = ""

    def __set_name__(self, owner: Type["MongoDocument"], name: str) -> None:
        self.name = name

    def get_default_value(self) -> Any:
        if callable(self.default):
            return self.default()
        return copy.deepcopy(self.default)

    def __get__(self, instance: Optional["MongoDocument"], owner: Type["MongoDocument"]) -> Any:
        if instance is None:
            return FieldExpr(owner, self.name, self.field_type)
        return instance.__dict__.get(self.name)

    def __set__(self, instance: "MongoDocument", value: Any) -> None:
        instance.__dict__[self.name] = _deserialize_value(value, self.field_type)


class Relation:
    """Lazy MongoDB reference resolver across collections."""

    def __init__(
        self,
        target_name: str,
        fk_field: str,
        remote_field: str = "id",
        uselist: bool = False,
    ):
        self.target_name = target_name
        self.fk_field = fk_field
        self.remote_field = remote_field
        self.uselist = uselist
        self.name: str = ""

    def __set_name__(self, owner: Type["MongoDocument"], name: str) -> None:
        self.name = name

    def __get__(self, instance: Optional["MongoDocument"], owner: Type["MongoDocument"]) -> Any:
        if instance is None:
            return self
        target_cls = _MODEL_REGISTRY.get(self.target_name)
        if target_cls is None:
            return [] if self.uselist else None

        fk_val = getattr(instance, self.fk_field, None)
        if fk_val is None:
            return [] if self.uselist else None

        session: Optional[MongoSession] = getattr(instance, "_session", None)
        if session is None:
            session = MongoSession()

        remote_expr = getattr(target_cls, self.remote_field)
        q = session.query(target_cls).filter(remote_expr == fk_val)
        return q.all() if self.uselist else q.first()


def _find_fk_field(primary_model: Type["MongoDocument"], target_model: Type["MongoDocument"]) -> str:
    """Find the foreign key field name on primary_model referencing target_model."""
    target_name = target_model.__name__
    for fname, fdesc in primary_model._fields.items():
        if fdesc.fk_target == target_name:
            return fname
    for rdesc in primary_model._relations.values():
        if rdesc.target_name == target_name and not rdesc.uselist:
            return rdesc.fk_field
    return f"{target_name.lower()}_id"


# ---------------------------------------------------------------------------
# Base MongoDocument Class
# ---------------------------------------------------------------------------

class MongoDocument:
    """Base class for all MongoDB collection documents in WorkForce 360."""

    __collection__: str = ""
    __tablename__: str = ""
    _fields: Dict[str, Field] = {}
    _relations: Dict[str, Relation] = {}

    def __init_subclass__(cls, **kwargs: Any) -> None:
        super().__init_subclass__(**kwargs)
        fields: Dict[str, Field] = {}
        relations: Dict[str, Relation] = {}
        for base in reversed(cls.__mro__):
            for k, v in base.__dict__.items():
                if isinstance(v, Field):
                    fields[k] = v
                elif isinstance(v, Relation):
                    relations[k] = v
        cls._fields = fields
        cls._relations = relations

        if cls.__collection__ and not cls.__tablename__:
            cls.__tablename__ = cls.__collection__
        elif cls.__tablename__ and not cls.__collection__:
            cls.__collection__ = cls.__tablename__

        if cls.__collection__:
            _MODEL_REGISTRY[cls.__name__] = cls

    def __init__(self, **kwargs: Any) -> None:
        self._session: Optional[MongoSession] = None
        self._persisted: bool = False
        self._snapshot: Dict[str, Any] = {}

        for fname, fdesc in self._fields.items():
            if fname in kwargs:
                setattr(self, fname, kwargs[fname])
            else:
                self.__dict__[fname] = fdesc.get_default_value()

    def to_mongo_doc(self) -> Dict[str, Any]:
        doc: Dict[str, Any] = {}
        for fname in self._fields:
            doc[fname] = _serialize_value(self.__dict__.get(fname))
        return doc

    @classmethod
    def from_mongo_doc(cls, raw: Dict[str, Any], session: Optional["MongoSession"] = None) -> "MongoDocument":
        obj = cls.__new__(cls)
        obj._session = session
        obj._persisted = True
        for fname, fdesc in cls._fields.items():
            if fname in raw:
                obj.__dict__[fname] = _deserialize_value(raw[fname], fdesc.field_type)
            else:
                obj.__dict__[fname] = fdesc.get_default_value()
        obj._snapshot = obj.to_mongo_doc()
        return obj


# ---------------------------------------------------------------------------
# MongoQuery & MongoSession
# ---------------------------------------------------------------------------

class MongoQuery:
    """Fluent MongoDB query builder supporting filter, join, order_by, offset, limit, count, update, delete."""

    def __init__(self, session: "MongoSession", target: Union[Type[MongoDocument], FieldExpr, AggregateExpr]):
        self.session = session
        self.target = target
        self._filters: List[FilterNode] = []
        self._sorts: List[Tuple[str, int]] = []
        self._skip: int = 0
        self._limit: Optional[int] = None
        self._joined_models: List[Type[MongoDocument]] = []

        if isinstance(target, AggregateExpr):
            self.model: Type[MongoDocument] = target.model
        elif isinstance(target, FieldExpr):
            self.model = target.model
        else:
            self.model = target

    def join(self, target_model: Type[MongoDocument], *args: Any, **kwargs: Any) -> "MongoQuery":
        self._joined_models.append(target_model)
        return self

    def filter(self, *clauses: FilterNode) -> "MongoQuery":
        for clause in clauses:
            if clause is not None:
                self._filters.append(clause)
        return self

    def order_by(self, *specs: SortSpec) -> "MongoQuery":
        for spec in specs:
            if isinstance(spec, SortSpec):
                self._sorts.append((spec.field_name, spec.direction))
            elif isinstance(spec, FieldExpr):
                self._sorts.append((spec.field_name, ASCENDING))
        return self

    def offset(self, n: int) -> "MongoQuery":
        self._skip = max(0, int(n))
        return self

    def limit(self, n: int) -> "MongoQuery":
        self._limit = max(0, int(n))
        return self

    def _compile_filter(self) -> Dict[str, Any]:
        if not self._filters:
            return {}
        parts = [f.to_mongo(self.model, self.session) for f in self._filters]
        parts = [p for p in parts if p]
        if not parts:
            return {}
        if len(parts) == 1:
            return parts[0]
        return {"$and": parts}

    def _collection(self):
        return self.session.db[self.model.__collection__]

    def count(self) -> int:
        return self._collection().count_documents(self._compile_filter())

    def scalar(self) -> Any:
        mongo_filter = self._compile_filter()
        if isinstance(self.target, AggregateExpr):
            if self.target.agg_type == "count":
                return self._collection().count_documents(mongo_filter)
            if self.target.agg_type == "sum":
                pipeline = [
                    {"$match": mongo_filter},
                    {"$group": {"_id": None, "total": {"$sum": f"${self.target.field_name}"}}},
                ]
                res = list(self._collection().aggregate(pipeline))
                return res[0]["total"] if res else 0
        if isinstance(self.target, FieldExpr):
            doc = self._collection().find_one(mongo_filter, {self.target.field_name: 1})
            return doc.get(self.target.field_name) if doc else None
        obj = self.first()
        return obj

    def first(self) -> Any:
        mongo_filter = self._compile_filter()
        if isinstance(self.target, FieldExpr):
            cursor = self._collection().find(mongo_filter, {self.target.field_name: 1})
            if self._sorts:
                cursor = cursor.sort(self._sorts)
            if self._skip:
                cursor = cursor.skip(self._skip)
            docs = list(cursor.limit(1))
            return (docs[0].get(self.target.field_name),) if docs else None

        cursor = self._collection().find(mongo_filter)
        if self._sorts:
            cursor = cursor.sort(self._sorts)
        if self._skip:
            cursor = cursor.skip(self._skip)
        docs = list(cursor.limit(1))
        if not docs:
            return None
        return self.session._hydrate(self.model, docs[0])

    def all(self) -> List[Any]:
        mongo_filter = self._compile_filter()
        cursor = self._collection().find(mongo_filter)
        if self._sorts:
            cursor = cursor.sort(self._sorts)
        if self._skip:
            cursor = cursor.skip(self._skip)
        if self._limit is not None:
            cursor = cursor.limit(self._limit)
        return [self.session._hydrate(self.model, d) for d in cursor]

    def update(self, values: Dict[str, Any], synchronize_session: Any = None) -> int:
        mongo_filter = self._compile_filter()
        serialized = {k: _serialize_value(v) for k, v in values.items()}
        result = self._collection().update_many(mongo_filter, {"$set": serialized})
        return result.modified_count

    def delete(self, synchronize_session: Any = None) -> int:
        mongo_filter = self._compile_filter()
        result = self._collection().delete_many(mongo_filter)
        return result.deleted_count


class MongoSession:
    """Unit-of-work session managing MongoDB collection reads, inserts, dirty updates, and deletes."""

    def __init__(self, db: Optional[Database] = None) -> None:
        self.db: Database = db if db is not None else get_mongo_db()
        self._pending_new: List[MongoDocument] = []
        self._tracked: Dict[Tuple[str, Any], MongoDocument] = {}

    def collection(self, name: str):
        return self.db[name]

    def _next_id(self, collection_name: str) -> int:
        counter = self.db["counters"].find_one_and_update(
            {"_id": collection_name},
            {"$inc": {"seq": 1}},
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )
        return int(counter["seq"])

    def _hydrate(self, model: Type[MongoDocument], raw: Dict[str, Any]) -> MongoDocument:
        key = (model.__collection__, raw.get("id"))
        if key in self._tracked:
            return self._tracked[key]
        obj = model.from_mongo_doc(raw, session=self)
        if raw.get("id") is not None:
            self._tracked[key] = obj
        return obj

    def query(self, target: Union[Type[MongoDocument], FieldExpr, AggregateExpr]) -> MongoQuery:
        return MongoQuery(self, target)

    def add(self, obj: MongoDocument) -> None:
        obj._session = self
        if not obj._persisted:
            if obj not in self._pending_new:
                self._pending_new.append(obj)
        else:
            key = (obj.__collection__, obj.__dict__.get("id"))
            self._tracked[key] = obj

    def add_all(self, objs: Sequence[MongoDocument]) -> None:
        for obj in objs:
            self.add(obj)

    def delete(self, obj: MongoDocument) -> None:
        obj_id = obj.__dict__.get("id")
        if obj_id is not None:
            self.db[obj.__collection__].delete_one({"id": obj_id})
            self._tracked.pop((obj.__collection__, obj_id), None)
        if obj in self._pending_new:
            self._pending_new.remove(obj)

    def flush(self) -> None:
        # 1. Insert new documents
        pending = list(self._pending_new)
        self._pending_new.clear()
        for obj in pending:
            col_name = obj.__collection__
            if obj.__dict__.get("id") is None:
                obj.__dict__["id"] = self._next_id(col_name)
            doc = obj.to_mongo_doc()
            self.db[col_name].insert_one(doc)
            obj._persisted = True
            obj._snapshot = copy.deepcopy(doc)
            self._tracked[(col_name, obj.__dict__["id"])] = obj

        # 2. Persist dirty tracked documents
        for (col_name, obj_id), obj in list(self._tracked.items()):
            current_doc = obj.to_mongo_doc()
            changes: Dict[str, Any] = {}
            for k, v in current_doc.items():
                if obj._snapshot.get(k) != v:
                    changes[k] = v

            if changes:
                # Apply onupdate hooks (e.g. updated_at)
                for fname, fdesc in obj._fields.items():
                    if fdesc.onupdate is not None and fname not in changes:
                        new_val = fdesc.onupdate()
                        setattr(obj, fname, new_val)
                        changes[fname] = _serialize_value(new_val)
                self.db[col_name].update_one({"id": obj_id}, {"$set": changes})
                obj._snapshot = obj.to_mongo_doc()

    def commit(self) -> None:
        self.flush()

    def refresh(self, obj: MongoDocument) -> None:
        obj_id = obj.__dict__.get("id")
        if obj_id is None:
            return
        raw = self.db[obj.__collection__].find_one({"id": obj_id})
        if raw:
            for fname, fdesc in obj._fields.items():
                if fname in raw:
                    obj.__dict__[fname] = _deserialize_value(raw[fname], fdesc.field_type)
            obj._snapshot = obj.to_mongo_doc()

    def rollback(self) -> None:
        self._pending_new.clear()

    def close(self) -> None:
        self._pending_new.clear()
        self._tracked.clear()
