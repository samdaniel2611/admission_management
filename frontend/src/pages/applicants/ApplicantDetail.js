import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getApplicant, updateDocument, allocateSeat, markFeePaid,
  confirmAdmission, updateAdmissionStatus, getSeatMatrices
} from '../../services/api';
import toast from 'react-hot-toast';

const STEP_MAP = {
  Applied: 0, 'Seat Allocated': 1, 'Documents Verified': 2, Admitted: 3
};

const STATUS_BADGE = {
  Applied: 'badge-blue', 'Seat Allocated': 'badge-yellow',
  'Documents Verified': 'badge-purple', Admitted: 'badge-green',
  Rejected: 'badge-red', Withdrawn: 'badge-gray'
};

const DOC_STATUS_COLOR = { Pending: 'badge-red', Submitted: 'badge-yellow', Verified: 'badge-green' };

export default function ApplicantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [applicant, setApplicant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matrices, setMatrices] = useState([]);
  const [selectedMatrix, setSelectedMatrix] = useState('');
  const [allocating, setAllocating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [feeModal, setFeeModal] = useState(false);
  const [feeAmount, setFeeAmount] = useState('');
  const [savingFee, setSavingFee] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getApplicant(id);
      setApplicant(res.data);
    } catch { toast.error('Failed to load applicant'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (applicant && applicant.status === 'Applied') {
      const params = {};
      if (applicant.institution?._id) params.institution = applicant.institution._id;
      if (applicant.academicYear?._id) params.academicYear = applicant.academicYear._id;
      getSeatMatrices(params).then(r => setMatrices(r.data));
    }
  }, [applicant]);

  const handleDocUpdate = async (docId, status) => {
    try {
      await updateDocument(id, docId, { status });
      toast.success('Document updated');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleAllocate = async () => {
    if (!selectedMatrix) { toast.error('Please select a seat matrix'); return; }
    setAllocating(true);
    try {
      await allocateSeat(id, { seatMatrixId: selectedMatrix });
      toast.success('✅ Seat allocated successfully!');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Allocation failed'); }
    finally { setAllocating(false); }
  };

  const handleFeePaid = async () => {
    setSavingFee(true);
    try {
      await markFeePaid(id, { feeAmount: parseFloat(feeAmount) || 0 });
      toast.success('Fee marked as paid');
      setFeeModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSavingFee(false); }
  };

  const handleConfirm = async () => {
    if (!window.confirm('Confirm admission and generate admission number? This cannot be undone.')) return;
    setConfirming(true);
    try {
      const res = await confirmAdmission(id, {});
      toast.success(`🎓 Admission confirmed! Number: ${res.data.admissionNumber}`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Confirmation failed'); }
    finally { setConfirming(false); }
  };

  const handleStatusChange = async (status) => {
    if (!window.confirm(`Mark applicant as ${status}?`)) return;
    try {
      await updateAdmissionStatus(id, { status });
      toast.success(`Applicant marked as ${status}`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!applicant) return <div className="alert alert-error">Applicant not found</div>;

  const step = STEP_MAP[applicant.status] ?? -1;
  const allDocsVerified = applicant.documents.every(d => d.status === 'Verified');
  const anyDocPending = applicant.documents.some(d => d.status === 'Pending');
  const canConfirm = applicant.feeStatus === 'Paid' && ['Seat Allocated', 'Documents Verified'].includes(applicant.status) && !applicant.admissionNumber;

  const filteredMatrices = matrices.filter(m => {
    if (!applicant.program?._id) return true;
    return m.program?._id === applicant.program?._id || m.program === applicant.program?._id;
  });

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">{applicant.firstName} {applicant.lastName}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            <span className={`badge ${STATUS_BADGE[applicant.status] || 'badge-gray'}`}>{applicant.status}</span>
            <span className={`badge ${applicant.feeStatus === 'Paid' ? 'badge-green' : 'badge-red'}`}>Fee: {applicant.feeStatus}</span>
            <span className="badge badge-cyan">{applicant.quotaType}</span>
            <span className="badge badge-gray">{applicant.admissionMode}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!applicant.admissionNumber && <Link to={`/applicants/${id}/edit`} className="btn btn-secondary">Edit</Link>}
          <button className="btn btn-secondary" onClick={() => navigate('/applicants')}>← Back</button>
        </div>
      </div>

      {/* Admission number banner */}
      {applicant.admissionNumber && (
        <div className="alert alert-success" style={{ marginBottom: 20, fontSize: 15 }}>
          🎓 <strong>Admitted!</strong> Admission Number: <span className="mono" style={{ fontSize: 15, fontWeight: 700 }}>{applicant.admissionNumber}</span>
          <div style={{ fontSize: 12, marginTop: 4 }}>Date: {new Date(applicant.admissionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
        </div>
      )}

      {/* Progress steps */}
      {applicant.status !== 'Rejected' && applicant.status !== 'Withdrawn' && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="steps">
            {['Applied', 'Seat Allocated', 'Documents Verified', 'Admitted'].map((s, i) => (
              <div key={s} className={`step${step > i ? ' done' : step === i ? ' active' : ''}`}>
                <div className="step-dot">{step > i ? '✓' : i + 1}</div>
                <div className="step-label">{s}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Personal */}
        <div className="card">
          <div className="card-header"><div className="card-title">👤 Personal Details</div></div>
          <div className="detail-grid">
            {[
              ['Full Name', `${applicant.firstName} ${applicant.lastName}`],
              ['Date of Birth', applicant.dateOfBirth ? new Date(applicant.dateOfBirth).toLocaleDateString('en-IN') : '—'],
              ['Gender', applicant.gender],
              ['Email', applicant.email],
              ['Phone', applicant.phone],
              ['Address', applicant.address],
              ['Category', applicant.category],
              ['Entry Type', applicant.entryType],
            ].map(([label, val]) => (
              <div key={label} className="detail-item">
                <label>{label}</label>
                <div className="value">{val || '—'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Academic & Admission */}
        <div className="card">
          <div className="card-header"><div className="card-title">📚 Academic & Admission</div></div>
          <div className="detail-grid">
            {[
              ['Qualifying Exam', applicant.qualifyingExam],
              ['Marks', applicant.qualifyingMarks],
              ['Percentage', applicant.qualifyingPercentage ? `${applicant.qualifyingPercentage}%` : '—'],
              ['Quota', applicant.quotaType],
              ['Mode', applicant.admissionMode],
              ['Allotment No.', applicant.allotmentNumber || '—'],
              ['Program', applicant.program ? `${applicant.program.name} (${applicant.program.code})` : '—'],
              ['Academic Year', applicant.academicYear?.year || '—'],
            ].map(([label, val]) => (
              <div key={label} className="detail-item">
                <label>{label}</label>
                <div className="value">{val || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Seat Allocation */}
      {applicant.status === 'Applied' && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <div><div className="card-title">💺 Seat Allocation</div><div className="card-sub">Select a seat matrix and allocate a seat for {applicant.quotaType} quota</div></div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1, minWidth: 300 }}>
              <label>Select Seat Matrix (Program + Year)</label>
              <select value={selectedMatrix} onChange={e => setSelectedMatrix(e.target.value)}>
                <option value="">Choose seat matrix...</option>
                {filteredMatrices.map(m => {
                  const q = m.quotas.find(x => x.name === applicant.quotaType);
                  const avail = q ? q.totalSeats - q.allocatedSeats : 0;
                  return (
                    <option key={m._id} value={m._id} disabled={avail === 0}>
                      {m.program?.name} ({m.program?.code}) — {m.academicYear?.year} — {applicant.quotaType}: {avail} seats left
                    </option>
                  );
                })}
              </select>
            </div>
            <button className="btn btn-primary" onClick={handleAllocate} disabled={allocating || !selectedMatrix}>
              {allocating ? '⏳ Allocating...' : '🔒 Allocate Seat'}
            </button>
          </div>
          {selectedMatrix && (() => {
            const m = matrices.find(x => x._id === selectedMatrix);
            if (!m) return null;
            return (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>Quota Availability:</div>
                <div className="quota-grid">
                  {m.quotas.map(q => (
                    <div key={q.name} className="quota-row">
                      <div className="quota-name">{q.name}</div>
                      <div className="quota-bar-wrap">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${q.totalSeats > 0 ? (q.allocatedSeats / q.totalSeats) * 100 : 0}%`, background: q.name === applicant.quotaType ? 'var(--accent)' : 'var(--border2)' }} />
                        </div>
                      </div>
                      <div className="quota-numbers">{q.allocatedSeats}/{q.totalSeats} ({q.totalSeats - q.allocatedSeats} left)</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Documents */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <div>
            <div className="card-title">📄 Document Checklist</div>
            <div className="card-sub">
              {applicant.documents.filter(d => d.status === 'Verified').length}/{applicant.documents.length} verified
            </div>
          </div>
          {anyDocPending && <span className="badge badge-yellow">⚠ Documents Pending</span>}
          {allDocsVerified && <span className="badge badge-green">✓ All Verified</span>}
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Document</th><th>Status</th><th>Update</th></tr>
            </thead>
            <tbody>
              {applicant.documents.map(doc => (
                <tr key={doc._id}>
                  <td style={{ fontWeight: 500 }}>{doc.name}</td>
                  <td><span className={`badge ${DOC_STATUS_COLOR[doc.status]}`}>{doc.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {['Pending', 'Submitted', 'Verified'].map(s => (
                        <button key={s} className={`btn btn-sm ${doc.status === s ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => handleDocUpdate(doc._id, s)} disabled={doc.status === s}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fee */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <div>
            <div className="card-title">💳 Fee Status</div>
            {applicant.feeStatus === 'Paid' && applicant.feePaidDate && (
              <div className="card-sub">Paid on {new Date(applicant.feePaidDate).toLocaleDateString('en-IN')} · ₹{applicant.feeAmount?.toLocaleString('en-IN') || 0}</div>
            )}
          </div>
          <span className={`badge ${applicant.feeStatus === 'Paid' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 13 }}>
            {applicant.feeStatus === 'Paid' ? '✓ Paid' : '⏳ Pending'}
          </span>
        </div>
        {applicant.feeStatus !== 'Paid' && ['Seat Allocated', 'Documents Verified'].includes(applicant.status) && (
          <button className="btn btn-success" onClick={() => setFeeModal(true)}>✓ Mark Fee as Paid</button>
        )}
        {applicant.feeStatus !== 'Paid' && applicant.status === 'Applied' && (
          <div className="alert alert-info">Allocate a seat first before marking fee as paid.</div>
        )}
      </div>

      {/* Confirm Admission */}
      {canConfirm && (
        <div className="card" style={{ marginTop: 16, border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.05)' }}>
          <div className="card-header">
            <div>
              <div className="card-title" style={{ color: 'var(--green)' }}>🎓 Ready for Admission Confirmation</div>
              <div className="card-sub">Fee is paid. Click below to generate the permanent admission number.</div>
            </div>
          </div>
          {!allDocsVerified && <div className="alert alert-warn" style={{ marginBottom: 12 }}>⚠ Some documents are still pending verification. You can still confirm admission.</div>}
          <button className="btn btn-success" style={{ fontSize: 15, padding: '12px 24px' }} onClick={handleConfirm} disabled={confirming}>
            {confirming ? '⏳ Generating...' : '🎓 Confirm Admission & Generate Number'}
          </button>
        </div>
      )}

      {/* Danger zone */}
      {!applicant.admissionNumber && !['Rejected', 'Withdrawn'].includes(applicant.status) && (
        <div className="card" style={{ marginTop: 16, borderColor: 'rgba(239,68,68,0.2)' }}>
          <div className="card-header"><div className="card-title" style={{ color: 'var(--red)' }}>⚠ Danger Zone</div></div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-sm" style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.3)' }}
              onClick={() => handleStatusChange('Rejected')}>Reject Applicant</button>
            <button className="btn btn-sm" style={{ background: 'var(--yellow-bg)', color: 'var(--yellow)', border: '1px solid rgba(245,158,11,0.3)' }}
              onClick={() => handleStatusChange('Withdrawn')}>Mark as Withdrawn</button>
          </div>
        </div>
      )}

      {/* Fee Modal */}
      {feeModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setFeeModal(false); }}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Mark Fee as Paid</div>
              <button className="modal-close" onClick={() => setFeeModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Fee Amount (₹)</label>
                <input type="number" value={feeAmount} onChange={e => setFeeAmount(e.target.value)} placeholder="e.g. 125000" />
              </div>
              <div className="alert alert-warn" style={{ marginTop: 12 }}>This will mark the fee as paid and allow admission confirmation.</div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setFeeModal(false)}>Cancel</button>
              <button className="btn btn-success" onClick={handleFeePaid} disabled={savingFee}>
                {savingFee ? '⏳...' : '✓ Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
