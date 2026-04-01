import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getApplicants, getAcademicYears, getInstitutions, getPrograms } from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_BADGE = {
  Applied: 'badge-blue', 'Seat Allocated': 'badge-yellow',
  'Documents Verified': 'badge-purple', 'Fee Paid': 'badge-cyan',
  Admitted: 'badge-green', Rejected: 'badge-red', Withdrawn: 'badge-gray'
};

const FEE_BADGE = { Pending: 'badge-red', Paid: 'badge-green' };

export default function Applicants() {
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', status: '', quotaType: '', admissionMode: '', feeStatus: '', program: '', academicYear: '', institution: '' });
  const [years, setYears] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [programs, setPrograms] = useState([]);

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
      const params = { page, limit: 15, ...filters };
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
      const res = await getApplicants(params);
      setData(res.data);
    } catch { toast.error('Failed to load applicants'); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  const updateFilter = (key, val) => { setFilters(f => ({ ...f, [key]: val })); setPage(1); };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Applicants</div>
          <div className="page-sub">{data.total} total applicants</div>
        </div>
        <Link to="/applicants/new" className="btn btn-primary">+ New Applicant</Link>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16, padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
          <input placeholder="🔍 Search name, phone, email..." value={filters.search} onChange={e => updateFilter('search', e.target.value)} style={{ gridColumn: '1 / span 2' }} />
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
            {programs.map(p => <option key={p._id} value={p._id}>{p.name} ({p.code})</option>)}
          </select>
          <select value={filters.status} onChange={e => updateFilter('status', e.target.value)}>
            <option value="">All Statuses</option>
            {['Applied', 'Seat Allocated', 'Documents Verified', 'Admitted', 'Rejected', 'Withdrawn'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.quotaType} onChange={e => updateFilter('quotaType', e.target.value)}>
            <option value="">All Quotas</option>
            {['KCET', 'COMEDK', 'Management'].map(q => <option key={q} value={q}>{q}</option>)}
          </select>
          <select value={filters.admissionMode} onChange={e => updateFilter('admissionMode', e.target.value)}>
            <option value="">All Modes</option>
            <option value="Government">Government</option>
            <option value="Management">Management</option>
          </select>
          <select value={filters.feeStatus} onChange={e => updateFilter('feeStatus', e.target.value)}>
            <option value="">All Fee Status</option>
            <option value="Pending">Fee Pending</option>
            <option value="Paid">Fee Paid</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="page-loader"><div className="spinner" /></div> : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Applicant</th><th>Contact</th><th>Program</th>
                    <th>Quota</th><th>Mode</th><th>Status</th><th>Fee</th>
                    <th>Admission No.</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.length === 0
                    ? <tr><td colSpan={9} className="table-empty">No applicants found</td></tr>
                    : data.items.map(a => (
                      <tr key={a._id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{a.firstName} {a.lastName}</div>
                          <div className="text-sm text-muted">{a.category} · {a.entryType}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: 12 }}>{a.email}</div>
                          <div className="text-sm text-muted">{a.phone}</div>
                        </td>
                        <td>{a.program ? (
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600 }}>{a.program.name}</div>
                            <div className="text-sm text-muted mono">{a.program.code}</div>
                          </div>
                        ) : <span className="text-muted">—</span>}</td>
                        <td><span className="badge badge-cyan">{a.quotaType}</span></td>
                        <td><span className="badge badge-gray">{a.admissionMode}</span></td>
                        <td><span className={`badge ${STATUS_BADGE[a.status] || 'badge-gray'}`}>{a.status}</span></td>
                        <td><span className={`badge ${FEE_BADGE[a.feeStatus]}`}>{a.feeStatus}</span></td>
                        <td>{a.admissionNumber ? <span className="mono" style={{ fontSize: 11, color: 'var(--green)' }}>{a.admissionNumber}</span> : <span className="text-muted">—</span>}</td>
                        <td>
                          <Link to={`/applicants/${a._id}`} className="btn btn-ghost btn-sm">View</Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.pages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16 }}>
                <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>Page {page} of {data.pages}</span>
                <button className="btn btn-ghost btn-sm" disabled={page === data.pages} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
