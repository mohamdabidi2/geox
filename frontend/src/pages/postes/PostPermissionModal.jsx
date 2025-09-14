import { useState, useEffect } from 'react';
import { X, Check, Package, Users, DollarSign } from 'lucide-react';

const PostPermissionModal = ({ post, modulesConfig, onClose, onSave }) => {
  const [selectedActions, setSelectedActions] = useState([]);
  const [expandedModules, setExpandedModules] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Extract permissions from the actions object
    if (post && post.actions && post.actions.permissions) {
      setSelectedActions(post.actions.permissions);
    } else if (post && post.actions) {
      // Handle case where actions might be an array directly
      setSelectedActions(Array.isArray(post.actions) ? post.actions : []);
    }
    
    // Déplier tous les modules par défaut
    const modules = Object.keys(modulesConfig.erp_modules);
    const expanded = {};
    modules.forEach(module => {
      expanded[module] = true;
    });
    setExpandedModules(expanded);
  }, [post, modulesConfig]);

  const handleActionToggle = (actionId) => {
    setSelectedActions(prev => {
      if (prev.includes(actionId)) {
        return prev.filter(id => id !== actionId);
      } else {
        return [...prev, actionId];
      }
    });
  };

  const handleModuleToggle = (moduleKey) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleKey]: !prev[moduleKey]
    }));
  };

  const handleSelectAllModule = (moduleKey) => {
    const moduleActions = modulesConfig.erp_modules[moduleKey].actions.map(action => action.id);
    const allSelected = moduleActions.every(actionId => selectedActions.includes(actionId));
    
    if (allSelected) {
      // Désélectionner toutes les actions de ce module
      setSelectedActions(prev => prev.filter(id => !moduleActions.includes(id)));
    } else {
      // Sélectionner toutes les actions de ce module
      setSelectedActions(prev => {
        const newActions = [...prev];
        moduleActions.forEach(actionId => {
          if (!newActions.includes(actionId)) {
            newActions.push(actionId);
          }
        });
        return newActions;
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(selectedActions);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des permissions :', error);
    } finally {
      setLoading(false);
    }
  };

  const getModuleIcon = (moduleKey) => {
    switch (moduleKey) {
      case 'gestion_stock':
        return <Package className="h-5 w-5 text-blue-600" />;
      case 'gestion_rh':
        return <Users className="h-5 w-5 text-green-600" />;
      case 'gestion_financiere':
        return <DollarSign className="h-5 w-5 text-yellow-600" />;
      default:
        return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  const filteredModules = Object.entries(modulesConfig.erp_modules).filter(([key, module]) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      module.name.toLowerCase().includes(searchLower) ||
      module.description.toLowerCase().includes(searchLower) ||
      module.actions.some(action => 
        action.name.toLowerCase().includes(searchLower) ||
        action.description.toLowerCase().includes(searchLower)
      )
    );
  });

  return (
    <div style={{background:"#8080805e"}} className="fixed inset-0 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-5/6 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Gérer les permissions - {post.name}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Sélectionnez les actions que ce poste peut effectuer
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Barre de recherche */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Rechercher des modules ou des actions..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Résumé des actions sélectionnées */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              Actions sélectionnées : {selectedActions.length}
            </span>
            <button
              onClick={() => setSelectedActions([])}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Tout désélectionner
            </button>
          </div>
        </div>

        {/* Modules et actions */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {filteredModules.map(([moduleKey, module]) => {
            const moduleActions = module.actions.map(action => action.id);
            const selectedInModule = moduleActions.filter(actionId => selectedActions.includes(actionId));
            const allSelected = moduleActions.length > 0 && selectedInModule.length === moduleActions.length;
            const partialSelected = selectedInModule.length > 0 && selectedInModule.length < moduleActions.length;

            return (
              <div key={moduleKey} className="border border-gray-200 rounded-lg">
                {/* En-tête du module */}
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getModuleIcon(moduleKey)}
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-gray-900">
                          {module.name}
                        </h4>
                        <p className="text-xs text-gray-600">
                          {module.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {selectedInModule.length}/{moduleActions.length}
                      </span>
                      <button
                        onClick={() => handleSelectAllModule(moduleKey)}
                        className={`px-2 py-1 text-xs rounded ${
                          allSelected
                            ? 'bg-blue-100 text-blue-800'
                            : partialSelected
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                      </button>
                      <button
                        onClick={() => handleModuleToggle(moduleKey)}
                        className="text-gray-400 hover:text-gray-600"
                        aria-label={expandedModules[moduleKey] ? "Réduire le module" : "Déplier le module"}
                      >
                        <svg
                          className={`h-4 w-4 transform transition-transform ${
                            expandedModules[moduleKey] ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Actions du module */}
                {expandedModules[moduleKey] && (
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {module.actions.map((action) => {
                        const isSelected = selectedActions.includes(action.id);
                        return (
                          <div
                            key={action.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleActionToggle(action.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <div
                                    className={`w-4 h-4 rounded border-2 mr-3 flex items-center justify-center ${
                                      isSelected
                                        ? 'border-blue-500 bg-blue-500'
                                        : 'border-gray-300'
                                    }`}
                                  >
                                    {isSelected && <Check className="h-3 w-3 text-white" />}
                                  </div>
                                  <h5 className="text-sm font-medium text-gray-900">
                                    {action.name}
                                  </h5>
                                </div>
                                <p className="text-xs text-gray-600 mt-1 ml-7">
                                  {action.description}
                                </p>
                                {action.component && (
                                  <span className="inline-block mt-1 ml-7 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                    {action.component}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredModules.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Aucun module trouvé correspondant à votre recherche.
          </div>
        )}

        {/* Pied de page */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 ${
              loading ? 'opacity-50 pointer-events-none' : ''
            }`}
            disabled={loading}
          >
            {loading ? 'Enregistrement...' : `Enregistrer (${selectedActions.length} action${selectedActions.length > 1 ? 's' : ''})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostPermissionModal;