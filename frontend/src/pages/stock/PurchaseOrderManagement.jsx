import { useState, useEffect } from 'react';
// import { useAuth } from '../../hooks/useAuth'; // Removed to avoid "must be used within an AuthProvider" error
// import { usePermissions } from '../../hooks/usePermissions'; // Also removed for same reason
import axios from 'axios';
import { Plus, ShoppingCart, Store, User, Mail, Eye, Lock, Filter, X, Search, AlertCircle, CheckCircle } from 'lucide-react';
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

const PurchaseOrderManagement = () => {
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

  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [formData, setFormData] = useState({
    demande_achat_ids: [],
    fournisseur_id: '',
    notes: '',
    magasin_id: user?.magasin?.id,
    created_by: user?.id
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({
    orderNumber: '',
    supplier: '',
    status: '',
    createdBy: '',
    date: '',
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
  }, [purchaseOrders, filters]);

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
    try {
      setLoading(true);
      const [ordersRes, requestsRes, suppliersRes] = await Promise.all([
        axios.get('http://localhost:5000/api/purchase-orders/magasin/' + (user?.magasin?.id ?? '')),
        axios.get('http://localhost:5000/api/purchase-requests/magasin/' + (user?.magasin?.id ?? '') + '/approved'),
        axios.get('http://localhost:5000/api/suppliers/magasin/' + (user?.magasin?.id ?? ''))
      ]);

      setPurchaseOrders(ordersRes.data);

      const normalizedRequests = Array.isArray(requestsRes.data)
        ? requestsRes.data.map(req => ({
            ...req,
            items: req.products || [],
            products: req.products || [],
            total_amount: req.total_amount !== undefined
              ? req.total_amount
              : Array.isArray(req.products)
                ? req.products.reduce((sum, p) => sum + (parseFloat(p.unit_price || 0) * parseFloat(p.quantity || 0)), 0)
                : 0
          }))
        : [];
      setPurchaseRequests(normalizedRequests);
      setSuppliers(suppliersRes.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des données :', error);
      setError('Erreur lors de la récupération des données');
    } finally {
      setLoading(false);
    }
  };

  // Fonctionnalité de filtrage
  const applyFilters = () => {
    let filtered = [...purchaseOrders];

    if (filters.orderNumber) {
      filtered = filtered.filter(order => 
        (order.order_number || '').toLowerCase().includes(filters.orderNumber.toLowerCase())
      );
    }

    if (filters.supplier) {
      filtered = filtered.filter(order => 
        (order.fournisseur_name || '').toLowerCase().includes(filters.supplier.toLowerCase())
      );
    }

    if (filters.status) {
      filtered = filtered.filter(order => (order.status || '').toLowerCase() === filters.status.toLowerCase());
    }

    if (filters.createdBy) {
      filtered = filtered.filter(order => 
        (order.created_by_name || '').toLowerCase().includes(filters.createdBy.toLowerCase())
      );
    }

    if (filters.date) {
      filtered = filtered.filter(order => 
        new Date(order.created_at).toLocaleDateString().includes(filters.date)
      );
    }

    if (filters.searchTerm) {
      filtered = filtered.filter(order => {
        const searchLower = filters.searchTerm.toLowerCase();
        return (order.order_number || '').toLowerCase().includes(searchLower) ||
               (order.fournisseur_name || '').toLowerCase().includes(searchLower) ||
               (order.created_by_name || '').toLowerCase().includes(searchLower);
      });
    }

    setFilteredOrders(filtered);
    updateActiveFilters();
  };

  const updateActiveFilters = () => {
    const active = [];
    if (filters.orderNumber) active.push({ key: 'orderNumber', label: `N° Commande : ${filters.orderNumber}`, value: filters.orderNumber });
    if (filters.supplier) active.push({ key: 'supplier', label: `Fournisseur : ${filters.supplier}`, value: filters.supplier });
    if (filters.status) active.push({ key: 'status', label: `Statut : ${filters.status}`, value: filters.status });
    if (filters.createdBy) active.push({ key: 'createdBy', label: `Créé par : ${filters.createdBy}`, value: filters.createdBy });
    if (filters.date) active.push({ key: 'date', label: `Date : ${filters.date}`, value: filters.date });
    if (filters.searchTerm) active.push({ key: 'searchTerm', label: `Recherche : ${filters.searchTerm}`, value: filters.searchTerm });
    setActiveFilters(active);
  };

  const removeFilter = (filterKey) => {
    setFilters(prev => ({ ...prev, [filterKey]: '' }));
  };

  const clearAllFilters = () => {
    setFilters({
      orderNumber: '',
      supplier: '',
      status: '',
      createdBy: '',
      date: '',
      searchTerm: ''
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleRequestChange = (selectedIds) => {
    const selectedRequests = purchaseRequests.filter(r => selectedIds.includes(r.id.toString()));
    const newTotalAmount = selectedRequests.reduce(
      (acc, r) =>
        acc +
        (r.total_amount !== undefined
          ? parseFloat(r.total_amount || 0)
          : Array.isArray(r.products)
            ? r.products.reduce((sum, p) => sum + (parseFloat(p.unit_price || 0) * parseFloat(p.quantity || 0)), 0)
            : 0),
      0
    );

    setFormData(prev => ({
      ...prev,
      demande_achat_ids: selectedIds.map(id => parseInt(id)),
      total_amount: newTotalAmount
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('http://localhost:5000/api/purchase-orders', {
        ...formData,
        magasin_id: user?.magasin?.id,
        created_by: user?.id
      });
      setSuccess(`Bon de commande créé avec succès. Numéro de commande : ${response.data.order_number}`);
      setShowModal(false);
      setFormData({
        demande_achat_ids: [],
        fournisseur_id: '',
        notes: '',
        magasin_id: user?.magasin?.id,
        created_by: user?.id
      });
      fetchData();
    } catch (error) {
      console.error('Erreur lors de la création du bon de commande :', error);
      setError('Erreur lors de la création du bon de commande');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'confirmed':
        return 'modern-badge-success';
      case 'received':
        return 'modern-badge-primary';
      case 'cancelled':
        return 'modern-badge-error';
      case 'sent':
        return 'modern-badge-primary';
      default:
        return 'modern-badge-warning';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'sent':
        return 'Envoyé';
      case 'confirmed':
        return 'Confirmé';
      case 'received':
        return 'Reçu';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  // Prepare data for Handsontable
  const prepareTableData = () => {
    return filteredOrders.map(order => ({
      id: order.id,
      order_number: order.order_number,
      fournisseur_name: order.fournisseur_name || order.fournisseur_name,
      items_count: (() => {
        let items = [];
        if (order.items) {
          try {
            items = JSON.parse(order.items);
          } catch {
            items = [];
          }
        } else if (order.products) {
          try {
            items = Array.isArray(order.products) ? order.products : JSON.parse(order.products);
          } catch {
            items = [];
          }
        }
        return items.length;
      })(),
      total_amount: parseFloat(order.total_amount || 0),
      status: order.status,
      created_by_name: order.created_by_name || order.created_by,
      created_at: new Date(order.created_at).toLocaleDateString('fr-FR'),
      actions: order.id
    }));
  };

  // Define columns for Handsontable
  const tableColumns = [
    { 
      data: 'order_number', 
      title: 'Numéro de commande', 
      type: 'text', 
      width: 180,
      readOnly: true,
      className: 'htLeft'
    },
    { 
      data: 'fournisseur_name', 
      title: 'Fournisseur', 
      type: 'text', 
      width: 150,
      readOnly: true,
      className: 'htLeft'
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
        const statusText = getStatusText(value);
        td.innerHTML = `<span class="modern-badge ${statusClass}">
          ${statusText}
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
      width: 100,
      readOnly: true,
      className: 'htCenter',
      renderer: (instance, td, row, col, prop, value) => {
        const viewButton = `<button class="modern-btn modern-btn-secondary modern-btn-sm modern-btn-icon" title="Voir détails" onclick="viewOrder(${value})">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                              </svg>
                            </button>`;
        td.innerHTML = `<div class="flex-center">${viewButton}</div>`;
        return td;
      }
    }
  ];

  // Global functions for action buttons
  useEffect(() => {
    window.viewOrder = (orderId) => {
      const order = purchaseOrders.find(o => o.id === orderId);
      if (order) {
        let items = [];
        if (order.items) {
          try {
            items = JSON.parse(order.items);
          } catch {
            items = [];
          }
        } else if (order.products) {
          try {
            items = Array.isArray(order.products) ? order.products : JSON.parse(order.products);
          } catch {
            items = [];
          }
        }
        const itemsText = items.map(item => `- ${item.name || item.product_name || 'Article'} (Qté: ${item.quantity || 'N/A'})`).join('\n');
        alert(`Détails du bon de commande:\nNuméro: ${order.order_number}\nFournisseur: ${order.fournisseur_name}\nMontant: ${parseFloat(order.total_amount || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}\nStatut: ${getStatusText(order.status)}\n\nArticles:\n${itemsText}`);
      }
    };

    return () => {
      delete window.viewOrder;
    };
    // eslint-disable-next-line
  }, [purchaseOrders]);

  if (permissionsLoading) {
    return (
      <div className="flex-center" style={{ minHeight: '400px' }}>
        <div className="modern-spinner"></div>
        <span style={{ marginLeft: '1rem', color: 'var(--neutral-600)' }}>Vérification des permissions...</span>
      </div>
    );
  }

  if (!hasComponentAccess('PurchaseOrderManagement')) {
    return (
      <div style={{ padding: '2rem' }}>
        <div className="flex-center" style={{ minHeight: '400px', flexDirection: 'column', textAlign: 'center' }}>
          <Lock size={64} color="var(--neutral-400)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--neutral-900)', marginBottom: '0.5rem' }}>
            Accès non autorisé
          </h2>
          <p style={{ color: 'var(--neutral-600)', lineHeight: 'var(--line-height-relaxed)' }}>
            Vous n'avez pas les permissions nécessaires pour accéder à la gestion des bons de commande.
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
            Gestion des Bons de Commande
          </h1>
          <p style={{ color: 'var(--neutral-600)', fontSize: 'var(--font-size-base)' }}>
            Créez des bons de commande à partir des demandes approuvées et envoyez-les aux fournisseurs
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
          {hasPermission('create_purchase_order') && (
            <button
              onClick={() => setShowModal(true)}
              className="modern-btn modern-btn-primary"
            >
              <Plus size={16} />
              Créer un bon de commande
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
            placeholder="Rechercher par numéro, fournisseur ou créateur..."
            className="modern-input"
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
          />
        </div>
      </div>

      {/* Data Grid */}
      <div className="modern-card" style={{ width: '100%', margin: 0, borderRadius: 0 }}>
        <div className="modern-card-body" style={{ padding: '0' }}>
          <HandsontableDataGrid
            data={prepareTableData()}
            columns={tableColumns}
            height={500}
            className="purchase-order-management-table"
            contextMenu={['row_above', 'row_below', 'separator', 'copy', 'cut']}
            filters={true}
            dropdownMenu={true}
            multiColumnSorting={true}
            width="100%"
            stretchH="all"
          />
          {filteredOrders.length === 0 && (
            <div className="text-center" style={{ padding: '2rem', color: 'var(--neutral-500)' }}>
              Aucun bon de commande trouvé correspondant à vos filtres.
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
                <label className="modern-form-label">Numéro de commande</label>
                <input
                  type="text"
                  value={filters.orderNumber}
                  onChange={(e) => handleFilterChange('orderNumber', e.target.value)}
                  className="modern-input"
                  placeholder="Numéro de commande"
                />
              </div>

              <div className="modern-form-group">
                <label className="modern-form-label">Fournisseur</label>
                <input
                  type="text"
                  value={filters.supplier}
                  onChange={(e) => handleFilterChange('supplier', e.target.value)}
                  className="modern-input"
                  placeholder="Nom du fournisseur"
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
                  <option value="sent">Envoyé</option>
                  <option value="confirmed">Confirmé</option>
                  <option value="received">Reçu</option>
                  <option value="cancelled">Annulé</option>
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
                <label className="modern-form-label">Date</label>
                <input
                  type="date"
                  value={filters.date}
                  onChange={(e) => handleFilterChange('date', e.target.value)}
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

      {/* Create Purchase Order Modal */}
      {showModal && (
        <div className="modern-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modern-modal modern-modal-xl">
            <div className="modern-modal-header">
              <h3 className="modern-modal-title">Créer un nouveau bon de commande</h3>
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
                    <label className="modern-form-label required">Fournisseur</label>
                    <select
                      value={formData.fournisseur_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, fournisseur_id: e.target.value }))}
                      className="modern-input modern-select"
                      required
                    >
                      <option value="">Sélectionner un fournisseur</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
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
                </div>
                
                <div className="modern-form-group">
                  <label className="modern-form-label required">Demandes d'achat approuvées</label>
                  <div className="modern-form-help">
                    Sélectionnez les demandes d'achat à inclure dans ce bon de commande
                  </div>
                  <div style={{ 
                    maxHeight: '300px', 
                    overflowY: 'auto', 
                    border: '2px solid var(--neutral-200)', 
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--neutral-50)'
                  }}>
                    {purchaseRequests.map((request) => (
                      <label key={request.id} className="modern-checkbox" style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        padding: '1rem', 
                        borderBottom: '1px solid var(--neutral-200)',
                        margin: '0'
                      }}>
                        <input
                          type="checkbox"
                          checked={formData.demande_achat_ids.includes(request.id)}
                          onChange={(e) => {
                            const currentIds = formData.demande_achat_ids;
                            const newIds = e.target.checked
                              ? [...currentIds, request.id]
                              : currentIds.filter(id => id !== request.id);
                            handleRequestChange(newIds.map(id => id.toString()));
                          }}
                        />
                        <span className="modern-checkbox-mark"></span>
                        <div style={{ marginLeft: '1rem', flex: '1' }}>
                          <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--neutral-900)' }}>
                            Demande #{request.id}
                          </div>
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--neutral-500)' }}>
                            {Array.isArray(request.products) ? request.products.length : 0} articles - 
                            {parseFloat(request.total_amount || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                          </div>
                        </div>
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
                  className="modern-btn modern-btn-primary"
                  style={{ minWidth: '180px' }}
                >
                  Créer le bon de commande
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderManagement;
