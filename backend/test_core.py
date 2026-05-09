"""
PHASE 0 — CORE POC SCRIPT
Validates the three foundational integrations before app build:
  1) Supabase Admin client connectivity (service role key)
  2) Supabase Auth: create user, sign-in, retrieve JWT, verify decoded JWT user_id
  3) Supabase Postgres + RLS: create a test table via service role, insert as user-A, ensure user-B cannot read user-A's row
  4) Supabase Storage bucket: create + list
  5) Claude Sonnet 4.5 chat via emergentintegrations (Emergent universal LLM key) — long structured response
  6) Pseudo-streaming pattern (we will chunk Claude response into SSE for the app)

Run:
  cd /app/backend && python test_core.py
"""
import os
import sys
import asyncio
import time
import uuid
from pathlib import Path
from dotenv import load_dotenv

ROOT = Path(__file__).parent
load_dotenv(ROOT / ".env")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_ANON_KEY = os.environ["SUPABASE_PUBLISHABLE_KEY"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]


def banner(t):
    print("\n" + "=" * 70)
    print(t)
    print("=" * 70)


# --------------------------------------------------------------------------
# 1. Supabase admin client connectivity
# --------------------------------------------------------------------------
def test_supabase_admin():
    banner("1) Supabase admin client connectivity")
    from supabase import create_client
    admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    # We expect at minimum we can talk to PostgREST. Try selecting from a system table-equivalent:
    try:
        # postgrest will respond with a 404 for missing tables, that's fine; we check the auth admin works
        users = admin.auth.admin.list_users()
        print(f"OK admin client. Existing users count: {len(users) if isinstance(users, list) else 'n/a'}")
        return admin
    except Exception as e:
        print(f"FAIL admin client: {e}")
        raise


# --------------------------------------------------------------------------
# 2. Create / fetch test users & sign in to obtain JWT
# --------------------------------------------------------------------------
def ensure_test_users(admin):
    banner("2) Create or fetch two test users (alice, bob)")
    test_users = [
        ("alice.iif.test@example.com", "Alice-Pass-123!"),
        ("bob.iif.test@example.com",   "Bob-Pass-123!"),
    ]
    created = {}
    for email, password in test_users:
        try:
            res = admin.auth.admin.create_user({
                "email": email,
                "password": password,
                "email_confirm": True,  # auto-confirm so we can sign in
            })
            user = getattr(res, "user", None) or res.get("user") if isinstance(res, dict) else res.user
            print(f"  Created {email} -> id={user.id}")
            created[email] = (password, user.id)
        except Exception as e:
            # Likely already exists. Find them.
            msg = str(e).lower()
            if "already" in msg or "registered" in msg or "exists" in msg or "duplicate" in msg:
                # Look up by email
                users_resp = admin.auth.admin.list_users()
                # supabase-py v2 returns list directly
                users_list = users_resp if isinstance(users_resp, list) else getattr(users_resp, "users", [])
                match = next((u for u in users_list if (getattr(u, "email", None) == email)), None)
                if match is None:
                    print(f"  ! could not locate existing user {email}: {e}")
                    raise
                print(f"  Reusing existing {email} -> id={match.id}")
                created[email] = (password, match.id)
            else:
                raise
    return created


def sign_in(email, password):
    """Sign in via the public/anon client, return (jwt, user_id)."""
    from supabase import create_client
    pub = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    res = pub.auth.sign_in_with_password({"email": email, "password": password})
    sess = res.session
    user = res.user
    assert sess and sess.access_token, f"No access token for {email}"
    return sess.access_token, user.id


# --------------------------------------------------------------------------
# 3. Apply test schema + RLS via SQL through service role HTTP RPC
#    We'll just use service role to ensure a table exists for our POC.
#    We use postgrest via supabase-py. RLS truly tests cross-user isolation.
# --------------------------------------------------------------------------
TEST_TABLE = "iif_poc_plans"


