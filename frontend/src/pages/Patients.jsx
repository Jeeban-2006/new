import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/api';

const EMPTY = { name: '', email: '', phone: '', date_of_birth: '', gender: '' };

function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return <div className={`toast toast-${type}`}>{msg}</div>;
}

function PatientModal({ patient, onClose, onSaved }) {
  const editing = !!patient;
  const [form,    setForm]    = useState(editing ? { ...patient } : { ...EMPTY });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      setError('Name and email are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        name:          form.name,
        email:         form.email,
        phone:         form.phone         || null,
        date_of_birth: form.date_of_birth || null,
        gender:        form.gender        || null,
      };
      const saved = editing
        ? await api.updatePatient(patient.id, payload)
        : await api.createPatient(payload);
      onSaved(saved, editing);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{editing ? 'Edit Patient' : 'Add Patient'}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-message">{error}</div>}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="p-name">Full Name *</label>
                <input id="p-name" name="name" placeholder="John Doe" value={form.name} onChange={handle} required />
              </div>
              <div className="form-group">
                <label htmlFor="p-email">Email *</label>
                <input id="p-email" name="email" type="email" placeholder="patient@email.com" value={form.email} onChange={handle} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="p-phone">Phone</label>
                <input id="p-phone" name="phone" type="tel" placeholder="+1 234 567 8900" value={form.phone} onChange={handle} />
              </div>
              <div className="form-group">
                <label htmlFor="p-dob">Date of Birth</label>
                <input id="p-dob" name="date_of_birth" type="date" value={form.date_of_birth || ''} onChange={handle} />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="p-gender">Gender</label>
              <select id="p-gender" name="gender" value={form.gender || ''} onChange={handle}>
                <option value="">Select gender…</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : editing ? 'Save Changes' : 'Add Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onClose, loading }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 380 }}>
        <div className="modal-header">
          <span className="modal-title">⚠️ Confirm Delete</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p className="confirm-text">{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

function genderBadge(gender) {
  if (!gender) return <span className="td-muted">—</span>;
  const map = { male: 'info', female: 'warning', other: 'primary' };
  return <span className={`badge badge-${map[gender] ?? 'primary'}`}>{gender}</span>;
}

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [modal,    setModal]    = useState(null);
  const [confirm,  setConfirm]  = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast,    setToast]    = useState(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPatients(await api.getPatients());
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const handleSaved = (saved, wasEditing) => {
    if (wasEditing) {
      setPatients((prev) => prev.map((p) => p.id === saved.id ? saved : p));
      showToast('Patient updated successfully.');
    } else {
      setPatients((prev) => [...prev, saved]);
      showToast('Patient added successfully.');
    }
    setModal(null);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deletePatient(confirm.id);
      setPatients((prev) => prev.filter((p) => p.id !== confirm.id));
      showToast('Patient deleted.');
      setConfirm(null);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.gender?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">🪪 Patients</div>
          <div className="page-subtitle">{patients.length} patients registered</div>
        </div>
        <button id="add-patient-btn" className="btn btn-primary" onClick={() => setModal({ type: 'add' })}>
          + Add Patient
        </button>
      </div>

      {/* Card */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">All Patients</span>
          <div className="toolbar">
            <input
              className="search-input"
              placeholder="Search by name, email or gender…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="empty-state">
              <span className="spinner" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <div className="empty-text">{search ? 'No patients match your search.' : 'No patients added yet.'}</div>
              {!search && (
                <div className="empty-sub">
                  Click <strong>+ Add Patient</strong> to get started.
                </div>
              )}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Date of Birth</th>
                  <th>Gender</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((pat, i) => (
                  <tr key={pat.id}>
                    <td className="td-muted">{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{pat.name}</td>
                    <td className="td-muted">{pat.email}</td>
                    <td className="td-muted">{pat.phone || '—'}</td>
                    <td className="td-muted">{pat.date_of_birth || '—'}</td>
                    <td>{genderBadge(pat.gender)}</td>
                    <td>
                      <div className="td-actions">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setModal({ type: 'edit', patient: pat })}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setConfirm({ id: pat.id, name: pat.name })}
                        >
                          🗑 Delete
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

      {/* Modals */}
      {modal && (
        <PatientModal
          patient={modal.type === 'edit' ? modal.patient : null}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {confirm && (
        <ConfirmModal
          message={`Are you sure you want to delete patient ${confirm.name}? This action cannot be undone.`}
          onConfirm={handleDelete}
          onClose={() => setConfirm(null)}
          loading={deleting}
        />
      )}

      {toast && (
        <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
