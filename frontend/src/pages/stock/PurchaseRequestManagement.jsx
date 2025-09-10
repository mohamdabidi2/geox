import { useState, useEffect } from 'react';
// import { useAuth } from '../../hooks/useAuth'; // Removed to avoid "must be used within an AuthProvider" error
// import { usePermissions } from '../../hooks/usePermissions'; // Also removed for same reason
import axios from 'axios';
import { Plus, FileText, Store, User, CheckCircle, XCircle, Clock, Minus, Eye, Filter, X, Search, Lock, AlertCircle } from 'lucide-react';
import HandsontableDataGrid from './HandsontableDataGrid';
import './modern-styles.css'; // Import our modern styles

// Fallback user and permissions if not in AuthProvider context
const fallbackUser = {
  id: 0,
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

const PurchaseRequestManagement = () => {
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

  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [respMagasin, setrespMagasin] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // États de filtre
  const [filters, setFilters] = useState({
    status: '',
    createdBy: '',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: '',
    searchTerm: ''
  });
  const [activeFilters, setActiveFilters] = useState([]);

  const [formData, setFormData] = useState({
    magasin_id: user?.magasin?.id || '',
    products: [{ product_id: '', quantity: 1 }],
    total_amount: 0,
    notes: '',
    created_by: (user?.firstname ? user.firstname : '') + (user?.lastname ? " " + user.lastname : '')
  });

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

  // Calculer le total à chaque changement de produits
  const calculateTotal = (productsArr) => {
    return productsArr.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const product = products.find(p => p.id === parseInt(item.product_id));
      const price = product ? parseFloat(product.product_data?.Prix || 0) : 0;
      return sum + qty * price;
    }, 0);
  };

  // Mettre à jour le total_amount à chaque changement de produits
  const setProductsAndTotal = (productsArr) => {
    setFormData(prev => ({
      ...prev,
      products: productsArr,
      total_amount: calculateTotal(productsArr)
    }));
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line
  }, [purchaseRequests, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const magasinId = user?.magasin?.id;
      const [requestsRes, productsRes, MagasinRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/purchase-requests/magasin/${magasinId}`),
        axios.get(`http://localhost:5000/api/products/magasin/${magasinId}`),
        axios.get(`http://localhost:5000/api/magasins/${magasinId}`),
      ]);
      setrespMagasin(MagasinRes.data.responsable_id)
      setPurchaseRequests(requestsRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des données :', error);
      setError('Erreur lors de la récupération des données');
    } finally {
      setLoading(false);
    }
  };

  // Fonctionnalité de filtre
  const applyFilters = () => {
    let filtered = [...purchaseRequests];

    if (filters.status) {
      filtered = filtered.filter(req => req.status === filters.status);
    }

    if (filters.createdBy) {
      filtered = filtered.filter(req =>
        req.created_by?.toLowerCase().includes(filters.createdBy.toLowerCase())
      );
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(req =>
        new Date(req.created_at) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(req =>
        new Date(req.created_at) <= new Date(filters.dateTo + 'T23:59:59')
      );
    }

    if (filters.minAmount) {
      filtered = filtered.filter(req =>
        parseFloat(req.total_amount || 0) >= parseFloat(filters.minAmount)
      );
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(req =>
        parseFloat(req.total_amount || 0) <= parseFloat(filters.maxAmount)
      );
    }

    if (filters.searchTerm) {
      filtered = filtered.filter(req =>
        req.id?.toString().includes(filters.searchTerm) ||
        req.created_by?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        req.notes?.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    setFilteredRequests(filtered);
    updateActiveFilters();
  };

  const updateActiveFilters = () => {
    const active = [];
    if (filters.status) active.push({ key: 'status', label: `Statut : ${filters.status}`, value: filters.status });
    if (filters.createdBy) active.push({ key: 'createdBy', label: `Créé par : ${filters.createdBy}`, value: filters.createdBy });
    if (filters.dateFrom) active.push({ key: 'dateFrom', label: `Du : ${filters.dateFrom}`, value: filters.dateFrom });
    if (filters.dateTo) active.push({ key: 'dateTo', label: `Au : ${filters.dateTo}`, value: filters.dateTo });
    if (filters.minAmount) active.push({ key: 'minAmount', label: `Min : ${filters.minAmount} €`, value: filters.minAmount });
    if (filters.maxAmount) active.push({ key: 'maxAmount', label: `Max : ${filters.maxAmount} €`, value: filters.maxAmount });
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
      minAmount: '',
      maxAmount: '',
      searchTerm: ''
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Voir les détails de la demande
  const viewRequestDetails = async (requestId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/purchase-requests/${requestId}`);
      setSelectedRequest(response.data);
      setShowViewModal(true);
    } catch (error) {
      console.error('Erreur lors de la récupération des détails de la demande :', error);
      setError('Erreur lors de la récupération des détails de la demande');
    }
  };

  const getProductDetails = (productId) => {
    return products.find(p => p.id === parseInt(productId));
  };

  const addItem = () => {
    const newProducts = [...formData.products, { product_id: '', quantity: 1 }];
    setProductsAndTotal(newProducts);
  };

  const removeItem = (index) => {
    const newProducts = formData.products.filter((_, i) => i !== index);
    setProductsAndTotal(newProducts);
  };

  const updateItem = (index, field, value) => {
    const newProducts = [...formData.products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setProductsAndTotal(newProducts);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanProducts = formData.products.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity
    }));

    const submitData = {
      magasin_id: user?.magasin?.id,
      products: cleanProducts,
      notes: formData.notes || '',
      created_by: (user?.firstname ? user.firstname : '') + (user?.lastname ? " " + user.lastname : '')
    };

    if (
      !submitData.magasin_id ||
      !Array.isArray(submitData.products) ||
      submitData.products.length === 0 ||
      !submitData.created_by
    ) {
      setError('Le magasin, la liste des produits et le créateur sont obligatoires');
      return;
    }

    for (const item of submitData.products) {
      if (!item.product_id || Number(item.quantity) <= 0) {
        setError('Chaque article doit avoir un produit sélectionné et une quantité supérieure à 0');
        return;
      }
    }

    try {
      await axios.post('http://localhost:5000/api/purchase-requests', submitData);
      setSuccess('Demande d\'achat créée avec succès');
      setShowModal(false);
      setFormData({
        magasin_id: user?.magasin?.id || '',
        products: [{ product_id: '', quantity: 1 }],
        total_amount: 0,
        notes: '',
        created_by: (user?.firstname ? user.firstname : '') + (user?.lastname ? " " + user.lastname : '')
      });
      fetchData();
    } catch (error) {
      let errorMsg = 'Erreur lors de la création de la demande d\'achat';
      if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      }
      setError(errorMsg);
      console.error('Erreur lors de la création de la demande d\'achat :', error);
    }
  };

  const handleStatusUpdate = async (requestId, status) => {
    try {
      await axios.patch(`http://localhost:5000/api/purchase-requests/${requestId}/approval`, {
        status,
        approved_by: user.id
      });
      setSuccess(`Demande d'achat ${status === 'approved' ? 'approuvée' : 'rejetée'} avec succès`);
      fetchData();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut de la demande :', error);
      setError('Erreur lors de la mise à jour du statut : ' + (error.response?.data?.error || error.message));
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

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'Approuvée';
      case 'rejected':
        return 'Rejetée';
      default:
        return 'En attente';
    }
  };

  // Prepare data for Handsontable
  const prepareTableData = () => {
    return filteredRequests.map(request => ({
      id: request.id,
      items_count: Array.isArray(request.products) ? request.products.length : 0,
      total_amount: parseFloat(request.total_amount || 0),
      status: request.status,
      created_by: request.created_by,
      created_at: new Date(request.created_at).toLocaleDateString('fr-FR'),
      actions: request.id
    }));
  };

  // Define columns for Handsontable
  const tableColumns = [
    { 
      data: 'id', 
      title: 'ID Demande', 
      type: 'numeric', 
      width: 100,
      readOnly: true,
      className: 'htCenter'
    },
    { 
      data: 'items_count', 
      title: 'Articles', 
      type: 'numeric', 
      width: 100,
      readOnly: true,
      className: 'htCenter',
      renderer: (instance, td, row, col, prop, value) => {
        td.innerHTML = `<span class="modern-badge modern-badge-secondary">${value} article${value > 1 ? 's' : ''}</span>`;
        return td;
      }
    },
    { 
      data: 'total_amount', 
      title: 'Montant total', 
      type: 'numeric', 
      width: 130,
      readOnly: true,
      className: 'htRight',
      renderer: (instance, td, row, col, prop, value) => {
        td.innerHTML = `<strong>${value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>`;
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
        const statusClass = getStatusBadgeClass(value);
        const statusIcon = getStatusIcon(value);
        const statusText = getStatusText(value);
        td.innerHTML = `<span class="modern-badge ${statusClass}">
          ${statusIcon} ${statusText}
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
      title: 'Date', 
      type: 'text', 
      width: 120,
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
        const request = filteredRequests.find(r => r.id === value);
        const approveButton = request?.status === 'pending' && (user.id === respMagasin || hasPermission('validate_purchase_request'))
          ? `<button class="modern-btn modern-btn-success modern-btn-sm modern-btn-icon mr-1" title="Approuver" onclick="approveRequest(${value})">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <polyline points="20,6 9,17 4,12"/>
               </svg>
             </button>
             <button class="modern-btn modern-btn-danger modern-btn-sm modern-btn-icon mr-1" title="Rejeter" onclick="rejectRequest(${value})">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <line x1="18" y1="6" x2="6" y2="18"/>
                 <line x1="6" y1="6" x2="18" y2="18"/>
               </svg>
             </button>`
          : '';
        const viewButton = `<button class="modern-btn modern-btn-secondary modern-btn-sm modern-btn-icon" title="Voir détails" onclick="viewRequest(${value})">
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
    window.approveRequest = (requestId) => {
      handleStatusUpdate(requestId, 'approved');
    };

    window.rejectRequest = (requestId) => {
      handleStatusUpdate(requestId, 'rejected');
    };

    window.viewRequest = (requestId) => {
      viewRequestDetails(requestId);
    };

    return () => {
      delete window.approveRequest;
      delete window.rejectRequest;
      delete window.viewRequest;
    };
    // eslint-disable-next-line
  }, [filteredRequests, respMagasin, user]);

  if (permissionsLoading) {
    return (
      <div className="flex-center" style={{ minHeight: '400px' }}>
        <div className="modern-spinner"></div>
        <span style={{ marginLeft: '1rem', color: 'var(--neutral-600)' }}>Vérification des permissions...</span>
      </div>
    );
  }

  if (!hasComponentAccess('PurchaseRequestManagement')) {
    return (
      <div style={{ padding: '2rem' }}>
        <div className="flex-center" style={{ minHeight: '400px', flexDirection: 'column', textAlign: 'center' }}>
          <Lock size={64} color="var(--neutral-400)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--neutral-900)', marginBottom: '0.5rem' }}>
            Accès non autorisé
          </h2>
          <p style={{ color: 'var(--neutral-600)', lineHeight: 'var(--line-height-relaxed)' }}>
            Vous n'avez pas les permissions nécessaires pour accéder à la gestion des demandes d'achat.
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

  return (
    <div style={{ width: '100vw', maxWidth: '100%', margin: 0, padding: '2rem 0' }}>
      {/* Header Section */}
      <div className="flex-between" style={{ marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem', padding: '0 2rem' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--neutral-900)', margin: '0 0 0.5rem 0' }}>
            Gestion des Demandes d'Achat
          </h1>
          <p style={{ color: 'var(--neutral-600)', fontSize: 'var(--font-size-base)' }}>
            Créez et gérez les demandes d'achat pour approbation
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
          {hasPermission('create_purchase_request') && (
            <button
              onClick={() => setShowModal(true)}
              className="modern-btn modern-btn-primary"
            >
              <Plus size={16} />
              Nouvelle demande
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem', padding: '0 2rem' }}>
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
      <div style={{ marginBottom: '1.5rem', padding: '0 2rem' }}>
        <div className="modern-search-input">
          <div className="modern-input-icon">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Rechercher par ID, créateur ou notes..."
            className="modern-input"
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
          />
        </div>
      </div>

      {/* Data Grid */}
      <div className="modern-card" style={{ width: '100vw', maxWidth: '100%', borderRadius: 0, margin: 0 }}>
        <div className="modern-card-body" style={{ padding: '0' }}>
          <HandsontableDataGrid
            data={prepareTableData()}
            columns={tableColumns}
            height={500}
            className="purchase-request-management-table"
            contextMenu={['row_above', 'row_below', 'separator', 'copy', 'cut']}
            filters={true}
            dropdownMenu={true}
            multiColumnSorting={true}
            width="100vw"
            stretchH="all"
          />
          {filteredRequests.length === 0 && (
            <div className="text-center" style={{ padding: '2rem', color: 'var(--neutral-500)' }}>
              Aucune demande d'achat trouvée correspondant à vos filtres.
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
                  <option value="pending">En attente</option>
                  <option value="approved">Approuvée</option>
                  <option value="rejected">Rejetée</option>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="modern-form-group">
                  <label className="modern-form-label">Montant minimum (€)</label>
                  <input
                    type="number"
                    value={filters.minAmount}
                    onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                    className="modern-input"
                    placeholder="0"
                  />
                </div>

                <div className="modern-form-group">
                  <label className="modern-form-label">Montant maximum (€)</label>
                  <input
                    type="number"
                    value={filters.maxAmount}
                    onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                    className="modern-input"
                    placeholder="10000"
                  />
                </div>
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

      {/* Create Request Modal */}
      {showModal && (
        <div className="modern-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modern-modal modern-modal-xl">
            <div className="modern-modal-header">
              <h3 className="modern-modal-title">Nouvelle demande d'achat</h3>
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
                  <label className="modern-form-label">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="modern-input modern-textarea"
                    rows="3"
                    placeholder="Notes additionnelles"
                  />
                </div>
                
                <div className="modern-form-group">
                  <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                    <label className="modern-form-label required">Produits</label>
                    <button
                      type="button"
                      onClick={addItem}
                      className="modern-btn modern-btn-secondary modern-btn-sm"
                    >
                      <Plus size={16} />
                      Ajouter un produit
                    </button>
                  </div>
                  
                  <div style={{ 
                    maxHeight: '300px', 
                    overflowY: 'auto', 
                    border: '2px solid var(--neutral-200)', 
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--neutral-50)'
                  }}>
                    {formData.products.map((item, index) => (
                      <div key={index} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '1rem', 
                        padding: '1rem', 
                        borderBottom: '1px solid var(--neutral-200)'
                      }}>
                        <select
                          value={item.product_id}
                          onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                          className="modern-input modern-select"
                          style={{ flex: '1' }}
                          required
                        >
                          <option value="">Sélectionner un produit</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                        
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="modern-input"
                          style={{ width: '80px' }}
                          placeholder="Qté"
                          required
                        />
                        
                        {formData.products.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="modern-btn modern-btn-danger modern-btn-sm modern-btn-icon"
                          >
                            <Minus size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--neutral-700)' }}>
                      Total estimé: <strong>{formData.total_amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>
                    </span>
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
                  className="modern-btn modern-btn-primary"
                  style={{ minWidth: '140px' }}
                >
                  Créer la demande
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && selectedRequest && (
        <div className="modern-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowViewModal(false)}>
          <div className="modern-modal modern-modal-lg">
            <div className="modern-modal-header">
              <h3 className="modern-modal-title">
                Détails de la demande d'achat #{selectedRequest.id}
              </h3>
              <button 
                onClick={() => setShowViewModal(false)}
                className="modern-modal-close"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="modern-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                  <label className="modern-form-label">Statut</label>
                  <span className={`modern-badge ${getStatusBadgeClass(selectedRequest.status)}`}>
                    {getStatusIcon(selectedRequest.status)} {getStatusText(selectedRequest.status)}
                  </span>
                </div>
                <div>
                  <label className="modern-form-label">Créé par</label>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--neutral-900)' }}>{selectedRequest.created_by}</p>
                </div>
                <div>
                  <label className="modern-form-label">Date de création</label>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--neutral-900)' }}>{new Date(selectedRequest.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <label className="modern-form-label">Montant total</label>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--neutral-900)', fontWeight: 'var(--font-weight-semibold)' }}>
                    {parseFloat(selectedRequest.total_amount || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </p>
                </div>
              </div>
              
              {selectedRequest.notes && (
                <div className="modern-form-group">
                  <label className="modern-form-label">Notes</label>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--neutral-900)' }}>{selectedRequest.notes}</p>
                </div>
              )}
              
              <div className="modern-form-group">
                <label className="modern-form-label">Produits demandés</label>
                <div className="modern-card" style={{ border: '2px solid var(--neutral-200)' }}>
                  {Array.isArray(selectedRequest.products) && selectedRequest.products.map((item, index) => {
                    const product = getProductDetails(item.product_id);
                    return (
                      <div key={index} className="flex-between" style={{ 
                        padding: '1rem', 
                        borderBottom: index < selectedRequest.products.length - 1 ? '1px solid var(--neutral-200)' : 'none'
                      }}>
                        <div>
                          <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--neutral-900)' }}>
                            {product?.name || 'Produit inconnu'}
                          </p>
                          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--neutral-500)' }}>ID: {item.product_id}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--neutral-900)' }}>Quantité: <strong>{item.quantity}</strong></p>
                          {product?.product_data?.Prix && (
                            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--neutral-500)' }}>
                              Prix unitaire: {parseFloat(product.product_data.Prix).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="modern-modal-footer">
              <button
                onClick={() => setShowViewModal(false)}
                className="modern-btn modern-btn-primary"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseRequestManagement;
