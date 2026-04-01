import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createApplicant, updateApplicant, getApplicant, getInstitutions, getAcademicYears, getPrograms } from '../../services/api';
import toast from 'react-hot-toast';

const INITIAL = {
  firstName: '', lastName: '', dateOfBirth: '', gender: '',
  email: '', phone: '', address: '',
  category: '', entryType: '', qualifyingExam: '', qualifyingMarks: '', qualifyingPercentage: '',
  quotaType: '', admissionMode: '', allotmentNumber: '',
  program: '', institution: '', academicYear: ''
};

export default function ApplicantForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [institutions, setInstitutions] = useState([]);
  const [years, setYears] = useState([]);
  const [programs, setPrograms] = useState([]);

  useEffect(() => {
    Promise.all([getInstitutions(), getAcademicYears(), getPrograms()]).then(([i, y, p]) => {
      setInstitutions(i.data); setYears(y.data); setPrograms(p.data);
      if (!isEdit) {
        const cur = y.data.find(x => x.isCurrent);
        if (cur) setForm(f => ({ ...f, academicYear: cur._id }));
      }
    });
    if (isEdit) {
      setLoading(true);
      getApplicant(id).then(r => {
        const a = r.data;
        setForm({
          firstName: a.firstName || '', lastName: a.lastName || '',
          dateOfBirth: a.dateOfBirth ? a.dateOfBirth.split('T')[0] : '',
          gender: a.gender || '', email: a.email || '', phone: a.phone || '',
          address: a.address || '', category: a.category || '',
          entryType: a.entryType || '', qualifyingExam: a.qualifyingExam || '',
          qualifyingMarks: a.qualifyingMarks || '', qualifyingPercentage: a.qualifyingPercentage || '',
          quotaType: a.quotaType || '', admissionMode: a.admissionMode || '',
          allotmentNumber: a.allotmentNumber || '',
          program: a.program?._id || a.program || '',
          institution: a.institution?._id || a.institution || '',
          academicYear: a.academicYear?._id || a.academicYear || ''
        });
      }).catch(() => toast.error('Failed to load applicant')).finally(() => setLoading(false));
    }
  }, [id]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) { await updateApplicant(id, form); toast.success('Applicant updated'); }
      else { const res = await createApplicant(form); toast.success('Applicant created'); navigate(`/applicants/${res.data._id}`); return; }
      navigate(`/applicants/${id}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  const isGovt = form.admissionMode === 'Government';

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <div className="page-title">{isEdit ? 'Edit Applicant' : 'New Applicant'}</div>
          <div className="page-sub">Fill in the applicant details (max 15 fields)</div>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Back</button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Section: Personal */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><div className="card-title">👤 Personal Details</div></div>
          <div className="form-grid">
            <div className="form-group">
              <label>First Name *</label>
              <input value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="First name" required />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Last name" required />
            </div>
            <div className="form-group">
              <label>Date of Birth *</label>
              <input type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Gender *</label>
              <select value={form.gender} onChange={e => set('gender', e.target.value)} required>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="applicant@email.com" required />
            </div>
            <div className="form-group">
              <label>Phone *</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 9876543210" required />
            </div>
            <div className="form-group full">
              <label>Address *</label>
              <textarea value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full residential address" required rows={2} />
            </div>
          </div>
        </div>

        {/* Section: Academic */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><div className="card-title">📚 Academic Details</div></div>
          <div className="form-grid">
            <div className="form-group">
              <label>Category *</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} required>
                <option value="">Select Category</option>
                {['GM', 'SC', 'ST', 'OBC', 'EWS', 'PWD'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Entry Type *</label>
              <select value={form.entryType} onChange={e => set('entryType', e.target.value)} required>
                <option value="">Select Entry Type</option>
                <option value="Regular">Regular</option>
                <option value="Lateral">Lateral</option>
              </select>
            </div>
            <div className="form-group">
              <label>Qualifying Exam *</label>
              <input value={form.qualifyingExam} onChange={e => set('qualifyingExam', e.target.value)} placeholder="e.g. 12th / Diploma" required />
            </div>
            <div className="form-group">
              <label>Marks Obtained *</label>
              <input type="number" value={form.qualifyingMarks} onChange={e => set('qualifyingMarks', e.target.value)} placeholder="e.g. 480" required />
            </div>
            <div className="form-group">
              <label>Percentage / Percentile *</label>
              <input type="number" step="0.01" value={form.qualifyingPercentage} onChange={e => set('qualifyingPercentage', e.target.value)} placeholder="e.g. 88.5" required />
            </div>
          </div>
        </div>

        {/* Section: Admission */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><div className="card-title">🎓 Admission Details</div></div>
          <div className="form-grid">
            <div className="form-group">
              <label>Institution *</label>
              <select value={form.institution} onChange={e => set('institution', e.target.value)} required>
                <option value="">Select Institution</option>
                {institutions.map(i => <option key={i._id} value={i._id}>{i.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Academic Year *</label>
              <select value={form.academicYear} onChange={e => set('academicYear', e.target.value)} required>
                <option value="">Select Year</option>
                {years.map(y => <option key={y._id} value={y._id}>{y.year}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Admission Mode *</label>
              <select value={form.admissionMode} onChange={e => set('admissionMode', e.target.value)} required>
                <option value="">Select Mode</option>
                <option value="Government">Government</option>
                <option value="Management">Management</option>
              </select>
            </div>
            <div className="form-group">
              <label>Quota Type *</label>
              <select value={form.quotaType} onChange={e => set('quotaType', e.target.value)} required>
                <option value="">Select Quota</option>
                <option value="KCET">KCET</option>
                <option value="COMEDK">COMEDK</option>
                <option value="Management">Management</option>
              </select>
            </div>
            {isGovt && (
              <div className="form-group">
                <label>Allotment Number</label>
                <input value={form.allotmentNumber} onChange={e => set('allotmentNumber', e.target.value)} placeholder="Government allotment number" />
              </div>
            )}
            <div className="form-group">
              <label>Preferred Program</label>
              <select value={form.program} onChange={e => set('program', e.target.value)}>
                <option value="">Select Program (optional at this stage)</option>
                {programs.map(p => <option key={p._id} value={p._id}>{p.name} ({p.code}) — {p.courseType}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '⏳ Saving...' : isEdit ? 'Update Applicant' : 'Create Applicant →'}
          </button>
        </div>
      </form>
    </div>
  );
}
