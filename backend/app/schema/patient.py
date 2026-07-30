from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional

class PatientBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., min_length=5, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    date_of_birth: Optional[str] = Field(None, max_length=50)
    gender: Optional[str] = Field(None, max_length=20)

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[str] = Field(None, min_length=5, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    date_of_birth: Optional[str] = Field(None, max_length=50)
    gender: Optional[str] = Field(None, max_length=20)
    is_active: Optional[bool] = None

class PatientOut(PatientBase):
    id: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
