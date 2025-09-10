import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Users, Settings, Eye, Edit2, Trash2, Move, Filter, X, Search } from 'lucide-react';
import HierarchicalPostView from './HierarchicalPostView';
import PostPermissionModal from './PostPermissionModal';
import modulesConfig from './modules-config.json';

// Fallback user if not in AuthProvider context
const fallbackUser = { username: 'Inconnu' };

const PostManagement = () => {
  // Try to get user from useAuth, fallback if error
  let user = fallbackUser;
  try {
    // Dynamically import useAuth to avoid error if not in provider
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { useAuth } = require('../../hooks/useAuth');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    user = useAuth()?.user || fallbackUser;
  } catch (e) {
    // Not in AuthProvider, fallback to default user
    user = fallbackUser;
  }

  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showHierarchicalView, setShowHierarchicalView] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    actions: [],
    parent_id: null,
    position_top: 100,
    position_left: 100,
    position_right: 0,
    position_bottom: 0
  });

  // États de filtre
  const [filters, setFilters] = useState({
    name: '',
    hasActions: '',
    parentPost: '',
    searchTerm: ''
  });
  const [activeFilters, setActiveFilters] = useState([]);

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line
  }, [posts, filters]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/posts');
      setPosts(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des postes :', error);
      setError('Échec de la récupération des postes');
    } finally {
      setLoading(false);
    }
  };

  // Fonctionnalité de filtrage
  const applyFilters = () => {
    let filtered = [...posts];

    if (filters.name) {
      filtered = filtered.filter(post =>
        post.name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    if (filters.hasActions) {
      if (filters.hasActions === 'yes') {
        filtered = filtered.filter(post => post.actions && post.actions.length > 0);
      } else if (filters.hasActions === 'no') {
        filtered = filtered.filter(post => !post.actions || post.actions.length === 0);
      }
    }

    if (filters.parentPost) {
      filtered = filtered.filter(post => {
        const parentPost = posts.find(p => p.id === post.parent_id);
        return parentPost && parentPost.name.toLowerCase().includes(filters.parentPost.toLowerCase());
      });
    }

    if (filters.searchTerm) {
      filtered = filtered.filter(post => {
        const searchLower = filters.searchTerm.toLowerCase();
        return post.name.toLowerCase().includes(searchLower) ||
               post.description?.toLowerCase().includes(searchLower);
      });
    }

    setFilteredPosts(filtered);
    updateActiveFilters();
  };

  const updateActiveFilters = () => {
    const active = [];
    if (filters.name) active.push({ key: 'name', label: `Nom : ${filters.name}`, value: filters.name });
    if (filters.hasActions) active.push({ key: 'hasActions', label: `Avec actions : ${filters.hasActions === 'yes' ? 'Oui' : 'Non'}`, value: filters.hasActions });
    if (filters.parentPost) active.push({ key: 'parentPost', label: `Parent : ${filters.parentPost}`, value: filters.parentPost });
    if (filters.searchTerm) active.push({ key: 'searchTerm', label: `Recherche : ${filters.searchTerm}`, value: filters.searchTerm });
    setActiveFilters(active);
  };

  const removeFilter = (filterKey) => {
    setFilters(prev => ({ ...prev, [filterKey]: '' }));
  };

  const clearAllFilters = () => {
    setFilters({
      name: '',
      hasActions: '',
      parentPost: '',
      searchTerm: ''
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        created_by: user?.username || user?.email || 'Inconnu'
      };

      if (editingPost) {
        await axios.put(`http://localhost:5000/api/posts/${editingPost.id}`, payload);
      } else {
        await axios.post('http://localhost:5000/api/posts', payload);
      }

      await fetchPosts();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du poste :', error);
      setError(error?.response?.data?.error || 'Échec de l\'enregistrement du poste');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce poste ?')) return;

    try {
      setActionLoading(true);
      await axios.delete(`http://localhost:5000/api/posts/${postId}`);
      await fetchPosts();
    } catch (error) {
      console.error('Erreur lors de la suppression du poste :', error);
      setError('Échec de la suppression du poste');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePositionUpdate = async (postId, position) => {
    try {
      await axios.patch(`http://localhost:5000/api/posts/${postId}/position`, position);
      await fetchPosts();
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la position :', error);
      setError('Échec de la mise à jour de la position');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      actions: [],
      parent_id: null,
      position_top: 100,
      position_left: 100,
      position_right: 0,
      position_bottom: 0
    });
    setEditingPost(null);
  };

  const openModal = (post = null) => {
    if (post) {
      setEditingPost(post);
      setFormData({
        name: post.name,
        description: post.description || '',
        actions: post.actions || [],
        parent_id: post.parent_id,
        position_top: post.position_top || 100,
        position_left: post.position_left || 100,
        position_right: post.position_right || 0,
        position_bottom: post.position_bottom || 0
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const openPermissionModal = (post) => {
    setSelectedPost(post);
    setShowPermissionModal(true);
  };

  const getParentPostName = (parentId) => {
    const parent = posts.find(p => p.id === parentId);
    return parent ? parent.name : 'Aucun';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full py-6 px-2 sm:px-4 lg:px-8">
      <div className="px-0 py-6">
        {error && (
          <div className="mb-4 p-3 rounded bg-red-100 text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Postes</h1>
            <p className="mt-2 text-sm text-gray-700">
              Gérez les postes organisationnels avec structure hiérarchique et permissions
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-2">
            <button
              onClick={() => setShowHierarchicalView(!showHierarchicalView)}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Move className="h-4 w-4 mr-2" />
              {showHierarchicalView ? 'Vue Tableau' : 'Vue Hiérarchique'}
            </button>
            <button
              onClick={() => setShowFilterModal(true)}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtres
              {activeFilters.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                  {activeFilters.length}
                </span>
              )}
            </button>
            <button
              onClick={() => openModal()}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Poste
            </button>
          </div>
        </div>

        {/* Affichage des filtres actifs */}
        {activeFilters.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-gray-700">Filtres actifs :</span>
            {activeFilters.map((filter) => (
              <span
                key={filter.key}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {filter.label}
                <button
                  onClick={() => removeFilter(filter.key)}
                  className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Tout effacer
            </button>
          </div>
        )}

        {/* Barre de recherche */}
        <div className="mt-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher par nom ou description du poste..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            />
          </div>
        </div>

        {/* Vue hiérarchique */}
        {showHierarchicalView ? (
          <HierarchicalPostView
            posts={filteredPosts}
            onPositionUpdate={handlePositionUpdate}
            onEdit={openModal}
            onDelete={handleDelete}
            onManagePermissions={openPermissionModal}
          />
        ) : (
          /* Vue Tableau */
          <div className="mt-8 w-full">
            <div className="flex flex-col">
              <div className="-my-2 -mx-2 overflow-x-auto">
                <div className="inline-block min-w-full py-2 align-middle px-2">
                  <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nom du Poste
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions Assignées
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Responsable
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Position
                          </th>
                          <th className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredPosts.map((post) => (
                          <tr key={post.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Users className="h-5 w-5 text-gray-400 mr-3" />
                                <div className="text-sm font-medium text-gray-900">
                                  {post.name}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 max-w-xs truncate">
                                {post.description || 'Aucune description'}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {post.actions ? post.actions.length : 0} action{post.actions && post.actions.length > 1 ? 's' : ''}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {getParentPostName(post.parent_id)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="text-xs">
                                Haut : {post.position_top}, Gauche : {post.position_left}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => openPermissionModal(post)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Gérer les permissions"
                                >
                                  <Settings className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => openModal(post)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                  title="Modifier le poste"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(post.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Supprimer le poste"
                                  disabled={actionLoading}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredPosts.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        Aucun poste trouvé correspondant à vos filtres.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Création/Édition Poste */}
        {showModal && (
          <div style={{background:"#8080805e"}} className="fixed inset-0 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingPost ? 'Modifier le Poste' : 'Nouveau Poste'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nom du Poste
                    </label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={actionLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      disabled={actionLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Responsable
                    </label>
                    <select
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={formData.parent_id || ''}
                      onChange={(e) => setFormData({ ...formData, parent_id: e.target.value || null })}
                      disabled={actionLoading}
                    >
                      <option value="">Aucun parent</option>
                      {posts.filter(p => p.id !== editingPost?.id).map((post) => (
                        <option key={post.id} value={post.id}>
                          {post.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      disabled={actionLoading}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 ${actionLoading ? 'opacity-50 pointer-events-none' : ''}`}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal Gestion des Permissions */}
        {showPermissionModal && selectedPost && (
          <PostPermissionModal
            post={selectedPost}
            modulesConfig={modulesConfig}
            onClose={() => {
              setShowPermissionModal(false);
              setSelectedPost(null);
            }}
            onSave={async (actions) => {
              try {
                await axios.patch(`http://localhost:5000/api/posts/${selectedPost.id}/actions`, { actions });
                await fetchPosts();
                setShowPermissionModal(false);
                setSelectedPost(null);
              } catch (error) {
                console.error('Erreur lors de la mise à jour des actions :', error);
                setError('Échec de la mise à jour des actions');
              }
            }}
          />
        )}

        {/* Modal Filtres */}
        {showFilterModal && (
          <div style={{background:"#8080805e"}} className="fixed inset-0 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Filtrer les Postes</h3>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom du Poste</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="Entrer le nom du poste"
                    value={filters.name}
                    onChange={(e) => handleFilterChange('name', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Avec Actions</label>
                    <select
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={filters.hasActions}
                      onChange={(e) => handleFilterChange('hasActions', e.target.value)}
                    >
                      <option value="">Tous les postes</option>
                      <option value="yes">Avec actions</option>
                      <option value="no">Sans actions</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Responsable</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      placeholder="Entrer le nom du Responsable"
                      value={filters.parentPost}
                      onChange={(e) => handleFilterChange('parentPost', e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={clearAllFilters}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Tout effacer
                  </button>
                  <button
                    onClick={() => setShowFilterModal(false)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    Appliquer les filtres
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostManagement;