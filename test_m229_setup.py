"""Setup script to create a test user and plan via backend API for Message 229 testing."""
import requests
import time
import json

BASE_URL = "https://pro-unlock-3.preview.emergentagent.com/api"
SUPABASE_URL = "https://dhxkwacdzmwwnmokmppf.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_KSys0E8FHr5UoDNDtYJLvQ_VOcSZ7wo"

def create_test_user_and_plan():
    """Create a test user and plan, return credentials and plan_id."""
    timestamp = int(time.time())
    email = f"test.m229.{timestamp}@example.com"
    password = "TestPass123!"
    name = f"Test M229 {timestamp}"
    
    print(f"Creating test user: {email}")
    
    # 1. Sign up via backend API
    signup_payload = {
        "email": email,
        "password": password,
        "full_name": name
    }
    
    r = requests.post(f"{BASE_URL}/auth/signup", json=signup_payload, timeout=10)
    if r.status_code != 200:
        print(f"Signup failed: {r.status_code} - {r.text}")
        return None
    
    user_data = r.json()
    user_id = user_data["id"]
    print(f"✅ User created: {email} (id={user_id})")
    
    # 2. Sign in via Supabase to get access token
    auth_url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
    auth_payload = {"email": email, "password": password}
    auth_headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json"
    }
    
    r2 = requests.post(auth_url, json=auth_payload, headers=auth_headers, timeout=10)
    if r2.status_code != 200:
        print(f"Sign-in failed: {r2.status_code} - {r2.text}")
        return None
    
    auth_data = r2.json()
    token = auth_data["access_token"]
    print(f"✅ Got access token")
    
    # 3. Create a plan
    plan_payload = {
        "title": "The Influence Incubator - M229 Test",
        "idea": "A transformational coaching platform for aspiring thought leaders",
        "founder_backstory": "Former corporate executive turned entrepreneur",
        "industry": "Coaching & Consulting",
        "stage": "Idea"
    }
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    r3 = requests.post(f"{BASE_URL}/plans", json=plan_payload, headers=headers, timeout=10)
    if r3.status_code != 201:
        print(f"Plan creation failed: {r3.status_code} - {r3.text}")
        return None
    
    plan_data = r3.json()
    plan_id = plan_data["id"]
    print(f"✅ Plan created: {plan_data['title']} (id={plan_id})")
    
    # Return credentials and plan info
    return {
        "email": email,
        "password": password,
        "user_id": user_id,
        "plan_id": plan_id,
        "token": token
    }

if __name__ == "__main__":
    result = create_test_user_and_plan()
    if result:
        print("\n" + "="*60)
        print("TEST ACCOUNT CREATED SUCCESSFULLY")
        print("="*60)
        print(json.dumps(result, indent=2))
        
        # Save to file for Playwright to use
        with open("/tmp/m229_test_account.json", "w") as f:
            json.dump(result, f, indent=2)
        print("\nCredentials saved to: /tmp/m229_test_account.json")
    else:
        print("\n❌ Failed to create test account")
        exit(1)
