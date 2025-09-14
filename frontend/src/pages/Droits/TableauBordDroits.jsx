import React, { useState, useRef } from 'react';
import { useStock } from '../../contexts/StockContext';
import { useAuth } from '../../contexts/AuthContext';
import GestionDroitsCategories from './GestionDroitsCategories';
import GestionDroitsMagasins from './GestionDroitsMagasins';
import GestionDroitsClients from './GestionDroitsClients';
import { RefreshCw, BarChart3, FolderOpen, Store, Users } from 'lucide-react';

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
    { id: 'apercu', label: 'Aperçu', icon: BarChart3 },
    { id: 'categories', label: 'Droits Catégories', icon: FolderOpen },
    { id: 'magasins', label: 'Droits Magasins', icon: Store },
    { id: 'clients', label: 'Droits Clients', icon: Users }
  ];

  const CarteStatistique = ({ title, total, active, icon: Icon, color }) => (
    <div className="modern-card" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="modern-card-body">
        <div className="flex-between">
          <div>
            <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--neutral-600)', margin: '0 0 0.5rem 0' }}>
              {title}
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--neutral-900)', margin: 0 }}>
                {active}
              </p>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--neutral-500)' }}>
                / {total}
              </p>
            </div>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--neutral-500)', margin: '0.25rem 0 0 0' }}>
              Actifs / Total
            </p>
          </div>
          <div style={{ color: color, fontSize: '2.5rem' }}>
            <Icon size={40} />
          </div>
        </div>
      </div>
    </div>
  );

  const OngletApercu = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Cartes de statistiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <CarteStatistique
          title="Total des Droits"
          total={stats.totalRights}
          active={stats.activeRights}
          icon={BarChart3}
          color="var(--primary-500)"
        />
        <CarteStatistique
          title="Droits Catégories"
          total={stats.categoryRights.total}
          active={stats.categoryRights.active}
          icon={FolderOpen}
          color="var(--success-500)"
        />
        <CarteStatistique
          title="Droits Magasins"
          total={stats.magasinRights.total}
          active={stats.magasinRights.active}
          icon={Store}
          color="var(--warning-500)"
        />
        <CarteStatistique
          title="Droits Clients"
          total={stats.clientRights.total}
          active={stats.clientRights.active}
          icon={Users}
          color="var(--purple-500)"
        />
      </div>

      {/* Activité récente des droits */}
      <div className="modern-card">
        <div className="modern-card-body">
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--neutral-900)', margin: '0 0 1.5rem 0' }}>
            Activité Récente des Droits
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Droits de catégories actifs */}
            {getActiveCategoryRights().slice(0, 3).map((right) => (
              <div key={`category-${right.id}`} className="modern-alert modern-alert-success" style={{ margin: 0 }}>
                <FolderOpen size={20} />
                <div>
                  <p style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--neutral-900)', margin: 0 }}>
                    Catégorie: {right.category_name}
                  </p>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--neutral-600)', margin: 0 }}>
                    Expire: {new Date(right.DroitExpiredAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <span className="modern-badge modern-badge-success">
                  Actif
                </span>
              </div>
            ))}

            {/* Droits de magasins actifs */}
            {getActiveMagasinRights().slice(0, 3).map((right) => (
              <div key={`magasin-${right.id}`} className="modern-alert modern-alert-warning" style={{ margin: 0 }}>
                <Store size={20} />
                <div>
                  <p style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--neutral-900)', margin: 0 }}>
                    Magasin: {right.magasin_name}
                  </p>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--neutral-600)', margin: 0 }}>
                    Expire: {new Date(right.DroitExpiredAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <span className="modern-badge modern-badge-warning">
                  Actif
                </span>
              </div>
            ))}

            {/* Droits clients actifs */}
            {getActiveClientRights().slice(0, 3).map((right) => (
              <div key={`client-${right.id}`} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '1rem', 
                backgroundColor: 'var(--purple-50)', 
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--purple-200)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Users size={20} style={{ color: 'var(--purple-600)' }} />
                  <div>
                    <p style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--neutral-900)', margin: 0 }}>
                      Client: {right.client_name}
                    </p>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--neutral-600)', margin: 0 }}>
                      Expire: {new Date(right.DroitExpiredAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <span className="modern-badge" style={{ 
                  backgroundColor: 'var(--purple-100)', 
                  color: 'var(--purple-800)' 
                }}>
                  Actif
                </span>
              </div>
            ))}

            {stats.activeRights === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--neutral-500)' }}>
                Aucun droit actif trouvé.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--neutral-50)', width: '100%' }}>
      {/* Navigation Tabs */}
      <div className="modern-card" style={{ borderRadius: 0, borderBottom: '1px solid var(--neutral-200)' }}>
        <div style={{ padding: '0 2rem' }}>
          <nav style={{ display: 'flex', gap: '2rem' }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`modern-btn modern-btn-ghost ${
                    activeTab === tab.id ? 'modern-btn-active' : ''
                  }`}
                  style={{
                    padding: '1rem 0',
                    borderRadius: 0,
                    borderBottom: activeTab === tab.id ? '2px solid var(--primary-500)' : '2px solid transparent',
                    color: activeTab === tab.id ? 'var(--primary-600)' : 'var(--neutral-500)'
                  }}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div style={{ width: '100%', padding: '2rem', position: 'relative' }}>
        {isLoading && (
          <div className="flex-center" style={{ padding: '3rem 0' }}>
            <div className="modern-spinner" style={{ width: '3rem', height: '3rem' }}></div>
          </div>
        )}

        {!isLoading && (
          <>
            {activeTab === 'apercu' && <OngletApercu />}
             {activeTab === 'magasins' && <GestionDroitsMagasins />}
            {activeTab === 'categories' && <GestionDroitsCategories />}
           
            {activeTab === 'clients' && <GestionDroitsClients />}
          </>
        )}
      </div>
    </div>
  );
};

export default TableauBordDroits;