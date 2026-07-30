import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/api';

const EMPTY = { name: '', specialty: '', email: '', phone: '' };

function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return <div className={`toast toast-${type}`}>{msg}</div>;
}

function DoctorModal({ doctor, onClose, onSaved }) {
  const editing = !!doctor;
  const [form,    setForm]    = useState(editing ? { ...doctor } : { ...EMPTY });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.specialty || !form.email) {
      setError('Name, specialty, and email are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = { name: form.name, specialty: form.specialty, email: form.email, phone: form.phone };
      const saved = editing
        ? await api.updateDoctor(doctor.id, payload)
        : await api.createDoctor(payload);
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
          <span className="modal-title">{editing ? 'Edit Doctor' : 'Add Doctor'}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-message">{error}</div>}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="d-name">Full Name *</label>
                <input id="d-name" name="name" placeholder="Dr. Jane Smith" value={form.name} onChange={handle} required />
              </div>
              <div className="form-group">
                <label htmlFor="d-specialty">Specialty *</label>
                <input id="d-specialty" name="specialty" placeholder="e.g. Cardiology" value={form.specialty} onChange={handle} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="d-email">Email *</label>
                <input id="d-email" name="email" type="email" placeholder="doctor@clinic.com" value={form.email} onChange={handle} required />
              </div>
              <div className="form-group">
                <label htmlFor="d-phone">Phone</label>
                <input id="d-phone" name="phone" type="tel" placeholder="+1 234 567 8900" value={form.phone} onChange={handle} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : editing ? 'Save Changes' : 'Add Doctor'}
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

export default function Doctors() {
  const [doctors,  setDoctors]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [modal,    setModal]    = useState(null);   // null | { type:'add'|'edit', doctor? }
  const [confirm,  setConfirm]  = useState(null);  // null | { id, name }
  const [deleting, setDeleting] = useState(false);
  const [toast,    setToast]    = useState(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setDoctors(await api.getDoctors());
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const handleSaved = (saved, wasEditing) => {
    if (wasEditing) {
      setDoctors((prev) => prev.map((d) => d.id === saved.id ? saved : d));
      showToast('Doctor updated successfully.');
    } else {
      setDoctors((prev) => [...prev, saved]);
      showToast('Doctor added successfully.');
    }
    setModal(null);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteDoctor(confirm.id);
      setDoctors((prev) => prev.filter((d) => d.id !== confirm.id));
      showToast('Doctor deleted.');
      setConfirm(null);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = doctors.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.specialty?.toLowerCase().includes(search.toLowerCase()) ||
    d.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">👨‍⚕️ Doctors</div>
          <div className="page-subtitle">{doctors.length} doctors registered</div>
        </div>
        <button id="add-doctor-btn" className="btn btn-primary" onClick={() => setModal({ type: 'add' })}>
          + Add Doctor
        </button>
      </div>

      {/* Card */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">All Doctors</span>
          <div className="toolbar">
            <input
              className="search-input"
              placeholder="Search by name or specialty…"
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
              <div className="empty-text">{search ? 'No doctors match your search.' : 'No doctors added yet.'}</div>
              {!search && (
                <div className="empty-sub">
                  Click <strong>+ Add Doctor</strong> to get started.
                </div>
              )}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Specialty</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc, i) => (
                  <tr key={doc.id}>
                    <td className="td-muted">{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{doc.name}</td>
                    <td><span className="badge badge-primary">{doc.specialty || '—'}</span></td>
                    <td className="td-muted">{doc.email}</td>
                    <td className="td-muted">{doc.phone || '—'}</td>
                    <td>
                      <div className="td-actions">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setModal({ type: 'edit', doctor: doc })}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setConfirm({ id: doc.id, name: doc.name })}
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
        <DoctorModal
          doctor={modal.type === 'edit' ? modal.doctor : null}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {confirm && (
        <ConfirmModal
          message={`Are you sure you want to delete Dr. ${confirm.name}? This action cannot be undone.`}
          onConfirm={handleDelete}
          onClose={() => setConfirm(null)}
          loading={deleting}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
