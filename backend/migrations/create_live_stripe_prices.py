"""One-shot script: create all 5 LIVE-mode Stripe Prices for The Influence
Incubator Formula, then print the price IDs you must paste into backend/.env.

USAGE:
    export STRIPE_LIVE_SECRET_KEY="sk_live_..."   # from Stripe Dashboard -> Developers -> API keys
    python migrations/create_live_stripe_prices.py

Safe to re-run: existing products/prices are reused by matching name + unit_amount + recurrence.
Reports what already exists vs what it created.

Products/Prices created (all USD):
    - Influence Incubator Formula — Monthly           : $19/mo   recurring
    - Influence Incubator Formula — Lifetime          : $97      one-time
    - Influence Incubator Formula — Lifetime Unlimited: $397     one-time
    - Extra Plan Slot (Lifetime)                      : $19.99   one-time
    - Extra Plan Slot (Monthly)                       : $10/mo   recurring
"""
import os
import sys

try:
    import stripe
except ImportError:
    print("Install stripe first:  pip install stripe")
    sys.exit(1)

KEY = os.environ.get("STRIPE_LIVE_SECRET_KEY", "").strip()
if not KEY:
    print("ERROR: STRIPE_LIVE_SECRET_KEY env var is not set.\nExport your Stripe LIVE secret key and re-run.")
    sys.exit(1)
if not KEY.startswith("sk_live_"):
    print(f"ERROR: STRIPE_LIVE_SECRET_KEY does not look like a live key (starts with '{KEY[:8]}...').\nPlease use your LIVE (not test) secret key.")
    sys.exit(1)

stripe.api_key = KEY

PRICES = [
    {"env": "STRIPE_PRICE_MONTHLY",            "product": "Influence Incubator Formula — Monthly",            "amount": 1900,  "recurring": True,  "desc": "Monthly Pro — all 7 steps, cancel anytime."},
    {"env": "STRIPE_PRICE_LIFETIME",           "product": "Influence Incubator Formula — Lifetime",           "amount": 9700,  "recurring": False, "desc": "Lifetime Pro — one-time, up to 6 plans."},
    {"env": "STRIPE_PRICE_LIFETIME_UNLIMITED", "product": "Influence Incubator Formula — Lifetime Unlimited", "amount": 39700, "recurring": False, "desc": "Lifetime Unlimited — one-time, unlimited plans."},
    {"env": "STRIPE_PRICE_EXTRA_LIFETIME",     "product": "Extra Plan Slot (Lifetime)",                       "amount": 1999,  "recurring": False, "desc": "Additional plan slot for Lifetime members."},
    {"env": "STRIPE_PRICE_EXTRA_MONTHLY",      "product": "Extra Plan Slot (Monthly)",                        "amount": 1000,  "recurring": True,  "desc": "Additional plan slot for Monthly members."},
]

def find_or_create_product(name: str, description: str):
    prods = stripe.Product.list(limit=100, active=True).data
    match = next((p for p in prods if p.name == name), None)
    if match:
        return match, False
    return stripe.Product.create(name=name, description=description), True


def find_or_create_price(product, amount: int, recurring: bool):
    for p in stripe.Price.list(product=product.id, limit=100, active=True).data:
        if p.unit_amount != amount or p.currency != "usd":
            continue
        if recurring and getattr(p, "recurring", None) and p.recurring["interval"] == "month":
            return p, False
        if not recurring and p.type == "one_time":
            return p, False
    price_kwargs = {"product": product.id, "unit_amount": amount, "currency": "usd"}
    if recurring:
        price_kwargs["recurring"] = {"interval": "month"}
    return stripe.Price.create(**price_kwargs), True


results = []
for row in PRICES:
    prod, created_prod = find_or_create_product(row["product"], row["desc"])
    price, created_price = find_or_create_price(prod, row["amount"], row["recurring"])
    results.append((row["env"], row["product"], price.id, created_prod, created_price))
    print(f"  {'[NEW]' if created_price else '[REUSED]'} {row['env']}={price.id}   product={row['product'][:60]}")

print("\n=" * 30)
print("\nDONE. Paste these into /app/backend/.env (replacing the test-mode price IDs):\n")
for env_key, _, price_id, _, _ in results:
    print(f"{env_key}={price_id}")
print("\nThen also swap:")
print("  STRIPE_SECRET_KEY=<your sk_live_ key>")
print("  STRIPE_WEBHOOK_SECRET=<from Stripe Dashboard -> Webhooks -> your live endpoint>")
print("\nRestart backend after updating .env:  sudo supervisorctl restart backend")
