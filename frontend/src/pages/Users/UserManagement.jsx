import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Filter,
  CheckCircle,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import axiosInstance from '@/utils/axiosInstance';

const UserManagement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [users, setUsers] = useState([]);
  const [magasins, setMagasins] = useState([]);
  const [postes, setPostes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstname: '',
    lastname: '',
    poste: '',
    magasin_id: ''
  });
  const [formError, setFormError] = useState('');

  // États des filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPoste, setFilterPoste] = useState('');
  const [filterValidEmail, setFilterValidEmail] = useState('');
  const [filterRh, setFilterRh] = useState('');
  const [filterDirection, setFilterDirection] = useState('');
  const [filterMagasin, setFilterMagasin] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Affichage du modal de détail
  const [showDetailUser, setShowDetailUser] = useState(null);

  // Récupérer les utilisateurs
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/users`);
      const data = response.data;
      if (data.success) {
        setUsers(data.data);
      } else {
        console.error('Échec de la récupération des utilisateurs :', data.message);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs :', error);
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les magasins
  const fetchMagasins = async () => {
    try {
      const response = await axiosInstance.get(`/magasins`);
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setMagasins(response.data.data);
      } else if (Array.isArray(response.data)) {
        setMagasins(response.data);
      } else {
        setMagasins([]);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des magasins :', error);
    }
  };

  // Récupérer les postes
  const fetchPostes = async () => {
    try {
      const response = await axiosInstance.get(`/posts`);
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setPostes(response.data.data);
      } else if (Array.isArray(response.data)) {
        setPostes(response.data);
      } else {
        setPostes([]);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des postes :', error);
    }
  };

  // Chargement initial
  useEffect(() => {
 
    fetchUsers();
    fetchMagasins();
    fetchPostes();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setFormError('');
  };

  // Validation côté client
  const validateForm = () => {
    const { email, firstname, lastname, poste } = formData;
    if (!email.trim() || !firstname.trim() || !lastname.trim() || !poste) {
      setFormError('Email, prénom, nom et poste sont obligatoires.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validateForm()) {
      return;
    }
    try {
      setLoading(true);

      // Préparer les données
      let posteId = formData.poste;
      if (typeof posteId === 'object' && posteId !== null && posteId.id) {
        posteId = posteId.id;
      }
      if (typeof posteId === 'string' && posteId !== '' && !isNaN(Number(posteId))) {
        posteId = Number(posteId);
      }

      const submitData = {
        ...formData,
        poste: posteId,
        magasin_id: formData.magasin_id || null
      };

      let response;
      if (isEditMode && editingUserId) {
        // Modifier utilisateur
        response = await axiosInstance.put(`/users/update/${editingUserId}`, submitData, {
          headers: {
            'Content-Type': 'application/json',
          }
        });
      } else {
        // Créer utilisateur
        response = await axiosInstance.post('/auth/register', submitData, {
          headers: {
            'Content-Type': 'application/json',
          }
        });
      }

      const data = response.data;

      if (data.success) {
        setIsModalOpen(false);
        setIsEditMode(false);
        setEditingUserId(null);
        setFormData({
          email: '',
          firstname: '',
          lastname: '',
          poste: '',
          magasin_id: ''
        });
        setFormError('');
        fetchUsers();
      } else {
        setFormError(data.message || `Échec de ${isEditMode ? 'la modification' : 'la création'} de l'utilisateur.`);
      }
    } catch (error) {
      let backendMsg = `Erreur lors de ${isEditMode ? 'la modification' : 'la création'} de l'utilisateur. Veuillez réessayer.`;
      if (error.response && error.response.data && error.response.data.message) {
        backendMsg = error.response.data.message;
      }
      setFormError(backendMsg);
    } finally {
      setLoading(false);
    }
  };

  // Modifier utilisateur
  const handleEditUser = (user) => {
    let posteValue = '';
    if (user.posteData && user.posteData.id) {
      posteValue = user.posteData.id;
    } else if (user.poste) {
      posteValue = user.poste;
    }
    setFormData({
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      poste: posteValue,
      magasin_id: user.magasin && user.magasin.id ? user.magasin.id : (user.magasin_id || '')
    });
    setIsEditMode(true);
    setEditingUserId(user.id);
    setFormError('');
    setIsModalOpen(true);
  };

  // Afficher détail utilisateur
  const handleShowDetailUser = (user) => {
    setShowDetailUser(user);
  };

  // Supprimer utilisateur
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }
    try {
      setLoading(true);
      const response = await axiosInstance.delete(`/users/${userId}`);
      const data = response.data;
      if (data.success) {
        fetchUsers();
      } else {
        alert(`Erreur : ${data.message}`);
      }
    } catch (error) {
      alert('Erreur lors de la suppression de l\'utilisateur. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Validation (select)
  const handleValidationSelect = async (userId, validationType, value) => {
    try {
      setLoading(true);
      const response = await axiosInstance.put(`/users/${userId}/validate-${validationType}`, {
        isValid: value === "true" || value === true
      });
      const data = response.data;
      if (data.success) {
        fetchUsers();
      } else {
        alert(`Erreur : ${data.message}`);
      }
    } catch (error) {
      alert(`Erreur lors de la mise à jour de la validation ${validationType}. Veuillez réessayer.`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 rounded text-xs font-medium";
    if (status === true || status === 1) {
      return `${baseClasses} bg-green-100 text-green-800`;
    } else if (status === false || status === 0) {
      return `${baseClasses} bg-red-100 text-red-800`;
    }
    switch (status) {
      case 'Valid':
      case 'Valide':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'Invalid':
      case 'Invalide':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'Verified':
      case 'Vérifié':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'Pending':
      case 'En attente':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatStatusText = (status) => {
    if (status === true || status === 1) {
      return 'Valide';
    } else if (status === false || status === 0) {
      return 'Invalide';
    }
    if (status === 'Valid') return 'Valide';
    if (status === 'Invalid') return 'Invalide';
    if (status === 'Verified') return 'Vérifié';
    if (status === 'Pending') return 'En attente';
    return status || 'Inconnu';
  };

  // Réinitialiser le modal pour nouvel utilisateur
  const handleNewUser = () => {
    setFormData({
      email: '',
      firstname: '',
      lastname: '',
      poste: '',
      magasin_id: ''
    });
    setIsEditMode(false);
    setEditingUserId(null);
    setFormError('');
    setIsModalOpen(true);
  };

  // Fermer le modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingUserId(null);
    setFormData({
      email: '',
      firstname: '',
      lastname: '',
      poste: '',
      magasin_id: ''
    });
    setFormError('');
  };

  // Filtrage
  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.trim().toLowerCase();
    let matchesSearch = true;
    if (searchLower) {
      matchesSearch =
        (user.firstname && user.firstname.toLowerCase().includes(searchLower)) ||
        (user.lastname && user.lastname.toLowerCase().includes(searchLower)) ||
        (user.email && user.email.toLowerCase().includes(searchLower)) ||
        (user.posteData && user.posteData.name && user.posteData.name.toLowerCase().includes(searchLower)) ||
        (user.poste && typeof user.poste === 'string' && user.poste.toLowerCase().includes(searchLower)) ||
        (user.magasin && user.magasin.name && user.magasin.name.toLowerCase().includes(searchLower));
    }
    let matchesPoste = true;
    if (filterPoste) {
      if (user.posteData && user.posteData.id) {
        matchesPoste = user.posteData.id.toString() === filterPoste;
      } else if (user.poste) {
        matchesPoste = user.poste.toString() === filterPoste;
      } else {
        matchesPoste = false;
      }
    }
    let matchesValidEmail = true;
    if (filterValidEmail) {
      if (filterValidEmail === 'valid') matchesValidEmail = user.validEmail === true || user.validEmail === 1;
      else if (filterValidEmail === 'invalid') matchesValidEmail = user.validEmail === false || user.validEmail === 0;
    }
    let matchesRh = true;
    if (filterRh) {
      if (filterRh === 'valid') matchesRh = user.verifiedProfileRh === true || user.verifiedProfileRh === 1;
      else if (filterRh === 'invalid') matchesRh = user.verifiedProfileRh === false || user.verifiedProfileRh === 0;
    }
    let matchesDirection = true;
    if (filterDirection) {
      if (filterDirection === 'valid') matchesDirection = user.verifiedProfileDirection === true || user.verifiedProfileDirection === 1;
      else if (filterDirection === 'invalid') matchesDirection = user.verifiedProfileDirection === false || user.verifiedProfileDirection === 0;
    }
    let matchesMagasin = true;
    if (filterMagasin) {
      if (user.magasin && user.magasin.id) {
        matchesMagasin = user.magasin.id.toString() === filterMagasin;
      } else if (user.magasin_id) {
        matchesMagasin = user.magasin_id.toString() === filterMagasin;
      } else {
        matchesMagasin = false;
      }
    }
    return matchesSearch && matchesPoste && matchesValidEmail && matchesRh && matchesDirection && matchesMagasin;
  });

  return (
    <div className="flex flex-col min-h-screen" style={{ width: "83vw" }}>
      {/* En-tête */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher des utilisateurs..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-80"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Admin</span>
            <div className="w-8 h-8 bg-red-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Section utilisateurs */}
      <div className="flex-1 px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Utilisateurs</h1>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              className="flex items-center space-x-2"
              onClick={() => setShowFilters(f => !f)}
            >
              <Filter className="w-4 h-4" />
              <span>Filtres</span>
            </Button>
            <Button
              variant={filterValidEmail === 'valid' ? "default" : "outline"}
              className="flex items-center space-x-2"
              onClick={() => setFilterValidEmail(filterValidEmail === 'valid' ? '' : 'valid')}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Valide seulement</span>
            </Button>
            <Button
              onClick={handleNewUser}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2"
              disabled={loading}
            >
              <Plus className="w-4 h-4" />
              <span>Nouvel utilisateur</span>
            </Button>
          </div>
        </div>

        {/* Panneau de filtres */}
        {showFilters && (
          <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-wrap gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Poste</label>
              <select
                className="border border-gray-300 rounded px-2 py-1"
                value={filterPoste}
                onChange={e => setFilterPoste(e.target.value)}
              >
                <option value="">Tous</option>
                {postes.map(poste => (
                  <option key={poste.id} value={poste.id}>
                    {poste.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email valide</label>
              <select
                className="border border-gray-300 rounded px-2 py-1"
                value={filterValidEmail}
                onChange={e => setFilterValidEmail(e.target.value)}
              >
                <option value="">Tous</option>
                <option value="valid">Valide</option>
                <option value="invalid">Invalide</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Vérification RH</label>
              <select
                className="border border-gray-300 rounded px-2 py-1"
                value={filterRh}
                onChange={e => setFilterRh(e.target.value)}
              >
                <option value="">Tous</option>
                <option value="valid">Valide</option>
                <option value="invalid">Invalide</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Vérification Direction</label>
              <select
                className="border border-gray-300 rounded px-2 py-1"
                value={filterDirection}
                onChange={e => setFilterDirection(e.target.value)}
              >
                <option value="">Tous</option>
                <option value="valid">Valide</option>
                <option value="invalid">Invalide</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Magasin</label>
              <select
                className="border border-gray-300 rounded px-2 py-1"
                value={filterMagasin}
                onChange={e => setFilterMagasin(e.target.value)}
              >
                <option value="">Tous</option>
                {magasins.map(magasin => (
                  <option key={magasin.id} value={magasin.id}>
                    {magasin.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterPoste('');
                  setFilterValidEmail('');
                  setFilterRh('');
                  setFilterDirection('');
                  setFilterMagasin('');
                }}
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        )}

        {/* Indicateur de chargement */}
        {loading && (
          <div className="text-center py-4">
            <p className="text-gray-600">Chargement...</p>
          </div>
        )}

        {/* Tableau des utilisateurs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Poste</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chefs responsables</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email valide</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RH</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Direction</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user, index) => (
                <tr key={user.id || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {`${user.firstname} ${user.lastname}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.posteData && user.posteData.name
                      ? user.posteData.name
                      : (user.poste && typeof user.poste === 'string' ? user.poste : '-')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.responsibleChefs && user.responsibleChefs.length > 0
                      ? user.responsibleChefs.map(chef =>
                        typeof chef === 'object'
                          ? `${chef.firstname} ${chef.lastname}`
                          : chef
                      ).join(', ')
                      : '-'
                    }
                  </td>
                  {/* EMAIL VALIDE */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={getStatusBadge(user.validEmail)}>
                        {formatStatusText(user.validEmail)}
                      </span>
                      <select
                        className="border border-gray-300 rounded px-1 py-0.5 text-xs"
                        style={{ minWidth: 70 }}
                        value={
                          user.validEmail === true || user.validEmail === 1
                            ? "true"
                            : user.validEmail === false || user.validEmail === 0
                            ? "false"
                            : ""
                        }
                        onChange={e =>
                          handleValidationSelect(user.id, 'email', e.target.value)
                        }
                      >
                        <option value="true">Valide</option>
                        <option value="false">Invalide</option>
                      </select>
                    </div>
                  </td>
                  {/* RH */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={getStatusBadge(user.verifiedProfileRh)}>
                        {formatStatusText(user.verifiedProfileRh)}
                      </span>
                      <select
                        className="border border-gray-300 rounded px-1 py-0.5 text-xs"
                        style={{ minWidth: 70 }}
                        value={
                          user.verifiedProfileRh === true || user.verifiedProfileRh === 1
                            ? "true"
                            : user.verifiedProfileRh === false || user.verifiedProfileRh === 0
                            ? "false"
                            : ""
                        }
                        onChange={e =>
                          handleValidationSelect(user.id, 'rh', e.target.value)
                        }
                      >
                        <option value="true">Valide</option>
                        <option value="false">Invalide</option>
                      </select>
                    </div>
                  </td>
                  {/* DIRECTION */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={getStatusBadge(user.verifiedProfileDirection)}>
                        {formatStatusText(user.verifiedProfileDirection)}
                      </span>
                      <select
                        className="border border-gray-300 rounded px-1 py-0.5 text-xs"
                        style={{ minWidth: 70 }}
                        value={
                          user.verifiedProfileDirection === true || user.verifiedProfileDirection === 1
                            ? "true"
                            : user.verifiedProfileDirection === false || user.verifiedProfileDirection === 0
                            ? "false"
                            : ""
                        }
                        onChange={e =>
                          handleValidationSelect(user.id, 'direction', e.target.value)
                        }
                      >
                        <option value="true">Valide</option>
                        <option value="false">Invalide</option>
                      </select>
                    </div>
                  </td>
                  {/* ACTIONS */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleShowDetailUser(user)}
                        className="p-1 rounded hover:bg-gray-100"
                        title="Détail"
                        type="button"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-1 rounded hover:bg-gray-100"
                        title="Modifier"
                        type="button"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1 rounded hover:bg-gray-100 text-red-600 hover:text-red-800"
                        title="Supprimer"
                        type="button"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && !loading && (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-600">Affichage de {filteredUsers.length} utilisateur(s)</p>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="flex items-center space-x-1" disabled>
              <ChevronLeft className="w-4 h-4" />
              <span>Précédent</span>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center space-x-1" disabled>
              <span>Suivant</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modal détail */}
      {showDetailUser && (
        <div className="fixed inset-0  flex items-center justify-center z-50" style={{backgroundColor:"#0000004b"}}>
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Détails de l'utilisateur
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetailUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="space-y-2">
              <div><span className="font-semibold">Nom :</span> {showDetailUser.firstname} {showDetailUser.lastname}</div>
              <div><span className="font-semibold">Email :</span> {showDetailUser.email}</div>
              <div>
                <span className="font-semibold">Poste :</span>{" "}
                {showDetailUser.posteData && showDetailUser.posteData.name
                  ? showDetailUser.posteData.name
                  : (showDetailUser.poste && typeof showDetailUser.poste === 'string' ? showDetailUser.poste : '-')}
              </div>
              <div>
                <span className="font-semibold">Chef responsable :</span>{" "}
                {showDetailUser.responsibleChef
                  ? `Poste ID: ${showDetailUser.responsibleChef}`
                  : '-'
                }
              </div>
              <div>
                <span className="font-semibold">Email valide :</span>{" "}
                <span className={getStatusBadge(showDetailUser.validEmail)}>
                  {formatStatusText(showDetailUser.validEmail)}
                </span>
              </div>
              <div>
                <span className="font-semibold">RH :</span>{" "}
                <span className={getStatusBadge(showDetailUser.verifiedProfileRh)}>
                  {formatStatusText(showDetailUser.verifiedProfileRh)}
                </span>
              </div>
              <div>
                <span className="font-semibold">Direction :</span>{" "}
                <span className={getStatusBadge(showDetailUser.verifiedProfileDirection)}>
                  {formatStatusText(showDetailUser.verifiedProfileDirection)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal création/modification */}
      {isModalOpen && (
        <div className="fixed inset-0  flex items-center justify-center z-50" style={{backgroundColor:"#0000004b"}}>
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditMode ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Email, prénom, nom et poste sont obligatoires. Magasin est optionnel. Le chef responsable sera automatiquement déterminé à partir du poste parent.
            </p>

            {formError && (
              <div className="mb-4">
                <div className="p-3 bg-red-100 border border-red-300 rounded text-sm text-red-700">
                  {formError}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="utilisateur@entreprise.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                  <input
                    type="text"
                    name="firstname"
                    value={formData.firstname}
                    onChange={handleInputChange}
                    placeholder="Jean"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                  <input
                    type="text"
                    name="lastname"
                    value={formData.lastname}
                    onChange={handleInputChange}
                    placeholder="Dupont"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Poste <span className="text-red-500">*</span></label>
                  <select
                    name="poste"
                    value={formData.poste}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  >
                    <option value="">Sélectionner un poste</option>
                    {postes.map(poste => (
                      <option key={poste.id} value={poste.id}>
                        {poste.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Magasin (optionnel)</label>
                  <select
                    name="magasin_id"
                    value={formData.magasin_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Sélectionner un magasin</option>
                    {magasins.map(magasin => (
                      <option key={magasin.id} value={magasin.id}>
                        {magasin.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={loading}
                >
                  {loading ? 'Traitement...' : isEditMode ? 'Mettre à jour' : 'Créer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;