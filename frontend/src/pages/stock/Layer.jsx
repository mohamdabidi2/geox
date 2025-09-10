import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  Layers,
  Package,
  Users,
  ShoppingCart,
  FileText,
  BarChart3,
  Lock
} from 'lucide-react';

// Professional, clean, modern design
const colorMap = {
  'bg-blue-500': 'border-blue-600 text-blue-600 bg-blue-50',
  'bg-green-500': 'border-green-600 text-green-600 bg-green-50',
  'bg-purple-500': 'border-purple-600 text-purple-600 bg-purple-50',
  'bg-orange-500': 'border-orange-500 text-orange-500 bg-orange-50',
  'bg-red-500': 'border-red-600 text-red-600 bg-red-50',
  'bg-indigo-500': 'border-indigo-600 text-indigo-600 bg-indigo-50',
  'bg-teal-500': 'border-teal-600 text-teal-600 bg-teal-50',
  'bg-pink-500': 'border-pink-600 text-pink-600 bg-pink-50'
};

const CartesStock = () => {
  const navigate = useNavigate();

  const cartes = [
    {
      titre: 'Gestion des Magasins',
      description: 'Gérez les magasins et leurs configurations',
      icone: Store,
      chemin: '/magasins',
      couleur: 'bg-blue-500'
    },
    {
      titre: 'Gestion des Catégories',
      description: 'Créez et gérez les catégories de produits',
      icone: Layers,
      chemin: '/categories',
      couleur: 'bg-green-500'
    },
    {
      titre: 'Gestion des Produits',
      description: 'Ajoutez et gérez les produits',
      icone: Package,
      chemin: '/products',
      couleur: 'bg-purple-500'
    },
    {
      titre: 'Gestion des Fournisseurs',
      description: 'Gérez les fournisseurs et leurs contacts',
      icone: Users,
      chemin: '/suppliers',
      couleur: 'bg-orange-500'
    },
    {
      titre: 'Demandes d\'Achat',
      description: 'Créez et suivez les demandes d\'achat',
      icone: FileText,
      chemin: '/purchase-requests',
      couleur: 'bg-red-500'
    },
    {
      titre: 'Commandes d\'Achat',
      description: 'Gérez les commandes d\'achat',
      icone: ShoppingCart,
      chemin: '/purchase-orders',
      couleur: 'bg-indigo-500'
    },
    {
      titre: 'Gestion des Stocks',
      description: 'Surveillez et gérez les niveaux de stock',
      icone: BarChart3,
      chemin: '/stock',
      couleur: 'bg-teal-500'
    },
    {
      titre: 'Gestion des Permissions',
      description: 'Attribuez et gérez les droits d\'accès des utilisateurs',
      icone: Lock,
      chemin: '/permissions',
      couleur: 'bg-pink-500'
    }
  ];

  const gererClicCarte = (chemin) => {
    navigate(chemin);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-10 text-center tracking-tight">
          Gestion Stock & Achats
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8">
          {cartes.map((carte, index) => {
            const ComposantIcone = carte.icone;
            const colorClasses = colorMap[carte.couleur] || 'border-gray-300 text-gray-600 bg-gray-50';
            return (
              <div
                key={index}
                className={`
                  group
                  rounded-xl
                  bg-white
                  border
                  shadow-sm
                  p-7
                  cursor-pointer
                  transition
                  duration-200
                  hover:shadow-lg
                  hover:border-blue-500
                  flex flex-col
                  h-full
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-500
                `}
                tabIndex={0}
                onClick={() => gererClicCarte(carte.chemin)}
                onKeyPress={e => {
                  if (e.key === 'Enter' || e.key === ' ') gererClicCarte(carte.chemin);
                }}
                aria-label={carte.titre}
                role="button"
              >
                <div className="flex items-center mb-5">
                  <div
                    className={`
                      flex items-center justify-center
                      w-12 h-12
                      rounded-lg
                      border
                      ${colorClasses}
                      transition
                      duration-200
                      group-hover:bg-opacity-90
                      group-hover:border-blue-500
                      group-hover:text-blue-700
                    `}
                  >
                    <ComposantIcone className="h-7 w-7" />
                  </div>
                  <h3 className="ml-4 text-lg font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                    {carte.titre}
                  </h3>
                </div>
                <p className="text-sm text-gray-700 flex-1 mb-6">
                  {carte.description}
                </p>
                <div className="flex items-center gap-2 mt-auto text-sm font-medium text-blue-600 group-hover:text-blue-800 transition-colors">
                  <span>Accéder</span>
                  <svg className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CartesStock;