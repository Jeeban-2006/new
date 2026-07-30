import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/api';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getDoctors(), api.getPatients(), api.getAppointments()])
      .then(([d, p, a]) => {
        setDoctors(d || []);
        setPatients(p || []);
        setAppointments(a || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const scheduledCount = appointments.filter((a) => a.status === 'Scheduled').length;
  const completedCount = appointments.filter((a) => a.status === 'Completed').length;

  const STATS = [
    { icon: '👨‍⚕️', label: 'Total Doctors', value: doctors.length, color: 'indigo' },
    { icon: '🪪', label: 'Total Patients', value: patients.length, color: 'green' },
    { icon: '📅', label: 'Total Appointments', value: appointments.length, color: 'warning' },
    { icon: '⏳', label: 'Scheduled Appointments', value: scheduledCount, color: 'info' },
  ];

  // Recent 5 appointments, doctors, and patients
  const recentAppointments = appointments.slice(0, 5);
  const recentDoctors = doctors.slice(-5).reverse();
  const recentPatients = patients.slice(-5).reverse();

  const getStatusBadge = (st) => {
    switch (st) {
      case 'Completed':
        return <span className="badge badge-success">✓ Completed</span>;
      case 'Cancelled':
        return <span className="badge badge-danger">✕ Cancelled</span>;
      default:
        return <span className="badge badge-info">📅 Scheduled</span>;
    }
  };

  return (
    <div>
      {/* Welcome Banner */}
      <div className="welcome-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>{greeting()}, {user?.username} 👋</h2>
          <p>Here&apos;s an overview of your clinic and appointments today.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/appointments')}>
          📅 Manage Appointments Desk
        </button>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        {STATS.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className={`stat-icon ${s.color}`}>{s.icon}</div>
            <div className="stat-body">
              <div className="stat-value">{loading ? '—' : s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming / Recent Appointments Full Width Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <span className="card-title">📅 Upcoming & Recent Appointments</span>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/appointments')}>
            View All ({appointments.length})
          </button>
        </div>
        <div className="table-container">
          {recentAppointments.length === 0 && !loading ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <div className="empty-text">No appointments scheduled yet</div>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} onClick={() => navigate('/appointments')}>
                Book First Appointment
              </button>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date & Time</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAppointments.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <strong>{app.patient?.name || `Patient #${app.patient_id}`}</strong>
                    </td>
                    <td>
                      Dr. {app.doctor?.name || `Doctor #${app.doctor_id}`}
                      <br />
                      <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                        {app.doctor?.specialty}
                      </span>
                    </td>
                    <td>
                      {app.appointment_date} at {app.appointment_time}
                    </td>
                    <td>{app.reason || '—'}</td>
                    <td>{getStatusBadge(app.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Quick-view tables for Doctors and Patients */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent Doctors */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Doctors</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/doctors')}>
              View All
            </button>
          </div>
          <div className="table-container">
            {recentDoctors.length === 0 && !loading ? (
              <div className="empty-state">
                <div className="empty-icon">👨‍⚕️</div>
                <div className="empty-text">No doctors yet</div>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Specialty</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDoctors.map((d) => (
                    <tr key={d.id}>
                      <td>{d.name}</td>
                      <td>
                        <span className="badge badge-primary">{d.specialty}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Patients */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Patients</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/patients')}>
              View All
            </button>
          </div>
          <div className="table-container">
            {recentPatients.length === 0 && !loading ? (
              <div className="empty-state">
                <div className="empty-icon">🪪</div>
                <div className="empty-text">No patients yet</div>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Gender</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPatients.map((p) => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>
                        <span className={`badge badge-${p.gender === 'female' ? 'warning' : 'info'}`}>
                          {p.gender ?? '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
