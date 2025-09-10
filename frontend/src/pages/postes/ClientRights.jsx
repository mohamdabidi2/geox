import React, { useState, useEffect, useRef } from 'react';
import { useStock } from '../../contexts/StockContext';
import { useAuth } from '../../hooks/useAuth';
import HandsontableDataGrid from '../stock/HandsontableDataGrid';
import Modal from '../../components/Modal';

const ClientRights = () => {
  const { user } = useAuth();
  const {
    clientRights,
    loadingClientRights,
    clientRightsError,
    fetchClientRights,
    createClientRight,
    updateClientRight,
    deleteClientRight,
  } = useStock();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRight, setEditingRight] = useState(null);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [showClientForm, setShowClientForm] = useState(false);
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

  // Pour focus sur le premier champ du formulaire modal
  const userSelectRef = useRef(null);

  useEffect(() => {
    fetchClients();
    fetchUsers();
    fetchClientRights();
  }, []);

  useEffect(() => {
    // Toujours mettre à jour le ResponsableId avec l'utilisateur courant
    setFormData((prev) => ({
      ...prev,
      ResponsableId: user?.id || ''
    }));
  }, [user]);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/clients', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
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

  const handleClientInputChange = (e) => {
    const { name, value } = e.target;
    setClientFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRight) {
        await updateClientRight(editingRight.id, {
          DroitStartIn: formData.DroitStartIn,
          DroitExpiredAt: formData.DroitExpiredAt,
          ResponsableId: user?.id || ''
        });
      } else {
        await createClientRight({
          ...formData,
          ResponsableId: user?.id || ''
        });
      }
      setFormData({
        userid: '',
        clientid: '',
        DroitStartIn: '',
        DroitExpiredAt: '',
        ResponsableId: user?.id || ''
      });
      setShowCreateForm(false);
      setEditingRight(null);
      fetchClientRights();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du droit client:', error);
      alert('Erreur lors de l\'enregistrement du droit client: ' + error.message);
    }
  };

  const handleClientSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(clientFormData)
      });

      if (response.ok) {
        setClientFormData({
          name: '',
          email: '',
          phone: '',
          address: ''
        });
        setShowClientForm(false);
        await fetchClients();
      } else {
        throw new Error('Échec de la création du client');
      }
    } catch (error) {
      console.error('Erreur lors de la création du client:', error);
      alert('Erreur lors de la création du client: ' + error.message);
    }
  };

  const handleEdit = (right) => {
    setEditingRight(right);
    setFormData({
      userid: right.userid,
      clientid: right.clientid,
      DroitStartIn: right.DroitStartIn.split('T')[0],
      DroitExpiredAt: right.DroitExpiredAt.split('T')[0],
      ResponsableId: user?.id || ''
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (rightId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce droit client ?')) {
      try {
        await deleteClientRight(rightId);
        fetchClientRights();
      } catch (error) {
        console.error('Erreur lors de la suppression du droit client:', error);
        alert('Erreur lors de la suppression du droit client: ' + error.message);
      }
    }
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
      data: 'client_name',
      title: 'Client',
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
        td.innerText = value ? formatDate(value) : '';
      }
    },
    {
      data: 'DroitExpiredAt',
      title: 'Expiration',
      readOnly: true,
      renderer: (instance, td, row, col, prop, value) => {
        td.innerText = value ? formatDate(value) : '';
      }
    },
    {
      data: 'status',
      title: 'Statut',
      readOnly: true,
      renderer: (instance, td, row, col, prop, value, cellProperties) => {
        const isActive = isRightActive(clientRights[row]);
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
          <button class="text-blue-600 hover:text-blue-900 mr-3 btn-edit">Modifier</button>
          <button class="text-red-600 hover:text-red-900 btn-delete">Supprimer</button>
        `;
        td.querySelector('.btn-edit').onclick = (e) => {
          e.stopPropagation();
          handleEdit(clientRights[row]);
        };
        td.querySelector('.btn-delete').onclick = (e) => {
          e.stopPropagation();
          handleDelete(clientRights[row].id);
        };
      }
    }
  ];

  // Préparer les données pour Handsontable
  const data = clientRights.map((right) => ({
    ...right,
    user_fullname: `${right.user_firstname || ''} ${right.user_lastname || ''}`,
    responsable_fullname: `${right.responsable_firstname || ''} ${right.responsable_lastname || ''}`,
    status: isRightActive(right) ? 'Actif' : 'Inactif'
  }));

  if (loadingClientRights) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestion des droits clients</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowClientForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
          >
            Ajouter un client
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Ajouter un droit client
          </button>
        </div>
      </div>

      {clientRightsError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Erreur : {clientRightsError}
        </div>
      )}

      {/* Modal création client */}
      <Modal open={showClientForm} onClose={() => setShowClientForm(false)} title="Créer un nouveau client">
        <form onSubmit={handleClientSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du client
            </label>
            <input
              type="text"
              name="name"
              value={clientFormData.name}
              onChange={handleClientInputChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={clientFormData.email}
              onChange={handleClientInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone
            </label>
            <input
              type="tel"
              name="phone"
              value={clientFormData.phone}
              onChange={handleClientInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse
            </label>
            <textarea
              name="address"
              value={clientFormData.address}
              onChange={handleClientInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              rows="2"
            />
          </div>
          <div className="md:col-span-2 flex gap-2">
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
            >
              Créer le client
            </button>
            <button
              type="button"
              onClick={() => {
                setShowClientForm(false);
                setClientFormData({
                  name: '',
                  email: '',
                  phone: '',
                  address: ''
                });
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
            >
              Annuler
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal création/édition droit client */}
      <Modal open={showCreateForm} onClose={() => { setShowCreateForm(false); setEditingRight(null); }} title={editingRight ? "Modifier le droit client" : "Créer un nouveau droit client"}>
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
              ref={userSelectRef}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Sélectionner un utilisateur</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.firstname} {user.lastname}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client
            </label>
            <select
              name="clientid"
              value={formData.clientid}
              onChange={handleInputChange}
              required
              disabled={!!editingRight}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Sélectionner un client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Responsable
            </label>
            <input
              type="text"
              value={users.find(u => u.id === (user?.id || '')) ? `${users.find(u => u.id === (user?.id || '')).firstname} ${users.find(u => u.id === (user?.id || '')).lastname}` : ''}
              disabled
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100"
            />
          </div>
          <div className="md:col-span-2 flex gap-2">
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
                  clientid: '',
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
      </Modal>

      {/* Tableau des droits clients */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <HandsontableDataGrid
          data={data}
          columns={columns}
          licenseKey="non-commercial-and-evaluation"
          stretchH="all"
          colHeaders
          rowHeaders
          height="auto"
          language="fr-FR"
        />
        {clientRights.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Aucun droit client trouvé.
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientRights;
