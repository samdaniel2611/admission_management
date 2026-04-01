import React from 'react';
import MasterPage from '../../components/MasterPage';
import { getInstitutions, createInstitution, updateInstitution, deleteInstitution } from '../../services/api';

const COLUMNS = [
  { key: 'name', label: 'Institution Name' },
  { key: 'code', label: 'Code', render: i => <span className="badge badge-blue mono">{i.code}</span> },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'website', label: 'Website', render: i => i.website ? <a href={i.website} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>{i.website}</a> : '—' },
  { key: 'jkTotalLimit', label: 'J&K Cap' },
  { key: 'isActive', label: 'Status', render: i => <span className={`badge ${i.isActive ? 'badge-green' : 'badge-red'}`}>{i.isActive ? 'Active' : 'Inactive'}</span> },
];

const FIELDS = [
  { key: 'name', label: 'Institution Name', required: true, placeholder: 'e.g. Reva University', full: true },
  { key: 'code', label: 'Short Code', required: true, placeholder: 'e.g. REVA' },
  { key: 'email', label: 'Email', type: 'email', placeholder: 'admissions@institution.edu' },
  { key: 'phone', label: 'Phone', placeholder: '+91 80 1234 5678' },
  { key: 'website', label: 'Website', placeholder: 'https://institution.edu.in' },
  { key: 'jkTotalLimit', label: 'J&K Seat Cap (across programs)', type: 'number', default: 0, min: 0 },
  { key: 'address', label: 'Address', full: true, placeholder: 'Full address' },
];

export default function Institutions() {
  return (
    <MasterPage
      title="Institutions"
      subtitle="Manage educational institutions"
      columns={COLUMNS}
      fetchFn={getInstitutions}
      createFn={createInstitution}
      updateFn={updateInstitution}
      deleteFn={deleteInstitution}
      formFields={FIELDS}
    />
  );
}
