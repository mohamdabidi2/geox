import React, { useState, useEffect } from 'react';
import { useStock } from '../../contexts/StockContext';
import { useAuth } from '../../hooks/useAuth';
import HandsontableDataGrid from '../stock/HandsontableDataGrid';

const CategoryRights = () => {
  const { user } = useAuth();
  const {
    categoryRights,
    loadingCategoryRights,
    categoryRightsError,
    fetchCategoryRights,
    createCategoryRight,
    updateCategoryRight,
    deleteCategoryRight,
  } = useStock();

  const [showPopup, setShowPopup] = useState(false);
  const [editingRight, setEditingRight] = useState(null);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    userid: '',
    categoryid: '',
    DroitStartIn: '',
    DroitExpiredAt: '',
    ResponsableId: user?.id || ''
  });

  // Fetch categories and users for dropdowns
  useEffect(() => {
    fetchCategories();
    fetchUsers();
    fetchCategoryRights();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
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
    try {
      if (editingRight) {
        await updateCategoryRight(editingRight.id, {
          DroitStartIn: formData.DroitStartIn,
          DroitExpiredAt: formData.DroitExpiredAt,
          ResponsableId: user.id // Toujours l'utilisateur courant
        });
      } else {
        await createCategoryRight({
          ...formData,
          ResponsableId: user.id // Toujours l'utilisateur courant
        });
      }
      // Reset form
      setFormData({
        userid: '',
        categoryid: '',
        DroitStartIn: '',
        DroitExpiredAt: '',
        ResponsableId: user?.id || ''
      });
      setShowPopup(false);
      setEditingRight(null);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du droit catégorie:', error);
      alert('Erreur lors de l\'enregistrement du droit catégorie: ' + error.message);
    }
  };

  const handleEdit = (right) => {
    setEditingRight(right);
    setFormData({
      userid: right.userid,
      categoryid: right.categoryid,
      DroitStartIn: right.DroitStartIn.split('T')[0],
      DroitExpiredAt: right.DroitExpiredAt.split('T')[0],
      ResponsableId: user?.id || ''
    });
    setShowPopup(true);
  };

  const handleDelete = async (rightId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce droit catégorie ?')) {
      try {
        await deleteCategoryRight(rightId);
      } catch (error) {
        console.error('Erreur lors de la suppression du droit catégorie:', error);
        alert('Erreur lors de la suppression du droit catégorie: ' + error.message);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const isRightActive = (right) => {
    const now = new Date();
    const startDate = new Date(right.DroitStartIn);
    const endDate = new Date(right.DroitExpiredAt);
    return now >= startDate && now <= endDate;
  };

  // Colonnes pour HandsontableDataGrid
  const columns = [
    {
      data: 'user_fullname',
      title: 'Utilisateur',
      readOnly: true,
      renderer: (instance, td, row, col, prop, value) => {
        td.innerText = value || '';
      }
    },
    {
      data: 'category_name',
      title: 'Catégorie',
      readOnly: true,
      renderer: (instance, td, row, col, prop, value) => {
        td.innerText = value || '';
      }
    },
    {
      data: 'DroitStartIn',
      title: 'Début',
      readOnly: true,
      renderer: (instance, td, row, col, prop, value) => {
        td.innerText = formatDate(value);
      }
    },
    {
      data: 'DroitExpiredAt',
      title: 'Expiration',
      readOnly: true,
      renderer: (instance, td, row, col, prop, value) => {
        td.innerText = formatDate(value);
      }
    },
    {
      data: 'status',
      title: 'Statut',
      readOnly: true,
      renderer: (instance, td, row, col, prop, value, cellProperties) => {
        const isActive = isRightActive(categoryRights[row]);
        td.innerHTML = `<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }">${isActive ? 'Actif' : 'Inactif'}</span>`;
      }
    },
    {
      data: 'responsable_fullname',
      title: 'Responsable',
      readOnly: true,
      renderer: (instance, td, row, col, prop, value) => {
        td.innerText = value || '';
      }
    },
    {
      data: 'actions',
      title: 'Actions',
      readOnly: true,
      renderer: (instance, td, row, col, prop, value, cellProperties) => {
        td.innerHTML = `
          <button class="text-blue-600 hover:text-blue-900 mr-2" data-action="edit">Modifier</button>
          <button class="text-red-600 hover:text-red-900" data-action="delete">Supprimer</button>
        `;
        td.onclick = (e) => {
          if (e.target.dataset.action === 'edit') {
            handleEdit(categoryRights[row]);
          } else if (e.target.dataset.action === 'delete') {
            handleDelete(categoryRights[row].id);
          }
        };
      }
    }
  ];

  // Adapter les données pour Handsontable
  const data = categoryRights.map(right => ({
    ...right,
    user_fullname: `${right.user_firstname || ''} ${right.user_lastname || ''}`,
    category_name: right.category_name || '',
    responsable_fullname: `${right.responsable_firstname || ''} ${right.responsable_lastname || ''}`,
    status: isRightActive(right) ? 'Actif' : 'Inactif'
  }));

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
        <h2 className="text-2xl font-bold text-gray-900">Gestion des droits par catégorie</h2>
        <button
          onClick={() => {
            setShowPopup(true);
            setEditingRight(null);
            setFormData({
              userid: '',
              categoryid: '',
              DroitStartIn: '',
              DroitExpiredAt: '',
              ResponsableId: user?.id || ''
            });
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Ajouter un droit
        </button>
      </div>

      {categoryRightsError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Erreur : {categoryRightsError}
        </div>
      )}

      {/* Popup de création/modification */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => {
                setShowPopup(false);
                setEditingRight(null);
                setFormData({
                  userid: '',
                  categoryid: '',
                  DroitStartIn: '',
                  DroitExpiredAt: '',
                  ResponsableId: user?.id || ''
                });
              }}
            >
              ×
            </button>
            <h3 className="text-lg font-semibold mb-4">
              {editingRight ? 'Modifier le droit' : 'Créer un nouveau droit'}
            </h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Utilisateur
                </label>
                <select
                  name="userid"
                  value={formData.userid}
                  onChange={handleInputChange}
                  required
                  disabled={!!editingRight}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Sélectionner un utilisateur</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.firstname} {u.lastname}
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
                  disabled={!!editingRight}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début
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
                  Date d'expiration
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

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Responsable
                </label>
                <input
                  type="text"
                  value={`${user.firstname || ''} ${user.lastname || ''}`}
                  disabled
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100"
                />
              </div>

              <div className="md:col-span-2 flex gap-2 mt-2">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                >
                  {editingRight ? 'Mettre à jour' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPopup(false);
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

      {/* Liste des droits avec Handsontable */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <HandsontableDataGrid
          data={data}
          columns={columns}
          stretchH="all"
          height="auto"
          licenseKey="non-commercial-and-evaluation"
          rowHeaders={true}
          colHeaders={columns.map(col => col.title)}
          manualColumnResize={true}
          manualRowResize={true}
          className="htCenter"
          language="fr-FR"
        />
        {categoryRights.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Aucun droit de catégorie trouvé.
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryRights;
