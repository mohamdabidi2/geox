import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import HandsontableDataGrid from './HandsontableDataGrid';
import { Plus, X, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import '../stock/modern-styles.css';


const GestionDroitsMagasins = () => {
  const { user } = useAuth();

  // State for data
  const [magasinRights, setMagasinRights] = useState([]);
  const [users, setUsers] = useState([]);
  const [magasins, setMagasins] = useState([]);
  
  // State for UI
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRight, setEditingRight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    userid: '',
    magasinid: '',
    DroitStartIn: '',
    DroitExpiredAt: '',
    ResponsableId: user?.id || ''
  });

  // Fetch all required data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

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

  const fetchAllData = async () => {
    try {
      setDataLoading(true);
      setError('');

      // Fetch all data in parallel
      const [rightsResponse, usersResponse, magasinsResponse] = await Promise.all([
        axios.get('http://localhost:5000/api/droits/magasin'),
        axios.get('http://localhost:5000/api/magasins/users'),
        axios.get('http://localhost:5000/api/magasins')
      ]);

      // Set magasin rights data
      if (rightsResponse.data.success) {
        setMagasinRights(rightsResponse.data.data || []);
      } else {
        throw new Error('Failed to fetch magasin rights');
      }

      // Set users data
      setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : []);

      // Set magasins data
      setMagasins(Array.isArray(magasinsResponse.data) ? magasinsResponse.data : []);

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Erreur lors du chargement des données: ' + (error.response?.data?.error || error.message));
    } finally {
      setDataLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
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
        // Update existing right
        const response = await axios.put(`http://localhost:5000/api/droits/magasin/${editingRight.id}`, {
          DroitStartIn: dataToSubmit.DroitStartIn,
          DroitExpiredAt: dataToSubmit.DroitExpiredAt,
          ResponsableId: dataToSubmit.ResponsableId
        });
        
        if (response.data.success) {
          setSuccess('Droit de magasin modifié avec succès');
        } else {
          throw new Error(response.data.error || 'Erreur lors de la modification');
        }
      } else {
        // Create new right
        const response = await axios.post('http://localhost:5000/api/droits/magasin', dataToSubmit);
        
        if (response.data.success) {
          setSuccess('Droit de magasin créé avec succès');
        } else {
          throw new Error(response.data.error || 'Erreur lors de la création');
        }
      }
      
      // Reset form and refresh data
      setFormData({
        userid: '',
        magasinid: '',
        DroitStartIn: '',
        DroitExpiredAt: '',
        ResponsableId: user?.id || ''
      });
      setShowCreateForm(false);
      setEditingRight(null);
      
      // Refresh the rights data
      await fetchAllData();
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du droit magasin:', error);
      setError(error.response?.data?.error || error.message || 'Erreur lors de la sauvegarde du droit magasin');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (right) => {
    setEditingRight(right);
    setFormData({
      userid: right.userid,
      magasinid: right.magasinid,
      DroitStartIn: right.DroitStartIn.split('T')[0],
      DroitExpiredAt: right.DroitExpiredAt.split('T')[0],
      ResponsableId: right.ResponsableId
    });
    setShowCreateForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (rightId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce droit magasin ?')) {
      try {
        const response = await axios.delete(`http://localhost:5000/api/droits/magasin/${rightId}`);
        
        if (response.data.success) {
          setSuccess('Droit de magasin supprimé avec succès');
          await fetchAllData(); // Refresh data
        } else {
          throw new Error(response.data.error || 'Erreur lors de la suppression');
        }
      } catch (error) {
        console.error('Erreur lors de la suppression du droit magasin:', error);
        setError(error.response?.data?.error || error.message || 'Erreur lors de la suppression du droit magasin');
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
        magasinid: '',
        DroitStartIn: '',
        DroitExpiredAt: '',
        ResponsableId: user?.id || ''
      });
      setShowCreateForm(true);
      setError('');
      setSuccess('');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const isRightActive = (right) => {
    if (!right || !right.DroitStartIn || !right.DroitExpiredAt) return false;
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
    { data: 'magasin_name', title: 'Magasin', type: 'text', readOnly: true, width: 120 },
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
        const editButton = `<button class="modern-btn modern-btn-primary modern-btn-sm modern-btn-icon mr-1" title="Modifier" onclick="editMagasinRight(${rowData.id})">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                 <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
               </svg>
             </button>`;
        const deleteButton = `<button class="modern-btn modern-btn-danger modern-btn-sm modern-btn-icon" title="Supprimer" onclick="deleteMagasinRight(${rowData.id})">
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
    window.editMagasinRight = (rightId) => {
      const right = magasinRights.find(r => r.id === rightId);
      if (right) openModal(right);
    };
    window.deleteMagasinRight = (rightId) => {
      handleDelete(rightId);
    };
    
    return () => {
      delete window.editMagasinRight;
      delete window.deleteMagasinRight;
    };
  }, [magasinRights]);

  if (dataLoading) {
    return (
      <div className="flex-center" style={{ minHeight: '400px' }}>
        <div className="modern-spinner"></div>
        <span style={{ marginLeft: '1rem', color: 'var(--neutral-600)' }}>Chargement des données...</span>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', margin: 0, padding: '2rem 0' }}>
      {/* Header Section */}
      <div className="flex-between" style={{ marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem', width: '100%', padding: '0 2rem' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--neutral-900)', margin: '0 0 0.5rem 0' }}>
            Gestion des Droits de Magasins
          </h1>
          <p style={{ color: 'var(--neutral-600)', fontSize: 'var(--font-size-base)' }}>
            Gérez les droits d'accès aux magasins pour les utilisateurs
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={fetchAllData}
            className="modern-btn modern-btn-outline"
            disabled={dataLoading}
          >
            <RefreshCw size={16} />
            Actualiser
          </button>
          <button
            onClick={() => openModal()}
            className="modern-btn modern-btn-primary"
          >
            <Plus size={16} />
            Ajouter un Droit de Magasin
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
            data={magasinRights}
            columns={columns}
            height={400}
            className="magasin-rights-table"
            contextMenu={['row_above', 'row_below', 'separator', 'copy', 'cut']}
            filters={true}
            dropdownMenu={true}
            multiColumnSorting={true}
            width="100%"
            style={{ width: '100%' }}
          />
          
          {magasinRights.length === 0 && (
            <div className="text-center" style={{ padding: '2rem', color: 'var(--neutral-500)' }}>
              Aucun droit de magasin trouvé.
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateForm && (
        <div className="modern-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreateForm(false)}>
          <div className="modern-modal modern-modal-lg">
            <div className="modern-modal-header">
              <h3 className="modern-modal-title">
                {editingRight ? 'Modifier le Droit de Magasin' : 'Créer un Nouveau Droit de Magasin'}
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
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="modern-form-group">
                    <label className="modern-form-label required">Magasin</label>
                    <select
                      name="magasinid"
                      value={formData.magasinid}
                      onChange={handleInputChange}
                      required
                      disabled={editingRight}
                      className="modern-input modern-select"
                    >
                      <option value="">Sélectionner un magasin</option>
                      {magasins.map(magasin => (
                        <option key={magasin.id} value={magasin.id}>
                          {magasin.name}
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

export default GestionDroitsMagasins;