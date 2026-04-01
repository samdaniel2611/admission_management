import React, { useState, useEffect } from 'react';
import { getSeatMatrices, createSeatMatrix, updateSeatMatrix, getPrograms, getAcademicYears, getInstitutions } from '../../services/api';
import toast from 'react-hot-toast';

const QUOTA_TEMPLATES = [
  { name: 'KCET', type: 'Government' },
  { name: 'COMEDK', type: 'Government' },
  { name: 'Management', type: 'Management' },
];

const DEFAULT_QUOTAS = QUOTA_TEMPLATES.map(q => ({ ...q, totalSeats: 0 }));

export default function SeatMatrix() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [years, setYears] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [filterYear, setFilterYear] = useState('');

  const [form, setForm] = useState({
    program: '', academicYear: '', institution: '',
    totalIntake: '', admissionMode: 'Both',
    supernumerarySeats: 0,
    quotas: DEFAULT_QUOTAS.map(q => ({ ...q, totalSeats: 0 }))
  });

  useEffect(() => {
    Promise.all([getPrograms(), getAcademicYears(), getInstitutions()]).then(([p, y, i]) => {
      setPrograms(p.data);
      setYears(y.data);
      setInstitutions(i.data);
      const cur = y.data.find(x => x.isCurrent);
      if (cur) setFilterYear(cur._id);
    });
  }, []);

  useEffect(() => { load(); }, [filterYear]);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterYear) params.academicYear = filterYear;
      const res = await getSeatMatrices(params);
      setItems(res.data);
    } catch { toast.error('Failed to load seat matrix'); }
    finally { setLoading(false); }
  };

  const totalQuotaSeats = form.quotas.reduce((s, q) => s + (parseInt(q.totalSeats) || 0), 0);
  const intakeMismatch = parseInt(form.totalIntake) > 0 && totalQuotaSeats !== parseInt(form.totalIntake);

  const openCreate = () => {
    setEditing(null);
    setForm({ program: '', academicYear: '', institution: '', totalIntake: '', admissionMode: 'Both', supernumerarySeats: 0, quotas: DEFAULT_QUOTAS.map(q => ({ ...q, totalSeats: 0 })) });
    setModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      program: item.program?._id || '',
      academicYear: item.academicYear?._id || '',
      institution: item.institution?._id || '',
      totalIntake: item.totalIntake,
      admissionMode: item.admissionMode,
      supernumerarySeats: item.supernumerarySeats || 0,
      quotas: item.quotas.map(q => ({ name: q.name, type: q.type, totalSeats: q.totalSeats }))
    });
    setModal(true);
  };

  const updateQuota = (idx, field, value) => {
    setForm(f => {
      const quotas = [...f.quotas];
      quotas[idx] = { ...quotas[idx], [field]: value };
      return { ...f, quotas };
    });
  };

  const addQuota = () => {
    setForm(f => ({ ...f, quotas: [...f.quotas, { name: '', type: 'Government', totalSeats: 0 }] }));
  };

  const removeQuota = (idx) => {
    setForm(f => ({ ...f, quotas: f.quotas.filter((_, i) => i !== idx) }));
  };

  const handleSave = async () => {
    if (intakeMismatch) { toast.error(`Quota seats (${totalQuotaSeats}) must equal total intake (${form.totalIntake})`); return; }
    if (!form.program || !form.academicYear || !form.institution) { toast.error('Program, Academic Year and Institution are required'); return; }
    setSaving(true);
    try {
      const data = { ...form, totalIntake: parseInt(form.totalIntake), supernumerarySeats: parseInt(form.supernumerarySeats) || 0, quotas: form.quotas.map(q => ({ ...q, totalSeats: parseInt(q.totalSeats) || 0 })) };
      if (editing) { await updateSeatMatrix(editing._id, data); toast.success('Seat matrix updated'); }
      else { await createSeatMatrix(data); toast.success('Seat matrix created'); }
      setModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Seat Matrix</div>
          <div className="page-sub">Configure program intake and quota distribution</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Seat Matrix</button>
      </div>

      <div className="filters-bar">
        <select value={filterYear} onChange={e => setFilterYear(e.target.value)}>
          <option value="">All Years</option>
          {years.map(y => <option key={y._id} value={y._id}>{y.year}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="page-loader"><div className="spinner" /></div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Program</th><th>Year</th><th>Total Intake</th>
                  <th>KCET</th><th>COMEDK</th><th>Management</th>
                  <th>Supernumerary</th><th>Mode</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0
                  ? <tr><td colSpan={9} className="table-empty">No seat matrices configured</td></tr>
                  : items.map(item => {
                    const getQ = name => item.quotas.find(q => q.name === name);
                    return (
                      <tr key={item._id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.program?.name}</div>
                          <div className="text-sm text-muted mono">{item.program?.code} · {item.program?.courseType}</div>
                        </td>
                        <td><span className="badge badge-blue">{item.academicYear?.year}</span></td>
                        <td style={{ fontWeight: 700 }}>{item.totalIntake}</td>
                        {['KCET', 'COMEDK', 'Management'].map(qn => {
                          const q = getQ(qn);
                          return <td key={qn}>{q ? (
                            <div>
                              <div style={{ fontWeight: 600 }}>{q.allocatedSeats}/{q.totalSeats}</div>
                              <div className="progress-bar" style={{ width: 60, marginTop: 4 }}>
                                <div className="progress-fill" style={{ width: `${q.totalSeats > 0 ? (q.allocatedSeats / q.totalSeats) * 100 : 0}%`, background: 'var(--accent)' }} />
                              </div>
                            </div>
                          ) : <span className="text-muted">—</span>}</td>;
                        })}
                        <td>{item.supernumerarySeats > 0 ? `${item.supernumeraryAllocated}/${item.supernumerarySeats}` : '—'}</td>
                        <td><span className="badge badge-gray">{item.admissionMode}</span></td>
                        <td>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}>Edit</button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(false); }}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <div className="modal-title">{editing ? 'Edit Seat Matrix' : 'Configure Seat Matrix'}</div>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid" style={{ marginBottom: 20 }}>
                <div className="form-group">
                  <label>Institution *</label>
                  <select value={form.institution} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))}>
                    <option value="">Select Institution</option>
                    {institutions.map(i => <option key={i._id} value={i._id}>{i.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Academic Year *</label>
                  <select value={form.academicYear} onChange={e => setForm(f => ({ ...f, academicYear: e.target.value }))}>
                    <option value="">Select Year</option>
                    {years.map(y => <option key={y._id} value={y._id}>{y.year}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Program *</label>
                  <select value={form.program} onChange={e => setForm(f => ({ ...f, program: e.target.value }))}>
                    <option value="">Select Program</option>
                    {programs.map(p => <option key={p._id} value={p._id}>{p.name} ({p.code}) — {p.courseType}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Total Intake *</label>
                  <input type="number" value={form.totalIntake} onChange={e => setForm(f => ({ ...f, totalIntake: e.target.value }))} placeholder="e.g. 60" min="1" />
                </div>
                <div className="form-group">
                  <label>Admission Mode</label>
                  <select value={form.admissionMode} onChange={e => setForm(f => ({ ...f, admissionMode: e.target.value }))}>
                    <option value="Both">Both</option>
                    <option value="Government">Government Only</option>
                    <option value="Management">Management Only</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Supernumerary Seats</label>
                  <input type="number" value={form.supernumerarySeats} onChange={e => setForm(f => ({ ...f, supernumerarySeats: e.target.value }))} placeholder="0" min="0" />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>Quota Distribution</div>
                    <div className="text-sm text-muted">Total quota seats must equal total intake</div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={addQuota}>+ Add Quota</button>
                </div>

                {intakeMismatch && (
                  <div className="alert alert-error" style={{ marginBottom: 12 }}>
                    ⚠ Quota total ({totalQuotaSeats}) ≠ Intake ({form.totalIntake}). Difference: {Math.abs(totalQuotaSeats - parseInt(form.totalIntake || 0))}
                  </div>
                )}
                {!intakeMismatch && totalQuotaSeats > 0 && parseInt(form.totalIntake) > 0 && (
                  <div className="alert alert-success" style={{ marginBottom: 12 }}>✓ Quota distribution is valid</div>
                )}

                <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg3)' }}>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase' }}>Quota Name</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase' }}>Type</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase' }}>Seats</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase' }}>%</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.quotas.map((q, idx) => (
                        <tr key={idx} style={{ borderTop: '1px solid var(--border)' }}>
                          <td style={{ padding: '8px 14px' }}>
                            <input value={q.name} onChange={e => updateQuota(idx, 'name', e.target.value)} placeholder="e.g. KCET" style={{ width: 120 }} />
                          </td>
                          <td style={{ padding: '8px 14px' }}>
                            <select value={q.type} onChange={e => updateQuota(idx, 'type', e.target.value)} style={{ width: 140 }}>
                              <option value="Government">Government</option>
                              <option value="Management">Management</option>
                            </select>
                          </td>
                          <td style={{ padding: '8px 14px' }}>
                            <input type="number" value={q.totalSeats} onChange={e => updateQuota(idx, 'totalSeats', e.target.value)} min="0" style={{ width: 80 }} />
                          </td>
                          <td style={{ padding: '8px 14px', fontSize: 12, color: 'var(--text3)' }}>
                            {form.totalIntake > 0 ? Math.round((parseInt(q.totalSeats) || 0) / parseInt(form.totalIntake) * 100) + '%' : '—'}
                          </td>
                          <td style={{ padding: '8px 14px' }}>
                            <button onClick={() => removeQuota(idx)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 16 }}>×</button>
                          </td>
                        </tr>
                      ))}
                      <tr style={{ borderTop: '1px solid var(--border)', background: 'var(--bg3)' }}>
                        <td style={{ padding: '8px 14px', fontWeight: 700, fontSize: 12 }}>TOTAL</td>
                        <td></td>
                        <td style={{ padding: '8px 14px', fontWeight: 700, color: intakeMismatch ? 'var(--red)' : 'var(--green)' }}>{totalQuotaSeats}</td>
                        <td style={{ padding: '8px 14px', fontSize: 12, color: 'var(--text3)' }}>/ {form.totalIntake || 0}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || intakeMismatch}>
                {saving ? '⏳ Saving...' : 'Save Seat Matrix'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
