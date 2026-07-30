const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getToken() {
  return localStorage.getItem('clinic_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || `Error ${res.status}`);
  }

  // 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Auth
  login:    (data) => request('/api/users/login',    { method: 'POST', body: JSON.stringify(data) }),
  register: (data) => request('/api/users/register', { method: 'POST', body: JSON.stringify(data) }),
  me:       ()     => request('/api/users/me'),

  // Doctors
  getDoctors:    ()         => request('/api/doctors/'),
  createDoctor:  (data)     => request('/api/doctors/',        { method: 'POST',   body: JSON.stringify(data) }),
  updateDoctor:  (id, data) => request(`/api/doctors/${id}`,   { method: 'PUT',    body: JSON.stringify(data) }),
  deleteDoctor:  (id)       => request(`/api/doctors/${id}`,   { method: 'DELETE' }),

  // Patients
  getPatients:   ()         => request('/api/patients/'),
  createPatient: (data)     => request('/api/patients/',       { method: 'POST',   body: JSON.stringify(data) }),
  updatePatient: (id, data) => request(`/api/patients/${id}`,  { method: 'PUT',    body: JSON.stringify(data) }),
  deletePatient: (id)       => request(`/api/patients/${id}`,  { method: 'DELETE' }),

  // Appointments
  getAppointments: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.patient_id) searchParams.append('patient_id', params.patient_id);
    if (params.doctor_id) searchParams.append('doctor_id', params.doctor_id);
    if (params.status) searchParams.append('status', params.status);
    if (params.date) searchParams.append('date', params.date);
    const queryString = searchParams.toString();
    return request(`/api/appointments/${queryString ? `?${queryString}` : ''}`);
  },
  createAppointment: (data)     => request('/api/appointments/',      { method: 'POST',   body: JSON.stringify(data) }),
  updateAppointment: (id, data) => request(`/api/appointments/${id}`, { method: 'PUT',    body: JSON.stringify(data) }),
  deleteAppointment: (id)       => request(`/api/appointments/${id}`, { method: 'DELETE' }),
};
