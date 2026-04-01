import React from 'react';
import MasterPage from '../../components/MasterPage';
import { getCampuses, createCampus, updateCampus, deleteCampus, getInstitutions } from '../../services/api';

const COLUMNS = [
  { key: 'name', label: 'Campus Name' },
  { key: 'code', label: 'Code', render: c => <span className="badge badge-cyan mono">{c.code}</span> },
  { key: 'institution', label: 'Institution', render: c => c.institution?.name || '—' },
  { key: 'address', label: 'Address', render: c => c.address || '—' },
  { key: 'isActive', label: 'Status', render: c => <span className={`badge ${c.isActive ? 'badge-green' : 'badge-red'}`}>{c.isActive ? 'Active' : 'Inactive'}</span> },
];

const FIELDS = [
  { key: 'name', label: 'Campus Name', required: true, placeholder: 'e.g. Main Campus' },
  { key: 'code', label: 'Campus Code', required: true, placeholder: 'e.g. MAIN' },
  { key: 'institution', label: 'Institution', required: true, type: 'select', optionsKey: 'institutions', optionLabel: o => `${o.name} (${o.code})` },
  { key: 'address', label: 'Address', placeholder: 'Campus address', full: true },
];

export default function Campuses() {
  return (
    <MasterPage
      title="Campuses"
      subtitle="Manage campuses under institutions"
      columns={COLUMNS}
      fetchFn={getCampuses}
      createFn={createCampus}
      updateFn={updateCampus}
      deleteFn={deleteCampus}
      formFields={FIELDS}
      fetchDeps={[{ key: 'institutions', fn: getInstitutions }]}
    />
  );
}
