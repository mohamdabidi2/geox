import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, BarChart3, Package, Store, TrendingUp, TrendingDown, Activity, Filter, X, Search, Lock, AlertCircle, CheckCircle } from 'lucide-react';
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

const StockManagement = () => {
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

  const [currentStock, setCurrentStock] = useState([]);
  const [filteredStock, setFilteredStock] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [filteredMovements, setFilteredMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [magasins, setMagasins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeTab, setActiveTab] = useState('stock');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    product_id: '',
    magasin_id: '',
    movement_type: 'in',
    quantity: 1,
    reference_type: 'manual',
    reference_id: '',
    notes: ''
  });

  // États de filtre
  const [filters, setFilters] = useState({
    product: '',
    category: '',
    magasin: '',
    movementType: '',
    referenceType: '',
    searchTerm: ''
  });
  const [activeFilters, setActiveFilters] = useState([]);

  useEffect(() => {
    if (user?.magasin?.id) {
      fetchData();
    }
    // eslint-disable-next-line
  }, [user]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line
  }, [currentStock, stockMovements, filters]);

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
      const [stockRes, movementsRes, productsRes, magasinsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/stock/current-stock'),
        axios.get('http://localhost:5000/api/stock/stock-movements'),
        axios.get('http://localhost:5000/api/products/magasin/' + user.magasin.id),
        axios.get('http://localhost:5000/api/magasins')
      ]);

      const approvedProducts = productsRes.data.filter(product => product.is_approved);

      setCurrentStock(stockRes.data);
      setStockMovements(movementsRes.data);
      setProducts(approvedProducts);
      setMagasins(magasinsRes.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des données :', error);
      setError('Erreur lors de la récupération des données');
    } finally {
      setLoading(false);
    }
  };

  // Fonctionnalité de filtre
  const applyFilters = () => {
    // Filtrer le stock actuel
    let filteredStockData = [...currentStock];

    if (filters.product) {
      filteredStockData = filteredStockData.filter(stock =>
        stock.product_name?.toLowerCase().includes(filters.product.toLowerCase())
      );
    }

    if (filters.category) {
      filteredStockData = filteredStockData.filter(stock =>
        stock.category_name?.toLowerCase().includes(filters.category.toLowerCase())
      );
    }

    if (filters.magasin) {
      filteredStockData = filteredStockData.filter(stock =>
        stock.magasin_name?.toLowerCase().includes(filters.magasin.toLowerCase())
      );
    }

    if (filters.searchTerm) {
      filteredStockData = filteredStockData.filter(stock => {
        const searchLower = filters.searchTerm.toLowerCase();
        return stock.product_name?.toLowerCase().includes(searchLower) ||
          stock.category_name?.toLowerCase().includes(searchLower) ||
          stock.magasin_name?.toLowerCase().includes(searchLower);
      });
    }

    setFilteredStock(filteredStockData);

    // Filtrer les mouvements de stock
    let filteredMovementData = [...stockMovements];

    if (filters.product) {
      filteredMovementData = filteredMovementData.filter(movement =>
        movement.product_name?.toLowerCase().includes(filters.product.toLowerCase())
      );
    }

    if (filters.magasin) {
      filteredMovementData = filteredMovementData.filter(movement =>
        movement.magasin_name?.toLowerCase().includes(filters.magasin.toLowerCase())
      );
    }

    if (filters.movementType) {
      filteredMovementData = filteredMovementData.filter(movement =>
        movement.movement_type === filters.movementType
      );
    }

    if (filters.referenceType) {
      filteredMovementData = filteredMovementData.filter(movement =>
        movement.reference_type === filters.referenceType
      );
    }

    if (filters.searchTerm) {
      filteredMovementData = filteredMovementData.filter(movement => {
        const searchLower = filters.searchTerm.toLowerCase();
        return movement.product_name?.toLowerCase().includes(searchLower) ||
          movement.magasin_name?.toLowerCase().includes(searchLower) ||
          movement.reference_type?.toLowerCase().includes(searchLower);
      });
    }

    setFilteredMovements(filteredMovementData);
    updateActiveFilters();
  };

  const updateActiveFilters = () => {
    const active = [];
    if (filters.product) active.push({ key: 'product', label: `Produit : ${filters.product}`, value: filters.product });
    if (filters.category) active.push({ key: 'category', label: `Catégorie : ${filters.category}`, value: filters.category });
    if (filters.magasin) active.push({ key: 'magasin', label: `Magasin : ${filters.magasin}`, value: filters.magasin });
    if (filters.movementType) active.push({ key: 'movementType', label: `Mouvement : ${filters.movementType === 'in' ? 'Entrée' : 'Sortie'}`, value: filters.movementType });
    if (filters.referenceType) active.push({ key: 'referenceType', label: `Référence : ${filters.referenceType === 'manual' ? 'Manuel' : filters.referenceType === 'purchase_order' ? 'Bon d\'achat' : 'Vente'}`, value: filters.referenceType });
    if (filters.searchTerm) active.push({ key: 'searchTerm', label: `Recherche : ${filters.searchTerm}`, value: filters.searchTerm });
    setActiveFilters(active);
  };

  const removeFilter = (filterKey) => {
    setFilters(prev => ({ ...prev, [filterKey]: '' }));
  };

  const clearAllFilters = () => {
    setFilters({
      product: '',
      category: '',
      magasin: '',
      movementType: '',
      referenceType: '',
      searchTerm: ''
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await axios.post('http://localhost:5000/api/stock/stock-movements', formData);
      setSuccess('Mouvement de stock enregistré avec succès');
      setShowModal(false);
      setFormData({
        product_id: '',
        magasin_id: '',
        movement_type: 'in',
        quantity: 1,
        reference_type: 'manual',
        reference_id: '',
        notes: ''
      });
      fetchData();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du mouvement de stock :', error);
      setError('Erreur lors de l\'enregistrement du mouvement de stock');
    }
  };

  // Prepare data for Stock table
  const prepareStockTableData = () => {
    return filteredStock.map(stock => {
      const magasinId = stock.magasin && stock.magasin.id ? stock.magasin.id : (stock.magasin_id || 'unknown');
      return {
        id: `${stock.product_id}-${magasinId}`,
        product_name: stock.product_name,
        category_name: stock.category_name,
        magasin_name: stock.magasin_name,
        current_quantity: stock.current_quantity,
        last_updated: new Date(stock.last_updated).toLocaleDateString('fr-FR')
      };
    });
  };

  // Prepare data for Movements table
  const prepareMovementsTableData = () => {
    return filteredMovements.map(movement => ({
      id: movement.id,
      product_name: movement.product_name,
      magasin_name: movement.magasin_name,
      movement_type: movement.movement_type,
      quantity: movement.quantity,
      reference_type: movement.reference_type,
      created_at: new Date(movement.created_at).toLocaleDateString('fr-FR'),
      notes: movement.notes || ''
    }));
  };

  // Define columns for Stock table
  const stockColumns = [
    { 
      data: 'product_name', 
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
      data: 'current_quantity', 
      title: 'Quantité actuelle', 
      type: 'numeric', 
      width: 150,
      readOnly: true,
      className: 'htCenter',
      renderer: (instance, td, row, col, prop, value) => {
        const quantity = parseInt(value) || 0;
        let badgeClass = 'modern-badge ';
        if (quantity === 0) {
          badgeClass += 'modern-badge-error';
        } else if (quantity < 10) {
          badgeClass += 'modern-badge-warning';
        } else {
          badgeClass += 'modern-badge-success';
        }
        td.innerHTML = `<span class="${badgeClass}">${quantity}</span>`;
        return td;
      }
    },
    { 
      data: 'last_updated', 
      title: 'Dernière mise à jour', 
      type: 'text', 
      width: 150,
      readOnly: true,
      className: 'htCenter'
    }
  ];

  // Define columns for Movements table
  const movementsColumns = [
    { 
      data: 'product_name', 
      title: 'Produit', 
      type: 'text', 
      width: 200,
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
      data: 'movement_type', 
      title: 'Type de mouvement', 
      type: 'text', 
      width: 150,
      readOnly: true,
      className: 'htCenter',
      renderer: (instance, td, row, col, prop, value) => {
        const isIn = value === 'in';
        const icon = isIn ? '⬆️' : '⬇️';
        const text = isIn ? 'Entrée' : 'Sortie';
        const badgeClass = isIn ? 'modern-badge-success' : 'modern-badge-error';
        td.innerHTML = `<span class="modern-badge ${badgeClass}">${icon} ${text}</span>`;
        return td;
      }
    },
    { 
      data: 'quantity', 
      title: 'Quantité', 
      type: 'numeric', 
      width: 100,
      readOnly: true,
      className: 'htCenter'
    },
    { 
      data: 'reference_type', 
      title: 'Référence', 
      type: 'text', 
      width: 120,
      readOnly: true,
      className: 'htCenter',
      renderer: (instance, td, row, col, prop, value) => {
        let text = value;
        if (value === 'manual') text = 'Manuel';
        else if (value === 'purchase_order') text = 'Bon d\'achat';
        else if (value === 'sale') text = 'Vente';
        td.innerHTML = `<span class="modern-badge modern-badge-secondary">${text}</span>`;
        return td;
      }
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
      data: 'notes', 
      title: 'Notes', 
      type: 'text', 
      width: 200,
      readOnly: true,
      className: 'htLeft'
    }
  ];

  // If user is not present, show error message
  if (!user || !user.magasin?.id) {
    return (
      <div className="flex-center" style={{ minHeight: '400px', flexDirection: 'column', textAlign: 'center' }}>
        <AlertCircle size={48} color="var(--error-400)" style={{ marginBottom: '1rem' }} />
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--neutral-900)', marginBottom: '0.5rem' }}>
          Erreur d'authentification
        </h2>
        <p style={{ color: 'var(--neutral-600)', lineHeight: 'var(--line-height-relaxed)' }}>
          Vous devez être connecté et avoir un magasin sélectionné pour accéder à la gestion du stock.<br />
          Veuillez vous reconnecter ou contacter un administrateur.
        </p>
      </div>
    );
  }

  if (permissionsLoading) {
    return (
      <div className="flex-center" style={{ minHeight: '400px' }}>
        <div className="modern-spinner"></div>
        <span style={{ marginLeft: '1rem', color: 'var(--neutral-600)' }}>Vérification des permissions...</span>
      </div>
    );
  }

  if (!hasComponentAccess('StockManagement')) {
    return (
      <div style={{ padding: '2rem' }}>
        <div className="flex-center" style={{ minHeight: '400px', flexDirection: 'column', textAlign: 'center' }}>
          <Lock size={64} color="var(--neutral-400)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--neutral-900)', marginBottom: '0.5rem' }}>
            Accès non autorisé
          </h2>
          <p style={{ color: 'var(--neutral-600)', lineHeight: 'var(--line-height-relaxed)' }}>
            Vous n'avez pas les permissions nécessaires pour accéder à la gestion du stock.
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
    <div style={{ width: '100vw', maxWidth: '100vw', margin: 0, padding: '2rem 0', boxSizing: 'border-box' }}>
      {/* Header Section */}
      <div className="flex-between" style={{ marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem', padding: '0 2rem' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--neutral-900)', margin: '0 0 0.5rem 0' }}>
            Gestion de Stock
          </h1>
          <p style={{ color: 'var(--neutral-600)', fontSize: 'var(--font-size-base)' }}>
            Surveillez les niveaux de stock actuels et enregistrez les mouvements de stock
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
          <button
            onClick={() => setShowModal(true)}
            className="modern-btn modern-btn-primary"
          >
            <Plus size={16} />
            Enregistrer un mouvement
          </button>
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
            placeholder="Rechercher par produit, catégorie ou magasin..."
            className="modern-input"
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '1.5rem', padding: '0 2rem' }}>
        <div className="modern-tabs">
          <button
            onClick={() => setActiveTab('stock')}
            className={`modern-tab ${activeTab === 'stock' ? 'modern-tab-active' : ''}`}
          >
            <BarChart3 size={16} />
            Stock Actuel
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`modern-tab ${activeTab === 'movements' ? 'modern-tab-active' : ''}`}
          >
            <Activity size={16} />
            Mouvements de Stock
          </button>
        </div>
      </div>

      {/* Stock Tab */}
      {activeTab === 'stock' && (
        <div className="modern-card" style={{ width: '100%', borderRadius: 0, margin: 0 }}>
          <div className="modern-card-body" style={{ padding: '0' }}>
            <HandsontableDataGrid
              data={prepareStockTableData()}
              columns={stockColumns}
              height={400}
              className="stock-management-table"
              contextMenu={['row_above', 'row_below', 'separator', 'copy', 'cut']}
              filters={true}
              dropdownMenu={true}
              multiColumnSorting={true}
              width="100%"
              stretchH="all"
            />
            {filteredStock.length === 0 && (
              <div className="text-center" style={{ padding: '2rem', color: 'var(--neutral-500)' }}>
                Aucun stock trouvé correspondant à vos filtres.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Movements Tab */}
      {activeTab === 'movements' && (
        <div className="modern-card" style={{ width: '100%', borderRadius: 0, margin: 0 }}>
          <div className="modern-card-body" style={{ padding: '0' }}>
            <HandsontableDataGrid
              data={prepareMovementsTableData()}
              columns={movementsColumns}
              height={400}
              className="stock-movements-table"
              contextMenu={['row_above', 'row_below', 'separator', 'copy', 'cut']}
              filters={true}
              dropdownMenu={true}
              multiColumnSorting={true}
              width="100%"
              stretchH="all"
            />
            {filteredMovements.length === 0 && (
              <div className="text-center" style={{ padding: '2rem', color: 'var(--neutral-500)' }}>
                Aucun mouvement de stock trouvé correspondant à vos filtres.
              </div>
            )}
          </div>
        </div>
      )}

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
                <label className="modern-form-label">Produit</label>
                <input
                  type="text"
                  value={filters.product}
                  onChange={(e) => handleFilterChange('product', e.target.value)}
                  className="modern-input"
                  placeholder="Nom du produit"
                />
              </div>

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

              {activeTab === 'movements' && (
                <>
                  <div className="modern-form-group">
                    <label className="modern-form-label">Type de mouvement</label>
                    <select
                      value={filters.movementType}
                      onChange={(e) => handleFilterChange('movementType', e.target.value)}
                      className="modern-input modern-select"
                    >
                      <option value="">Tous les types</option>
                      <option value="in">Entrée</option>
                      <option value="out">Sortie</option>
                    </select>
                  </div>

                  <div className="modern-form-group">
                    <label className="modern-form-label">Type de référence</label>
                    <select
                      value={filters.referenceType}
                      onChange={(e) => handleFilterChange('referenceType', e.target.value)}
                      className="modern-input modern-select"
                    >
                      <option value="">Tous les types</option>
                      <option value="manual">Manuel</option>
                      <option value="purchase_order">Bon d'achat</option>
                      <option value="sale">Vente</option>
                    </select>
                  </div>
                </>
              )}
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

      {/* Movement Modal */}
      {showModal && (
        <div className="modern-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modern-modal modern-modal-lg">
            <div className="modern-modal-header">
              <h3 className="modern-modal-title">Enregistrer un mouvement de stock</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="modern-modal-close"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modern-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  <div className="modern-form-group">
                    <label className="modern-form-label required">Produit</label>
                    <select
                      value={formData.product_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, product_id: e.target.value }))}
                      className="modern-input modern-select"
                      required
                    >
                      <option value="">Sélectionner un produit</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="modern-form-group">
                    <label className="modern-form-label required">Magasin</label>
                    <select
                      value={formData.magasin_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, magasin_id: e.target.value }))}
                      className="modern-input modern-select"
                      required
                    >
                      <option value="">Sélectionner un magasin</option>
                      {magasins.map((magasin) => (
                        <option key={magasin.id} value={magasin.id}>
                          {magasin.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="modern-form-group">
                    <label className="modern-form-label required">Type de mouvement</label>
                    <select
                      value={formData.movement_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, movement_type: e.target.value }))}
                      className="modern-input modern-select"
                      required
                    >
                      <option value="in">Entrée</option>
                      <option value="out">Sortie</option>
                    </select>
                  </div>
                  
                  <div className="modern-form-group">
                    <label className="modern-form-label required">Quantité</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                      className="modern-input"
                      required
                    />
                  </div>
                  
                  <div className="modern-form-group">
                    <label className="modern-form-label required">Type de référence</label>
                    <select
                      value={formData.reference_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, reference_type: e.target.value }))}
                      className="modern-input modern-select"
                      required
                    >
                      <option value="manual">Manuel</option>
                      <option value="purchase_order">Bon d'achat</option>
                      <option value="sale">Vente</option>
                    </select>
                  </div>
                  
                  <div className="modern-form-group">
                    <label className="modern-form-label">ID de référence</label>
                    <input
                      type="text"
                      value={formData.reference_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, reference_id: e.target.value }))}
                      className="modern-input"
                      placeholder="Optionnel"
                    />
                  </div>
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
                  Enregistrer le mouvement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockManagement;
