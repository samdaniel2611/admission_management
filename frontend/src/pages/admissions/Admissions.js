import React, { useState, useEffect, useCallback } from 'react';
import { getAdmitted, getAcademicYears, getInstitutions, getPrograms } from '../../services/api';
import toast from 'react-hot-toast';

export default function Admissions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [years, setYears] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [filters, setFilters] = useState({ academicYear: '', institution: '', program: '', search: '' });

  useEffect(() => {
    Promise.all([getAcademicYears(), getInstitutions(), getPrograms()]).then(([y, i, p]) => {
      setYears(y.data); setInstitutions(i.data); setPrograms(p.data);
      const cur = y.data.find(x => x.isCurrent);
      if (cur) setFilters(f => ({ ...f, academicYear: cur._id }));
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.academicYear) params.academicYear = filters.academicYear;
      if (filters.institution) params.institution = filters.institution;
      if (filters.program) params.program = filters.program;
      const res = await getAdmitted(params);
      setItems(res.data);
    } catch { toast.error('Failed to load admitted students'); }
    finally { setLoading(false); }
  }, [filters.academicYear, filters.institution, filters.program]);

  useEffect(() => { load(); }, [load]);

  const updateFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  const filtered = items.filter(a => {
    if (!filters.search) return true;
    const s = filters.search.toLowerCase();
    return `${a.firstName} ${a.lastName}`.toLowerCase().includes(s)
      || a.admissionNumber?.toLowerCase().includes(s)
      || a.email?.toLowerCase().includes(s)
      || a.phone?.includes(s);
  });

  const handlePrint = () => window.print();

  const handleExportCSV = () => {
    const headers = ['Admission No', 'Name', 'Email', 'Phone', 'Program', 'Quota', 'Category', 'Admission Date'];
    const rows = filtered.map(a => [
      a.admissionNumber, `${a.firstName} ${a.lastName}`, a.email, a.phone,
      a.program?.name, a.quotaType, a.category,
      a.admissionDate ? new Date(a.admissionDate).toLocaleDateString('en-IN') : ''
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'admitted_students.csv'; a.click();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Admitted Students</div>
          <div className="page-sub">{filtered.length} students admitted</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={handleExportCSV}>↓ Export CSV</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16, padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
          <input placeholder="🔍 Search..." value={filters.search} onChange={e => updateFilter('search', e.target.value)} style={{ gridColumn: '1 / span 2' }} />
          <select value={filters.academicYear} onChange={e => updateFilter('academicYear', e.target.value)}>
            <option value="">All Years</option>
            {years.map(y => <option key={y._id} value={y._id}>{y.year}</option>)}
          </select>
          <select value={filters.institution} onChange={e => updateFilter('institution', e.target.value)}>
            <option value="">All Institutions</option>
            {institutions.map(i => <option key={i._id} value={i._id}>{i.name}</option>)}
          </select>
          <select value={filters.program} onChange={e => updateFilter('program', e.target.value)}>
            <option value="">All Programs</option>
            {programs.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="page-loader"><div className="spinner" /></div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Admission Number</th><th>Student Name</th>
                  <th>Program</th><th>Quota</th><th>Category</th>
                  <th>Contact</th><th>Admission Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan={8} className="table-empty">No admitted students found</td></tr>
                  : filtered.map((a, idx) => (
                    <tr key={a._id}>
                      <td className="text-muted" style={{ fontSize: 12 }}>{idx + 1}</td>
                      <td>
                        <span className="mono" style={{ color: 'var(--green)', fontWeight: 700, fontSize: 11 }}>{a.admissionNumber}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{a.firstName} {a.lastName}</div>
                        <div className="text-sm text-muted">{a.gender} · {a.entryType}</div>
                      </td>
                      <td>
                        {a.program ? (
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600 }}>{a.program.name}</div>
                            <div className="mono text-sm text-muted">{a.program.code} · {a.program.courseType}</div>
                          </div>
                        ) : '—'}
                      </td>
                      <td><span className="badge badge-cyan">{a.quotaType}</span></td>
                      <td><span className="badge badge-purple">{a.category}</span></td>
                      <td>
                        <div style={{ fontSize: 12 }}>{a.email}</div>
                        <div className="text-muted text-sm">{a.phone}</div>
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {a.admissionDate ? new Date(a.admissionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
