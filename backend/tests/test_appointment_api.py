from fastapi.testclient import TestClient
from app.main import app
import time

client = TestClient(app)

def get_auth_headers():
    unique_suffix = int(time.time() * 1000)
    test_username = f"user_{unique_suffix}"
    test_email = f"user_{unique_suffix}@example.com"
    test_password = "password123"

    register_payload = {
        "username": test_username,
        "email": test_email,
        "password": test_password
    }
    response = client.post("/api/users/register", json=register_payload)
    assert response.status_code == 201

    login_payload = {
        "username": test_username,
        "password": test_password
    }
    response = client.post("/api/users/login", json=login_payload)
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_appointment_crud_flow():
    headers = get_auth_headers()
    unique_suffix = int(time.time() * 1000)

    # 1. Create doctor
    doc_res = client.post("/api/doctors/", json={
        "name": "Dr. House",
        "specialty": "Diagnostics",
        "email": f"house_{unique_suffix}@clinic.com",
        "phone": "+123456789"
    }, headers=headers)
    assert doc_res.status_code == 201
    doctor_id = doc_res.json()["id"]

    # 2. Create patient
    pat_res = client.post("/api/patients/", json={
        "name": "John Doe",
        "email": f"johndoe_{unique_suffix}@gmail.com",
        "phone": "+987654321",
        "gender": "Male"
    }, headers=headers)
    assert pat_res.status_code == 201
    patient_id = pat_res.json()["id"]

    # 3. Create appointment
    app_res = client.post("/api/appointments/", json={
        "patient_id": patient_id,
        "doctor_id": doctor_id,
        "appointment_date": "2026-08-10",
        "appointment_time": "10:30",
        "reason": "Routine Checkup"
    }, headers=headers)
    assert app_res.status_code == 201
    app_data = app_res.json()
    assert app_data["patient_id"] == patient_id
    assert app_data["doctor_id"] == doctor_id
    assert app_data["status"] == "Scheduled"
    appointment_id = app_data["id"]

    # 4. List appointments with filter
    list_res = client.get(f"/api/appointments/?doctor_id={doctor_id}&status=Scheduled", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 5. Update appointment status to Completed
    update_res = client.put(f"/api/appointments/{appointment_id}", json={
        "status": "Completed",
        "doctor_notes": "Patient in good health."
    }, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "Completed"
    assert update_res.json()["doctor_notes"] == "Patient in good health."

    # 6. Delete appointment
    del_res = client.delete(f"/api/appointments/{appointment_id}", headers=headers)
    assert del_res.status_code == 200

    # 7. Verify deletion
    get_res = client.get(f"/api/appointments/{appointment_id}", headers=headers)
    assert get_res.status_code == 404
