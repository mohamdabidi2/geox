import React, { useState } from 'react';
import { useStock } from '../../contexts/StockContext';
import { useAuth } from '../../hooks/useAuth';
import HandsontableDataGrid from '../stock/HandsontableDataGrid';
import Modal from '../../components/Modal';

const RightsDashboard = () => {
  const { user } = useAuth();
  const {
    categoryRights,
    magasinRights,
    clientRights,
    loadingCategoryRights,
    loadingMagasinRights,
    loadingClientRights,
    fetchAllRights,
    createCategoryRight,
    createMagasinRight,
    createClientRight,
    fetchCategoryRights,
    fetchMagasinRights,
    fetchClientRights,
  } = useStock();

  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  // Popups state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showMagasinModal, setShowMagasinModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);

  // Form data for creation
  const [categoryForm, setCategoryForm] = useState({
    userid: '',
    categoryid: '',
    DroitStartIn: '',
    DroitExpiredAt: '',
    ResponsableId: user?.id || ''
  });
  const [magasinForm, setMagasinForm] = useState({
    userid: '',
    magasinid: '',
    DroitStartIn: '',
    DroitExpiredAt: '',
    ResponsableId: user?.id || ''
  });
  const [clientForm, setClientForm] = useState({
    userid: '',
    clientid: '',
    DroitStartIn: '',
    DroitExpiredAt: '',
    ResponsableId: user?.id || ''
  });

  // Rafraîchir toutes les données
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchAllRights();
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des droits:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Statistiques
  const getStats = () => {
    const now = new Date();
    const isActive = (d) => new Date(d.DroitExpiredAt) > now;
    return {
      total: categoryRights.length + magasinRights.length + clientRights.length,
      actifs: [
        ...categoryRights.filter(isActive),
        ...magasinRights.filter(isActive),
        ...clientRights.filter(isActive)
      ].length,
      categories: {
        total: categoryRights.length,
        actifs: categoryRights.filter(isActive).length
      },
      magasins: {
        total: magasinRights.length,
        actifs: magasinRights.filter(isActive).length
      },
      clients: {
        total: clientRights.length,
        actifs: clientRights.filter(isActive).length
      }
    };
  };

  const stats = getStats();
  const isLoading = loadingCategoryRights || loadingMagasinRights || loadingClientRights;

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: '📊' },
    { id: 'categories', label: 'Droits Catégories', icon: '📁' },
    { id: 'magasins', label: 'Droits Magasins', icon: '🏪' },
    { id: 'clients', label: 'Droits Clients', icon: '👥' }
  ];

  // Création handlers
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    await createCategoryRight({ ...categoryForm, ResponsableId: user?.id || '' });
    setShowCategoryModal(false);
    setCategoryForm({
      userid: '',
      categoryid: '',
      DroitStartIn: '',
      DroitExpiredAt: '',
      ResponsableId: user?.id || ''
    });
    fetchCategoryRights();
  };

  const handleCreateMagasin = async (e) => {
    e.preventDefault();
    await createMagasinRight({ ...magasinForm, ResponsableId: user?.id || '' });
    setShowMagasinModal(false);
    setMagasinForm({
      userid: '',
      magasinid: '',
      DroitStartIn: '',
      DroitExpiredAt: '',
      ResponsableId: user?.id || ''
    });
    fetchMagasinRights();
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    await createClientRight({ ...clientForm, ResponsableId: user?.id || '' });
    setShowClientModal(false);
    setClientForm({
      userid: '',
      clientid: '',
      DroitStartIn: '',
      DroitExpiredAt: '',
      ResponsableId: user?.id || ''
    });
    fetchClientRights();
  };

  // Table columns (français)
  const categoryColumns = [
    { data: 'userid', type: 'text', title: 'Utilisateur' },
    { data: 'categoryid', type: 'text', title: 'Catégorie' },
    { data: 'DroitStartIn', type: 'date', title: 'Début' },
    { data: 'DroitExpiredAt', type: 'date', title: 'Expiration' },
    { data: 'ResponsableId', type: 'text', title: 'Responsable' }
  ];
  const magasinColumns = [
    { data: 'userid', type: 'text', title: 'Utilisateur' },
    { data: 'magasinid', type: 'text', title: 'Magasin' },
    { data: 'DroitStartIn', type: 'date', title: 'Début' },
    { data: 'DroitExpiredAt', type: 'date', title: 'Expiration' },
    { data: 'ResponsableId', type: 'text', title: 'Responsable' }
  ];
  const clientColumns = [
    { data: 'userid', type: 'text', title: 'Utilisateur' },
    { data: 'clientid', type: 'text', title: 'Client' },
    { data: 'DroitStartIn', type: 'date', title: 'Début' },
    { data: 'DroitExpiredAt', type: 'date', title: 'Expiration' },
    { data: 'ResponsableId', type: 'text', title: 'Responsable' }
  ];

  // Vue d'ensemble
  const OverviewTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          titre="Droits totaux"
          total={stats.total}
          actifs={stats.actifs}
          icon="🔐"
          color="border-blue-500"
        />
        <StatCard
          titre="Droits Catégories"
          total={stats.categories.total}
          actifs={stats.categories.actifs}
          icon="📁"
          color="border-green-500"
        />
        <StatCard
          titre="Droits Magasins"
          total={stats.magasins.total}
          actifs={stats.magasins.actifs}
          icon="🏪"
          color="border-yellow-500"
        />
        <StatCard
          titre="Droits Clients"
          total={stats.clients.total}
          actifs={stats.clients.actifs}
          icon="👥"
          color="border-purple-500"
        />
      </div>
    </div>
  );

  function StatCard({ titre, total, actifs, icon, color }) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${color}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{titre}</p>
            <div className="flex items-center mt-2">
              <p className="text-3xl font-bold text-gray-900">{actifs}</p>
              <p className="text-sm text-gray-500 ml-2">/ {total}</p>
            </div>
            <p className="text-xs text-gray-500 mt-1">Actifs / Total</p>
          </div>
          <div className="text-4xl">{icon}</div>
        </div>
      </div>
    );
  }

  // Popups de création
  const renderCategoryModal = () => (
    <Modal show={showCategoryModal} onClose={() => setShowCategoryModal(false)} title="Créer un droit catégorie">
      <form onSubmit={handleCreateCategory} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Utilisateur</label>
          <input
            type="text"
            className="input"
            value={categoryForm.userid}
            onChange={e => setCategoryForm(f => ({ ...f, userid: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Catégorie</label>
          <input
            type="text"
            className="input"
            value={categoryForm.categoryid}
            onChange={e => setCategoryForm(f => ({ ...f, categoryid: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Début</label>
          <input
            type="date"
            className="input"
            value={categoryForm.DroitStartIn}
            onChange={e => setCategoryForm(f => ({ ...f, DroitStartIn: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Expiration</label>
          <input
            type="date"
            className="input"
            value={categoryForm.DroitExpiredAt}
            onChange={e => setCategoryForm(f => ({ ...f, DroitExpiredAt: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Responsable</label>
          <input
            type="text"
            className="input"
            value={user?.id || ''}
            disabled
          />
        </div>
        <div className="flex justify-end">
          <button type="button" className="btn-secondary mr-2" onClick={() => setShowCategoryModal(false)}>
            Annuler
          </button>
          <button type="submit" className="btn-primary">
            Créer
          </button>
        </div>
      </form>
    </Modal>
  );

  const renderMagasinModal = () => (
    <Modal show={showMagasinModal} onClose={() => setShowMagasinModal(false)} title="Créer un droit magasin">
      <form onSubmit={handleCreateMagasin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Utilisateur</label>
          <input
            type="text"
            className="input"
            value={magasinForm.userid}
            onChange={e => setMagasinForm(f => ({ ...f, userid: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Magasin</label>
          <input
            type="text"
            className="input"
            value={magasinForm.magasinid}
            onChange={e => setMagasinForm(f => ({ ...f, magasinid: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Début</label>
          <input
            type="date"
            className="input"
            value={magasinForm.DroitStartIn}
            onChange={e => setMagasinForm(f => ({ ...f, DroitStartIn: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Expiration</label>
          <input
            type="date"
            className="input"
            value={magasinForm.DroitExpiredAt}
            onChange={e => setMagasinForm(f => ({ ...f, DroitExpiredAt: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Responsable</label>
          <input
            type="text"
            className="input"
            value={user?.id || ''}
            disabled
          />
        </div>
        <div className="flex justify-end">
          <button type="button" className="btn-secondary mr-2" onClick={() => setShowMagasinModal(false)}>
            Annuler
          </button>
          <button type="submit" className="btn-primary">
            Créer
          </button>
        </div>
      </form>
    </Modal>
  );

  const renderClientModal = () => (
    <Modal show={showClientModal} onClose={() => setShowClientModal(false)} title="Créer un droit client">
      <form onSubmit={handleCreateClient} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Utilisateur</label>
          <input
            type="text"
            className="input"
            value={clientForm.userid}
            onChange={e => setClientForm(f => ({ ...f, userid: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Client</label>
          <input
            type="text"
            className="input"
            value={clientForm.clientid}
            onChange={e => setClientForm(f => ({ ...f, clientid: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Début</label>
          <input
            type="date"
            className="input"
            value={clientForm.DroitStartIn}
            onChange={e => setClientForm(f => ({ ...f, DroitStartIn: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Expiration</label>
          <input
            type="date"
            className="input"
            value={clientForm.DroitExpiredAt}
            onChange={e => setClientForm(f => ({ ...f, DroitExpiredAt: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Responsable</label>
          <input
            type="text"
            className="input"
            value={user?.id || ''}
            disabled
          />
        </div>
        <div className="flex justify-end">
          <button type="button" className="btn-secondary mr-2" onClick={() => setShowClientModal(false)}>
            Annuler
          </button>
          <button type="submit" className="btn-primary">
            Créer
          </button>
        </div>
      </form>
    </Modal>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des droits</h1>
              <p className="text-gray-600 mt-1">
                Gérer les droits des utilisateurs pour les catégories, magasins et clients
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing || isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md flex items-center"
            >
              {refreshing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <span className="mr-2">🔄</span>
              )}
              Rafraîchir
            </button>
          </div>
        </div>
      </div>

      {/* Onglets de navigation */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {!isLoading && (
          <>
            {activeTab === 'overview' && <OverviewTab />}

            {activeTab === 'categories' && (
              <div>
                <div className="flex justify-end mb-4">
                  <button
                    className="btn-primary"
                    onClick={() => setShowCategoryModal(true)}
                  >
                    + Nouveau droit catégorie
                  </button>
                </div>
                <HandsontableDataGrid
                  data={categoryRights}
                  columns={categoryColumns}
                  readOnly={true}
                  stretchH="all"
                  width="100%"
                  height="auto"
                  licenseKey="non-commercial-and-evaluation"
                  language="fr-FR"
                />
                {renderCategoryModal()}
              </div>
            )}

            {activeTab === 'magasins' && (
              <div>
                <div className="flex justify-end mb-4">
                  <button
                    className="btn-primary"
                    onClick={() => setShowMagasinModal(true)}
                  >
                    + Nouveau droit magasin
                  </button>
                </div>
                <HandsontableDataGrid
                  data={magasinRights}
                  columns={magasinColumns}
                  readOnly={true}
                  stretchH="all"
                  width="100%"
                  height="auto"
                  licenseKey="non-commercial-and-evaluation"
                  language="fr-FR"
                />
                {renderMagasinModal()}
              </div>
            )}

            {activeTab === 'clients' && (
              <div>
                <div className="flex justify-end mb-4">
                  <button
                    className="btn-primary"
                    onClick={() => setShowClientModal(true)}
                  >
                    + Nouveau droit client
                  </button>
                </div>
                <HandsontableDataGrid
                  data={clientRights}
                  columns={clientColumns}
                  readOnly={true}
                  stretchH="all"
                  width="100%"
                  height="auto"
                  licenseKey="non-commercial-and-evaluation"
                  language="fr-FR"
                />
                {renderClientModal()}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RightsDashboard;
