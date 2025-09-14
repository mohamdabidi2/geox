import React, { useState, useEffect } from 'react';
import { useStock } from '../../contexts/StockContext';
import { useAuth } from '../../contexts/AuthContext';
import HandsontableDataGrid from './HandsontableDataGrid';
import { Plus, X, CheckCircle, AlertCircle, UserPlus } from 'lucide-react';

const GestionDroitsClients = () => {
  const { user } = useAuth();
  const {
    clientRights,
    loadingClientRights,
    clientRightsError,
    createClientRight,
    updateClientRight,
    deleteClientRight,
    getActiveClientRights,
    mockUsers,
    mockClients
  } = useStock();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRight, setEditingRight] = useState(null);
  const [showClientForm, setShowClientForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clientLoading, setClientLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    userid: '',
    clientid: '',
    DroitStartIn: '',
    DroitExpiredAt: '',
    ResponsableId: user?.id || ''
  });
  const [clientFormData, setClientFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClientInputChange = (e) => {
    const { name, value } = e.target;
    setClientFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const dataToSubmit = {
        ...formData,
        ResponsableId: user?.id || formData.ResponsableId
      };

      if (editingRight) {
        await updateClientRight(editingRight.id, {
          DroitStartIn: dataToSubmit.DroitStartIn,
          DroitExpiredAt: dataToSubmit.DroitExpiredAt,
          ResponsableId: dataToSubmit.ResponsableId
        });
        setSuccess('Droit client modifié avec succès');
      } else {
        await createClientRight(dataToSubmit);
        setSuccess('Droit client créé avec succès');
      }
      
      // Reset form
      setFormData({
        userid: '',
        clientid: '',
        DroitStartIn: '',
        DroitExpiredAt: '',
        ResponsableId: user?.id || ''
      });
      setShowCreateForm(false);
      setEditingRight(null);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du droit client:', error);
      setError(error.message || 'Erreur lors de la sauvegarde du droit client');
    } finally {
      setLoading(false);
    }
  };

  const handleClientSubmit = async (e) => {
    e.preventDefault();
    setClientLoading(true);
    setError('');
    setSuccess('');

    try {
      // Simulation de création de client
      console.log('Nouveau client créé:', clientFormData);
      setSuccess('Client créé avec succès (simulation)');
      
      // Reset form
      setClientFormData({
        name: '',
        email: '',
        phone: '',
        address: ''
      });
      setShowClientForm(false);
    } catch (error) {
      console.error('Erreur lors de la création du client:', error);
      setError(error.message || 'Erreur lors de la création du client');
    } finally {
      setClientLoading(false);
    }
  };

  const handleEdit = (right) => {
    setEditingRight(right);
    setFormData({
      userid: right.userid,
      clientid: right.clientid,
      DroitStartIn: right.DroitStartIn.split('T')[0],
      DroitExpiredAt: right.DroitExpiredAt.split('T')[0],
      ResponsableId: right.ResponsableId
    });
    setShowCreateForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (rightId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce droit client ?')) {
      try {
        await deleteClientRight(rightId);
        setSuccess('Droit client supprimé avec succès');
      } catch (error) {
        console.error('Erreur lors de la suppression du droit client:', error);
        setError(error.message || 'Erreur lors de la suppression du droit client');
      }
    }
  };

  const openModal = (right = null) => {
    if (right) {
      handleEdit(right);
    } else {
      setEditingRight(null);
      setFormData({
        userid: '',
        clientid: '',
        DroitStartIn: '',
        DroitExpiredAt: '',
        ResponsableId: user?.id || ''
      });
      setShowCreateForm(true);
      setError('');
      setSuccess('');
    }
  };

  const openClientModal = () => {
    setClientFormData({
      name: '',
      email: '',
      phone: '',
      address: ''
    });
    setShowClientForm(true);
    setError('');
    setSuccess('');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const isRightActive = (right) => {
    const now = new Date();
    const startDate = new Date(right.DroitStartIn);
    const endDate = new Date(right.DroitExpiredAt);
    return now >= startDate && now <= endDate;
  };

  // Configuration des colonnes pour Handsontable
  const columns = [
    { data: 'id', title: 'ID', type: 'numeric', readOnly: true, width: 60 },
    { data: 'user_firstname', title: 'Prénom Utilisateur', type: 'text', readOnly: true, width: 120 },
    { data: 'user_lastname', title: 'Nom Utilisateur', type: 'text', readOnly: true, width: 120 },
    { data: 'client_name', title: 'Client', type: 'text', readOnly: true, width: 120 },
    { 
      data: 'DroitStartIn', 
      title: 'Date Début', 
      type: 'text', 
      readOnly: true, 
      width: 100,
      renderer: (instance, td, row, col, prop, value) => {
        td.innerHTML = formatDate(value);
        return td;
      }
    },
    { 
      data: 'DroitExpiredAt', 
      title: 'Date Fin', 
      type: 'text', 
      readOnly: true, 
      width: 100,
      renderer: (instance, td, row, col, prop, value) => {
        td.innerHTML = formatDate(value);
        return td;
      }
    },
    { 
      data: 'status', 
      title: 'Statut', 
      type: 'text', 
      readOnly: true, 
      width: 80,
      renderer: (instance, td, row, col, prop, value, cellProperties) => {
        const rowData = instance.getSourceDataAtRow(row);
        const active = isRightActive(rowData);
        td.innerHTML = `<span class="modern-badge ${
          active ? 'modern-badge-success' : 'modern-badge-error'
        }">${active ? 'Actif' : 'Inactif'}</span>`;
        return td;
      }
    },
    { data: 'responsable_firstname', title: 'Responsable Prénom', type: 'text', readOnly: true, width: 120 },
    { data: 'responsable_lastname', title: 'Responsable Nom', type: 'text', readOnly: true, width: 120 },
    { 
      data: 'actions', 
      title: 'Actions', 
      type: 'text', 
      readOnly: true, 
      width: 120,
      renderer: (instance, td, row, col, prop, value, cellProperties) => {
        const rowData = instance.getSourceDataAtRow(row);
        const editButton = `<button class="modern-btn modern-btn-primary modern-btn-sm modern-btn-icon mr-1" title="Modifier" onclick="editClientRight(${rowData.id})">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                 <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
               </svg>
             </button>`;
        const deleteButton = `<button class="modern-btn modern-btn-danger modern-btn-sm modern-btn-icon" title="Supprimer" onclick="deleteClientRight(${rowData.id})">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3,6 5,6 21,6"/>
                                <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                              </svg>
                            </button>`;
        
        td.innerHTML = `<div class="flex-center" style="gap: 0.5rem;">${editButton}${deleteButton}</div>`;
        return td;
      }
    }
  ];

  // Exposer les fonctions globalement pour les boutons d'action
  useEffect(() => {
    window.editClientRight = (rightId) => {
      const right = clientRights.find(r => r.id === rightId);
      if (right) openModal(right);
    };
    window.deleteClientRight = (rightId) => {
      handleDelete(rightId);
    };
    
    return () => {
      delete window.editClientRight;
      delete window.deleteClientRight;
    };
  }, [clientRights]);

  if (loadingClientRights) {
    return (
      <div className="flex-center" style={{ minHeight: '400px' }}>
        <div className="modern-spinner"></div>
        <span style={{ marginLeft: '1rem', color: 'var(--neutral-600)' }}>Chargement...</span>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', margin: 0, padding: '2rem 0' }}>
      {/* Header Section */}
      <div className="flex-between" style={{ marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem', width: '100%', padding: '0 2rem' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--neutral-900)', margin: '0 0 0.5rem 0' }}>
            Gestion des Droits Clients
          </h1>
          <p style={{ color: 'var(--neutral-600)', fontSize: 'var(--font-size-base)' }}>
            Gérez les droits d'accès aux clients
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={openClientModal}
            className="modern-btn modern-btn-success"
          >
            <UserPlus size={16} />
            Ajouter Client
          </button>
          <button
            onClick={() => openModal()}
            className="modern-btn modern-btn-primary"
          >
            <Plus size={16} />
            Ajouter Droit Client
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

      {/* Data Grid */}
      <div className="modern-card" style={{ width: '100%', borderRadius: 0, margin: 0, padding: 0 }}>
        <div className="modern-card-body" style={{ padding: '0', width: '100%' }}>
          <HandsontableDataGrid
            data={clientRights}
            columns={columns}
            height={400}
            className="client-rights-table"
            contextMenu={['row_above', 'row_below', 'separator', 'copy', 'cut']}
            filters={true}
            dropdownMenu={true}
            multiColumnSorting={true}
            width="100%"
            style={{ width: '100%' }}
          />
          
          {clientRights.length === 0 && (
            <div className="text-center" style={{ padding: '2rem', color: 'var(--neutral-500)' }}>
              Aucun droit client trouvé.
            </div>
          )}
        </div>
      </div>

      {/* Client Creation Modal */}
      {showClientForm && (
        <div className="modern-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowClientForm(false)}>
          <div className="modern-modal modern-modal-lg">
            <div className="modern-modal-header">
              <h3 className="modern-modal-title">Créer un Nouveau Client</h3>
              <button 
                onClick={() => setShowClientForm(false)}
                className="modern-modal-close"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleClientSubmit}>
              <div className="modern-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  <div className="modern-form-group">
                    <label className="modern-form-label required">Nom du Client</label>
                    <input
                      type="text"
                      name="name"
                      value={clientFormData.name}
                      onChange={handleClientInputChange}
                      required
                      className="modern-input"
                      placeholder="Entrez le nom du client"
                    />
                  </div>

                  <div className="modern-form-group">
                    <label className="modern-form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={clientFormData.email}
                      onChange={handleClientInputChange}
                      className="modern-input"
                      placeholder="email@example.com"
                    />
                  </div>

                  <div className="modern-form-group">
                    <label className="modern-form-label">Téléphone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={clientFormData.phone}
                      onChange={handleClientInputChange}
                      className="modern-input"
                      placeholder="+33 1 23 45 67 89"
                    />
                  </div>
                </div>

                <div className="modern-form-group">
                  <label className="modern-form-label">Adresse</label>
                  <textarea
                    name="address"
                    value={clientFormData.address}
                    onChange={handleClientInputChange}
                    className="modern-input modern-textarea"
                    rows="3"
                    placeholder="Adresse complète du client"
                  />
                </div>
              </div>

              <div className="modern-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowClientForm(false)}
                  className="modern-btn modern-btn-ghost"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={clientLoading}
                  className="modern-btn modern-btn-success"
                  style={{ minWidth: '120px' }}
                >
                  {clientLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="modern-spinner" style={{ width: '16px', height: '16px' }}></div>
                      Création...
                    </div>
                  ) : (
                    'Créer Client'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rights Creation/Edit Modal */}
      {showCreateForm && (
        <div className="modern-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreateForm(false)}>
          <div className="modern-modal modern-modal-lg">
            <div className="modern-modal-header">
              <h3 className="modern-modal-title">
                {editingRight ? 'Modifier le Droit Client' : 'Créer un Nouveau Droit Client'}
              </h3>
              <button 
                onClick={() => setShowCreateForm(false)}
                className="modern-modal-close"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modern-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  <div className="modern-form-group">
                    <label className="modern-form-label required">Utilisateur</label>
                    <select
                      name="userid"
                      value={formData.userid}
                      onChange={handleInputChange}
                      required
                      disabled={editingRight}
                      className="modern-input modern-select"
                    >
                      <option value="">Sélectionner un utilisateur</option>
                      {mockUsers.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.firstname} {user.lastname}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="modern-form-group">
                    <label className="modern-form-label required">Client</label>
                    <select
                      name="clientid"
                      value={formData.clientid}
                      onChange={handleInputChange}
                      required
                      disabled={editingRight}
                      className="modern-input modern-select"
                    >
                      <option value="">Sélectionner un client</option>
                      {mockClients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="modern-form-group">
                    <label className="modern-form-label required">Date de Début</label>
                    <input
                      type="date"
                      name="DroitStartIn"
                      value={formData.DroitStartIn}
                      onChange={handleInputChange}
                      required
                      className="modern-input"
                    />
                  </div>

                  <div className="modern-form-group">
                    <label className="modern-form-label required">Date d'Expiration</label>
                    <input
                      type="date"
                      name="DroitExpiredAt"
                      value={formData.DroitExpiredAt}
                      onChange={handleInputChange}
                      required
                      className="modern-input"
                    />
                  </div>
                </div>

                <div className="modern-form-group">
                  <label className="modern-form-label">Responsable</label>
                  <input
                    type="text"
                    value={`${user?.firstname || ''} ${user?.lastname || ''} (Vous)`}
                    readOnly
                    className="modern-input"
                    style={{ backgroundColor: 'var(--neutral-100)' }}
                  />
                </div>
              </div>

              <div className="modern-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
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
                    editingRight ? 'Modifier' : 'Créer'
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

export default GestionDroitsClients;