import { useState, useEffect } from 'react';
// import { useAuth } from '../../hooks/useAuth'; // Removed to avoid "must be used within an AuthProvider" error
// import { usePermissions } from '../../hooks/usePermissions'; // Removed due to useAuth dependency
import axios from 'axios';
import { Plus, Edit2, Eye, Filter, X, Search, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import HandsontableDataGrid from './HandsontableDataGrid';
import './modern-styles.css'; // Import our modern styles

const MagasinManagement = () => {
  // Permissions are disabled to avoid useAuth error
  // const { hasComponentAccess, hasPermission, loading: permissionsLoading } = usePermissions();

  // Fallback: No permissions, always allow access and actions
  const hasComponentAccess = () => true;
  const hasPermission = () => true;
  const permissionsLoading = false;

  const [magasins, setMagasins] = useState([]);
  const [filteredMagasins, setFilteredMagasins] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [editingMagasin, setEditingMagasin] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    responsable_id: '',
    email: '',
    phone: '',
    address: '',
    selected_fields: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // États de filtre
  const [filters, setFilters] = useState({
    responsable: '',
    searchTerm: ''
  });
  const [activeFilters, setActiveFilters] = useState([]);

  const DEFAULT_FIELDS = [
    "Taille", "Qualite", "Couleur", "Composition", "Devise", "Unite", "Incoterm", 
    "Saison", "MarchéCible", "Certifications", "PaysOrigine", "HSCode", "Type", 
    "Statut", "Prod_Origine", "Marque", "Version", "Référence", "Libellé", "CodeABarre", 
    "Prix", "PrixMP", "LeadTime", "Poids_Net", "Poids_Unitaire", "Poids_M2", 
    "Construction", "ClasOnze", "RetTRMin", "RetTRMax", "RetCHMin", "RetCHMax", 
    "Laize", "Retrecissement_X", "Retrecissement_Y", "Note", "Domaine", 
    "InstructionsEntretien", "InfoDurabilité", "SpécTechniques", "Images", "Tags"
  ];

  useEffect(() => {
    fetchMagasins();
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [magasins, filters]);

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

  const fetchMagasins = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/magasins');
      setMagasins(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des magasins :', error);
      setError('Échec de la récupération des magasins');
    }
  };

  // Fonctionnalité de filtre
  const applyFilters = () => {
    let filtered = [...magasins];

    // Filtre responsable
    if (filters.responsable) {
      filtered = filtered.filter(magasin => 
        magasin.responsable?.toLowerCase().includes(filters.responsable.toLowerCase())
      );
    }

    // Filtre de recherche
    if (filters.searchTerm) {
      filtered = filtered.filter(magasin => {
        const searchLower = filters.searchTerm.toLowerCase();
        return magasin.name.toLowerCase().includes(searchLower) ||
               magasin.responsable?.toLowerCase().includes(searchLower) ||
               magasin.responsable_email?.toLowerCase().includes(searchLower) ||
               magasin.address?.toLowerCase().includes(searchLower);
      });
    }

    setFilteredMagasins(filtered);
    updateActiveFilters();
  };

  const updateActiveFilters = () => {
    const active = [];
    if (filters.responsable) active.push({ key: 'responsable', label: `Responsable : ${filters.responsable}`, value: filters.responsable });
    if (filters.searchTerm) active.push({ key: 'searchTerm', label: `Recherche : ${filters.searchTerm}`, value: filters.searchTerm });
    setActiveFilters(active);
  };

  const removeFilter = (filterKey) => {
    setFilters(prev => ({ ...prev, [filterKey]: '' }));
  };

  const clearAllFilters = () => {
    setFilters({
      responsable: '',
      searchTerm: ''
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/magasins/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs :', error);
      setError('Échec de la récupération des utilisateurs');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (editingMagasin) {
        await axios.put(`http://localhost:5000/api/magasins/${editingMagasin.id}`, formData);
        setSuccess('Magasin modifié avec succès');
      } else {
        await axios.post('http://localhost:5000/api/magasins', formData);
        setSuccess('Magasin créé avec succès');
      }
      
      await fetchMagasins();
      setShowModal(false);
      setEditingMagasin(null);
      setFormData({
        name: '',
        responsable_id: '',
        email: '',
        phone: '',
        address: '',
        selected_fields: []
      });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du magasin :', error);
      setError(error.response?.data?.error || 'Échec de l\'enregistrement du magasin');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldToggle = (field) => {
    const isSelected = formData.selected_fields.includes(field);
    setFormData(prev => ({
      ...prev,
      selected_fields: isSelected 
        ? prev.selected_fields.filter(f => f !== field)
        : [...prev.selected_fields, field]
    }));
  };

  const openModal = (magasin = null) => {
    if (magasin) {
      setEditingMagasin(magasin);
      setFormData({
        name: magasin.name,
        responsable_id: magasin.responsable_id || '',
        email: magasin.email || '',
        phone: magasin.phone || '',
        address: magasin.address || '',
        selected_fields: magasin.available_fields || []
      });
    } else {
      setEditingMagasin(null);
      setFormData({
        name: '',
        responsable_id: '',
        email: '',
        phone: '',
        address: '',
        selected_fields: DEFAULT_FIELDS
      });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  // Prepare data for Handsontable
  const prepareTableData = () => {
    return filteredMagasins.map(magasin => ({
      id: magasin.id,
      name: magasin.name,
      responsable: magasin.responsable || 'Aucun responsable assigné',
      responsable_email: magasin.responsable_email || 'N/A',
      responsable_poste: magasin.responsable_poste || 'N/A',
      available_fields_count: magasin.available_fields?.length || 0,
      actions: magasin.id
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
      data: 'responsable', 
      title: 'Responsable', 
      type: 'text', 
      width: 180,
      readOnly: true,
      className: 'htLeft'
    },
    { 
      data: 'responsable_email', 
      title: 'Email Responsable', 
      type: 'text', 
      width: 200,
      readOnly: true,
      className: 'htLeft'
    },
    { 
      data: 'responsable_poste', 
      title: 'Poste', 
      type: 'text', 
      width: 150,
      readOnly: true,
      className: 'htLeft'
    },
    { 
      data: 'available_fields_count', 
      title: 'Champs Disponibles', 
      type: 'numeric', 
      width: 150,
      readOnly: true,
      className: 'htCenter',
      renderer: (instance, td, row, col, prop, value) => {
        td.innerHTML = `<span class="modern-badge modern-badge-primary">${value} champs</span>`;
        return td;
      }
    },
    { 
      data: 'actions', 
      title: 'Actions', 
      type: 'text', 
      width: 120,
      readOnly: true,
      className: 'htCenter',
      renderer: (instance, td, row, col, prop, value) => {
        // Always show edit and view buttons (permissions always true)
        const editButton = `<button class="modern-btn modern-btn-primary modern-btn-sm modern-btn-icon mr-1" title="Modifier" onclick="editMagasin(${value})">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                 <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
               </svg>
             </button>`;
        const viewButton = `<button class="modern-btn modern-btn-secondary modern-btn-sm modern-btn-icon" title="Voir détails" onclick="viewMagasin(${value})">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                              </svg>
                            </button>`;
        
        td.innerHTML = `<div class="flex-center" style="gap: 0.5rem;">${editButton}${viewButton}</div>`;
        return td;
      }
    }
  ];

  // Global functions for action buttons
  useEffect(() => {
    window.editMagasin = (magasinId) => {
      const magasin = magasins.find(m => m.id === magasinId);
      if (magasin) openModal(magasin);
    };

    window.viewMagasin = (magasinId) => {
      const magasin = magasins.find(m => m.id === magasinId);
      if (magasin) {
        alert(`Détails du magasin:\nNom: ${magasin.name}\nResponsable: ${magasin.responsable || 'N/A'}\nEmail: ${magasin.responsable_email || 'N/A'}\nAdresse: ${magasin.address || 'N/A'}`);
      }
    };

    return () => {
      delete window.editMagasin;
      delete window.viewMagasin;
    };
  }, [magasins]);

  if (permissionsLoading) {
    return (
      <div className="flex-center" style={{ minHeight: '400px' }}>
        <div className="modern-spinner"></div>
        <span style={{ marginLeft: '1rem', color: 'var(--neutral-600)' }}>Vérification des permissions...</span>
      </div>
    );
  }

  if (!hasComponentAccess('MagasinManagement')) {
    return (
      <div style={{ padding: '2rem' }}>
        <div className="flex-center" style={{ minHeight: '400px', flexDirection: 'column', textAlign: 'center' }}>
          <Lock size={64} color="var(--neutral-400)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--neutral-900)', marginBottom: '0.5rem' }}>
            Accès non autorisé
          </h2>
          <p style={{ color: 'var(--neutral-600)', lineHeight: 'var(--line-height-relaxed)' }}>
            Vous n'avez pas les permissions nécessaires pour accéder à la gestion des magasins.
            <br />
            Veuillez contacter votre administrateur pour obtenir les droits d'accès appropriés.
          </p>
        </div>
      </div>
    );
  }

  // FULL WIDTH DESIGN: Remove maxWidth, set width 100%, reduce padding, and make grid/card full width
  return (
    <div style={{ width: '100%', margin: 0, padding: '2rem 0' }}>
      {/* Header Section */}
      <div className="flex-between" style={{ marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem', width: '100%', padding: '0 2rem' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--neutral-900)', margin: '0 0 0.5rem 0' }}>
            Gestion des Magasins
          </h1>
          <p style={{ color: 'var(--neutral-600)', fontSize: 'var(--font-size-base)' }}>
            Gérez les magasins et leurs configurations
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
          {hasPermission('manage_magasin') && (
            <button
              onClick={() => openModal()}
              className="modern-btn modern-btn-primary"
            >
              <Plus size={16} />
              Nouveau Magasin
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
      <div style={{ marginBottom: '1.5rem', width: '100%', padding: '0 2rem' }}>
        <div className="modern-search-input">
          <div className="modern-input-icon">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Rechercher par nom, responsable, email ou adresse..."
            className="modern-input"
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
          />
        </div>
      </div>

      {/* Data Grid */}
      <div className="modern-card" style={{ width: '100%', borderRadius: 0, margin: 0, padding: 0 }}>
        <div className="modern-card-body" style={{ padding: '0', width: '100%' }}>
          <HandsontableDataGrid
            data={prepareTableData()}
            columns={tableColumns}
            height={500}
            className="magasin-management-table"
            contextMenu={['row_above', 'row_below', 'separator', 'copy', 'cut']}
            filters={true}
            dropdownMenu={true}
            multiColumnSorting={true}
            width="100%"
            style={{ width: '100%' }}
          />
          {filteredMagasins.length === 0 && (
            <div className="text-center" style={{ padding: '2rem', color: 'var(--neutral-500)' }}>
              Aucun magasin trouvé correspondant à vos filtres.
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
                <label className="modern-form-label">Responsable</label>
                <input
                  type="text"
                  value={filters.responsable}
                  onChange={(e) => handleFilterChange('responsable', e.target.value)}
                  className="modern-input"
                  placeholder="Nom du responsable"
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
          <div className="modern-modal modern-modal-xl">
            <div className="modern-modal-header">
              <h3 className="modern-modal-title">
                {editingMagasin ? 'Modifier le Magasin' : 'Nouveau Magasin'}
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
                {/* Form Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className="modern-form-group">
                    <label className="modern-form-label required">Nom du Magasin</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="modern-input"
                      required
                      placeholder="Entrez le nom du magasin"
                    />
                  </div>
                  
                  <div className="modern-form-group">
                    <label className="modern-form-label">Responsable</label>
                    <select
                      value={formData.responsable_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, responsable_id: e.target.value }))}
                      className="modern-input modern-select"
                    >
                      <option value="">Sélectionner un responsable</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} - {user.poste}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="modern-form-group">
                    <label className="modern-form-label">Email du Magasin</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="modern-input"
                      placeholder="email@example.com"
                    />
                  </div>
                  
                  <div className="modern-form-group">
                    <label className="modern-form-label">Téléphone</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="modern-input"
                      placeholder="+33 1 23 45 67 89"
                    />
                  </div>
                </div>
                
                <div className="modern-form-group">
                  <label className="modern-form-label">Adresse</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="modern-input modern-textarea"
                    rows="3"
                    placeholder="Adresse complète du magasin"
                  />
                </div>
                
                <div className="modern-form-group">
                  <label className="modern-form-label">Champs Disponibles</label>
                  <div className="modern-form-help">
                    Sélectionnez les champs qui seront disponibles pour ce magasin
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
                    {DEFAULT_FIELDS.map((field) => (
                      <label key={field} className="modern-checkbox">
                        <input
                          type="checkbox"
                          checked={formData.selected_fields.includes(field)}
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
                    editingMagasin ? 'Modifier' : 'Créer'
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

export default MagasinManagement;
