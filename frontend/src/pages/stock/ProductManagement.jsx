import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Package, Tags, Store, User, CheckCircle, XCircle, Clock, Filter, X, Search, Lock, AlertCircle } from 'lucide-react';
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

const ProductManagement = () => {
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

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [magasins, setMagasins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [requiredFields, setRequiredFields] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    magasin_id: '',
    product_data: {}
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // États de filtre
  const [filters, setFilters] = useState({
    category: '',
    magasin: '',
    status: '',
    createdBy: '',
    searchTerm: ''
  });
  const [activeFilters, setActiveFilters] = useState([]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line
  }, [products, filters]);

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

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const magasinId = user?.magasin?.id || '';
      const [productsRes, categoriesRes, magasinsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/products/magasin/' + magasinId),
        axios.get('http://localhost:5000/api/categories/magasin/' + magasinId),
        axios.get('http://localhost:5000/api/magasins')
      ]);
      setProducts(productsRes.data);

      const filteredCategories = categoriesRes.data.filter(cat => cat.is_approved === 1);
      setCategories(filteredCategories);
      setMagasins(magasinsRes.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des données :', error);
      setError('Échec de la récupération des données. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Fonctionnalité de filtrage
  const applyFilters = () => {
    let filtered = [...products];

    if (filters.category) {
      filtered = filtered.filter(product => 
        product.category_name?.toLowerCase().includes(filters.category.toLowerCase())
      );
    }

    if (filters.magasin) {
      filtered = filtered.filter(product => 
        product.magasin_name?.toLowerCase().includes(filters.magasin.toLowerCase())
      );
    }

    if (filters.status) {
      filtered = filtered.filter(product => product.status === filters.status);
    }

    if (filters.createdBy) {
      filtered = filtered.filter(product => 
        product.created_by_name?.toLowerCase().includes(filters.createdBy.toLowerCase())
      );
    }

    if (filters.searchTerm) {
      filtered = filtered.filter(product => {
        const searchLower = filters.searchTerm.toLowerCase();
        return product.name.toLowerCase().includes(searchLower) ||
               product.category_name?.toLowerCase().includes(searchLower) ||
               product.magasin_name?.toLowerCase().includes(searchLower);
      });
    }

    setFilteredProducts(filtered);
    updateActiveFilters();
  };

  const updateActiveFilters = () => {
    const active = [];
    if (filters.category) active.push({ key: 'category', label: `Catégorie : ${filters.category}`, value: filters.category });
    if (filters.magasin) active.push({ key: 'magasin', label: `Magasin : ${filters.magasin}`, value: filters.magasin });
    if (filters.status) active.push({ key: 'status', label: `Statut : ${filters.status}`, value: filters.status });
    if (filters.createdBy) active.push({ key: 'createdBy', label: `Créé par : ${filters.createdBy}`, value: filters.createdBy });
    if (filters.searchTerm) active.push({ key: 'searchTerm', label: `Recherche : ${filters.searchTerm}`, value: filters.searchTerm });
    setActiveFilters(active);
  };

  const removeFilter = (filterKey) => {
    setFilters(prev => ({ ...prev, [filterKey]: '' }));
  };

  const clearAllFilters = () => {
    setFilters({
      category: '',
      magasin: '',
      status: '',
      createdBy: '',
      searchTerm: ''
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    const category = categories.find(c => c.id.toString() === categoryId);
    if (category) {
      let fields = [];
      if (Array.isArray(category.required_fields)) {
        fields = category.required_fields;
      } else if (typeof category.required_fields === 'string') {
        try {
          fields = JSON.parse(category.required_fields);
        } catch {
          fields = [];
        }
      }
      setRequiredFields(fields);
      setFormData(prev => ({
        ...prev,
        category_id: categoryId,
        magasin_id: category.magasin.id,
        product_data: {}
      }));
    } else {
      setRequiredFields([]);
      setFormData(prev => ({
        ...prev,
        category_id: '',
        magasin_id: '',
        product_data: {}
      }));
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      product_data: {
        ...prev.product_data,
        [field]: value
      }
    }));
  };

  const validateForm = () => {
    if (!formData.category_id) {
      setError('La catégorie est requise.');
      return false;
    }
    // Defensive: magasin_id may be a string or object
    if (!formData.magasin_id && !(formData.magasin && formData.magasin.id)) {
      setError('Le magasin est requis.');
      return false;
    }
    if (!formData.product_data || Object.keys(formData.product_data).length === 0) {
      setError('Les champs du produit sont requis.');
      return false;
    }
    for (let field of requiredFields) {
      if (!formData.product_data[field] || formData.product_data[field].trim() === '') {
        setError(`Le champ "${field}" est requis.`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setActionLoading(true);

    const payload = {
      ...formData,
      created_by: user?.name || user?.username || user?.email || 'Inconnu'
    };

    try {
      await axios.post('http://localhost:5000/api/products', payload);
      setSuccess('Produit créé avec succès');
      setShowModal(false);
      setFormData({ name: '', category_id: '', magasin_id: '', product_data: {} });
      setRequiredFields([]);
      setSelectedCategory('');
      await fetchData();
    } catch (error) {
      console.error('Erreur lors de la création du produit :', error);
      if (error.response && error.response.data && error.response.data.error) {
        setError(error.response.data.error);
      } else {
        setError('Échec de la création du produit. Veuillez réessayer.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusUpdate = async (productId, status) => {
    setActionLoading(true);
    setError(null);
    try {
      await axios.patch(`http://localhost:5000/api/products/${productId}/status`, { status });
      setSuccess(`Produit ${status === 'approved' ? 'approuvé' : 'rejeté'} avec succès`);
      await fetchData();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut du produit :', error);
      setError('Échec de la mise à jour du statut du produit. Veuillez réessayer.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return '✅';
      case 'rejected':
        return '❌';
      default:
        return '⏳';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved':
        return 'modern-badge-success';
      case 'rejected':
        return 'modern-badge-error';
      default:
        return 'modern-badge-warning';
    }
  };

  // Prepare data for Handsontable
  const prepareTableData = () => {
    return filteredProducts.map(product => ({
      id: product.id,
      name: product.name,
      category_name: product.category_name,
      magasin_name: product.magasin_name,
      status: product.status,
      created_by_name: product.created_by_name,
      created_at: new Date(product.created_at).toLocaleDateString('fr-FR'),
      actions: product.id
    }));
  };

  // Define columns for Handsontable
  const tableColumns = [
    { 
      data: 'name', 
      title: 'Produit', 
      type: 'text', 
      width: 200,
      
      readOnly: true,
      className: 'htLeft'
    },
    { 
      data: 'category_name', 
      title: 'Catégorie', 
      type: 'text', 
      width: 150,
      readOnly: true,
      className: 'htLeft'
    },
    { 
      data: 'magasin_name', 
      title: 'Magasin', 
      type: 'text', 
      width: 150,
      readOnly: true,
      className: 'htLeft'
    },
    { 
      data: 'status', 
      title: 'Statut', 
      type: 'text', 
      width: 120,
      readOnly: true,
      className: 'htCenter',
      renderer: (instance, td, row, col, prop, value) => {
        const statusClass = getStatusBadgeClass(value);
        const statusIcon = getStatusIcon(value);
        const statusText = value === 'approved' ? 'Approuvé' : value === 'rejected' ? 'Rejeté' : 'En attente';
        td.innerHTML = `<span class="modern-badge ${statusClass}">
          ${statusIcon} ${statusText}
        </span>`;
        return td;
      }
    },
    { 
      data: 'created_by_name', 
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
        const product = filteredProducts.find(p => p.id === value);
        const approveButton = product?.status === 'pending' && hasPermission('validate_product')
          ? `<button class="modern-btn modern-btn-success modern-btn-sm modern-btn-icon mr-1" title="Approuver" onclick="approveProduct(${value})">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <polyline points="20,6 9,17 4,12"/>
               </svg>
             </button>
             <button class="modern-btn modern-btn-danger modern-btn-sm modern-btn-icon mr-1" title="Rejeter" onclick="rejectProduct(${value})">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <line x1="18" y1="6" x2="6" y2="18"/>
                 <line x1="6" y1="6" x2="18" y2="18"/>
               </svg>
             </button>`
          : '';
        const viewButton = `<button class="modern-btn modern-btn-secondary modern-btn-sm modern-btn-icon" title="Voir détails" onclick="viewProduct(${value})">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                              </svg>
                            </button>`;
        
        td.innerHTML = `<div class="flex-center" style="gap: 0.5rem;">${approveButton}${viewButton}</div>`;
        return td;
      }
    }
  ];

  // Global functions for action buttons
  useEffect(() => {
    window.approveProduct = (productId) => {
      handleStatusUpdate(productId, 'approved');
    };

    window.rejectProduct = (productId) => {
      handleStatusUpdate(productId, 'rejected');
    };

    window.viewProduct = (productId) => {
      const product = products.find(p => p.id === productId);
      if (product) {
        const productData = typeof product.product_data === 'string' 
          ? JSON.parse(product.product_data) 
          : product.product_data;
        const dataString = Object.entries(productData || {})
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
        alert(`Détails du produit:\nNom: ${product.name}\nCatégorie: ${product.category_name}\nMagasin: ${product.magasin_name}\nStatut: ${product.status}\n\nDonnées:\n${dataString}`);
      }
    };

    return () => {
      delete window.approveProduct;
      delete window.rejectProduct;
      delete window.viewProduct;
    };
    // eslint-disable-next-line
  }, [products]);

  if (permissionsLoading) {
    return (
      <div className="flex-center" style={{ minHeight: '400px' }}>
        <div className="modern-spinner"></div>
        <span style={{ marginLeft: '1rem', color: 'var(--neutral-600)' }}>Vérification des permissions...</span>
      </div>
    );
  }

  if (!hasComponentAccess('ProductManagement')) {
    return (
      <div style={{ padding: '2rem' }}>
        <div className="flex-center" style={{ minHeight: '400px', flexDirection: 'column', textAlign: 'center' }}>
          <Lock size={64} color="var(--neutral-400)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--neutral-900)', marginBottom: '0.5rem' }}>
            Accès non autorisé
          </h2>
          <p style={{ color: 'var(--neutral-600)', lineHeight: 'var(--line-height-relaxed)' }}>
            Vous n'avez pas les permissions nécessaires pour accéder à la gestion des produits.
            <br />
            Veuillez contacter votre administrateur pour obtenir les droits d'accès appropriés.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column' }}>
        <div className="modern-spinner" style={{ width: '3rem', height: '3rem' }}></div>
        <div style={{ marginTop: '1rem', color: 'var(--neutral-600)', fontSize: 'var(--font-size-lg)' }}>
          Chargement des données...
        </div>
      </div>
    );
  }

  // --- FULL WIDTH DESIGN STARTS HERE ---
  return (
    <div style={{ width: '100%', minHeight: '100vh', margin: 0, padding: 0, position: 'relative', background: 'var(--neutral-25)' }}>
      <div style={{ width: '100%', maxWidth: '100%', margin: 0, padding: '2rem 2vw' }}>
        {/* Header Section */}
        <div className="flex-between" style={{ marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--neutral-900)', margin: '0 0 0.5rem 0' }}>
              Gestion des Produits
            </h1>
            <p style={{ color: 'var(--neutral-600)', fontSize: 'var(--font-size-base)' }}>
              Gérez les produits selon les catégories approuvées
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
            {hasPermission('create_product') && (
              <button
                onClick={() => setShowModal(true)}
                className="modern-btn modern-btn-primary"
              >
                <Plus size={16} />
                Ajouter un produit
              </button>
            )}
          </div>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="modern-alert modern-alert-success">
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
          <div className="modern-alert modern-alert-error">
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
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
        <div style={{ marginBottom: '1.5rem' }}>
          <div className="modern-search-input">
            <div className="modern-input-icon">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="Rechercher par nom, catégorie ou magasin..."
              className="modern-input"
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            />
          </div>
        </div>

        {/* Data Grid */}
        <div className="modern-card" style={{ width: '100%', maxWidth: '100%', overflowX: 'auto' }}>
          <div className="modern-card-body" style={{ padding: '0', width: '100%', maxWidth: '100%', overflowX: 'auto' }}>
            <HandsontableDataGrid
              data={prepareTableData()}
              columns={tableColumns}
              height={500}
              width="100%"
              className="product-management-table"
              contextMenu={['row_above', 'row_below', 'separator', 'copy', 'cut']}
              filters={true}
              dropdownMenu={true}
              multiColumnSorting={true}
              stretchH="all"
            />
            {filteredProducts.length === 0 && (
              <div className="text-center" style={{ padding: '2rem', color: 'var(--neutral-500)' }}>
                Aucun produit trouvé correspondant à vos filtres.
              </div>
            )}
          </div>
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
                <label className="modern-form-label">Catégorie</label>
                <input
                  type="text"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="modern-input"
                  placeholder="Nom de la catégorie"
                />
              </div>

              <div className="modern-form-group">
                <label className="modern-form-label">Magasin</label>
                <input
                  type="text"
                  value={filters.magasin}
                  onChange={(e) => handleFilterChange('magasin', e.target.value)}
                  className="modern-input"
                  placeholder="Nom du magasin"
                />
              </div>

              <div className="modern-form-group">
                <label className="modern-form-label">Statut</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="modern-input modern-select"
                >
                  <option value="">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="approved">Approuvé</option>
                  <option value="rejected">Rejeté</option>
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

      {/* Create Product Modal */}
      {showModal && (
        <div className="modern-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modern-modal modern-modal-xl">
            <div className="modern-modal-header">
              <h3 className="modern-modal-title">Ajouter un nouveau produit</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="modern-modal-close"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modern-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className="modern-form-group">
                    <label className="modern-form-label required">Nom du Produit</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="modern-input"
                      required
                      placeholder="Entrez le nom du produit"
                    />
                  </div>
                  
                  <div className="modern-form-group">
                    <label className="modern-form-label required">Catégorie</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="modern-input modern-select"
                      required
                    >
                      <option value="">Sélectionner une catégorie</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {requiredFields.length > 0 && (
                  <div className="modern-form-group">
                    <label className="modern-form-label">Champs Requis pour cette Catégorie</label>
                    <div className="modern-form-help">
                      Remplissez tous les champs obligatoires pour cette catégorie
                    </div>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                      gap: '1rem', 
                      maxHeight: '300px', 
                      overflowY: 'auto', 
                      padding: '1rem', 
                      border: '2px solid var(--neutral-200)', 
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--neutral-50)'
                    }}>
                      {requiredFields.map((field) => (
                        <div key={field} className="modern-form-group" style={{ marginBottom: '0' }}>
                          <label className="modern-form-label required" style={{ fontSize: 'var(--font-size-sm)' }}>
                            {field}
                          </label>
                          <input
                            type="text"
                            value={formData.product_data[field] || ''}
                            onChange={(e) => handleFieldChange(field, e.target.value)}
                            className="modern-input"
                            placeholder={`Entrer ${field}`}
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                  disabled={actionLoading}
                  className="modern-btn modern-btn-primary"
                  style={{ minWidth: '140px' }}
                >
                  {actionLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="modern-spinner" style={{ width: '16px', height: '16px' }}></div>
                      Création...
                    </div>
                  ) : (
                    'Créer le produit'
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

export default ProductManagement;
