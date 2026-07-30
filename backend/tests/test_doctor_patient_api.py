from fastapi.testclient import TestClient
from app.main import app
import time

client = TestClient(app)

def get_auth_headers():
    # Helper to create a user and get auth headers
    unique_suffix = int(time.time() * 1000)
    test_username = f"user_{unique_suffix}"
    test_email = f"user_{unique_suffix}@example.com"
    test_password = "password123"

    # Register
    register_payload = {
        "username": test_username,
        "email": test_email,
        "password": test_password
    }
    response = client.post("/api/users/register", json=register_payload)
    assert response.status_code == 201

    # Login
    login_payload = {
        "username": test_username,
        "password": test_password
    }
    response = client.post("/api/users/login", json=login_payload)
    assert response.status_code == 200
    token_data = response.json()
    token = token_data["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_doctor_crud_flow():
    headers = get_auth_headers()
    unique_suffix = int(time.time() * 1000)
    doc_email = f"doctor_{unique_suffix}@clinic.com"

    # 1. Create a doctor
    create_payload = {
        "name": "Dr. John Watson",
        "specialty": "General Medicine",
        "email": doc_email,
        "phone": "+123456789"
    }
    response = client.post("/api/doctors/", json=create_payload, headers=headers)
    assert response.status_code == 201
    doctor_data = response.json()
    assert doctor_data["name"] == "Dr. John Watson"
    assert doctor_data["email"] == doc_email
    assert "id" in doctor_data
    assert doctor_data["is_active"] is True
    doctor_id = doctor_data["id"]

    # 2. Try to create duplicate doctor email
    response = client.post("/api/doctors/", json=create_payload, headers=headers)
    assert response.status_code == 400

    # 3. Get doctor by ID
    response = client.get(f"/api/doctors/{doctor_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Dr. John Watson"

    # 4. List doctors
    response = client.get("/api/doctors/", headers=headers)
    assert response.status_code == 200
    doctors_list = response.json()
    assert len(doctors_list) >= 1
    assert any(d["id"] == doctor_id for d in doctors_list)

    # 5. Update doctor
    update_payload = {
        "specialty": "Cardiology",
        "phone": "+987654321"
    }
    response = client.put(f"/api/doctors/{doctor_id}", json=update_payload, headers=headers)
    assert response.status_code == 200
    updated_data = response.json()
    assert updated_data["specialty"] == "Cardiology"
    assert updated_data["phone"] == "+987654321"
    assert updated_data["email"] == doc_email # should remain unchanged

    # 6. Delete doctor
    response = client.delete(f"/api/doctors/{doctor_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["id"] == doctor_id

    # 7. Verify doctor is deleted (404)
    response = client.get(f"/api/doctors/{doctor_id}", headers=headers)
    assert response.status_code == 404

def test_patient_crud_flow():
    headers = get_auth_headers()
    unique_suffix = int(time.time() * 1000)
    patient_email = f"patient_{unique_suffix}@gmail.com"

    # 1. Create a patient
    create_payload = {
        "name": "Sherlock Holmes",
        "email": patient_email,
        "phone": "+111222333",
        "date_of_birth": "1854-01-06",
        "gender": "Male"
    }
    response = client.post("/api/patients/", json=create_payload, headers=headers)
    assert response.status_code == 201
    patient_data = response.json()
    assert patient_data["name"] == "Sherlock Holmes"
    assert patient_data["email"] == patient_email
    assert "id" in patient_data
    assert patient_data["is_active"] is True
    patient_id = patient_data["id"]

    # 2. Try to create duplicate patient email
    response = client.post("/api/patients/", json=create_payload, headers=headers)
    assert response.status_code == 400

    # 3. Get patient by ID
    response = client.get(f"/api/patients/{patient_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Sherlock Holmes"

    # 4. List patients
    response = client.get("/api/patients/", headers=headers)
    assert response.status_code == 200
    patients_list = response.json()
    assert len(patients_list) >= 1
    assert any(p["id"] == patient_id for p in patients_list)

    # 5. Update patient
    update_payload = {
        "name": "Sherlock Holmes Jr.",
        "phone": "+444555666",
        "gender": "Other"
    }
    response = client.put(f"/api/patients/{patient_id}", json=update_payload, headers=headers)
    assert response.status_code == 200
    updated_data = response.json()
    assert updated_data["name"] == "Sherlock Holmes Jr."
    assert updated_data["phone"] == "+444555666"
    assert updated_data["gender"] == "Other"

    # 6. Delete patient
    response = client.delete(f"/api/patients/{patient_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["id"] == patient_id

    # 7. Verify patient is deleted (404)
    response = client.get(f"/api/patients/{patient_id}", headers=headers)
    assert response.status_code == 404
