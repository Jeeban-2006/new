import { useState, useEffect, useMemo } from 'react';
import { api } from '../api/api';

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [doctorFilter, setDoctorFilter] = useState('');
  const [patientFilter, setPatientFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_date: '',
    appointment_time: '10:00',
    reason: '',
    status: 'Scheduled',
    doctor_notes: '',
  });

  // Modal State for Complete Consultation / Notes
  const [completeModalApp, setCompleteModalApp] = useState(null);
  const [completeNotes, setCompleteNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [appRes, docRes, patRes] = await Promise.all([
        api.getAppointments(),
        api.getDoctors(),
        api.getPatients(),
      ]);
      setAppointments(appRes || []);
      setDoctors(docRes || []);
      setPatients(patRes || []);
    } catch (err) {
      setError(err.message || 'Failed to load appointments data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingApp(null);
    const todayStr = new Date().toISOString().split('T')[0];
    setFormData({
      patient_id: patients[0]?.id ? String(patients[0].id) : '',
      doctor_id: doctors[0]?.id ? String(doctors[0].id) : '',
      appointment_date: todayStr,
      appointment_time: '10:00',
      reason: '',
      status: 'Scheduled',
      doctor_notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (app) => {
    setEditingApp(app);
    setFormData({
      patient_id: String(app.patient_id),
      doctor_id: String(app.doctor_id),
      appointment_date: app.appointment_date || '',
      appointment_time: app.appointment_time || '10:00',
      reason: app.reason || '',
      status: app.status || 'Scheduled',
      doctor_notes: app.doctor_notes || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingApp(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.patient_id || !formData.doctor_id) {
      setError('Please select both a patient and a doctor.');
      return;
    }
    if (!formData.appointment_date || !formData.appointment_time) {
      setError('Please provide appointment date and time.');
      return;
    }

    try {
      const payload = {
        patient_id: Number(formData.patient_id),
        doctor_id: Number(formData.doctor_id),
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
        reason: formData.reason,
      };

      if (editingApp) {
        await api.updateAppointment(editingApp.id, {
          ...payload,
          status: formData.status,
          doctor_notes: formData.doctor_notes,
        });
        setSuccessMsg('Appointment updated successfully!');
      } else {
        await api.createAppointment(payload);
        setSuccessMsg('Appointment scheduled successfully!');
      }

      closeModal();
      loadData();
    } catch (err) {
      setError(err.message || 'Error saving appointment');
    }
  };

  const handleQuickStatusChange = async (appId, newStatus, doctorNotes = null) => {
    setError('');
    try {
      const payload = { status: newStatus };
      if (doctorNotes !== null) {
        payload.doctor_notes = doctorNotes;
      }
      await api.updateAppointment(appId, payload);
      setSuccessMsg(`Appointment status updated to ${newStatus}`);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to update status');
    }
  };

  const handleOpenCompleteModal = (app) => {
    setCompleteModalApp(app);
    setCompleteNotes(app.doctor_notes || '');
  };

  const handleSaveCompleteNotes = async (e) => {
    e.preventDefault();
    if (!completeModalApp) return;
    await handleQuickStatusChange(completeModalApp.id, 'Completed', completeNotes);
    setCompleteModalApp(null);
  };

  const handleDelete = async (appId) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) return;
    setError('');
    try {
      await api.deleteAppointment(appId);
      setSuccessMsg('Appointment deleted');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete appointment');
    }
  };

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((app) => {
      if (doctorFilter && String(app.doctor_id) !== String(doctorFilter)) return false;
      if (patientFilter && String(app.patient_id) !== String(patientFilter)) return false;
      if (statusFilter && statusFilter !== 'All' && app.status !== statusFilter) return false;
      if (dateFilter && app.appointment_date !== dateFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const patName = app.patient?.name?.toLowerCase() || '';
        const docName = app.doctor?.name?.toLowerCase() || '';
        const reason = app.reason?.toLowerCase() || '';
        const notes = app.doctor_notes?.toLowerCase() || '';
        if (!patName.includes(q) && !docName.includes(q) && !reason.includes(q) && !notes.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [appointments, doctorFilter, patientFilter, statusFilter, dateFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = appointments.length;
    const scheduled = appointments.filter((a) => a.status === 'Scheduled').length;
    const completed = appointments.filter((a) => a.status === 'Completed').length;
    const cancelled = appointments.filter((a) => a.status === 'Cancelled').length;
    return { total, scheduled, completed, cancelled };
  }, [appointments]);

  const resetFilters = () => {
    setDoctorFilter('');
    setPatientFilter('');
    setStatusFilter('');
    setDateFilter('');
    setSearchQuery('');
  };

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
    <div className="appointments-page">
      {/* Header Banner */}
      <div className="welcome-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Appointment Desk 📅</h2>
          <p>Schedule, manage, and track patient consultations.</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={openCreateModal}>
          ➕ Book New Appointment
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          ⚠️ {error}
        </div>
      )}
      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: 20 }}>
          ✅ {successMsg}
        </div>
      )}

      {/* Stats Row */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon indigo">📋</div>
          <div className="stat-body">
            <div className="stat-value">{loading ? '—' : stats.total}</div>
            <div className="stat-label">Total Appointments</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">⏳</div>
          <div className="stat-body">
            <div className="stat-value">{loading ? '—' : stats.scheduled}</div>
            <div className="stat-label">Scheduled / Upcoming</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">✅</div>
          <div className="stat-body">
            <div className="stat-value">{loading ? '—' : stats.completed}</div>
            <div className="stat-label">Completed Consultations</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning">❌</div>
          <div className="stat-body">
            <div className="stat-value">{loading ? '—' : stats.cancelled}</div>
            <div className="stat-label">Cancelled</div>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="card">
        {/* Filter Toolbar */}
        <div className="card-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title">Appointments Directory</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing {filteredAppointments.length} of {appointments.length} records
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            {/* Search */}
            <input
              type="text"
              className="form-input"
              placeholder="🔍 Search patient, doctor, reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Doctor Filter */}
            <select
              className="form-input"
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
            >
              <option value="">All Doctors</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.name} ({d.specialty})
                </option>
              ))}
            </select>

            {/* Patient Filter */}
            <select
              className="form-input"
              value={patientFilter}
              onChange={(e) => setPatientFilter(e.target.value)}
            >
              <option value="">All Patients</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              className="form-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            {/* Date Filter */}
            <input
              type="date"
              className="form-input"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />

            {/* Reset */}
            {(doctorFilter || patientFilter || statusFilter || dateFilter || searchQuery) && (
              <button className="btn btn-ghost" onClick={resetFilters}>
                🔄 Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Table Container */}
        <div className="table-container">
          {loading ? (
            <div className="empty-state">
              <div className="empty-icon">⏳</div>
              <div className="empty-text">Loading appointments...</div>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <div className="empty-text">No appointments found matching filters</div>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={openCreateModal}>
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
                  <th>Reason for Visit</th>
                  <th>Status</th>
                  <th>Doctor Notes</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{app.patient?.name || `Patient #${app.patient_id}`}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {app.patient?.phone || app.patient?.email || ''}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>Dr. {app.doctor?.name || `Doctor #${app.doctor_id}`}</div>
                      <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                        {app.doctor?.specialty || 'General'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>📅 {app.appointment_date}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>⏰ {app.appointment_time}</div>
                    </td>
                    <td style={{ maxWidth: 200 }}>
                      <span style={{ fontSize: '0.9rem', color: app.reason ? 'var(--text)' : 'var(--text-muted)' }}>
                        {app.reason || '—'}
                      </span>
                    </td>
                    <td>{getStatusBadge(app.status)}</td>
                    <td style={{ maxWidth: 220 }}>
                      {app.doctor_notes ? (
                        <div style={{ fontSize: '0.85rem', fontStyle: 'italic', color: '#6366f1' }}>
                          💬 &quot;{app.doctor_notes}&quot;
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>None recorded</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        {app.status === 'Scheduled' && (
                          <>
                            <button
                              className="btn btn-sm btn-success"
                              title="Mark Consultation Completed"
                              onClick={() => handleOpenCompleteModal(app)}
                            >
                              ✓ Complete
                            </button>
                            <button
                              className="btn btn-sm btn-ghost"
                              style={{ color: '#ef4444' }}
                              title="Cancel Appointment"
                              onClick={() => handleQuickStatusChange(app.id, 'Cancelled')}
                            >
                              ✕ Cancel
                            </button>
                          </>
                        )}
                        <button
                          className="btn btn-sm btn-ghost"
                          title="Edit Details"
                          onClick={() => openEditModal(app)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn btn-sm btn-ghost"
                          style={{ color: '#ef4444' }}
                          title="Delete Appointment"
                          onClick={() => handleDelete(app.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Book / Edit Appointment Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingApp ? '✏️ Edit Appointment' : '📅 Book New Appointment'}</h3>
              <button className="modal-close-btn" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Patient *</label>
                <select
                  className="form-input"
                  required
                  value={formData.patient_id}
                  onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                >
                  <option value="">Select Patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.email ? `(${p.email})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Doctor *</label>
                <select
                  className="form-input"
                  required
                  value={formData.doctor_id}
                  onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                >
                  <option value="">Select Doctor</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.name} ({d.specialty})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    required
                    value={formData.appointment_date}
                    onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Time *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 10:30 AM"
                    required
                    value={formData.appointment_time}
                    onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Reason for Visit</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="e.g. Routine checkup, Follow-up consultation..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />
              </div>

              {editingApp && (
                <>
                  <div className="form-group" style={{ marginBottom: 14 }}>
                    <label className="form-label">Status</label>
                    <select
                      className="form-input"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 14 }}>
                    <label className="form-label">Doctor Notes</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      placeholder="Doctor's notes / diagnosis..."
                      value={formData.doctor_notes}
                      onChange={(e) => setFormData({ ...formData, doctor_notes: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn btn-ghost" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingApp ? 'Save Changes' : 'Schedule Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Consultation Modal with Doctor Notes */}
      {completeModalApp && (
        <div className="modal-backdrop" onClick={() => setCompleteModalApp(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✓ Complete Consultation</h3>
              <button className="modal-close-btn" onClick={() => setCompleteModalApp(null)}>✕</button>
            </div>
            <form onSubmit={handleSaveCompleteNotes}>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                Marking appointment for <strong>{completeModalApp.patient?.name}</strong> with <strong>Dr. {completeModalApp.doctor?.name}</strong> as completed.
              </p>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Consultation Notes / Prescription</label>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder="Enter doctor's diagnosis, notes, or prescriptions (optional)..."
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setCompleteModalApp(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success">
                  Mark as Completed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
