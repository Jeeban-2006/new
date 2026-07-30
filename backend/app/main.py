from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .api.user import router as user_router
from .models.doctor import Doctor
from .models.patient import Patient
from .models.appointment import Appointment
from .api.doctor import router as doctor_router
from .api.patient import router as patient_router
from .api.appointment import router as appointment_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Niyati Python Fullstack Template")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get('/health')
def health():
    return {'ok': True, 'service': 'api', 'stack': 'python'}

@app.get('/api/version')
def version():
    return {'version': 'starter-v1', 'runtime': 'python', 'deploy_target': 'render'}

@app.get('/api/ping')
def ping():
    return {'ok': True, 'message': 'pong'}

@app.get("/")
def root():
    return {"message": "PostgreSQL Connected Successfully"}

# Include User API router
app.include_router(user_router, prefix="/api/users", tags=["users"])

# Include Doctor, Patient, and Appointment API routers
app.include_router(doctor_router, prefix="/api/doctors", tags=["doctors"])
app.include_router(patient_router, prefix="/api/patients", tags=["patients"])
app.include_router(appointment_router, prefix="/api/appointments", tags=["appointments"])


