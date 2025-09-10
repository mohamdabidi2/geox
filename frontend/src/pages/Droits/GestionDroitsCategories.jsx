import React, { useState, useEffect } from 'react';
import { useStock } from '../../contexts/StockContext';
import { useAuth } from '../../contexts/AuthContext';
import HandsontableDataGrid from '../stock/HandsontableDataGrid';

const GestionDroitsCategories = () => {
  const { user } = useAuth();
  const {
    categoryRights,
    loadingCategoryRights,
    categoryRightsError,
    createCategoryRight,
    updateCategoryRight,
    deleteCategoryRight,
    getActiveCategoryRights,
    mockUsers,
    mockCategories
  } = useStock();

  // Ensure mockUsers and mockCategories are always arrays to prevent .map errors
  const safeMockUsers = Array.isArray(mockUsers) ? mockUsers : [];
  const safeMockCategories = Array.isArray(mockCategories) ? mockCategories : [];
  const safeCategoryRights = Array.isArray(categoryRights) ? categoryRights : [];

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRight, setEditingRight] = useState(null);
  const [formData, setFormData] = useState({
    userid: '',
    categoryid: '',
    DroitStartIn: '',
    DroitExpiredAt: '',
    ResponsableId: user?.id || ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSubmit = {
        ...formData,
        ResponsableId: user?.id || formData.ResponsableId // Utilise l'ID de l'utilisateur connecté
      };

      if (editingRight) {
        await updateCategoryRight(editingRight.id, {
          DroitStartIn: dataToSubmit.DroitStartIn,
          DroitExpiredAt: dataToSubmit.DroitExpiredAt,
          ResponsableId: dataToSubmit.ResponsableId
        });
      } else {
        await createCategoryRight(dataToSubmit);
      }
      
      // Reset form
      setFormData({
        userid: '',
        categoryid: '',
        DroitStartIn: '',
        DroitExpiredAt: '',
        ResponsableId: user?.id || ''
      });
      setShowCreateForm(false);
      setEditingRight(null);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du droit de catégorie:', error);
      alert('Erreur lors de la sauvegarde du droit de catégorie: ' + error.message);
    }
  };

  const handleEdit = (right) => {
    setEditingRight(right);
    setFormData({
      userid: right.userid,
      categoryid: right.categoryid,
      DroitStartIn: right.DroitStartIn?.split('T')[0] || '',
      DroitExpiredAt: right.DroitExpiredAt?.split('T')[0] || '',
      ResponsableId: right.ResponsableId
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (rightId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce droit de catégorie ?')) {
      try {
        await deleteCategoryRight(rightId);
      } catch (error) {
        console.error('Erreur lors de la suppression du droit de catégorie:', error);
        alert('Erreur lors de la suppression du droit de catégorie: ' + error.message);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('fr-FR');
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
    { data: 'category_name', title: 'Catégorie', type: 'text', readOnly: true, width: 120 },
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
        td.innerHTML = `<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
        td.innerHTML = `
          <button onclick="window.editCategoryRight(${rowData.id})" class="text-blue-600 hover:text-blue-900 mr-2 text-sm">Modifier</button>
          <button onclick="window.deleteCategoryRight(${rowData.id})" class="text-red-600 hover:text-red-900 text-sm">Supprimer</button>
        `;
        return td;
      }
    }
  ];

  // Exposer les fonctions globalement pour les boutons d'action
  useEffect(() => {
    window.editCategoryRight = handleEdit;
    window.deleteCategoryRight = handleDelete;
    
    return () => {
      delete window.editCategoryRight;
      delete window.deleteCategoryRight;
    };
    // eslint-disable-next-line
  }, []);

  if (loadingCategoryRights) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestion des Droits de Catégories</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Ajouter un Droit de Catégorie
        </button>
      </div>

      {categoryRightsError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Erreur: {categoryRightsError}
        </div>
      )}

      {/* Formulaire de création/édition en popup */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-semibold mb-4">
              {editingRight ? 'Modifier le Droit de Catégorie' : 'Créer un Nouveau Droit de Catégorie'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Utilisateur
                </label>
                <select
                  name="userid"
                  value={formData.userid}
                  onChange={handleInputChange}
                  required
                  disabled={editingRight}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Sélectionner un utilisateur</option>
                  {safeMockUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.firstname} {user.lastname}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie
                </label>
                <select
                  name="categoryid"
                  value={formData.categoryid}
                  onChange={handleInputChange}
                  required
                  disabled={editingRight}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {safeMockCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de Début
                </label>
                <input
                  type="date"
                  name="DroitStartIn"
                  value={formData.DroitStartIn}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date d'Expiration
                </label>
                <input
                  type="date"
                  name="DroitExpiredAt"
                  value={formData.DroitExpiredAt}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Responsable
                </label>
                <input
                  type="text"
                  value={`${user?.firstname || ''} ${user?.lastname || ''} (Vous)`}
                  readOnly
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                >
                  {editingRight ? 'Mettre à jour' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingRight(null);
                    setFormData({
                      userid: '',
                      categoryid: '',
                      DroitStartIn: '',
                      DroitExpiredAt: '',
                      ResponsableId: user?.id || ''
                    });
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tableau Handsontable */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <HandsontableDataGrid
          data={safeCategoryRights}
          columns={columns}
          height={400}
          className="category-rights-table"
        />
        
        {safeCategoryRights.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Aucun droit de catégorie trouvé.
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionDroitsCategories;