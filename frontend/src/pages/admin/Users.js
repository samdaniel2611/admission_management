import React, { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser } from '../../services/api';
import toast from 'react-hot-toast';

const ROLE_BADGE = { admin: 'badge-red', admission_officer: 'badge-blue', management: 'badge-purple' };
const ROLE_LABEL = { admin: 'Administrator', admission_officer: 'Admission Officer', management: 'Management' };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'admission_officer' });

  const load = async () => {
    setLoading(true);
    try { const r = await getUsers(); setUsers(r.data); }
    catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', password: '', role: 'admission_officer' });
    setModal(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, isActive: u.isActive });
    setModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        const data = { name: form.name, role: form.role, isActive: form.isActive };
        await updateUser(editing._id, data);
        toast.success('User updated');
      } else {
        await createUser(form);
        toast.success('User created');
      }
      setModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (u) => {
    try {
      await updateUser(u._id, { isActive: !u.isActive });
      toast.success(`User ${u.isActive ? 'deactivated' : 'activated'}`);
      load();
    } catch { toast.error('Failed'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">User Management</div>
          <div className="page-sub">Manage system users and roles</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add User</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="page-loader"><div className="spinner" /></div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#fff', flexShrink: 0 }}>
                          {u.name[0].toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600 }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text2)', fontSize: 13 }}>{u.email}</td>
                    <td><span className={`badge ${ROLE_BADGE[u.role]}`}>{ROLE_LABEL[u.role]}</span></td>
                    <td><span className={`badge ${u.isActive ? 'badge-green' : 'badge-gray'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td className="text-sm text-muted">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>
                      <div className="gap-8">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(u)}>Edit</button>
                        <button className="btn btn-sm" style={{ background: u.isActive ? 'var(--red-bg)' : 'var(--green-bg)', color: u.isActive ? 'var(--red)' : 'var(--green)', border: 'none' }} onClick={() => toggleActive(u)}>
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(false); }}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editing ? 'Edit User' : 'New User'}</div>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full">
                  <label>Full Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" />
                </div>
                {!editing && (
                  <div className="form-group full">
                    <label>Email *</label>
                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="user@institution.edu" />
                  </div>
                )}
                {!editing && (
                  <div className="form-group full">
                    <label>Password *</label>
                    <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" />
                  </div>
                )}
                <div className="form-group full">
                  <label>Role *</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                    <option value="admission_officer">Admission Officer</option>
                    <option value="admin">Administrator</option>
                    <option value="management">Management (View Only)</option>
                  </select>
                </div>
                {editing && (
                  <div className="form-group full">
                    <label style={{ flexDirection: 'row', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input type="checkbox" style={{ width: 'auto' }} checked={!!form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                      Active User
                    </label>
                  </div>
                )}
              </div>
              <div className="alert alert-info" style={{ marginTop: 12 }}>
                <strong>Role Permissions:</strong><br />
                Admin — Full access including master setup<br />
                Admission Officer — Create applicants, allocate seats, confirm admissions<br />
                Management — View-only access to dashboard and reports
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? '⏳ Saving...' : 'Save User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
