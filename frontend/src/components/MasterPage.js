import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Generic master CRUD component
 * Props: title, columns, fetchFn, createFn, updateFn, deleteFn, formFields, extraFilters
 */
export default function MasterPage({ title, subtitle, columns, fetchFn, createFn, updateFn, deleteFn, formFields, fetchDeps = [], transformCreate }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | 'edit'
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deps, setDeps] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchFn();
      setItems(res.data);
    } catch (err) {
      toast.error('Failed to load ' + title);
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => { load(); }, [load]);

  // Load dependencies for dropdowns
  useEffect(() => {
    const loadDeps = async () => {
      const loaded = {};
      for (const dep of fetchDeps) {
        try {
          const res = await dep.fn();
          loaded[dep.key] = res.data;
        } catch {}
      }
      setDeps(loaded);
    };
    if (fetchDeps.length) loadDeps();
  }, []);

  const openCreate = () => {
    const init = {};
    formFields.forEach(f => { init[f.key] = f.default || ''; });
    setForm(init);
    setEditing(null);
    setModal('create');
  };

  const openEdit = (item) => {
    const init = {};
    formFields.forEach(f => { init[f.key] = item[f.key] ?? f.default ?? ''; });
    setForm(init);
    setEditing(item);
    setModal('edit');
  };

  const closeModal = () => { setModal(null); setEditing(null); setForm({}); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = transformCreate ? transformCreate(form) : form;
      if (modal === 'create') {
        await createFn(data);
        toast.success(`${title.slice(0, -1)} created`);
      } else {
        await updateFn(editing._id, data);
        toast.success(`${title.slice(0, -1)} updated`);
      }
      closeModal();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this record?')) return;
    try {
      await deleteFn(id);
      toast.success('Deactivated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const renderField = (field) => {
    if (field.type === 'select') {
      const options = field.optionsKey ? (deps[field.optionsKey] || []) : (field.options || []);
      return (
        <select value={form[field.key] || ''} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}>
          <option value="">Select {field.label}</option>
          {options.map(opt => {
            const val = opt._id || opt.value || opt;
            const label = field.optionLabel ? field.optionLabel(opt) : (opt.name || opt.label || opt);
            return <option key={val} value={val}>{label}</option>;
          })}
        </select>
      );
    }
    if (field.type === 'number') {
      return <input type="number" value={form[field.key] || ''} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} placeholder={field.placeholder || ''} min={field.min} />;
    }
    if (field.type === 'date') {
      return <input type="date" value={form[field.key] || ''} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} />;
    }
    if (field.type === 'checkbox') {
      return (
        <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" style={{ width: 'auto' }} checked={!!form[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.checked }))} />
          {field.checkLabel || field.label}
        </label>
      );
    }
    return <input type={field.type || 'text'} value={form[field.key] || ''} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} placeholder={field.placeholder || ''} />;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">{title}</div>
          {subtitle && <div className="page-sub">{subtitle}</div>}
        </div>
        {createFn && (
          <button className="btn btn-primary" onClick={openCreate}>+ Add {title.slice(0, -1)}</button>
        )}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {columns.map(c => <th key={c.key}>{c.label}</th>)}
                  {(updateFn || deleteFn) && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={columns.length + 1} className="table-empty">No records found</td></tr>
                ) : items.map(item => (
                  <tr key={item._id}>
                    {columns.map(c => (
                      <td key={c.key}>{c.render ? c.render(item) : (item[c.key] ?? '—')}</td>
                    ))}
                    {(updateFn || deleteFn) && (
                      <td>
                        <div className="gap-8">
                          {updateFn && <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}>Edit</button>}
                          {deleteFn && <button className="btn btn-sm" style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red-bg)' }} onClick={() => handleDelete(item._id)}>Deactivate</button>}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{modal === 'create' ? `Add ${title.slice(0, -1)}` : `Edit ${title.slice(0, -1)}`}</div>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                {formFields.map(field => (
                  <div key={field.key} className={`form-group${field.full ? ' full' : ''}`}>
                    <label>{field.label}{field.required && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}</label>
                    {renderField(field)}
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? '⏳ Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
