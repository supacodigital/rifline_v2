import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, AlertCircle, CheckCircle, X, ChevronRight } from 'lucide-react';
import {
  adminGetCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
} from '../../../services/admin.service';
import shared from '../admin.shared.module.css';

const EMPTY_FORM = { name: '', description: '', parentId: '' };

const CategoryModal = ({ category, categories, onClose, onSaved }) => {
  const isEdit = !!category?.id;
  const [form, setForm] = useState(
    category
      ? { name: category.name || '', description: category.description || '', parentId: category.parent_id ?? '' }
      : EMPTY_FORM
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Nom requis.'); return; }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        parentId: form.parentId ? parseInt(form.parentId) : null,
      };
      const data = isEdit
        ? await adminUpdateCategory(category.id, payload)
        : await adminCreateCategory(payload);
      if (data.error) { setError(data.error); return; }
      onSaved();
    } catch {
      setError('Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const parentOptions = categories.filter((c) => c.id !== category?.id);

  return (
    <div className={shared.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={shared.modal}>
        <div className={shared.modalHeader}>
          <h2 className={shared.modalTitle}>{isEdit ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h2>
          <button type="button" className={shared.modalClose} onClick={onClose}><X size={18} /></button>
        </div>

        <div className={shared.modalBody}>
          {error && <div className={shared.errorBanner}><AlertCircle size={14} />{error}</div>}

          <form onSubmit={handleSubmit} className={shared.modalForm}>
            <div className={shared.field}>
              <label className={shared.label}>Nom *</label>
              <input type="text" className={shared.input} value={form.name} onChange={handleChange('name')} required />
            </div>

            <div className={shared.field}>
              <label className={shared.label}>Description</label>
              <textarea className={`${shared.input} ${shared.textarea}`} value={form.description} onChange={handleChange('description')} rows={2} />
            </div>

            <div className={shared.field}>
              <label className={shared.label}>Catégorie parente</label>
              <select className={shared.input} value={form.parentId} onChange={handleChange('parentId')}>
                <option value="">— Aucune (catégorie racine) —</option>
                {parentOptions.filter((c) => !c.parent_id).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className={shared.modalActions}>
              <button type="button" className={shared.btnSecondary} onClick={onClose}>Annuler</button>
              <button type="submit" className={shared.btnPrimary} disabled={loading}>
                {loading ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const load = () => {
    setLoading(true);
    adminGetCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const showFeedback = (msg, type = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSaved = () => {
    setModal(null);
    showFeedback('Catégorie enregistrée.');
    load();
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Supprimer "${cat.name}" ?`)) return;
    try {
      const data = await adminDeleteCategory(cat.id);
      if (data.error) { showFeedback(data.error, 'error'); return; }
      showFeedback('Catégorie supprimée.');
      load();
    } catch {
      showFeedback('Une erreur est survenue.', 'error');
    }
  };

  const roots = categories.filter((c) => !c.parent_id);
  const children = (parentId) => categories.filter((c) => c.parent_id === parentId);

  return (
    <div className={shared.page}>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.title}>Catégories</h1>
          <p className={shared.subtitle}>{categories.length} catégorie{categories.length !== 1 ? 's' : ''}</p>
        </div>
        <button className={shared.addBtn} onClick={() => setModal({})}><Plus size={16} />Nouvelle catégorie</button>
      </div>

      {feedback && (
        <div className={`${shared.feedback} ${shared[`feedback_${feedback.type}`]}`}>
          {feedback.type === 'error' ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
          {feedback.msg}
        </div>
      )}

      {loading ? (
        <div className={shared.loading}>Chargement…</div>
      ) : categories.length === 0 ? (
        <div className={shared.empty}>Aucune catégorie.</div>
      ) : (
        <div className={shared.tableWrapper}>
          <table className={shared.table}>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Slug</th>
                <th>Description</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {roots.map((root) => (
                <React.Fragment key={root.id}>
                  <tr>
                    <td data-label="Nom" className={shared.tdName}>{root.name}</td>
                    <td data-label="Slug" className={shared.tdMuted}>{root.slug}</td>
                    <td data-label="Description" className={shared.tdMuted}>{root.description || '—'}</td>
                    <td className={shared.tdActions}>
                      <button className={shared.iconBtn} onClick={() => setModal(root)} title="Modifier"><Pencil size={15} /></button>
                      <button className={`${shared.iconBtn} ${shared.iconBtnDanger}`} onClick={() => handleDelete(root)} title="Supprimer"><Trash2 size={15} /></button>
                    </td>
                  </tr>
                  {children(root.id).map((child) => (
                    <tr key={child.id}>
                      <td data-label="Nom" className={`${shared.tdMuted} ${shared.tdChild}`}>
                        <ChevronRight size={13} className={shared.tdChildIcon} />{child.name}
                      </td>
                      <td data-label="Slug" className={shared.tdMuted}>{child.slug}</td>
                      <td data-label="Description" className={shared.tdMuted}>{child.description || '—'}</td>
                      <td className={shared.tdActions}>
                        <button className={shared.iconBtn} onClick={() => setModal(child)} title="Modifier"><Pencil size={15} /></button>
                        <button className={`${shared.iconBtn} ${shared.iconBtnDanger}`} onClick={() => handleDelete(child)} title="Supprimer"><Trash2 size={15} /></button>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal !== null && (
        <CategoryModal
          category={modal?.id ? modal : null}
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

export default AdminCategories;
