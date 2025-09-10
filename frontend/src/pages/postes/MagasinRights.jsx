import React, { useState, useEffect, useRef } from 'react';
import { useStock } from '../../contexts/StockContext';
import { useAuth } from '../../hooks/useAuth';
import HandsontableDataGrid from '../stock/HandsontableDataGrid';
import Modal from '../../components/Modal';

// Import Handsontable and register French language
import Handsontable from 'handsontable/base';
import frFR from 'handsontable/i18n/languages/fr-FR';

// Register the French language for Handsontable
Handsontable.languages.registerLanguageDictionary(frFR);

const MagasinRights = () => {
  const { user } = useAuth();
  const {
    magasinRights,
    loadingMagasinRights,
    magasinRightsError,
    fetchMagasinRights,
    createMagasinRight,
    updateMagasinRight,
    deleteMagasinRight,
  } = useStock();

  const [showModal, setShowModal] = useState(false);
  const [editingRight, setEditingRight] = useState(null);
  const [magasins, setMagasins] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    userid: '',
    magasinid: '',
    DroitStartIn: '',
    DroitExpiredAt: '',
    ResponsableId: user?.id || ''
  });

  // For focusing the first input in the modal
  const firstInputRef = useRef(null);

  // Fetch magasins and users for dropdowns
  useEffect(() => {
    fetchMagasins();
    fetchUsers();
    fetchMagasinRights();
  }, []);

  // Focus the first input when modal opens
  useEffect(() => {
    if (showModal && firstInputRef.current) {
      setTimeout(() => {
        firstInputRef.current.focus();
      }, 100);
    }
  }, [showModal]);

  const fetchMagasins = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/magasins', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMagasins(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des magasins:', error);
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
        await updateMagasinRight(editingRight.id, {
          DroitStartIn: formData.DroitStartIn,
          DroitExpiredAt: formData.DroitExpiredAt,
          ResponsableId: user?.id
        });
      } else {
        await createMagasinRight({
          ...formData,
          ResponsableId: user?.id
        });
      }
      setFormData({
        userid: '',
        magasinid: '',
        DroitStartIn: '',
        DroitExpiredAt: '',
        ResponsableId: user?.id || ''
      });
      setShowModal(false);
      setEditingRight(null);
      fetchMagasinRights();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du droit magasin:', error);
      alert('Erreur lors de l\'enregistrement du droit magasin: ' + error.message);
    }
  };

  const handleEdit = (right) => {
    setEditingRight(right);
    setFormData({
      userid: right.userid,
      magasinid: right.magasinid,
      DroitStartIn: right.DroitStartIn.split('T')[0],
      DroitExpiredAt: right.DroitExpiredAt.split('T')[0],
      ResponsableId: user?.id || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (rightId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce droit magasin ?')) {
      try {
        await deleteMagasinRight(rightId);
        fetchMagasinRights();
      } catch (error) {
        console.error('Erreur lors de la suppression du droit magasin:', error);
        alert('Erreur lors de la suppression du droit magasin: ' + error.message);
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
      data: 'magasin_name',
      title: 'Magasin',
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
        const right = magasinRights[row];
        const actif = isRightActive(right);
        td.innerHTML = `<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${actif ? 'Actif' : 'Inactif'}</span>`;
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
      data: null,
      title: 'Actions',
      readOnly: true,
      renderer: (instance, td, row) => {
        td.innerHTML = `
          <button class="text-blue-600 hover:text-blue-900 mr-2 btn-edit">Modifier</button>
          <button class="text-red-600 hover:text-red-900 btn-delete">Supprimer</button>
        `;
        // Use setTimeout to ensure DOM is ready for event assignment
        setTimeout(() => {
          const editBtn = td.querySelector('.btn-edit');
          const deleteBtn = td.querySelector('.btn-delete');
          if (editBtn) {
            editBtn.onclick = (e) => {
              e.stopPropagation();
              handleEdit(magasinRights[row]);
            };
          }
          if (deleteBtn) {
            deleteBtn.onclick = (e) => {
              e.stopPropagation();
              handleDelete(magasinRights[row].id);
            };
          }
        }, 0);
      }
    }
  ];

  // Préparer les données pour Handsontable
  const data = magasinRights.map(right => ({
    ...right,
    user_fullname: `${right.user_firstname || ''} ${right.user_lastname || ''}`.trim(),
    magasin_name: right.magasin_name,
    DroitStartIn: right.DroitStartIn,
    DroitExpiredAt: right.DroitExpiredAt,
    status: isRightActive(right) ? 'Actif' : 'Inactif',
    responsable_fullname: `${right.responsable_firstname || ''} ${right.responsable_lastname || ''}`.trim(),
  }));

  if (loadingMagasinRights) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestion des droits Magasin</h2>
        <button
          onClick={() => {
            setShowModal(true);
            setEditingRight(null);
            setFormData({
              userid: '',
              magasinid: '',
              DroitStartIn: '',
              DroitExpiredAt: '',
              ResponsableId: user?.id || ''
            });
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Ajouter un droit magasin
        </button>
      </div>

      {magasinRightsError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Erreur : {magasinRightsError}
        </div>
      )}

      {/* Modal de création/édition */}
      <Modal show={showModal} onClose={() => { setShowModal(false); setEditingRight(null); }}>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">
            {editingRight ? 'Modifier le droit magasin' : 'Créer un nouveau droit magasin'}
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
                ref={firstInputRef}
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
                Magasin
              </label>
              <select
                name="magasinid"
                value={formData.magasinid}
                onChange={handleInputChange}
                required
                disabled={!!editingRight}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Sélectionner un magasin</option>
                {magasins.map(magasin => (
                  <option key={magasin.id} value={magasin.id}>
                    {magasin.name}
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

            {/* Responsable: caché, toujours l'utilisateur courant */}
            <input type="hidden" name="ResponsableId" value={user?.id || ''} />

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
                  setShowModal(false);
                  setEditingRight(null);
                  setFormData({
                    userid: '',
                    magasinid: '',
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
      </Modal>

      {/* Liste des droits avec Handsontable */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <HandsontableDataGrid
          data={data}
          columns={columns}
          stretchH="all"
          licenseKey="non-commercial-and-evaluation"
          height="auto"
          rowHeaders={true}
          colHeaders={columns.map(col => col.title)}
          manualColumnResize={true}
          manualRowResize={true}
          className="ht-theme-material"
          language="fr-FR"
        />
        {magasinRights.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Aucun droit magasin trouvé.
          </div>
        )}
      </div>
    </div>
  );
};

export default MagasinRights;