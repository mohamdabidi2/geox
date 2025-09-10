import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Building2, User, Eye, Filter, X, Search, Mail, Phone, MapPin, Globe, Edit, Trash2, ExternalLink, Minus } from 'lucide-react';
import HandsontableDataGrid from './HandsontableDataGrid';

// Fallback user if not in AuthProvider context
const fallbackUser = {
  id: null,
  username: 'Inconnu',
  firstname: 'Inconnu',
  lastname: '',
  magasin: { id: '' }
};

const SupplierManagement = () => {
  // Defensive: Try to get user from useAuth, fallback if error
  let user = fallbackUser;
  try {
    // Dynamically import useAuth to avoid error if not in provider
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { useAuth } = require('../../hooks/useAuth');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    user = useAuth()?.user || fallbackUser;
  } catch (e) {
    user = fallbackUser;
  }

  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [editMode, setEditMode] = useState(false);

  // États de filtre
  const [filters, setFilters] = useState({
    country: '',
    createdBy: '',
    dateFrom: '',
    dateTo: '',
    contactType: '',
    searchTerm: ''
  });
  const [activeFilters, setActiveFilters] = useState([]);

  const [formData, setFormData] = useState({
    magasin_id: user?.magasin?.id || '',
    name: '',
    country: '',
    address: '',
    contacts: [],
    created_by_user_id: user?.id || ''
  });

  const contactTypeOptions = [
    { type: 'Email', icon: Mail, placeholder: 'exemple@entreprise.com', inputType: 'email' },
    { type: 'Téléphone', icon: Phone, placeholder: '+213...', inputType: 'tel' }
  ];

  const countryOptions = [
    'Algérie', 'Maroc', 'Tunisie', 'Égypte', 'Libye',
    'France', 'Allemagne', 'Italie', 'Espagne', 'Royaume-Uni',
    'États-Unis', 'Canada', 'Chine', 'Japon', 'Inde',
    'Turquie', 'Émirats arabes unis', 'Arabie Saoudite', 'Autre'
  ];

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line
  }, [suppliers, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [suppliersRes, usersRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/suppliers/magasin/${user?.magasin?.id}`),
        axios.get('http://localhost:5000/api/suppliers/users')
      ]);
      const transformedSuppliers = suppliersRes.data.map(supplier => ({
        ...supplier,
        contacts: supplier.contacts || transformLegacyContacts(supplier)
      }));
      setSuppliers(transformedSuppliers);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des données :', error);
      alert('Erreur lors de la récupération des données');
    } finally {
      setLoading(false);
    }
  };

  const transformLegacyContacts = (supplier) => {
    const contacts = [];
    if (supplier.email) {
      contacts.push({ type: 'Email', value: supplier.email });
    }
    if (supplier.phone) {
      contacts.push({ type: 'Téléphone', value: supplier.phone });
    }
    if (supplier.contact_types && Array.isArray(supplier.contact_types)) {
      supplier.contact_types.forEach(type => {
        if (!contacts.find(c => c.type === type)) {
          contacts.push({ type, value: '' });
        }
      });
    }
    return contacts;
  };

  // Fonctionnalité de filtrage
  const applyFilters = () => {
    let filtered = [...suppliers];

    if (filters.country) {
      filtered = filtered.filter(supplier =>
        supplier.country?.toLowerCase().includes(filters.country.toLowerCase())
      );
    }

    if (filters.createdBy) {
      filtered = filtered.filter(supplier =>
        supplier.created_by?.toLowerCase().includes(filters.createdBy.toLowerCase())
      );
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(supplier =>
        new Date(supplier.created_at) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(supplier =>
        new Date(supplier.created_at) <= new Date(filters.dateTo + 'T23:59:59')
      );
    }

    if (filters.contactType) {
      filtered = filtered.filter(supplier =>
        supplier.contacts?.some(contact => contact.type === filters.contactType && contact.value)
      );
    }

    if (filters.searchTerm) {
      filtered = filtered.filter(supplier => {
        const searchLower = filters.searchTerm.toLowerCase();
        return supplier.name?.toLowerCase().includes(searchLower) ||
          supplier.address?.toLowerCase().includes(searchLower) ||
          supplier.country?.toLowerCase().includes(searchLower) ||
          supplier.contacts?.some(contact =>
            contact.value?.toLowerCase().includes(searchLower)
          );
      });
    }

    setFilteredSuppliers(filtered);
    updateActiveFilters();
  };

  const updateActiveFilters = () => {
    const active = [];
    if (filters.country) active.push({ key: 'country', label: `Pays : ${filters.country}`, value: filters.country });
    if (filters.createdBy) active.push({ key: 'createdBy', label: `Créé par : ${filters.createdBy}`, value: filters.createdBy });
    if (filters.dateFrom) active.push({ key: 'dateFrom', label: `Du : ${filters.dateFrom}`, value: filters.dateFrom });
    if (filters.dateTo) active.push({ key: 'dateTo', label: `Au : ${filters.dateTo}`, value: filters.dateTo });
    if (filters.contactType) active.push({ key: 'contactType', label: `Contact : ${filters.contactType}`, value: filters.contactType });
    if (filters.searchTerm) active.push({ key: 'searchTerm', label: `Recherche : ${filters.searchTerm}`, value: filters.searchTerm });
    setActiveFilters(active);
  };

  const removeFilter = (filterKey) => {
    setFilters(prev => ({ ...prev, [filterKey]: '' }));
  };

  const clearAllFilters = () => {
    setFilters({
      country: '',
      createdBy: '',
      dateFrom: '',
      dateTo: '',
      contactType: '',
      searchTerm: ''
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Gestion des contacts
  const addContact = () => {
    setFormData(prev => ({
      ...prev,
      contacts: [...prev.contacts, { type: '', value: '' }]
    }));
  };

  const removeContact = (index) => {
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index)
    }));
  };

  const updateContact = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.map((contact, i) =>
        i === index ? { ...contact, [field]: value } : contact
      )
    }));
  };

  const getContactIcon = (type) => {
    const option = contactTypeOptions.find(opt => opt.type === type);
    return option ? option.icon : ExternalLink;
  };

  const getContactPlaceholder = (type) => {
    const option = contactTypeOptions.find(opt => opt.type === type);
    return option ? option.placeholder : 'Entrer l\'information de contact';
  };

  const getContactInputType = (type) => {
    const option = contactTypeOptions.find(opt => opt.type === type);
    return option ? option.inputType : 'text';
  };

  // Voir détails fournisseur
  const viewSupplierDetails = async (supplierId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/suppliers/${supplierId}`);
      const supplier = {
        ...response.data,
        contacts: response.data.contacts || transformLegacyContacts(response.data)
      };
      setSelectedSupplier(supplier);
      setShowViewModal(true);
      setEditMode(false);
    } catch (error) {
      console.error('Erreur lors de la récupération des détails du fournisseur :', error);
      alert('Erreur lors de la récupération des détails du fournisseur');
    }
  };

  const handleEdit = () => {
    setFormData({
      magasin_id: selectedSupplier.magasin?.id,
      name: selectedSupplier.name,
      country: selectedSupplier.country || '',
      address: selectedSupplier.address || '',
      contacts: selectedSupplier.contacts || [],
      created_by_user_id: selectedSupplier.created_by_user_id
    });
    setEditMode(true);
  };

  const handleDelete = async (supplierId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) {
      try {
        await axios.delete(`http://localhost:5000/api/suppliers/${supplierId}`);
        alert('Fournisseur supprimé avec succès');
        setShowViewModal(false);
        fetchData();
      } catch (error) {
        console.error('Erreur lors de la suppression du fournisseur :', error);
        alert('Erreur lors de la suppression du fournisseur : ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name) {
      alert('Le nom du fournisseur est requis');
      return;
    }

    const validContacts = formData.contacts.filter(contact => contact.type && contact.value.trim());

    const submitData = {
      ...formData,
      contacts: validContacts,
      email: validContacts.find(c => c.type === 'Email')?.value || '',
      phone: validContacts.find(c => c.type === 'Téléphone')?.value || '',
      contact_types: validContacts.map(c => c.type)
    };

    try {
      if (editMode && selectedSupplier) {
        await axios.put(`http://localhost:5000/api/suppliers/${selectedSupplier.id}`, submitData);
        alert('Fournisseur modifié avec succès');
        setShowViewModal(false);
      } else {
        await axios.post('http://localhost:5000/api/suppliers', submitData);
        alert('Fournisseur créé avec succès');
        setShowModal(false);
      }

      setFormData({
        magasin_id: user?.magasin?.id || '',
        name: '',
        country: '',
        address: '',
        contacts: [],
        created_by_user_id: user?.id || ''
      });
      setEditMode(false);
      fetchData();
    } catch (error) {
      let errorMsg = editMode ? 'Erreur lors de la modification du fournisseur : ' : 'Erreur lors de la création du fournisseur : ';
      if (error.response?.data?.error) {
        errorMsg += error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMsg += error.response.data.message;
      } else {
        errorMsg += error.message;
      }
      alert(errorMsg);
      console.error('Erreur lors de l\'opération fournisseur :', error);
    }
  };

  // Prepare data for Handsontable
  const prepareTableData = () => {
    return filteredSuppliers.map(supplier => {
      const validContacts = supplier.contacts?.filter(c => c.value && c.value.trim()) || [];
      const primaryContact = validContacts.length > 0 ? validContacts[0].value : 'N/A';
      const contactTypes = validContacts.map(c => c.type).join(', ') || 'Aucun';
      
      return {
        id: supplier.id,
        name: supplier.name,
        country: supplier.country || 'N/A',
        primary_contact: primaryContact,
        contact_types: contactTypes,
        created_by: supplier.created_by,
        created_at: new Date(supplier.created_at).toLocaleDateString('fr-FR'),
        actions: supplier.id
      };
    });
  };

  // Define columns for Handsontable
  const tableColumns = [
    { 
      data: 'name', 
      title: 'Nom du fournisseur', 
      type: 'text', 
      width: 200,
      readOnly: true
    },
    { 
      data: 'country', 
      title: 'Pays', 
      type: 'text', 
      width: 120,
      readOnly: true
    },
    { 
      data: 'primary_contact', 
      title: 'Contact', 
      type: 'text', 
      width: 200,
      readOnly: true
    },
    { 
      data: 'contact_types', 
      title: 'Types de contact', 
      type: 'text', 
      width: 150,
      readOnly: true,
      renderer: (instance, td, row, col, prop, value) => {
        const types = value.split(', ').filter(t => t !== 'Aucun');
        if (types.length === 0) {
          td.innerHTML = '<span class="text-gray-400">Aucun</span>';
        } else {
          const badges = types.map(type => {
            const icon = type === 'Email' ? '📧' : type === 'Téléphone' ? '📞' : '📋';
            return `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-1">${icon} ${type}</span>`;
          }).join('');
          td.innerHTML = badges;
        }
        return td;
      }
    },
    { 
      data: 'created_by', 
      title: 'Créé par', 
      type: 'text', 
      width: 150,
      readOnly: true
    },
    { 
      data: 'created_at', 
      title: 'Date', 
      type: 'text', 
      width: 120,
      readOnly: true
    },
    { 
      data: 'actions', 
      title: 'Actions', 
      type: 'text', 
      width: 120,
      readOnly: true,
      renderer: (instance, td, row, col, prop, value) => {
        const viewButton = `<button class="text-blue-600 hover:text-blue-900" onclick="viewSupplier(${value})">👁️</button>`;
        td.innerHTML = `<div class="flex space-x-1">${viewButton}</div>`;
        return td;
      }
    }
  ];

  // Global functions for action buttons
  useEffect(() => {
    window.viewSupplier = (supplierId) => {
      viewSupplierDetails(supplierId);
    };

    return () => {
      delete window.viewSupplier;
    };
    // eslint-disable-next-line
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full py-6 px-2 sm:px-4 lg:px-8">
      <div className="px-0 py-6 sm:px-0">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-3xl font-bold text-gray-900">Gestion des fournisseurs</h1>
            <p className="mt-2 text-sm text-gray-700">
              Gérez les fournisseurs et leurs informations de contact
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-2">
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
              onClick={() => setShowModal(true)}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau fournisseur
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
              placeholder="Rechercher par nom, contact, adresse ou pays..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            />
          </div>
        </div>

        {/* Handsontable Data Grid */}
        <div className="mt-8 flex flex-col">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <HandsontableDataGrid
              data={prepareTableData()}
              columns={tableColumns}
              height={400}
              className="supplier-management-table"
              contextMenu={['row_above', 'row_below', 'separator', 'copy', 'cut']}
              filters={true}
              dropdownMenu={true}
              multiColumnSorting={true}
            />
            {filteredSuppliers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Aucun fournisseur trouvé correspondant à vos filtres.
              </div>
            )}
          </div>
        </div>

        {/* Modal pour les filtres */}
        {showFilterModal && (
          <div style={{background:"#8080805e"}} className="fixed inset-0 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Filtres</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pays</label>
                    <input
                      type="text"
                      value={filters.country}
                      onChange={(e) => handleFilterChange('country', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Nom du pays"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Créé par</label>
                    <input
                      type="text"
                      value={filters.createdBy}
                      onChange={(e) => handleFilterChange('createdBy', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Nom du créateur"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date de début</label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date de fin</label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type de contact</label>
                    <select
                      value={filters.contactType}
                      onChange={(e) => handleFilterChange('contactType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Tous les types</option>
                      <option value="Email">Email</option>
                      <option value="Téléphone">Téléphone</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-6">
                  <button
                    onClick={() => setShowFilterModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Fermer
                  </button>
                  <button
                    onClick={clearAllFilters}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    Effacer tout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal pour créer/modifier un fournisseur */}
        {showModal && (
          <div style={{background:"#8080805e"}} className="fixed inset-0 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Nouveau fournisseur</h3>
                
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom du fournisseur
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pays
                      </label>
                      <select
                        value={formData.country}
                        onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Sélectionner un pays</option>
                        {countryOptions.map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows="3"
                      placeholder="Adresse complète du fournisseur"
                    />
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Informations de contact
                      </label>
                      <button
                        type="button"
                        onClick={addContact}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        + Ajouter un contact
                      </button>
                    </div>
                    
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {formData.contacts.map((contact, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md">
                          <select
                            value={contact.type}
                            onChange={(e) => updateContact(index, 'type', e.target.value)}
                            className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="">Type</option>
                            {contactTypeOptions.map((option) => (
                              <option key={option.type} value={option.type}>
                                {option.type}
                              </option>
                            ))}
                          </select>
                          
                          <input
                            type={getContactInputType(contact.type)}
                            value={contact.value}
                            onChange={(e) => updateContact(index, 'value', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder={getContactPlaceholder(contact.type)}
                          />
                          
                          <button
                            type="button"
                            onClick={() => removeContact(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      Créer le fournisseur
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal pour voir les détails */}
        {showViewModal && selectedSupplier && (
          <div style={{background:"#8080805e"}} className="fixed inset-0 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Détails du fournisseur: {selectedSupplier.name}
                  </h3>
                  <div className="flex space-x-2">
                    {!editMode && (
                      <>
                        <button
                          onClick={handleEdit}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(selectedSupplier.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                {editMode ? (
                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nom du fournisseur
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pays
                        </label>
                        <select
                          value={formData.country}
                          onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Sélectionner un pays</option>
                          {countryOptions.map((country) => (
                            <option key={country} value={country}>
                              {country}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Adresse
                      </label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows="3"
                      />
                    </div>
                    
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Informations de contact
                        </label>
                        <button
                          type="button"
                          onClick={addContact}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          + Ajouter un contact
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {formData.contacts.map((contact, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md">
                            <select
                              value={contact.type}
                              onChange={(e) => updateContact(index, 'type', e.target.value)}
                              className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="">Type</option>
                              {contactTypeOptions.map((option) => (
                                <option key={option.type} value={option.type}>
                                  {option.type}
                                </option>
                              ))}
                            </select>
                            
                            <input
                              type={getContactInputType(contact.type)}
                              value={contact.value}
                              onChange={(e) => updateContact(index, 'value', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder={getContactPlaceholder(contact.type)}
                            />
                            
                            <button
                              type="button"
                              onClick={() => removeContact(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setEditMode(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                      >
                        Sauvegarder
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Pays</label>
                        <p className="text-sm text-gray-900">{selectedSupplier.country || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Créé par</label>
                        <p className="text-sm text-gray-900">{selectedSupplier.created_by}</p>
                      </div>
                    </div>
                    
                    {selectedSupplier.address && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Adresse</label>
                        <p className="text-sm text-gray-900">{selectedSupplier.address}</p>
                      </div>
                    )}
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Informations de contact</label>
                      <div className="space-y-2">
                        {selectedSupplier.contacts && selectedSupplier.contacts.length > 0 ? (
                          selectedSupplier.contacts.filter(c => c.value && c.value.trim()).map((contact, index) => {
                            const IconComponent = getContactIcon(contact.type);
                            return (
                              <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-md">
                                <IconComponent className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">{contact.type}:</span>
                                <span className="text-sm text-gray-900">{contact.value}</span>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-sm text-gray-500">Aucune information de contact disponible</p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => setShowViewModal(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                      >
                        Fermer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierManagement;
