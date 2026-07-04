"""Verification test for DrGibson@drbrandgibson.com login and Pro Lifetime Unlimited status.

This test verifies:
1. Login succeeds with provided credentials
2. Backend APIs return correct subscription_status='pro_lifetime_unlimited'
3. Profile shows isPro=true and isUnlimited=true
4. Edge cases: lowercase email works, wrong password fails gracefully
"""
import requests
import sys
from datetime import datetime

# Use the public backend URL (PREVIEW environment)
BASE_URL = "https://pro-unlock-3.preview.emergentagent.com/api"
FRONTEND_URL = "https://pro-unlock-3.preview.emergentagent.com"

# Supabase config for client-side auth
SUPABASE_URL = "https://dhxkwacdzmwwnmokmppf.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_KSys0E8FHr5UoDNDtYJLvQ_VOcSZ7wo"

# Test credentials
TEST_EMAIL = "DrGibson@drbrandgibson.com"
TEST_PASSWORD = "FootDoc2001#"
EXPECTED_TIER = "pro_lifetime_unlimited"
EXPECTED_USER_ID = "ffadc34f-03ff-4be2-abbf-a4f183ae9969"


class DrGibsonLoginTest:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.failures = []
        self.token = None
        self.user_id = None

    def log(self, msg):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")

    def test(self, name, func):
        """Run a test function and track results."""
        self.tests_run += 1
        self.log(f"\n{'='*70}")
        self.log(f"TEST {self.tests_run}: {name}")
        self.log('='*70)
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

    def assert_equals(self, actual, expected, msg):
        if actual != expected:
            raise AssertionError(f"{msg} Expected '{expected}', got '{actual}'")

    def get_headers(self):
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    # ========== TEST METHODS ==========

    def test_login_exact_credentials(self):
        """Test login with exact credentials: DrGibson@drbrandgibson.com"""
        self.log(f"   Attempting login with email: {TEST_EMAIL}")
        
        auth_url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
        auth_payload = {"email": TEST_EMAIL, "password": TEST_PASSWORD}
        auth_headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Content-Type": "application/json"
        }
        
        r = requests.post(auth_url, json=auth_payload, headers=auth_headers, timeout=10)
        self.assert_status(r, 200, "Login failed with exact credentials")
        
        data = r.json()
        self.assert_true("access_token" in data, "Login response missing access_token")
        self.assert_true("user" in data, "Login response missing user")
        
        self.token = data["access_token"]
        user = data["user"]
        self.user_id = user.get("id")
        
        self.log(f"   ✓ Login successful")
        self.log(f"   ✓ User ID: {self.user_id}")
        self.log(f"   ✓ Email: {user.get('email')}")
        self.log(f"   ✓ Access token obtained: {self.token[:30]}...")
        
        # Verify user ID matches expected
        if EXPECTED_USER_ID:
            self.assert_equals(self.user_id, EXPECTED_USER_ID, "User ID mismatch")
            self.log(f"   ✓ User ID matches expected: {EXPECTED_USER_ID}")

    def test_profile_me_endpoint(self):
        """Test GET /api/profile/me returns correct subscription status"""
        self.log("   Fetching profile from /api/profile/me...")
        
        r = requests.get(f"{BASE_URL}/profile/me", headers=self.get_headers(), timeout=10)
        self.assert_status(r, 200, "Profile fetch failed")
        
        data = r.json()
        self.log(f"   Profile data: {data}")
        
        self.assert_true("id" in data, "Profile missing 'id'")
        self.assert_true("email" in data, "Profile missing 'email'")
        self.assert_true("subscription_status" in data, "Profile missing 'subscription_status'")
        
        subscription_status = data.get("subscription_status")
        self.assert_equals(
            subscription_status, 
            EXPECTED_TIER, 
            f"Subscription status mismatch"
        )
        
        self.log(f"   ✓ subscription_status = '{subscription_status}' (correct)")
        self.log(f"   ✓ Email: {data.get('email')}")
        self.log(f"   ✓ Full name: {data.get('full_name')}")

    def test_billing_me_endpoint(self):
        """Test GET /api/billing/me returns is_pro=true and correct status"""
        self.log("   Fetching billing info from /api/billing/me...")
        
        r = requests.get(f"{BASE_URL}/billing/me", headers=self.get_headers(), timeout=10)
        self.assert_status(r, 200, "Billing fetch failed")
        
        data = r.json()
        self.log(f"   Billing data: {data}")
        
        self.assert_true("is_pro" in data, "Billing response missing 'is_pro'")
        self.assert_true("subscription_status" in data, "Billing response missing 'subscription_status'")
        
        is_pro = data.get("is_pro")
        subscription_status = data.get("subscription_status")
        
        self.assert_true(is_pro is True, f"Expected is_pro=true, got {is_pro}")
        self.assert_equals(
            subscription_status,
            EXPECTED_TIER,
            "Billing subscription_status mismatch"
        )
        
        self.log(f"   ✓ is_pro = {is_pro} (correct)")
        self.log(f"   ✓ subscription_status = '{subscription_status}' (correct)")
        self.log(f"   ✓ refund_eligible = {data.get('refund_eligible')}")

    def test_plans_quota_endpoint(self):
        """Test GET /api/plans/quota returns unlimited=true for lifetime_unlimited tier"""
        self.log("   Fetching quota from /api/plans/quota...")
        
        r = requests.get(f"{BASE_URL}/plans/quota", headers=self.get_headers(), timeout=10)
        self.assert_status(r, 200, "Quota fetch failed")
        
        data = r.json()
        self.log(f"   Quota data: {data}")
        
        self.assert_true("tier" in data, "Quota response missing 'tier'")
        self.assert_true("unlimited" in data, "Quota response missing 'unlimited'")
        
        tier = data.get("tier")
        unlimited = data.get("unlimited")
        
        self.assert_equals(tier, EXPECTED_TIER, "Quota tier mismatch")
        self.assert_true(unlimited is True, f"Expected unlimited=true, got {unlimited}")
        
        self.log(f"   ✓ tier = '{tier}' (correct)")
        self.log(f"   ✓ unlimited = {unlimited} (correct)")
        self.log(f"   ✓ limit = {data.get('limit')}")
        self.log(f"   ✓ used = {data.get('used')}")

    def test_login_lowercase_email(self):
        """Test login with lowercase email (Supabase should normalize)"""
        lowercase_email = TEST_EMAIL.lower()
        self.log(f"   Attempting login with lowercase email: {lowercase_email}")
        
        auth_url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
        auth_payload = {"email": lowercase_email, "password": TEST_PASSWORD}
        auth_headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Content-Type": "application/json"
        }
        
        r = requests.post(auth_url, json=auth_payload, headers=auth_headers, timeout=10)
        self.assert_status(r, 200, "Login failed with lowercase email")
        
        data = r.json()
        self.assert_true("access_token" in data, "Login response missing access_token")
        
        self.log(f"   ✓ Login successful with lowercase email")
        self.log(f"   ✓ Supabase correctly normalized email case")

    def test_login_wrong_password(self):
        """Test login with wrong password fails gracefully"""
        wrong_password = "WrongPassword123!"
        self.log(f"   Attempting login with WRONG password...")
        
        auth_url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
        auth_payload = {"email": TEST_EMAIL, "password": wrong_password}
        auth_headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Content-Type": "application/json"
        }
        
        r = requests.post(auth_url, json=auth_payload, headers=auth_headers, timeout=10)
        
        # Should return 400 with error message
        self.assert_true(
            r.status_code in [400, 401], 
            f"Expected 400 or 401 for wrong password, got {r.status_code}"
        )
        
        data = r.json()
        self.log(f"   Error response: {data}")
        
        # Check for error message (can be in various fields)
        error_msg = (
            data.get("error_description") or 
            data.get("error") or 
            data.get("message") or 
            data.get("msg") or 
            data.get("error_code") or 
            ""
        )
        self.assert_true(
            "invalid" in str(error_msg).lower() or "credentials" in str(error_msg).lower(),
            f"Expected error message about invalid credentials, got: {error_msg}"
        )
        
        self.log(f"   ✓ Login correctly rejected with wrong password")
        self.log(f"   ✓ Error message: {error_msg}")

    def print_summary(self):
        """Print test summary."""
        print("\n" + "="*70)
        print("DRGIBSON LOGIN VERIFICATION - TEST SUMMARY")
        print("="*70)
        print(f"Total tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed} ✅")
        print(f"Failed: {self.tests_failed} ❌")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failures:
            print("\n" + "="*70)
            print("FAILURES")
            print("="*70)
            for f in self.failures:
                print(f"\n❌ {f['test']}")
                print(f"   {f['error']}")
        else:
            print("\n" + "="*70)
            print("🎉 ALL TESTS PASSED!")
            print("="*70)
            print(f"✓ Login works for {TEST_EMAIL}")
            print(f"✓ Subscription status: {EXPECTED_TIER}")
            print(f"✓ Backend APIs return correct Pro status")
            print(f"✓ Edge cases handled correctly")
        
        print("\n" + "="*70)
        return 0 if self.tests_failed == 0 else 1


def main():
    tester = DrGibsonLoginTest()
    
    print("="*70)
    print("DRGIBSON LOGIN VERIFICATION TEST")
    print("="*70)
    print(f"Environment: PREVIEW")
    print(f"Frontend URL: {FRONTEND_URL}")
    print(f"Backend API: {BASE_URL}")
    print(f"Test User: {TEST_EMAIL}")
    print(f"Expected Tier: {EXPECTED_TIER}")
    print("="*70)
    
    # Core login test
    tester.test("Login with exact credentials (DrGibson@drbrandgibson.com)", 
                tester.test_login_exact_credentials)
    
    # Backend API verification tests
    tester.test("GET /api/profile/me returns subscription_status='pro_lifetime_unlimited'",
                tester.test_profile_me_endpoint)
    
    tester.test("GET /api/billing/me returns is_pro=true and correct status",
                tester.test_billing_me_endpoint)
    
    tester.test("GET /api/plans/quota returns tier='pro_lifetime_unlimited' with unlimited=true",
                tester.test_plans_quota_endpoint)
    
    # Edge case tests
    tester.test("Login with lowercase email (drgibson@drbrandgibson.com) succeeds",
                tester.test_login_lowercase_email)
    
    tester.test("Login with wrong password fails gracefully",
                tester.test_login_wrong_password)
    
    return tester.print_summary()


if __name__ == "__main__":
    sys.exit(main())
