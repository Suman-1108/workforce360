from typing import Optional, Dict, Any
import phonenumbers
from phonenumbers import geocoder, carrier, PhoneNumberType, NumberParseException


TYPE_MAPPING = {
    PhoneNumberType.MOBILE: "Mobile",
    PhoneNumberType.FIXED_LINE: "Landline",
    PhoneNumberType.FIXED_LINE_OR_MOBILE: "Mobile / Landline",
    PhoneNumberType.TOLL_FREE: "Toll-Free",
    PhoneNumberType.PREMIUM_RATE: "Premium Rate",
    PhoneNumberType.SHARED_COST: "Shared Cost",
    PhoneNumberType.VOIP: "VoIP",
    PhoneNumberType.PERSONAL_NUMBER: "Personal Number",
    PhoneNumberType.PAGER: "Pager",
    PhoneNumberType.UAN: "Universal Access",
    PhoneNumberType.VOICEMAIL: "Voicemail",
    PhoneNumberType.UNKNOWN: "Unknown",
}


def parse_phone_metadata(phone_str: Optional[str], default_country: str = "IN") -> Dict[str, Any]:
    """
    Parses a phone string, auto-detects country, formats in E.164 and International format,
    and identifies the line type (Mobile, Landline, VoIP, etc.).
    """
    if not phone_str or not phone_str.strip():
        return {
            "raw": phone_str or "",
            "is_valid": False,
            "is_possible": False,
            "country_code": None,
            "country_name": None,
            "calling_code": None,
            "national_number": None,
            "international_format": None,
            "e164_format": None,
            "number_type": None,
            "carrier": None,
            "error": "Empty phone number",
        }

    raw = phone_str.strip()
    try:
        parsed = phonenumbers.parse(raw, default_country)
        is_valid = phonenumbers.is_valid_number(parsed)
        is_possible = phonenumbers.is_possible_number(parsed)

        region_code = phonenumbers.region_code_for_number(parsed) or default_country
        region_name = geocoder.description_for_number(parsed, "en") or region_code
        carrier_name = carrier.name_for_number(parsed, "en") or None
        type_enum = phonenumbers.number_type(parsed)
        type_name = TYPE_MAPPING.get(type_enum, "Other")

        intl = phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.INTERNATIONAL)
        e164 = phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)

        return {
            "raw": raw,
            "is_valid": is_valid,
            "is_possible": is_possible,
            "country_code": region_code,
            "country_name": region_name,
            "calling_code": f"+{parsed.country_code}",
            "national_number": str(parsed.national_number),
            "international_format": intl,
            "e164_format": e164,
            "number_type": type_name,
            "carrier": carrier_name,
            "error": None,
        }
    except NumberParseException as e:
        return {
            "raw": raw,
            "is_valid": False,
            "is_possible": False,
            "country_code": None,
            "country_name": None,
            "calling_code": None,
            "national_number": None,
            "international_format": None,
            "e164_format": None,
            "number_type": None,
            "carrier": None,
            "error": str(e),
        }


def format_e164_or_international(phone_str: Optional[str], default_country: str = "IN") -> Optional[str]:
    """
    Formats a phone number to standard International format (e.g. +91 90897 86754),
    preserving the original string if parsing fails.
    """
    if not phone_str or not phone_str.strip():
        return None

    meta = parse_phone_metadata(phone_str, default_country)
    if meta.get("international_format"):
        return meta["international_format"]
    return phone_str.strip()