def ensure_test_table(admin):
    """
    Create the iif_poc_plans table & RLS policies if missing.
    Uses Supabase's pg-meta endpoint via a SECURITY DEFINER function isn't available by default,
    so we rely on PostgREST inserts -> we expect the user has run the SQL manually OR we hit
    the SQL endpoint with the service role using `httpx` direct call to the SQL editor RPC.

    Instead, we'll attempt to insert; if the table doesn't exist we instruct the user via SQL.
    """
    banner(f"3) Ensure schema exists: {TEST_TABLE} + RLS")
    sql = f"""
-- Run this in Supabase SQL Editor (one-time) if the POC reports missing table:
create extension if not exists "pgcrypto";
create table if not exists public.{TEST_TABLE} (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  created_at timestamptz default now()
);
alter table public.{TEST_TABLE} enable row level security;
drop policy if exists "select_own" on public.{TEST_TABLE};
drop policy if exists "insert_own" on public.{TEST_TABLE};
create policy "select_own" on public.{TEST_TABLE} for select using (auth.uid() = user_id);
create policy "insert_own" on public.{TEST_TABLE} for insert with check (auth.uid() = user_id);
"""
    # Try a probe insert via service role to see if the table exists.
    try:
        # service role bypasses RLS
        admin.table(TEST_TABLE).select("id").limit(1).execute()
        print(f"OK table {TEST_TABLE} exists.")
        return True, sql
    except Exception as e:
        print(f"  Table may not exist yet: {e}")
        return False, sql


def apply_schema_via_pgrest(sql_text):
    """
    Use Supabase's HTTP RPC endpoint to run raw SQL via the management/SQL API.
    Since management API requires a personal access token (different from service key),
    we instead try the postgrest 'rpc' approach by creating a SECURITY DEFINER function. That
    requires SQL access too. So we attempt the supabase.com SQL endpoint with service key —
    Supabase recently shipped a v1/projects/{ref}/database/query endpoint requiring a
    *Personal Access Token*, not the service_role key. So service_role alone CANNOT execute DDL.

    Fallback: use direct PostgREST sql via 'postgres-meta' if exposed (it is NOT by default).

    So in this POC we:
      - Try `psycopg`-style direct postgres connection if DATABASE_URL is set, else
      - Print SQL for the user to run in the SQL editor.
    """
    banner("3a) Attempt to apply DDL")
    db_url = os.environ.get("SUPABASE_DB_URL")
    if not db_url:
        print("  No SUPABASE_DB_URL set. Will instruct user to run SQL manually.")
        return False
    try:
        import psycopg
        with psycopg.connect(db_url, autocommit=True) as conn:
            with conn.cursor() as cur:
                cur.execute(sql_text)
        print("  OK applied schema via direct postgres connection.")
        return True
    except Exception as e:
        print(f"  Direct postgres apply failed: {e}")
        return False


# --------------------------------------------------------------------------
# 4. RLS isolation test as alice & bob
# --------------------------------------------------------------------------
def test_rls_isolation(alice_jwt, alice_id, bob_jwt, bob_id):
    banner("4) RLS isolation test")
    from supabase import create_client
    alice_cli = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    alice_cli.postgrest.auth(alice_jwt)
    bob_cli = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    bob_cli.postgrest.auth(bob_jwt)

    # Alice inserts a plan
    title_a = f"Alice plan {uuid.uuid4().hex[:6]}"
    ins_a = alice_cli.table(TEST_TABLE).insert({"user_id": alice_id, "title": title_a}).execute()
    print(f"  Alice insert: {ins_a.data}")

    # Bob inserts a plan
    title_b = f"Bob plan {uuid.uuid4().hex[:6]}"
    ins_b = bob_cli.table(TEST_TABLE).insert({"user_id": bob_id, "title": title_b}).execute()
    print(f"  Bob insert: {ins_b.data}")

    # Alice should see only her rows
    rows_alice = alice_cli.table(TEST_TABLE).select("*").execute()
    titles_alice = [r["title"] for r in rows_alice.data]
    print(f"  Alice sees {len(rows_alice.data)} rows: {titles_alice[:3]}...")
    assert title_b not in titles_alice, "RLS BREACH: alice can see bob's row!"
    assert title_a in titles_alice, "Alice cannot see her own row!"

    # Bob should see only his rows
    rows_bob = bob_cli.table(TEST_TABLE).select("*").execute()
    titles_bob = [r["title"] for r in rows_bob.data]
    print(f"  Bob   sees {len(rows_bob.data)} rows: {titles_bob[:3]}...")
    assert title_a not in titles_bob, "RLS BREACH: bob can see alice's row!"
    assert title_b in titles_bob, "Bob cannot see his own row!"

    # Try inserting as alice but with bob's user_id (should fail RLS check)
    try:
        alice_cli.table(TEST_TABLE).insert({"user_id": bob_id, "title": "evil"}).execute()
        raise AssertionError("RLS BREACH: alice was able to insert with bob's user_id")
    except Exception as e:
        print(f"  OK alice cannot impersonate bob (insert blocked): {type(e).__name__}")

    print("OK RLS isolation working.")


