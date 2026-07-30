from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional
from .doctor import DoctorOut
from .patient import PatientOut

class AppointmentBase(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_date: str = Field(..., min_length=1, max_length=50)
    appointment_time: str = Field(..., min_length=1, max_length=50)
    reason: Optional[str] = None
    status: Optional[str] = "Scheduled"
    doctor_notes: Optional[str] = None

class AppointmentCreate(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_date: str = Field(..., min_length=1, max_length=50)
    appointment_time: str = Field(..., min_length=1, max_length=50)
    reason: Optional[str] = None

class AppointmentUpdate(BaseModel):
    appointment_date: Optional[str] = Field(None, min_length=1, max_length=50)
    appointment_time: Optional[str] = Field(None, min_length=1, max_length=50)
    reason: Optional[str] = None
    status: Optional[str] = Field(None, min_length=1, max_length=50)
    doctor_notes: Optional[str] = None

class AppointmentOut(AppointmentBase):
    id: int
    created_at: datetime
    patient: Optional[PatientOut] = None
    doctor: Optional[DoctorOut] = None

    model_config = ConfigDict(from_attributes=True)
