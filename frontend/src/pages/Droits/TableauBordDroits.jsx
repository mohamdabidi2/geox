import React, { useState, useRef } from 'react';
import { useStock } from '../../contexts/StockContext';
import { useAuth } from '../../contexts/AuthContext';
import GestionDroitsCategories from './GestionDroitsCategories';
import GestionDroitsMagasins from './GestionDroitsMagasins';
import GestionDroitsClients from './GestionDroitsClients';

const TableauBordDroits = () => {
  const { user } = useAuth();
  const {
    categoryRights,
    magasinRights,
    clientRights,
    loadingCategoryRights,
    loadingMagasinRights,
    loadingClientRights,
    getActiveCategoryRights,
    getActiveMagasinRights,
    getActiveClientRights,
    fetchAllRights
  } = useStock();

  const [activeTab, setActiveTab] = useState('apercu');
  const [refreshing, setRefreshing] = useState(false);

  // Track if a popup is open in any child table
  const [popupState, setPopupState] = useState({
    categories: false,
    magasins: false,
    clients: false
  });

  // Pass these handlers to children to notify popup open/close
  const handlePopupOpen = (tab) => setPopupState((prev) => ({ ...prev, [tab]: true }));
  const handlePopupClose = (tab) => setPopupState((prev) => ({ ...prev, [tab]: false }));

  // Calculer les statistiques
  const getStatistics = () => {
    const activeCategoryRights = getActiveCategoryRights();
    const activeMagasinRights = getActiveMagasinRights();
    const activeClientRights = getActiveClientRights();

    return {
      totalRights: categoryRights.length + magasinRights.length + clientRights.length,
      activeRights: activeCategoryRights.length + activeMagasinRights.length + activeClientRights.length,
      categoryRights: {
        total: categoryRights.length,
        active: activeCategoryRights.length
      },
      magasinRights: {
        total: magasinRights.length,
        active: activeMagasinRights.length
      },
      clientRights: {
        total: clientRights.length,
        active: activeClientRights.length
      }
    };
  };

  const stats = getStatistics();
  const isLoading = loadingCategoryRights || loadingMagasinRights || loadingClientRights;

  const tabs = [
    { id: 'apercu', label: 'Aperçu', icon: '📊' },
    { id: 'categories', label: 'Droits Catégories', icon: '📁' },
    { id: 'magasins', label: 'Droits Magasins', icon: '🏪' },
    { id: 'clients', label: 'Droits Clients', icon: '👥' }
  ];

  const CarteStatistique = ({ title, total, active, icon, color }) => (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-center mt-2">
            <p className="text-3xl font-bold text-gray-900">{active}</p>
            <p className="text-sm text-gray-500 ml-2">/ {total}</p>
          </div>
          <p className="text-xs text-gray-500 mt-1">Actifs / Total</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );

  const OngletApercu = () => (
    <div className="space-y-6">
      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <CarteStatistique
          title="Total des Droits"
          total={stats.totalRights}
          active={stats.activeRights}
          icon="🔐"
          color="border-blue-500"
        />
        <CarteStatistique
          title="Droits Catégories"
          total={stats.categoryRights.total}
          active={stats.categoryRights.active}
          icon="📁"
          color="border-green-500"
        />
        <CarteStatistique
          title="Droits Magasins"
          total={stats.magasinRights.total}
          active={stats.magasinRights.active}
          icon="🏪"
          color="border-yellow-500"
        />
        <CarteStatistique
          title="Droits Clients"
          total={stats.clientRights.total}
          active={stats.clientRights.active}
          icon="👥"
          color="border-purple-500"
        />
      </div>

      {/* Activité récente des droits */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activité Récente des Droits</h3>
        <div className="space-y-4">
          {/* Droits de catégories actifs */}
          {getActiveCategoryRights().slice(0, 3).map((right) => (
            <div key={`category-${right.id}`} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <span className="text-green-600 mr-3">📁</span>
                <div>
                  <p className="font-medium text-gray-900">Catégorie: {right.category_name}</p>
                  <p className="text-sm text-gray-600">Expire: {new Date(right.DroitExpiredAt).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                Actif
              </span>
            </div>
          ))}

          {/* Droits de magasins actifs */}
          {getActiveMagasinRights().slice(0, 3).map((right) => (
            <div key={`magasin-${right.id}`} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center">
                <span className="text-yellow-600 mr-3">🏪</span>
                <div>
                  <p className="font-medium text-gray-900">Magasin: {right.magasin_name}</p>
                  <p className="text-sm text-gray-600">Expire: {new Date(right.DroitExpiredAt).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded-full">
                Actif
              </span>
            </div>
          ))}

          {/* Droits clients actifs */}
          {getActiveClientRights().slice(0, 3).map((right) => (
            <div key={`client-${right.id}`} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center">
                <span className="text-purple-600 mr-3">👥</span>
                <div>
                  <p className="font-medium text-gray-900">Client: {right.client_name}</p>
                  <p className="text-sm text-gray-600">Expire: {new Date(right.DroitExpiredAt).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded-full">
                Actif
              </span>
            </div>
          ))}

          {stats.activeRights === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucun droit actif trouvé.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Helper to determine if popup is open for the current tab
  const isPopupOpenForTab = (tab) => {
    if (tab === 'categories') return popupState.categories;
    if (tab === 'magasins') return popupState.magasins;
    if (tab === 'clients') return popupState.clients;
    return false;
  };

  // Table titles for each tab
  const tableTitles = {
    categories: 'Gestion des Droits de Catégories',
    magasins: 'Gestion des Droits de Magasins',
    clients: 'Gestion des Droits de Clients'
  };

  // Make the dashboard full width by removing max-w-7xl and mx-auto, and using px-8 for padding
  return (
    <div className="min-h-screen bg-gray-50 w-full">
      {/* Onglets de navigation */}
      <div className="bg-white shadow-sm w-full">
        <div className="px-8">
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
      <div className="w-full px-8 py-8 relative">
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {!isLoading && (
          <>
            {activeTab === 'apercu' && <OngletApercu />}

            {/* Table Title with z-index logic */}
            {(activeTab === 'categories' || activeTab === 'magasins' || activeTab === 'clients') && (
              <div
                className={`mb-6 transition-all duration-200`}
                style={{
                  position: isPopupOpenForTab(activeTab) ? 'relative' : 'static',
                  zIndex: isPopupOpenForTab(activeTab) ? 50 : 1
                }}
              >
                <h2
                  className={`text-2xl font-bold text-gray-900`}
                  style={{
                    background: isPopupOpenForTab(activeTab) ? 'white' : 'transparent',
                    position: isPopupOpenForTab(activeTab) ? 'relative' : 'static',
                    zIndex: isPopupOpenForTab(activeTab) ? 50 : 1,
                    padding: isPopupOpenForTab(activeTab) ? '0.5rem 1rem' : undefined,
                    borderRadius: isPopupOpenForTab(activeTab) ? '0.5rem' : undefined,
                    boxShadow: isPopupOpenForTab(activeTab) ? '0 2px 8px rgba(0,0,0,0.08)' : undefined
                  }}
                >
                  {tableTitles[activeTab]}
                </h2>
              </div>
            )}

            {activeTab === 'categories' && (
              <GestionDroitsCategories
                onPopupOpen={() => handlePopupOpen('categories')}
                onPopupClose={() => handlePopupClose('categories')}
              />
            )}
            {activeTab === 'magasins' && (
              <GestionDroitsMagasins
                onPopupOpen={() => handlePopupOpen('magasins')}
                onPopupClose={() => handlePopupClose('magasins')}
              />
            )}
            {activeTab === 'clients' && (
              <GestionDroitsClients
                onPopupOpen={() => handlePopupOpen('clients')}
                onPopupClose={() => handlePopupClose('clients')}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TableauBordDroits;