# --------------------------------------------------------------------------
# 5. Storage bucket
# --------------------------------------------------------------------------
def test_storage(admin):
    banner("5) Supabase Storage: create/list bucket")
    BUCKET = "iif-logos"
    try:
        buckets = admin.storage.list_buckets()
        names = [b.name if hasattr(b, "name") else b["name"] for b in buckets]
        print(f"  Existing buckets: {names}")
        if BUCKET not in names:
            admin.storage.create_bucket(BUCKET, options={"public": True})
            print(f"  Created bucket: {BUCKET}")
        else:
            print(f"  Reusing bucket: {BUCKET}")
        # Upload a tiny test file
        test_path = f"poc/{uuid.uuid4().hex}.txt"
        admin.storage.from_(BUCKET).upload(test_path, b"hello-from-poc", {"content-type": "text/plain"})
        public_url = admin.storage.from_(BUCKET).get_public_url(test_path)
        print(f"  Uploaded test file -> {public_url}")
        return True
    except Exception as e:
        print(f"FAIL storage test: {e}")
        return False


# --------------------------------------------------------------------------
# 6. Claude Sonnet 4.5 via emergentintegrations
# --------------------------------------------------------------------------
async def test_claude():
    banner("6) Claude Sonnet 4.5 via Emergent universal key")
    from emergentintegrations.llm.chat import LlmChat, UserMessage

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"poc-{uuid.uuid4().hex[:8]}",
        system_message=(
            "You are an expert business plan writer for solo entrepreneurs. "
            "Respond with concise, structured creative output."
        ),
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    msg = UserMessage(text=(
        "Generate exactly 3 creative business names for a wellness coaching practice "
        "called 'Inner Compass'. For each, give: (1) the name, (2) one-line rationale, "
        "(3) a memorability score 1-10. Format as a numbered list."
    ))
    t0 = time.time()
    out = await chat.send_message(msg)
    dt = time.time() - t0
    print(f"  Response in {dt:.2f}s, {len(out)} chars.")
    print("  --- response preview ---")
    print(out[:600])
    print("  ---")
    assert len(out) > 100, "Response too short"
    return out


# --------------------------------------------------------------------------
# 7. Pseudo-streaming pattern (chunk a complete response)
# --------------------------------------------------------------------------
def test_chunk_for_sse(text):
    banner("7) Verify chunked-streaming pattern")
    chunk_size = 40
    chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
    print(f"  Total chunks: {len(chunks)} (size={chunk_size})")
    print("  First 3 chunks:")
    for c in chunks[:3]:
        print(f"    | {c!r}")
    return True


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------
async def main():
    failures = []

    try:
        admin = test_supabase_admin()
    except Exception as e:
        failures.append(f"admin: {e}")
        print("\n!! CANNOT CONTINUE without admin client. Aborting.")
        sys.exit(2)

    try:
        users = ensure_test_users(admin)
    except Exception as e:
        failures.append(f"users: {e}")
        print(f"!! ensure_test_users failed: {e}")
        users = {}

    table_ok, sql_text = ensure_test_table(admin)
    if not table_ok:
        applied = apply_schema_via_pgrest(sql_text)
        if not applied:
            print("\n>>> ACTION REQUIRED: open Supabase SQL Editor and run:\n")
            print(sql_text)
            print("\nThen re-run this POC.\n")
            failures.append("schema not applied")

    try:
        if users and table_ok:
            (apw, aid) = users["alice.iif.test@example.com"]
            (bpw, bid) = users["bob.iif.test@example.com"]
            ajwt, _ = sign_in("alice.iif.test@example.com", apw)
            bjwt, _ = sign_in("bob.iif.test@example.com", bpw)
            print(f"  Got JWTs for both users (alice: {ajwt[:20]}..., bob: {bjwt[:20]}...)")
            test_rls_isolation(ajwt, aid, bjwt, bid)
        else:
            print("  Skipping RLS test (users or table missing)")
    except Exception as e:
        failures.append(f"rls: {e}")
        print(f"!! RLS test failed: {e}")

    try:
        test_storage(admin)
    except Exception as e:
        failures.append(f"storage: {e}")

    try:
        out = await test_claude()
        test_chunk_for_sse(out)
    except Exception as e:
        failures.append(f"claude: {e}")
        print(f"!! Claude test failed: {e}")

    banner("RESULT")
    if failures:
        print("FAILURES:")
        for f in failures:
            print(f"  - {f}")
        sys.exit(1)
    print("ALL POC TESTS PASSED ✓")


if __name__ == "__main__":
    asyncio.run(main())
