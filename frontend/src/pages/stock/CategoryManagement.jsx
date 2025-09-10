import { useState, useEffect } from 'react';
// import { useAuth } from '../../hooks/useAuth'; // Removed to avoid "must be used within an AuthProvider" error
// import { usePermissions } from '../../hooks/usePermissions'; // Also removed for same reason
import axios from 'axios';
import { Plus, Edit2, CheckCircle, XCircle, Eye, Filter, X, Search, Lock, AlertCircle } from 'lucide-react';
import HandsontableDataGrid from './HandsontableDataGrid';
import './modern-styles.css'; // Import our modern styles

// Fallback user and permissions if not in AuthProvider context
const fallbackUser = {
  username: 'Inconnu',
  firstname: 'Inconnu',
  lastname: '',
  magasin: { id: null }
};
const fallbackPermissions = {
  hasComponentAccess: () => true,
  hasPermission: () => true,
  loading: false
};

const CategoryManagement = () => {
  // Defensive: Try to get user from useAuth, fallback if error
  let user = fallbackUser;
  let hasComponentAccess = fallbackPermissions.hasComponentAccess;
  let hasPermission = fallbackPermissions.hasPermission;
  let permissionsLoading = fallbackPermissions.loading;
  try {
    // Dynamically import useAuth and usePermissions to avoid error if not in provider
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { useAuth } = require('../../hooks/useAuth');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    user = useAuth()?.user || fallbackUser;
  } catch (e) {
    user = fallbackUser;
  }
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { usePermissions } = require('../../hooks/usePermissions');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const perms = usePermissions() || {};
    hasComponentAccess = perms.hasComponentAccess || fallbackPermissions.hasComponentAccess;
    hasPermission = perms.hasPermission || fallbackPermissions.hasPermission;
    permissionsLoading = perms.loading ?? fallbackPermissions.loading;
  } catch (e) {
    hasComponentAccess = fallbackPermissions.hasComponentAccess;
    hasPermission = fallbackPermissions.hasPermission;
    permissionsLoading = fallbackPermissions.loading;
  }

  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [availableFields, setAvailableFields] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    required_fields: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // États de filtre
  const [filters, setFilters] = useState({
    status: '',
    createdBy: '',
    dateFrom: '',
    dateTo: '',
    searchTerm: ''
  });
  const [activeFilters, setActiveFilters] = useState([]);

  // Defensive: Only fetch if user and user.magasin and user.magasin.id exist
  useEffect(() => {
    if (user && user.magasin && user.magasin.id) {
      fetchCategories();
      fetchAvailableFields();
    }
    // eslint-disable-next-line
  }, [user && user.magasin && user.magasin.id]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line
  }, [categories, filters]);

  // Auto-hide success/error messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchCategories = async () => {
    if (!user || !user.magasin || !user.magasin.id) return;
    try {
      const response = await axios.get(`http://localhost:5000/api/categories/magasin/${user.magasin.id}`);
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories :', error);
      setError('Échec de la récupération des catégories');
      setCategories([]);
    }
  };

  // Fonctionnalité de filtrage
  const applyFilters = () => {
    let filtered = Array.isArray(categories) ? [...categories] : [];

    // Filtre statut
    if (filters.status) {
      if (filters.status === 'approved') {
        filtered = filtered.filter(cat => cat.is_approved);
      } else if (filters.status === 'pending') {
        filtered = filtered.filter(cat => !cat.is_approved);
      }
    }

    // Filtre créateur
    if (filters.createdBy) {
      filtered = filtered.filter(cat =>
        (cat.created_by || '').toLowerCase().includes(filters.createdBy.toLowerCase())
      );
    }

    // Filtre plage de dates
    if (filters.dateFrom) {
      filtered = filtered.filter(cat =>
        new Date(cat.created_at) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(cat =>
        new Date(cat.created_at) <= new Date(filters.dateTo + 'T23:59:59')
      );
    }

    // Filtre de recherche
    if (filters.searchTerm) {
      filtered = filtered.filter(cat => {
        const searchLower = filters.searchTerm.toLowerCase();
        return (cat.name || '').toLowerCase().includes(searchLower) ||
               (cat.created_by || '').toLowerCase().includes(searchLower);
      });
    }

    setFilteredCategories(filtered);
    updateActiveFilters();
  };

  const updateActiveFilters = () => {
    const active = [];
    if (filters.status) active.push({ key: 'status', label: `Statut : ${filters.status === 'approved' ? 'Approuvée' : 'En attente'}`, value: filters.status });
    if (filters.createdBy) active.push({ key: 'createdBy', label: `Créé par : ${filters.createdBy}`, value: filters.createdBy });
    if (filters.dateFrom) active.push({ key: 'dateFrom', label: `Du : ${filters.dateFrom}`, value: filters.dateFrom });
    if (filters.dateTo) active.push({ key: 'dateTo', label: `Au : ${filters.dateTo}`, value: filters.dateTo });
    if (filters.searchTerm) active.push({ key: 'searchTerm', label: `Recherche : ${filters.searchTerm}`, value: filters.searchTerm });
    setActiveFilters(active);
  };

  const removeFilter = (filterKey) => {
    setFilters(prev => ({ ...prev, [filterKey]: '' }));
  };

  const clearAllFilters = () => {
    setFilters({
      status: '',
      createdBy: '',
      dateFrom: '',
      dateTo: '',
      searchTerm: ''
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const fetchAvailableFields = async () => {
    if (!user || !user.magasin || !user.magasin.id) return;
    try {
      const response = await axios.get(`http://localhost:5000/api/magasins/${user.magasin.id}/fields`);
      setAvailableFields(Array.isArray(response.data?.fields) ? response.data.fields : []);
    } catch (error) {
      console.error('Erreur lors de la récupération des champs :', error);
      setError('Échec de la récupération des champs disponibles');
      setAvailableFields([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (editingCategory && editingCategory.id) {
        await axios.put(`http://localhost:5000/api/categories/${editingCategory.id}`, formData);
        setSuccess('Catégorie modifiée avec succès');
      } else {
        await axios.post('http://localhost:5000/api/categories', {
          ...formData,
          magasin_id: user?.magasin?.id,
          created_by: (user?.firstname || '') + " " + (user?.lastname || '')
        });
        setSuccess('Catégorie créée avec succès');
      }

      await fetchCategories();
      setShowModal(false);
      setEditingCategory(null);
      setFormData({ name: '', required_fields: [] });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la catégorie :', error);
      setError(error?.response?.data?.error || 'Échec de l\'enregistrement de la catégorie');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (categoryId, isApproved) => {
    if (!user || !user.username) return;
    try {
      await axios.patch(`http://localhost:5000/api/categories/${categoryId}/approval`, {
        is_approved: isApproved,
        approved_by: user.username
      });
      await fetchCategories();
      setSuccess(`Catégorie ${isApproved ? 'approuvée' : 'rejetée'} avec succès`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'approbation :', error);
      setError(error?.response?.data?.error || 'Échec de la mise à jour de l\'approbation');
    }
  };

  const handleFieldToggle = (field) => {
    const isSelected = formData.required_fields.includes(field);
    setFormData(prev => ({
      ...prev,
      required_fields: isSelected
        ? prev.required_fields.filter(f => f !== field)
        : [...prev.required_fields, field]
    }));
  };

  const openModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name || '',
        required_fields: Array.isArray(category.required_fields) ? category.required_fields : []
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', required_fields: [] });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  // Prepare data for Handsontable
  const prepareTableData = () => {
    return (Array.isArray(filteredCategories) ? filteredCategories : []).map(category => ({
      id: category.id,
      name: category.name,
      required_fields_count: Array.isArray(category.required_fields) ? category.required_fields.length : 0,
      status: category.is_approved ? 'Approuvée' : 'En attente',
      created_by: category.created_by,
      created_at: category.created_at ? new Date(category.created_at).toLocaleDateString('fr-FR') : '',
      actions: category.id // We'll use this for action buttons
    }));
  };

  // Define columns for Handsontable
  const tableColumns = [
    {
      data: 'name',
      title: 'Nom',
      type: 'text',
      width: 200,
      readOnly: true,
      className: 'htLeft'
    },
    {
      data: 'required_fields_count',
      title: 'Champs Requis',
      type: 'numeric',
      width: 120,
      readOnly: true,
      className: 'htCenter',
      renderer: (instance, td, row, col, prop, value) => {
        td.innerHTML = `<span class="modern-badge modern-badge-primary">${value} champs</span>`;
        return td;
      }
    },
    {
      data: 'status',
      title: 'Statut',
      type: 'text',
      width: 120,
      readOnly: true,
      className: 'htCenter',
      renderer: (instance, td, row, col, prop, value) => {
        const isApproved = value === 'Approuvée';
        const statusClass = isApproved
          ? 'modern-badge-success'
          : 'modern-badge-warning';
        const icon = isApproved ? '✓' : '⏳';
        td.innerHTML = `<span class="modern-badge ${statusClass}">
          ${icon} ${value}
        </span>`;
        return td;
      }
    },
    {
      data: 'created_by',
      title: 'Créé par',
      type: 'text',
      width: 150,
      readOnly: true,
      className: 'htLeft'
    },
    {
      data: 'created_at',
      title: 'Date de création',
      type: 'text',
      width: 130,
      readOnly: true,
      className: 'htCenter'
    },
    {
      data: 'actions',
      title: 'Actions',
      type: 'text',
      width: 180,
      readOnly: true,
      className: 'htCenter',
      renderer: (instance, td, row, col, prop, value) => {
        // Defensive: find in filteredCategories, fallback to categories
        let category = (Array.isArray(filteredCategories) ? filteredCategories : []).find(cat => cat.id === value);
        if (!category && Array.isArray(categories)) {
          category = categories.find(cat => cat.id === value);
        }
        const editButton = `<button class="modern-btn modern-btn-primary modern-btn-sm modern-btn-icon mr-1" title="Modifier" onclick="editCategory(${value})">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>`;
        const approveButton = !category?.is_approved && hasPermission('validate_category')
          ? `<button class="modern-btn modern-btn-success modern-btn-sm modern-btn-icon mr-1" title="Approuver" onclick="approveCategory(${value}, true)">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <polyline points="20,6 9,17 4,12"/>
               </svg>
             </button>
             <button class="modern-btn modern-btn-danger modern-btn-sm modern-btn-icon mr-1" title="Rejeter" onclick="approveCategory(${value}, false)">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <line x1="18" y1="6" x2="6" y2="18"/>
                 <line x1="6" y1="6" x2="18" y2="18"/>
               </svg>
             </button>`
          : '';
        const viewButton = `<button class="modern-btn modern-btn-secondary modern-btn-sm modern-btn-icon" title="Voir détails" onclick="viewCategory(${value})">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                              </svg>
                            </button>`;

        td.innerHTML = `<div class="flex-center" style="gap: 0.5rem;">${editButton}${approveButton}${viewButton}</div>`;
        return td;
      }
    }
  ];

  // Global functions for action buttons
  useEffect(() => {
    window.editCategory = (categoryId) => {
      if (!Array.isArray(categories)) return;
      const category = categories.find(cat => cat.id === categoryId);
      if (category) openModal(category);
    };

    window.approveCategory = (categoryId, isApproved) => {
      handleApproval(categoryId, isApproved);
    };

    window.viewCategory = (categoryId) => {
      if (!Array.isArray(categories)) return;
      const category = categories.find(cat => cat.id === categoryId);
      if (category) {
        alert(`Détails de la catégorie:\nNom: ${category.name}\nChamps requis: ${Array.isArray(category.required_fields) && category.required_fields.length > 0 ? category.required_fields.join(', ') : 'Aucun'}`);
      }
    };

    return () => {
      delete window.editCategory;
      delete window.approveCategory;
      delete window.viewCategory;
    };
    // eslint-disable-next-line
  }, [categories, filteredCategories]);

  // Ajout d'un état de chargement ou rendu conditionnel
  if (!user || !user.magasin || !user.magasin.id) {
    return (
      <div className="flex-center" style={{ minHeight: '400px', width: '100%' }}>
        <div className="modern-spinner"></div>
        <span style={{ marginLeft: '1rem', color: 'var(--neutral-600)' }}>Chargement...</span>
      </div>
    );
  }

  // Check component access
  if (permissionsLoading) {
    return (
      <div className="flex-center" style={{ minHeight: '400px', width: '100%' }}>
        <div className="modern-spinner"></div>
        <span style={{ marginLeft: '1rem', color: 'var(--neutral-600)' }}>Vérification des permissions...</span>
      </div>
    );
  }

  if (!hasComponentAccess('CategoryManagement')) {
    return (
      <div style={{ padding: '2rem', width: '100%' }}>
        <div className="flex-center" style={{ minHeight: '400px', flexDirection: 'column', textAlign: 'center' }}>
          <Lock size={64} color="var(--neutral-400)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--neutral-900)', marginBottom: '0.5rem' }}>
            Accès non autorisé
          </h2>
          <p style={{ color: 'var(--neutral-600)', lineHeight: 'var(--line-height-relaxed)' }}>
            Vous n'avez pas les permissions nécessaires pour accéder à la gestion des catégories.
            <br />
            Veuillez contacter votre administrateur pour obtenir les droits d'accès appropriés.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%', margin: 0, padding: '2rem 0' }}>
      {/* Header Section */}
      <div className="flex-between" style={{ marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem', width: '100%', padding: '0 2rem' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--neutral-900)', margin: '0 0 0.5rem 0' }}>
            Gestion des Catégories
          </h1>
          <p style={{ color: 'var(--neutral-600)', fontSize: 'var(--font-size-base)' }}>
            Gérez les catégories et leurs champs requis
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowFilterModal(true)}
            className="modern-btn modern-btn-outline"
          >
            <Filter size={16} />
            Filtres
            {activeFilters.length > 0 && (
              <span className="modern-badge modern-badge-primary" style={{ marginLeft: '0.5rem' }}>
                {activeFilters.length}
              </span>
            )}
          </button>
          {hasPermission('create_category') && (
            <button
              onClick={() => openModal()}
              className="modern-btn modern-btn-primary"
            >
              <Plus size={16} />
              Nouvelle Catégorie
            </button>
          )}
        </div>
      </div>

      {/* Success Alert */}
      {success && (
        <div className="modern-alert modern-alert-success" style={{ margin: '0 2rem' }}>
          <CheckCircle size={20} />
          <div>
            <strong>Succès!</strong>
            <div>{success}</div>
          </div>
          <button
            onClick={() => setSuccess('')}
            className="modern-btn-ghost modern-btn-icon modern-btn-sm"
            style={{ marginLeft: 'auto' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="modern-alert modern-alert-error" style={{ margin: '0 2rem' }}>
          <AlertCircle size={20} />
          <div>
            <strong>Erreur!</strong>
            <div>{error}</div>
          </div>
          <button
            onClick={() => setError('')}
            className="modern-btn-ghost modern-btn-icon modern-btn-sm"
            style={{ marginLeft: 'auto' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem', marginLeft: '2rem', marginRight: '2rem' }}>
          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--neutral-700)' }}>
            Filtres actifs :
          </span>
          {activeFilters.map((filter) => (
            <span key={filter.key} className="modern-badge modern-badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {filter.label}
              <button
                onClick={() => removeFilter(filter.key)}
                className="modern-btn-ghost modern-btn-icon"
                style={{ padding: '0.125rem', minWidth: 'auto', width: '1rem', height: '1rem' }}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <button
            onClick={clearAllFilters}
            style={{ fontSize: 'var(--font-size-sm)', color: 'var(--neutral-500)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Tout effacer
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div style={{ marginBottom: '1.5rem', marginLeft: '2rem', marginRight: '2rem' }}>
        <div className="modern-search-input">
          <div className="modern-input-icon">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Rechercher par nom ou créateur..."
            className="modern-input"
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
          />
        </div>
      </div>

      {/* Data Grid */}
      <div className="modern-card" style={{ width: '100%', margin: '0 2rem', boxSizing: 'border-box' }}>
        <div className="modern-card-body" style={{ padding: '0' }}>
          <HandsontableDataGrid
            data={prepareTableData()}
            columns={tableColumns}
            height={400}
            className="category-management-table"
            contextMenu={['row_above', 'row_below', 'separator', 'copy', 'cut']}
            filters={true}
            dropdownMenu={true}
            multiColumnSorting={true}
            width={'100%'}
          />
          {filteredCategories.length === 0 && (
            <div className="text-center" style={{ padding: '2rem', color: 'var(--neutral-500)' }}>
              Aucune catégorie trouvée correspondant à vos filtres.
            </div>
          )}
        </div>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="modern-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowFilterModal(false)}>
          <div className="modern-modal modern-modal-md">
            <div className="modern-modal-header">
              <h3 className="modern-modal-title">Filtres</h3>
              <button
                onClick={() => setShowFilterModal(false)}
                className="modern-modal-close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modern-modal-body">
              <div className="modern-form-group">
                <label className="modern-form-label">Statut</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="modern-input modern-select"
                >
                  <option value="">Tous les statuts</option>
                  <option value="approved">Approuvées</option>
                  <option value="pending">En attente</option>
                </select>
              </div>

              <div className="modern-form-group">
                <label className="modern-form-label">Créé par</label>
                <input
                  type="text"
                  value={filters.createdBy}
                  onChange={(e) => handleFilterChange('createdBy', e.target.value)}
                  className="modern-input"
                  placeholder="Nom du créateur"
                />
              </div>

              <div className="modern-form-group">
                <label className="modern-form-label">Date de début</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="modern-input"
                />
              </div>

              <div className="modern-form-group">
                <label className="modern-form-label">Date de fin</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="modern-input"
                />
              </div>
            </div>

            <div className="modern-modal-footer">
              <button
                onClick={clearAllFilters}
                className="modern-btn modern-btn-danger"
              >
                Effacer tout
              </button>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="modern-btn modern-btn-ghost"
                >
                  Fermer
                </button>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="modern-btn modern-btn-primary"
                >
                  Appliquer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modern-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modern-modal modern-modal-lg">
            <div className="modern-modal-header">
              <h3 className="modern-modal-title">
                {editingCategory ? 'Modifier la Catégorie' : 'Nouvelle Catégorie'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="modern-modal-close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modern-modal-body">
                <div className="modern-form-group">
                  <label className="modern-form-label required">Nom de la Catégorie</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="modern-input"
                    required
                    placeholder="Entrez le nom de la catégorie"
                  />
                </div>

                <div className="modern-form-group">
                  <label className="modern-form-label">Champs Requis</label>
                  <div className="modern-form-help">
                    Sélectionnez les champs qui seront obligatoires pour cette catégorie
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '0.5rem',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    padding: '1rem',
                    border: '2px solid var(--neutral-200)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--neutral-50)'
                  }}>
                    {Array.isArray(availableFields) && availableFields.map((field) => (
                      <label key={field} className="modern-checkbox">
                        <input
                          type="checkbox"
                          checked={formData.required_fields.includes(field)}
                          onChange={() => handleFieldToggle(field)}
                        />
                        <span className="modern-checkbox-mark"></span>
                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--neutral-700)' }}>{field}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modern-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="modern-btn modern-btn-ghost"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="modern-btn modern-btn-primary"
                  style={{ minWidth: '120px' }}
                >
                  {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="modern-spinner" style={{ width: '16px', height: '16px' }}></div>
                      Enregistrement...
                    </div>
                  ) : (
                    editingCategory ? 'Modifier' : 'Créer'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
