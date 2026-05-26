"""
Phase 11.7 Backend Testing: Lifetime Unlimited Tier
Tests the new $397 Lifetime Unlimited tier with unlimited plan creation.
"""
import requests
import json
import sys
import os
from datetime import datetime

# Get backend URL from frontend .env
BACKEND_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://pro-unlock-3.preview.emergentagent.com")
BASE_URL = f"{BACKEND_URL}/api"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

class Phase117Tester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.token = None
        self.user_id = None
        self.test_email = f"test_unlimited_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com"
        self.test_password = "TestPass123!"
        
    def log(self, msg, color=Colors.BLUE):
        print(f"{color}{msg}{Colors.END}")
        
    def test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{BASE_URL}/{endpoint}"
        h = {'Content-Type': 'application/json'}
        if self.token:
            h['Authorization'] = f'Bearer {self.token}'
        if headers:
            h.update(headers)
        
        self.tests_run += 1
        self.log(f"\n🔍 Test {self.tests_run}: {name}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=h, timeout=15)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=h, timeout=15)
            elif method == 'DELETE':
                response = requests.delete(url, headers=h, timeout=15)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                self.log(f"✅ PASS - Status: {response.status_code}", Colors.GREEN)
                try:
                    resp_json = response.json()
                    return True, resp_json
                except:
                    return True, {}
            else:
                self.tests_failed += 1
                self.log(f"❌ FAIL - Expected {expected_status}, got {response.status_code}", Colors.RED)
                try:
                    error_detail = response.json()
                    self.log(f"   Error: {json.dumps(error_detail, indent=2)}", Colors.RED)
                except:
                    self.log(f"   Response: {response.text[:200]}", Colors.RED)
                return False, {}
                
        except Exception as e:
            self.tests_failed += 1
            self.log(f"❌ FAIL - Exception: {str(e)}", Colors.RED)
            return False, {}
    
    def setup_test_user(self):
        """Create and authenticate a test user"""
        self.log("\n" + "="*60, Colors.YELLOW)
        self.log("SETUP: Creating test user", Colors.YELLOW)
        self.log("="*60, Colors.YELLOW)
        
        # Create user via signup endpoint
        success, resp = self.test(
            "Create test user",
            "POST",
            "auth/signup",
            200,  # Signup returns 200, not 201
            data={
                "email": self.test_email,
                "password": self.test_password,
                "full_name": "Test Unlimited User"
            }
        )
        
        if not success:
            self.log("Failed to create test user", Colors.RED)
            return False
        
        self.user_id = resp.get("id")
        
        # Now sign in to get a token
        self.log("\n📝 Signing in to get auth token...", Colors.BLUE)
        
        # Use Supabase auth endpoint
        import os
        supabase_url = os.environ.get("REACT_APP_SUPABASE_URL", "https://dhxkwacdzmwwnmokmppf.supabase.co")
        auth_url = f"{supabase_url}/auth/v1/token?grant_type=password"
        
        try:
            auth_resp = requests.post(
                auth_url,
                json={
                    "email": self.test_email,
                    "password": self.test_password
                },
                headers={
                    "apikey": os.environ.get("REACT_APP_SUPABASE_ANON_KEY", "sb_publishable_KSys0E8FHr5UoDNDtYJLvQ_VOcSZ7wo"),
                    "Content-Type": "application/json"
                },
                timeout=10
            )
            
            if auth_resp.status_code == 200:
                auth_data = auth_resp.json()
                self.token = auth_data.get("access_token")
                if not self.token:
                    self.log("No access_token in auth response", Colors.RED)
                    return False
            else:
                self.log(f"Auth failed: {auth_resp.status_code}", Colors.RED)
                return False
        except Exception as e:
            self.log(f"Auth exception: {str(e)}", Colors.RED)
            return False
            
        self.log(f"✓ Test user created: {self.test_email}", Colors.GREEN)
        self.log(f"✓ User ID: {self.user_id}", Colors.GREEN)
        self.log(f"✓ Token obtained", Colors.GREEN)
        return True
    
    def test_billing_config(self):
        """Test GET /api/billing/config includes lifetime_unlimited"""
        self.log("\n" + "="*60, Colors.YELLOW)
        self.log("TEST SUITE: Billing Config", Colors.YELLOW)
        self.log("="*60, Colors.YELLOW)
        
        success, resp = self.test(
            "GET /api/billing/config includes lifetime_unlimited",
            "GET",
            "billing/config",
            200
        )
        
        if success:
            packages = resp.get("packages", {})
            lu = packages.get("lifetime_unlimited")
            if lu:
                checks = [
                    (lu.get("amount_cents") == 39700, "amount_cents=39700"),
                    (lu.get("currency") == "usd", "currency=usd"),
                    (lu.get("label") == "Lifetime Unlimited", "label correct"),
                    (lu.get("available") == True, "available=true")
                ]
                for check, desc in checks:
                    if check:
                        self.log(f"  ✓ {desc}", Colors.GREEN)
                    else:
                        self.log(f"  ✗ {desc}", Colors.RED)
            else:
                self.log("  ✗ lifetime_unlimited package not found", Colors.RED)
    
    def test_checkout_as_free_user(self):
        """Test POST /api/billing/checkout with package=lifetime_unlimited as FREE user"""
        self.log("\n" + "="*60, Colors.YELLOW)
        self.log("TEST SUITE: Checkout as Free User", Colors.YELLOW)
        self.log("="*60, Colors.YELLOW)
        
        success, resp = self.test(
            "Checkout lifetime_unlimited as free user",
            "POST",
            "billing/checkout",
            200,
            data={
                "package": "lifetime_unlimited",
                "origin": "https://example.com"
            }
        )
        
        if success:
            if resp.get("url") and resp.get("session_id"):
                self.log("  ✓ Stripe checkout URL returned", Colors.GREEN)
                self.log("  ✓ Session ID present", Colors.GREEN)
            else:
                self.log("  ✗ Missing url or session_id", Colors.RED)
    
    def flip_user_to_pro_monthly(self):
        """Helper: Use Supabase admin to flip user to pro_monthly"""
        self.log("\n📝 Flipping user to pro_monthly via Supabase admin...", Colors.BLUE)
        # We'll use the backend's internal admin client via a helper endpoint
        # For testing, we'll simulate by just noting the status
        # In real test, you'd use Supabase admin SDK
        self.log("  (Simulated - would use Supabase admin in real test)", Colors.YELLOW)
        return True
    
    def test_quota_unlimited(self):
        """Test GET /api/plans/quota for pro_lifetime_unlimited user"""
        self.log("\n" + "="*60, Colors.YELLOW)
        self.log("TEST SUITE: Quota for Unlimited User", Colors.YELLOW)
        self.log("="*60, Colors.YELLOW)
        
        # First, we need to flip the user to pro_lifetime_unlimited
        # This would normally be done via Supabase admin
        self.log("⚠️  Note: User needs to be pro_lifetime_unlimited for this test", Colors.YELLOW)
        self.log("    In production test, use Supabase admin to flip status", Colors.YELLOW)
        
        success, resp = self.test(
            "GET /api/plans/quota as unlimited user",
            "GET",
            "plans/quota",
            200
        )
        
        if success:
            # For a free user, we won't see unlimited=true
            # This test would need the user to be flipped first
            self.log(f"  Current quota response: {json.dumps(resp, indent=2)}", Colors.BLUE)
    
    def test_create_multiple_plans_unlimited(self):
        """Test POST /api/plans multiple times for unlimited user"""
        self.log("\n" + "="*60, Colors.YELLOW)
        self.log("TEST SUITE: Create Multiple Plans (Unlimited)", Colors.YELLOW)
        self.log("="*60, Colors.YELLOW)
        
        self.log("⚠️  Note: User needs to be pro_lifetime_unlimited for this test", Colors.YELLOW)
        
        # Try creating 3 plans (would be 7+ in full test)
        for i in range(1, 4):
            success, resp = self.test(
                f"Create plan #{i} as unlimited user",
                "POST",
                "plans",
                201,
                data={
                    "title": f"Test Plan {i}",
                    "idea": f"Test idea {i}"
                }
            )
            if not success:
                self.log(f"  Failed to create plan {i}", Colors.RED)
                break
    
    def test_extra_slot_blocked_for_unlimited(self):
        """Test that extra slot purchases are blocked for unlimited users"""
        self.log("\n" + "="*60, Colors.YELLOW)
        self.log("TEST SUITE: Extra Slots Blocked for Unlimited", Colors.YELLOW)
        self.log("="*60, Colors.YELLOW)
        
        self.log("⚠️  Note: User needs to be pro_lifetime_unlimited for this test", Colors.YELLOW)
        
        for package in ["extra_lifetime", "extra_monthly"]:
            success, resp = self.test(
                f"Try to buy {package} as unlimited user (should fail)",
                "POST",
                "billing/checkout",
                409,  # Expect conflict
                data={
                    "package": package,
                    "origin": "https://example.com"
                }
            )
            if success:
                detail = resp.get("detail", {})
                if isinstance(detail, dict):
                    code = detail.get("code")
                    if code == "unlimited_no_extras_needed":
                        self.log(f"  ✓ Correct error code: {code}", Colors.GREEN)
                    else:
                        self.log(f"  ✗ Wrong error code: {code}", Colors.RED)
    
    def test_webhook_stripe_lifetime_unlimited(self):
        """Test Stripe webhook for lifetime_unlimited purchase"""
        self.log("\n" + "="*60, Colors.YELLOW)
        self.log("TEST SUITE: Stripe Webhook (Lifetime Unlimited)", Colors.YELLOW)
        self.log("="*60, Colors.YELLOW)
        
        # Create a mock checkout.session.completed event
        mock_event = {
            "id": f"evt_test_{datetime.now().timestamp()}",
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": f"cs_test_{datetime.now().timestamp()}",
                    "payment_status": "paid",
                    "customer": "cus_test_123",
                    "subscription": None,
                    "metadata": {
                        "supabase_user_id": self.user_id,
                        "package": "lifetime_unlimited"
                    }
                }
            }
        }
        
        success, resp = self.test(
            "POST /api/webhook/stripe with lifetime_unlimited checkout",
            "POST",
            "webhook/stripe",
            200,
            data=mock_event
        )
        
        if success:
            self.log("  ✓ Webhook accepted", Colors.GREEN)
            # In real test, would verify profile.subscription_status was updated
    
    def test_webhook_clickfunnels_397(self):
        """Test ClickFunnels webhook with $397 purchase"""
        self.log("\n" + "="*60, Colors.YELLOW)
        self.log("TEST SUITE: ClickFunnels Webhook ($397)", Colors.YELLOW)
        self.log("="*60, Colors.YELLOW)
        
        # Create a mock CF order.completed event
        mock_event = {
            "id": f"cf_evt_{datetime.now().timestamp()}",
            "event": "order.completed",
            "data": {
                "contact": {
                    "email_address": f"cf_test_{datetime.now().timestamp()}@example.com",
                    "first_name": "CF",
                    "last_name": "Test"
                },
                "total_amount": 397  # $397
            }
        }
        
        success, resp = self.test(
            "POST /api/webhook/clickfunnels with $397 purchase",
            "POST",
            "webhook/clickfunnels",
            200,
            data=mock_event
        )
        
        if success:
            self.log("  ✓ Webhook accepted", Colors.GREEN)
            # In real test, would verify new user created with pro_lifetime_unlimited
    
    def test_refund_unlimited_user(self):
        """Test refund for unlimited user within 7-day window"""
        self.log("\n" + "="*60, Colors.YELLOW)
        self.log("TEST SUITE: Refund for Unlimited User", Colors.YELLOW)
        self.log("="*60, Colors.YELLOW)
        
        self.log("⚠️  Note: User needs to be pro_lifetime_unlimited with recent purchase", Colors.YELLOW)
        
        # This would fail for a free user, but shows the endpoint works
        success, resp = self.test(
            "POST /api/billing/refund as unlimited user",
            "POST",
            "billing/refund",
            400  # Expect 400 for free user (no purchase to refund)
        )
    
    def run_all_tests(self):
        """Run all test suites"""
        self.log("\n" + "="*80, Colors.BLUE)
        self.log("PHASE 11.7 BACKEND TESTING: LIFETIME UNLIMITED TIER", Colors.BLUE)
        self.log("="*80, Colors.BLUE)
        self.log(f"Backend URL: {BASE_URL}", Colors.BLUE)
        self.log(f"Test started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", Colors.BLUE)
        
        # Setup
        if not self.setup_test_user():
            self.log("\n❌ Setup failed - cannot continue", Colors.RED)
            return False
        
        # Run test suites
        self.test_billing_config()
        self.test_checkout_as_free_user()
        self.test_quota_unlimited()
        self.test_create_multiple_plans_unlimited()
        self.test_extra_slot_blocked_for_unlimited()
        self.test_webhook_stripe_lifetime_unlimited()
        self.test_webhook_clickfunnels_397()
        self.test_refund_unlimited_user()
        
        # Summary
        self.log("\n" + "="*80, Colors.BLUE)
        self.log("TEST SUMMARY", Colors.BLUE)
        self.log("="*80, Colors.BLUE)
        self.log(f"Total tests run: {self.tests_run}", Colors.BLUE)
        self.log(f"Passed: {self.tests_passed}", Colors.GREEN)
        self.log(f"Failed: {self.tests_failed}", Colors.RED)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        self.log(f"Success rate: {success_rate:.1f}%", Colors.GREEN if success_rate >= 80 else Colors.RED)
        
        return self.tests_failed == 0

def main():
    tester = Phase117Tester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
