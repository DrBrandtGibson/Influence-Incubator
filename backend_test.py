"""Backend API tests for The Influence Incubator Formula.
Tests auth, profile, plans, and AI endpoints.
"""
import requests
import sys
import time
import json
from datetime import datetime

# Use the public backend URL
BASE_URL = "https://pro-unlock-3.preview.emergentagent.com/api"

# Supabase config for client-side auth
SUPABASE_URL = "https://dhxkwacdzmwwnmokmppf.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_KSys0E8FHr5UoDNDtYJLvQ_VOcSZ7wo"


class TestRunner:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.failures = []
        self.token = None
        self.user_id = None
        self.plan_id = None

    def log(self, msg):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")

    def test(self, name, func):
        """Run a test function and track results."""
        self.tests_run += 1
        self.log(f"\n{'='*60}")
        self.log(f"TEST {self.tests_run}: {name}")
        self.log('='*60)
        try:
            func()
            self.tests_passed += 1
            self.log(f"✅ PASSED: {name}")
            return True
        except AssertionError as e:
            self.tests_failed += 1
            self.failures.append({"test": name, "error": str(e)})
            self.log(f"❌ FAILED: {name}")
            self.log(f"   Error: {e}")
            return False
        except Exception as e:
            self.tests_failed += 1
            self.failures.append({"test": name, "error": f"Exception: {str(e)}"})
            self.log(f"❌ FAILED: {name}")
            self.log(f"   Exception: {e}")
            return False

    def assert_status(self, response, expected, msg=""):
        if response.status_code != expected:
            raise AssertionError(
                f"{msg} Expected status {expected}, got {response.status_code}. "
                f"Response: {response.text[:500]}"
            )

    def assert_true(self, condition, msg):
        if not condition:
            raise AssertionError(msg)

    def get_headers(self, with_auth=True):
        headers = {"Content-Type": "application/json"}
        if with_auth and self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    # ========== AUTH TESTS ==========

    def test_health(self):
        """Test health endpoint."""
        r = requests.get(f"{BASE_URL}/health", timeout=10)
        self.assert_status(r, 200, "Health check failed")
        data = r.json()
        self.assert_true(data.get("status") == "healthy", "Health status not 'healthy'")
        self.log(f"   Health: {data}")

    def test_signup(self):
        """Test user signup with auto-confirmed email."""
        timestamp = int(time.time())
        email = f"test.iif.{timestamp}@example.com"
        password = "TestPass123!"
        
        payload = {
            "email": email,
            "password": password,
            "full_name": f"Test User {timestamp}"
        }
        
        r = requests.post(f"{BASE_URL}/auth/signup", json=payload, timeout=10)
        self.assert_status(r, 200, "Signup failed")
        data = r.json()
        self.assert_true("id" in data, "Signup response missing 'id'")
        self.assert_true("email" in data, "Signup response missing 'email'")
        self.user_id = data["id"]
        self.log(f"   Created user: {data['email']} (id={self.user_id})")
        
        # Now sign in via Supabase to get access token
        self.log("   Signing in via Supabase...")
        auth_url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
        auth_payload = {"email": email, "password": password}
        auth_headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Content-Type": "application/json"
        }
        
        r2 = requests.post(auth_url, json=auth_payload, headers=auth_headers, timeout=10)
        self.assert_status(r2, 200, "Supabase sign-in failed")
        auth_data = r2.json()
        self.assert_true("access_token" in auth_data, "Sign-in response missing access_token")
        self.token = auth_data["access_token"]
        self.log(f"   Got access token: {self.token[:20]}...")

    def test_signup_duplicate(self):
        """Test signup with duplicate email returns 409."""
        # Use the existing user
        payload = {
            "email": "alice.iif.test@example.com",
            "password": "Alice-Pass-123!",
            "full_name": "Alice Test"
        }
        
        r = requests.post(f"{BASE_URL}/auth/signup", json=payload, timeout=10)
        self.assert_status(r, 409, "Duplicate signup should return 409")
        self.log("   Correctly rejected duplicate email")

    def test_signup_weak_password(self):
        """Test signup with weak password returns 400."""
        payload = {
            "email": f"weak.{int(time.time())}@example.com",
            "password": "short",
            "full_name": "Weak Pass"
        }
        
        r = requests.post(f"{BASE_URL}/auth/signup", json=payload, timeout=10)
        self.assert_status(r, 400, "Weak password should return 400")
        self.log("   Correctly rejected weak password")

    # ========== PROFILE TESTS ==========

    def test_profile_me(self):
        """Test GET /api/profile/me returns user profile."""
        r = requests.get(f"{BASE_URL}/profile/me", headers=self.get_headers(), timeout=10)
        self.assert_status(r, 200, "Profile fetch failed")
        data = r.json()
        self.assert_true("id" in data, "Profile missing 'id'")
        self.assert_true("email" in data, "Profile missing 'email'")
        self.assert_true("subscription_status" in data, "Profile missing 'subscription_status'")
        self.assert_true(data["subscription_status"] == "free", "New user should have 'free' status")
        self.log(f"   Profile: {data['email']}, status={data['subscription_status']}")

    def test_profile_unauthorized(self):
        """Test profile endpoint without auth returns 401."""
        r = requests.get(f"{BASE_URL}/profile/me", timeout=10)
        self.assert_status(r, 401, "Unauthorized request should return 401")
        self.log("   Correctly rejected unauthorized request")

    # ========== PLANS TESTS ==========

    def test_list_plans_empty(self):
        """Test listing plans for new user returns empty list."""
        r = requests.get(f"{BASE_URL}/plans", headers=self.get_headers(), timeout=10)
        self.assert_status(r, 200, "List plans failed")
        data = r.json()
        self.assert_true("plans" in data, "Response missing 'plans' key")
        self.assert_true(isinstance(data["plans"], list), "Plans should be a list")
        self.log(f"   Plans count: {len(data['plans'])}")

    def test_create_plan(self):
        """Test creating a plan."""
        payload = {
            "title": "My Test Business Plan",
            "idea": "A revolutionary AI-powered coaching platform",
            "founder_backstory": "Former corporate exec turned entrepreneur",
            "industry": "Coaching & Consulting",
            "stage": "Idea"
        }
        
        r = requests.post(f"{BASE_URL}/plans", json=payload, headers=self.get_headers(), timeout=10)
        self.assert_status(r, 201, "Plan creation failed")
        data = r.json()
        self.assert_true("id" in data, "Plan response missing 'id'")
        self.assert_true(data["title"] == payload["title"], "Plan title mismatch")
        self.assert_true(data["current_step"] == 1, "New plan should start at step 1")
        self.plan_id = data["id"]
        self.log(f"   Created plan: {data['title']} (id={self.plan_id})")

    def test_create_plan_limit(self):
        """Test free-tier 1-plan limit."""
        payload = {
            "title": "Second Plan (Should Fail)",
            "idea": "Another idea"
        }
        
        r = requests.post(f"{BASE_URL}/plans", json=payload, headers=self.get_headers(), timeout=10)
        self.assert_status(r, 402, "Second plan should be rejected with 402")
        data = r.json()
        self.assert_true("detail" in data, "Error response missing 'detail'")
        detail = data["detail"]
        if isinstance(detail, dict):
            self.assert_true(detail.get("code") == "plan_limit_reached", "Error code should be 'plan_limit_reached'")
        self.log("   Correctly enforced 1-plan limit for free tier")

    def test_get_plan(self):
        """Test getting a plan with steps and inputs."""
        r = requests.get(f"{BASE_URL}/plans/{self.plan_id}", headers=self.get_headers(), timeout=10)
        self.assert_status(r, 200, "Get plan failed")
        data = r.json()
        self.assert_true("plan" in data, "Response missing 'plan'")
        self.assert_true("steps" in data, "Response missing 'steps'")
        self.assert_true("inputs" in data, "Response missing 'inputs'")
        self.assert_true(len(data["steps"]) == 7, "Should have 7 step records")
        self.log(f"   Plan: {data['plan']['title']}, steps={len(data['steps'])}, inputs={len(data['inputs'])}")

    def test_update_plan(self):
        """Test updating a plan."""
        payload = {"title": "Updated Plan Title"}
        
        r = requests.patch(f"{BASE_URL}/plans/{self.plan_id}", json=payload, headers=self.get_headers(), timeout=10)
        self.assert_status(r, 200, "Plan update failed")
        data = r.json()
        self.assert_true(data["title"] == payload["title"], "Plan title not updated")
        self.log(f"   Updated plan title to: {data['title']}")

    def test_upsert_input(self):
        """Test upserting a plan input field."""
        payload = {
            "step_num": 1,
            "field_key": "business_name",
            "value": "The Influence Incubator"
        }
        
        r = requests.post(f"{BASE_URL}/plans/{self.plan_id}/inputs", json=payload, headers=self.get_headers(), timeout=10)
        self.assert_status(r, 200, "Input upsert failed")
        data = r.json()
        self.assert_true(data["field_key"] == payload["field_key"], "Field key mismatch")
        self.assert_true(data["value"] == payload["value"], "Value mismatch")
        self.log(f"   Upserted input: {data['field_key']} = {data['value']}")

    def test_update_step_status(self):
        """Test updating step status."""
        payload = {
            "step_num": 1,
            "status": "in_progress"
        }
        
        r = requests.post(f"{BASE_URL}/plans/{self.plan_id}/step-status", json=payload, headers=self.get_headers(), timeout=10)
        self.assert_status(r, 200, "Step status update failed")
        data = r.json()
        self.assert_true(data["status"] == payload["status"], "Status not updated")
        self.log(f"   Updated step {data['step_num']} status to: {data['status']}")

    # ========== AI TESTS ==========

    def test_ai_answer_question_json(self):
        """Test AI answer-question endpoint (JSON mode)."""
        payload = {
            "plan_id": self.plan_id,
            "step_num": 1,
            "field_key": "business_name",
            "field_label": "What is your business name?",
            "user_text": ""
        }
        
        self.log("   Calling AI endpoint (may take 5-10 seconds)...")
        r = requests.post(f"{BASE_URL}/ai/answer-question/json", json=payload, headers=self.get_headers(), timeout=30)
        self.assert_status(r, 200, "AI answer-question failed")
        data = r.json()
        self.assert_true("text" in data, "AI response missing 'text'")
        self.assert_true(len(data["text"]) > 0, "AI response text is empty")
        self.log(f"   AI response: {data['text'][:100]}...")

    def test_ai_answer_question_stream(self):
        """Test AI answer-question streaming endpoint."""
        payload = {
            "plan_id": self.plan_id,
            "step_num": 1,
            "field_key": "business_tagline",
            "field_label": "What is your business tagline?",
            "user_text": ""
        }
        
        self.log("   Testing streaming endpoint (may take 5-10 seconds)...")
        r = requests.post(f"{BASE_URL}/ai/answer-question", json=payload, headers=self.get_headers(), timeout=30, stream=True)
        self.assert_status(r, 200, "AI streaming failed")
        
        chunks = []
        for line in r.iter_lines():
            if line:
                line_str = line.decode('utf-8')
                if line_str.startswith('data: '):
                    data_str = line_str[6:]
                    try:
                        chunk_data = json.loads(data_str)
                        if 'text' in chunk_data:
                            chunks.append(chunk_data['text'])
                    except:
                        pass
        
        self.assert_true(len(chunks) > 0, "No chunks received from streaming endpoint")
        full_text = ''.join(chunks)
        self.log(f"   Received {len(chunks)} chunks, total text: {full_text[:100]}...")

    def test_ai_locked_step(self):
        """Test AI endpoint rejects locked step for free user."""
        payload = {
            "plan_id": self.plan_id,
            "step_num": 3,  # Step 3 is locked for free users
            "field_key": "test_field",
            "field_label": "Test question",
            "user_text": ""
        }
        
        r = requests.post(f"{BASE_URL}/ai/answer-question/json", json=payload, headers=self.get_headers(), timeout=10)
        self.assert_status(r, 403, "Locked step should return 403")
        data = r.json()
        self.assert_true("detail" in data, "Error response missing 'detail'")
        detail = data["detail"]
        if isinstance(detail, dict):
            self.assert_true(detail.get("code") == "step_locked", "Error code should be 'step_locked'")
        self.log("   Correctly rejected locked step access")

    # ========== RLS ISOLATION TEST ==========

    def test_rls_isolation(self):
        """Test that users cannot see each other's plans."""
        # Create a second user
        timestamp = int(time.time())
        email2 = f"test.iif.second.{timestamp}@example.com"
        password2 = "TestPass456!"
        
        payload = {
            "email": email2,
            "password": password2,
            "full_name": f"Second User {timestamp}"
        }
        
        r = requests.post(f"{BASE_URL}/auth/signup", json=payload, timeout=10)
        self.assert_status(r, 200, "Second user signup failed")
        
        # Sign in as second user
        auth_url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
        auth_payload = {"email": email2, "password": password2}
        auth_headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Content-Type": "application/json"
        }
        
        r2 = requests.post(auth_url, json=auth_payload, headers=auth_headers, timeout=10)
        self.assert_status(r2, 200, "Second user sign-in failed")
        token2 = r2.json()["access_token"]
        
        # Try to list plans as second user (should be empty)
        headers2 = {"Authorization": f"Bearer {token2}", "Content-Type": "application/json"}
        r3 = requests.get(f"{BASE_URL}/plans", headers=headers2, timeout=10)
        self.assert_status(r3, 200, "List plans for second user failed")
        data = r3.json()
        self.assert_true(len(data["plans"]) == 0, "Second user should not see first user's plans")
        
        # Try to access first user's plan directly (should fail)
        r4 = requests.get(f"{BASE_URL}/plans/{self.plan_id}", headers=headers2, timeout=10)
        self.assert_status(r4, 404, "Second user should not access first user's plan")
        
        self.log("   RLS isolation working correctly")

    def print_summary(self):
        """Print test summary."""
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        print(f"Total tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed} ✅")
        print(f"Failed: {self.tests_failed} ❌")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failures:
            print("\n" + "="*60)
            print("FAILURES")
            print("="*60)
            for f in self.failures:
                print(f"\n❌ {f['test']}")
                print(f"   {f['error']}")
        
        print("\n" + "="*60)
        return 0 if self.tests_failed == 0 else 1


