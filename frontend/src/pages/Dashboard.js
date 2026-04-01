import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { getDashboard, getAcademicYears, getInstitutions } from '../services/api';
import toast from 'react-hot-toast';

const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#06b6d4', '#f97316'];

const statusBadge = (s) => {
  const m = {
    Applied: 'badge-blue', 'Seat Allocated': 'badge-yellow', 'Documents Verified': 'badge-purple',
    'Fee Paid': 'badge-cyan', Admitted: 'badge-green', Rejected: 'badge-red', Withdrawn: 'badge-gray'
  };
  return <span className={`badge ${m[s] || 'badge-gray'}`}>{s}</span>;
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [years, setYears] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [filters, setFilters] = useState({ academicYear: '', institution: '' });

  useEffect(() => {
    Promise.all([getAcademicYears(), getInstitutions()]).then(([y, i]) => {
      setYears(y.data);
      setInstitutions(i.data);
      const cur = y.data.find(x => x.isCurrent);
      if (cur) setFilters(f => ({ ...f, academicYear: cur._id }));
    });
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [filters]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.academicYear) params.academicYear = filters.academicYear;
      if (filters.institution) params.institution = filters.institution;
      const res = await getDashboard(params);
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!data) return <div className="alert alert-error">Failed to load dashboard data.</div>;

  const { overview, programWise, quotaSummary, statusBreakdown, recentAdmissions, pendingDocsApplicants } = data;

  const quotaBarData = Object.entries(quotaSummary).map(([name, d]) => ({
    name, total: d.total, allocated: d.allocated, available: d.total - d.allocated
  }));

  const statusPieData = Object.entries(statusBreakdown).map(([name, value]) => ({ name, value }));

  const programBarData = programWise.slice(0, 8).map(p => ({
    name: p.programCode || p.program, intake: p.totalIntake, admitted: p.confirmed, allocated: p.allocated
  }));

  return (
    <div>
      {/* Filters */}
      <div className="filters-bar" style={{ marginBottom: 20 }}>
        <select value={filters.academicYear} onChange={e => setFilters(f => ({ ...f, academicYear: e.target.value }))}>
          <option value="">All Academic Years</option>
          {years.map(y => <option key={y._id} value={y._id}>{y.year}</option>)}
        </select>
        <select value={filters.institution} onChange={e => setFilters(f => ({ ...f, institution: e.target.value }))}>
          <option value="">All Institutions</option>
          {institutions.map(i => <option key={i._id} value={i._id}>{i.name}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: 'Total Applicants', value: overview.totalApplicants, icon: '👤', color: 'var(--accent)', bg: 'var(--accent-glow)' },
          { label: 'Admitted', value: overview.admittedCount, icon: '🎓', color: 'var(--green)', bg: 'var(--green-bg)' },
          { label: 'Seat Allocated', value: overview.seatAllocatedCount, icon: '💺', color: 'var(--yellow)', bg: 'var(--yellow-bg)' },
          { label: 'Fee Pending', value: overview.feePendingCount, icon: '💳', color: 'var(--red)', bg: 'var(--red-bg)' },
          { label: 'Total Intake', value: overview.totalIntake, icon: '📋', color: 'var(--purple)', bg: 'var(--purple-bg)' },
          { label: 'Remaining Seats', value: overview.totalRemaining, icon: '🔓', color: 'var(--cyan)', bg: 'var(--cyan-bg)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
            {s.label === 'Total Intake' && overview.totalIntake > 0 && (
              <div className="stat-change">{overview.fillPercent}% filled</div>
            )}
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="card">
          <div className="card-header"><div className="card-title">Quota-wise Seats</div></div>
          {quotaBarData.length === 0 ? (
            <div className="table-empty">No quota data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={quotaBarData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: '#8a94a8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#8a94a8', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1e2535', border: '1px solid #2a3347', borderRadius: 8, color: '#e8edf5' }} />
                <Bar dataKey="allocated" fill="#3b82f6" name="Allocated" radius={[4, 4, 0, 0]} />
                <Bar dataKey="available" fill="#22c55e" name="Available" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">Applicant Status</div></div>
          {statusPieData.length === 0 ? (
            <div className="table-empty">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {statusPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e2535', border: '1px solid #2a3347', borderRadius: 8, color: '#e8edf5' }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11, color: '#8a94a8' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Program wise */}
      {programBarData.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><div className="card-title">Program-wise Seat Filling</div></div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={programBarData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: '#8a94a8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8a94a8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e2535', border: '1px solid #2a3347', borderRadius: 8, color: '#e8edf5' }} />
              <Bar dataKey="intake" fill="#344059" name="Total Intake" radius={[4, 4, 0, 0]} />
              <Bar dataKey="allocated" fill="#3b82f6" name="Allocated" radius={[4, 4, 0, 0]} />
              <Bar dataKey="admitted" fill="#22c55e" name="Admitted" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Program quota detail */}
      {programWise.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><div className="card-title">Program Seat Matrix</div></div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Program</th><th>Type</th><th>Total Intake</th>
                  {Object.keys(quotaSummary).map(q => <th key={q}>{q}</th>)}
                  <th>Remaining</th><th>Fill %</th>
                </tr>
              </thead>
              <tbody>
                {programWise.map((p, i) => (
                  <tr key={i}>
                    <td><div style={{ fontWeight: 600 }}>{p.program}</div><div className="text-sm text-muted mono">{p.programCode}</div></td>
                    <td><span className="badge badge-blue">{p.courseType}</span></td>
                    <td>{p.totalIntake}</td>
                    {Object.keys(quotaSummary).map(qn => {
                      const q = p.quotas.find(x => x.name === qn);
                      return <td key={qn}>{q ? `${q.allocated}/${q.total}` : '—'}</td>;
                    })}
                    <td><span className={`badge ${p.remaining === 0 ? 'badge-red' : 'badge-green'}`}>{p.remaining}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar" style={{ width: 60 }}>
                          <div className="progress-fill" style={{ width: `${p.fillPercent}%`, background: p.fillPercent >= 90 ? 'var(--red)' : p.fillPercent >= 60 ? 'var(--yellow)' : 'var(--green)' }} />
                        </div>
                        <span style={{ fontSize: 12 }}>{p.fillPercent}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="card-header"><div className="card-title">Recent Admissions</div></div>
          {recentAdmissions.length === 0 ? (
            <div className="table-empty">No admissions yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentAdmissions.map(a => (
                <div key={a._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{a.firstName} {a.lastName}</div>
                    <div className="mono text-sm text-muted">{a.admissionNumber}</div>
                  </div>
                  <span className="badge badge-blue">{a.quotaType}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div><div className="card-title">Pending Documents</div><div className="card-sub">Applicants with pending docs</div></div>
            <span className="badge badge-yellow">{pendingDocsApplicants.length}</span>
          </div>
          {pendingDocsApplicants.length === 0 ? (
            <div className="table-empty">All documents up to date ✓</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pendingDocsApplicants.map(a => {
                const pending = a.documents.filter(d => d.status === 'Pending').length;
                return (
                  <div key={a._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{a.firstName} {a.lastName}</div>
                      <div className="text-sm text-muted">{a.phone}</div>
                    </div>
                    <span className="badge badge-red">{pending} pending</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
