import re


def clean_text(text: str) -> str:
    """
    Production utility:
    - handles None
    - removes extra spaces
    - lowercases for pattern matching
    """
    if not text:
        return ""
    text = str(text)
    text = re.sub(r"\s+", " ", text).strip()
    return text.lower()


def detect_red_flags(text: str):
    """
    Detects suspicious keywords/patterns commonly found in fake job scams.
    Returns a list of matched red flags.
    """
    lower_text = clean_text(text)

    red_flag_keywords = [
        # Payment / Fees
        "registration fee",
        "processing fee",
        "pay money",
        "payment required",
        "deposit",
        "fee required",
        "pay first",
        "pay to confirm",
        "security deposit",

        # No interview / instant join
        "no interview",
        "instant joining",
        "direct joining",

        # Messaging platforms
        "whatsapp",
        "telegram",
        "dm on telegram",
        "message on whatsapp",

        # Urgency / pressure tactics
        "limited seats",
        "urgent hiring",
        "apply immediately",
        "hurry up",
        "only today",
        "limited offer",

        # Too-good-to-be-true earnings
        "earn per day",
        "earn per week",
        "earn daily",
        "earn weekly",
        "high salary",
        "easy money",

        # Click bait
        "click here",
        "link below",

        # Work from home scams (not always scam, but suspicious when combined)
        "work from home",
        "part time work from home",
    ]

    found_flags = [k for k in red_flag_keywords if k in lower_text]

    # ✅ Extra pattern-based detection (more production-like)
    # UPI / payment app scam hints
    if re.search(r"\bupi\b", lower_text):
        found_flags.append("upi mentioned")

    # Telegram usernames
    if re.search(r"@\w+", lower_text) and "telegram" in lower_text:
        found_flags.append("telegram username shared")

    # Phone numbers (often used in scams)
    if re.search(r"\b\d{10}\b", lower_text):
        found_flags.append("phone number shared")

    # Very high numeric salary per day/week type scams
    if re.search(r"₹\s?\d{4,}", lower_text) and ("per day" in lower_text or "per week" in lower_text):
        found_flags.append("suspicious high earning claim")

    # ✅ Remove duplicates (important)
    found_flags = list(dict.fromkeys(found_flags))

    return found_flags


def calculate_risk_level(result: str, confidence: float, red_flags: list):
    """
    Production risk level:
    - HIGH if many red flags found (override)
    - else based on model prediction + confidence + number of red flags
    """
    flags_count = len(red_flags)

    # ✅ Production override rule:
    # If many red flags exist => HIGH risk no matter what ML says
    if flags_count >= 3:
        return "HIGH"

    if result == "FAKE":
        if flags_count >= 1 or confidence >= 70:
            return "HIGH"
        return "MEDIUM"

    # result == REAL
    if flags_count == 2:
        return "MEDIUM"

    if flags_count == 1 and confidence < 75:
        return "MEDIUM"

    return "LOW"