def main():
    runner = TestRunner()
    
    # Health check
    runner.test("Health endpoint", runner.test_health)
    
    # Auth tests
    runner.test("User signup with auto-confirm", runner.test_signup)
    runner.test("Duplicate email signup", runner.test_signup_duplicate)
    runner.test("Weak password signup", runner.test_signup_weak_password)
    
    # Profile tests
    runner.test("Get user profile", runner.test_profile_me)
    runner.test("Unauthorized profile access", runner.test_profile_unauthorized)
    
    # Plans tests
    runner.test("List plans (empty)", runner.test_list_plans_empty)
    runner.test("Create plan", runner.test_create_plan)
    runner.test("Free-tier plan limit", runner.test_create_plan_limit)
    runner.test("Get plan with steps and inputs", runner.test_get_plan)
    runner.test("Update plan", runner.test_update_plan)
    runner.test("Upsert plan input", runner.test_upsert_input)
    runner.test("Update step status", runner.test_update_step_status)
    
    # AI tests
    runner.test("AI answer-question (JSON)", runner.test_ai_answer_question_json)
    runner.test("AI answer-question (streaming)", runner.test_ai_answer_question_stream)
    runner.test("AI locked step rejection", runner.test_ai_locked_step)
    
    # RLS isolation
    runner.test("RLS isolation between users", runner.test_rls_isolation)
    
    return runner.print_summary()


if __name__ == "__main__":
    sys.exit(main())
