from fastapi.testclient import TestClient
from app.main import app
import time

client = TestClient(app)

def test_user_flow():
    # Generate unique credentials for this test run
    unique_suffix = int(time.time())
    test_username = f"user_{unique_suffix}"
    test_email = f"user_{unique_suffix}@example.com"
    test_password = "password123"

    # 1. Register a test user
    register_payload = {
        "username": test_username,
        "email": test_email,
        "password": test_password
    }
    response = client.post("/api/users/register", json=register_payload)
    assert response.status_code == 201
    user_data = response.json()
    assert user_data["username"] == test_username
    assert user_data["email"] == test_email
    assert "id" in user_data
    
    user_id = user_data["id"]

    # 2. Try registering the same user again (should fail)
    response = client.post("/api/users/register", json=register_payload)
    assert response.status_code == 400

    # 3. Login
    login_payload = {
        "username": test_username,
        "password": test_password
    }
    response = client.post("/api/users/login", json=login_payload)
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    token = token_data["access_token"]
    
    headers = {"Authorization": f"Bearer {token}"}

    # 4. Get Current User profile
    response = client.get("/api/users/me", headers=headers)
    assert response.status_code == 200
    profile_data = response.json()
    assert profile_data["username"] == test_username
    assert profile_data["id"] == user_id

    # 5. Read User list
    response = client.get("/api/users/", headers=headers)
    assert response.status_code == 200
    users_list = response.json()
    assert len(users_list) >= 1
    assert any(u["id"] == user_id for u in users_list)

    # 6. Read User by ID
    response = client.get(f"/api/users/{user_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["username"] == test_username

    # 7. Update User profile
    update_payload = {
        "email": f"updated_{unique_suffix}@example.com"
    }
    response = client.put(f"/api/users/{user_id}", json=update_payload, headers=headers)
    assert response.status_code == 200
    updated_data = response.json()
    assert updated_data["email"] == f"updated_{unique_suffix}@example.com"

    # 8. Delete User
    response = client.delete(f"/api/users/{user_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["id"] == user_id

    # 9. Verify user is deleted (old token is now invalid -> returns 401 Unauthorized)
    response = client.get(f"/api/users/{user_id}", headers=headers)
    assert response.status_code == 401
