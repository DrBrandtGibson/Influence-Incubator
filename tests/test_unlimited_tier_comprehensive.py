"""
Comprehensive Phase 11.7 Testing with Supabase Admin
Tests all aspects of the Lifetime Unlimited tier including status flipping
"""
import requests
import json
import sys
import os
from datetime import datetime, timezone
from supabase import create_client, Client

# Configuration
BACKEND_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://pro-unlock-3.preview.emergentagent.com")
BASE_URL = f"{BACKEND_URL}/api"
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://dhxkwacdzmwwnmokmppf.supabase.co")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "sb_secret_XLbt1Yl6emshcNV5uGxFGw_8MwriFZz")

# Initialize Supabase admin client
admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

class TestRunner:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.test_email = f"unlimited_test_{int(datetime.now().timestamp())}@test.com"
        self.test_password = "TestPass123!"
        self.user_id = None
        self.token = None
        
    def log_pass(self, msg):
        print(f"✅ {msg}")
        self.passed += 1
        
    def log_fail(self, msg):
        print(f"❌ {msg}")
        self.failed += 1
        
    def log_info(self, msg):
        print(f"ℹ️  {msg}")
    
    def create_test_user(self):
        """Create a test user and get auth token"""
        print("\n" + "="*70)
        print("SETUP: Creating test user")
        print("="*70)
        
        try:
            # Create user via backend
            resp = requests.post(
                f"{BASE_URL}/auth/signup",
                json={
                    "email": self.test_email,
                    "password": self.test_password,
                    "full_name": "Unlimited Test User"
                },
                timeout=10
            )
            
            if resp.status_code != 200:
                self.log_fail(f"Signup failed: {resp.status_code}")
                return False
            
            data = resp.json()
            self.user_id = data.get("id")
            
            # Get auth token
            auth_resp = requests.post(
                f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
                json={"email": self.test_email, "password": self.test_password},
                headers={
                    "apikey": os.environ.get("REACT_APP_SUPABASE_ANON_KEY", "sb_publishable_KSys0E8FHr5UoDNDtYJLvQ_VOcSZ7wo"),
                    "Content-Type": "application/json"
                },
                timeout=10
            )
            
            if auth_resp.status_code == 200:
                self.token = auth_resp.json().get("access_token")
                self.log_pass(f"User created: {self.test_email}")
                self.log_pass(f"User ID: {self.user_id}")
                return True
            else:
                self.log_fail(f"Auth failed: {auth_resp.status_code}")
                return False
                
        except Exception as e:
            self.log_fail(f"Setup exception: {str(e)}")
            return False
    
    def flip_user_status(self, status: str):
        """Use Supabase admin to change user subscription status"""
        try:
            admin.table("profiles").update({
                "subscription_status": status,
                "purchased_at": datetime.now(timezone.utc).isoformat()
            }).eq("id", self.user_id).execute()
            self.log_info(f"Flipped user to {status}")
            return True
        except Exception as e:
            self.log_fail(f"Failed to flip status: {str(e)}")
            return False
    
    def test_billing_config(self):
        """Test 1: Billing config includes lifetime_unlimited"""
        print("\n" + "="*70)
        print("TEST 1: Billing Config")
        print("="*70)
        
        try:
            resp = requests.get(f"{BASE_URL}/billing/config", timeout=10)
            if resp.status_code != 200:
                self.log_fail(f"Config endpoint failed: {resp.status_code}")
                return
            
            data = resp.json()
            packages = data.get("packages", {})
            lu = packages.get("lifetime_unlimited")
            
            if not lu:
                self.log_fail("lifetime_unlimited package not found")
                return
            
            checks = [
                (lu.get("amount_cents") == 39700, "amount_cents = 39700"),
                (lu.get("currency") == "usd", "currency = usd"),
                (lu.get("label") == "Lifetime Unlimited", "label correct"),
                (lu.get("available") == True, "available = true")
            ]
            
            for check, desc in checks:
                if check:
                    self.log_pass(desc)
                else:
                    self.log_fail(desc)
                    
        except Exception as e:
            self.log_fail(f"Exception: {str(e)}")
    
    def test_checkout_free_user(self):
        """Test 2: Free user can checkout lifetime_unlimited"""
        print("\n" + "="*70)
        print("TEST 2: Checkout as Free User")
        print("="*70)
        
        try:
            resp = requests.post(
                f"{BASE_URL}/billing/checkout",
                json={"package": "lifetime_unlimited", "origin": "https://example.com"},
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=10
            )
            
            if resp.status_code == 200:
                data = resp.json()
                if data.get("url") and data.get("session_id"):
                    self.log_pass("Checkout session created for free user")
                else:
                    self.log_fail("Missing url or session_id")
            else:
                self.log_fail(f"Checkout failed: {resp.status_code}")
                
        except Exception as e:
            self.log_fail(f"Exception: {str(e)}")
    
    def test_checkout_unlimited_blocked(self):
        """Test 3: Unlimited user cannot buy lifetime_unlimited again"""
        print("\n" + "="*70)
        print("TEST 3: Unlimited User Blocked from Re-purchase")
        print("="*70)
        
        # Flip to unlimited
        if not self.flip_user_status("pro_lifetime_unlimited"):
            return
        
        try:
            resp = requests.post(
                f"{BASE_URL}/billing/checkout",
                json={"package": "lifetime_unlimited", "origin": "https://example.com"},
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=10
            )
            
            if resp.status_code == 409:
                self.log_pass("Unlimited user correctly blocked from re-purchase (409)")
            else:
                self.log_fail(f"Expected 409, got {resp.status_code}")
                
        except Exception as e:
            self.log_fail(f"Exception: {str(e)}")
    
    def test_quota_unlimited(self):
        """Test 4: Quota shows unlimited for pro_lifetime_unlimited"""
        print("\n" + "="*70)
        print("TEST 4: Quota for Unlimited User")
        print("="*70)
        
        try:
            resp = requests.get(
                f"{BASE_URL}/plans/quota",
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=10
            )
            
            if resp.status_code == 200:
                data = resp.json()
                checks = [
                    (data.get("tier") == "pro_lifetime_unlimited", "tier = pro_lifetime_unlimited"),
                    (data.get("unlimited") == True, "unlimited = true"),
                    (data.get("limit") is None, "limit = null"),
                    (data.get("remaining") is None, "remaining = null"),
                    (data.get("extra_package") is None, "extra_package = null"),
                    (data.get("extra_price_cents") is None, "extra_price_cents = null")
                ]
                
                for check, desc in checks:
                    if check:
                        self.log_pass(desc)
                    else:
                        self.log_fail(desc)
            else:
                self.log_fail(f"Quota endpoint failed: {resp.status_code}")
                
        except Exception as e:
            self.log_fail(f"Exception: {str(e)}")
    
    def test_create_many_plans(self):
        """Test 5: Unlimited user can create 7+ plans"""
        print("\n" + "="*70)
        print("TEST 5: Create 7+ Plans as Unlimited User")
        print("="*70)
        
        created_count = 0
        for i in range(1, 8):
            try:
                resp = requests.post(
                    f"{BASE_URL}/plans",
                    json={"title": f"Test Plan {i}", "idea": f"Idea {i}"},
                    headers={"Authorization": f"Bearer {self.token}"},
                    timeout=10
                )
                
                if resp.status_code == 201:
                    created_count += 1
                else:
                    self.log_fail(f"Plan {i} creation failed: {resp.status_code}")
                    break
            except Exception as e:
                self.log_fail(f"Plan {i} exception: {str(e)}")
                break
        
        if created_count >= 7:
            self.log_pass(f"Created {created_count} plans successfully (unlimited works)")
        else:
            self.log_fail(f"Only created {created_count}/7 plans")
    
    def test_extra_slots_blocked(self):
        """Test 6: Unlimited user cannot buy extra slots"""
        print("\n" + "="*70)
        print("TEST 6: Extra Slots Blocked for Unlimited")
        print("="*70)
        
        for package in ["extra_lifetime", "extra_monthly"]:
            try:
                resp = requests.post(
                    f"{BASE_URL}/billing/checkout",
                    json={"package": package, "origin": "https://example.com"},
                    headers={"Authorization": f"Bearer {self.token}"},
                    timeout=10
                )
                
                if resp.status_code == 409:
                    data = resp.json()
                    detail = data.get("detail", {})
                    if isinstance(detail, dict) and detail.get("code") == "unlimited_no_extras_needed":
                        self.log_pass(f"{package} correctly blocked with code 'unlimited_no_extras_needed'")
                    else:
                        self.log_fail(f"{package} blocked but wrong error code")
                else:
                    self.log_fail(f"{package} expected 409, got {resp.status_code}")
                    
            except Exception as e:
                self.log_fail(f"{package} exception: {str(e)}")
    
    def test_upgrade_paths(self):
        """Test 7: Upgrade paths work correctly"""
        print("\n" + "="*70)
        print("TEST 7: Upgrade Paths")
        print("="*70)
        
        # Test pro_monthly can upgrade
        self.flip_user_status("pro_monthly")
        try:
            resp = requests.post(
                f"{BASE_URL}/billing/checkout",
                json={"package": "lifetime_unlimited", "origin": "https://example.com"},
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=10
            )
            if resp.status_code == 200:
                self.log_pass("pro_monthly can upgrade to lifetime_unlimited")
            else:
                self.log_fail(f"pro_monthly upgrade failed: {resp.status_code}")
        except Exception as e:
            self.log_fail(f"pro_monthly upgrade exception: {str(e)}")
        
        # Test pro_lifetime can upgrade
        self.flip_user_status("pro_lifetime")
        try:
            resp = requests.post(
                f"{BASE_URL}/billing/checkout",
                json={"package": "lifetime_unlimited", "origin": "https://example.com"},
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=10
            )
            if resp.status_code == 200:
                self.log_pass("pro_lifetime can upgrade to lifetime_unlimited")
            else:
                self.log_fail(f"pro_lifetime upgrade failed: {resp.status_code}")
        except Exception as e:
            self.log_fail(f"pro_lifetime upgrade exception: {str(e)}")
    
    def run_all(self):
        """Run all tests"""
        print("\n" + "="*80)
        print("PHASE 11.7 COMPREHENSIVE TESTING: LIFETIME UNLIMITED")
        print("="*80)
        print(f"Backend: {BASE_URL}")
        print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        if not self.create_test_user():
            print("\n❌ Setup failed - cannot continue")
            return False
        
        self.test_billing_config()
        self.test_checkout_free_user()
        self.test_checkout_unlimited_blocked()
        self.test_quota_unlimited()
        self.test_create_many_plans()
        self.test_extra_slots_blocked()
        self.test_upgrade_paths()
        
        print("\n" + "="*80)
        print("TEST SUMMARY")
        print("="*80)
        total = self.passed + self.failed
        print(f"Total: {total}")
        print(f"✅ Passed: {self.passed}")
        print(f"❌ Failed: {self.failed}")
        success_rate = (self.passed / total * 100) if total > 0 else 0
        print(f"Success Rate: {success_rate:.1f}%")
        
        return self.failed == 0

if __name__ == "__main__":
    runner = TestRunner()
    success = runner.run_all()
    sys.exit(0 if success else 1)
