import React from 'react';
import { Lock, AlertCircle, RefreshCw } from 'lucide-react';
import { useRightsManagement } from '../../hooks/useRightsManagement';
import '../stock/modern-styles.css';

// Higher-order component to protect pages with rights management
const RightsProtectedPage = ({ 
  children, 
  requireMagasin = true, 
  requireCategories = false, 
  requireClients = false,
  pageName = 'cette page'
}) => {
  const {
    loading,
    error,
    user,
    hasMandatoryMagasinAccess,
    userRights,
    refreshRights
  } = useRightsManagement();

  // Loading state
  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '400px', width: '100%' }}>
        <div className="modern-spinner"></div>
        <span style={{ marginLeft: '1rem', color: 'var(--neutral-600)' }}>
          Vérification des droits d'accès...
        </span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ padding: '2rem', width: '100%' }}>
        <div className="flex-center" style={{ minHeight: '400px', flexDirection: 'column', textAlign: 'center' }}>
          <AlertCircle size={64} color="var(--error-400)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--neutral-900)', marginBottom: '0.5rem' }}>
            Erreur de vérification des droits
          </h2>
          <p style={{ color: 'var(--neutral-600)', lineHeight: 'var(--line-height-relaxed)', marginBottom: '1rem' }}>
            Une erreur s'est produite lors de la vérification de vos droits d'accès.
            <br />
            Veuillez réessayer ou contacter votre administrateur.
          </p>
          <button
            onClick={refreshRights}
            className="modern-btn modern-btn-primary"
            style={{ marginTop: '1rem' }}
          >
            <RefreshCw size={16} />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Check user authentication
  if (!user || !user.id) {
    return (
      <div style={{ padding: '2rem', width: '100%' }}>
        <div className="flex-center" style={{ minHeight: '400px', flexDirection: 'column', textAlign: 'center' }}>
          <Lock size={64} color="var(--neutral-400)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--neutral-900)', marginBottom: '0.5rem' }}>
            Authentification requise
          </h2>
          <p style={{ color: 'var(--neutral-600)', lineHeight: 'var(--line-height-relaxed)' }}>
            Vous devez être connecté pour accéder à {pageName}.
            <br />
            Veuillez vous connecter et réessayer.
          </p>
        </div>
      </div>
    );
  }

  // Check mandatory magasin access
  if (requireMagasin && !hasMandatoryMagasinAccess()) {
    return (
      <div style={{ padding: '2rem', width: '100%' }}>
        <div className="flex-center" style={{ minHeight: '400px', flexDirection: 'column', textAlign: 'center' }}>
          <Lock size={64} color="var(--error-400)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--neutral-900)', marginBottom: '0.5rem' }}>
            Accès au magasin non autorisé
          </h2>
          <p style={{ color: 'var(--neutral-600)', lineHeight: 'var(--line-height-relaxed)' }}>
            Vous n'avez pas les droits d'accès nécessaires pour le magasin requis.
            <br />
            Veuillez contacter votre administrateur pour obtenir les droits d'accès appropriés.
          </p>
          {user.magasin?.id && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--neutral-100)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--neutral-700)' }}>
                Magasin demandé : <strong>{user.magasin.id}</strong>
              </p>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--neutral-700)' }}>
                Magasins autorisés : <strong>{userRights?.magasins?.length ? userRights.magasins.join(', ') : 'Aucun'}</strong>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // If all checks pass, render the protected content
  return children;
};

export default RightsProtectedPage;