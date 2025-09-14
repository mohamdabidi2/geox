-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : dim. 14 sep. 2025 à 04:02
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `geox_erp`
--

-- --------------------------------------------------------

--
-- Structure de la table `bons_commande`
--

CREATE TABLE `bons_commande` (
  `id` int(11) NOT NULL,
  `demande_achat_id` text DEFAULT NULL,
  `fournisseur_id` int(11) NOT NULL,
  `magasin_id` int(11) NOT NULL,
  `order_number` varchar(255) NOT NULL,
  `products` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`products`)),
  `total_amount` decimal(10,2) NOT NULL,
  `notes` text DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `status` enum('pending','sent','confirmed','received','cancelled') DEFAULT 'pending',
  `email_sent` tinyint(1) DEFAULT 0,
  `sent_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `magasin_id` int(11) NOT NULL,
  `required_fields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`required_fields`)),
  `created_by` int(11) NOT NULL,
  `is_approved` tinyint(1) DEFAULT 0,
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `clients`
--

CREATE TABLE `clients` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `demandes_achat`
--

CREATE TABLE `demandes_achat` (
  `id` int(11) NOT NULL,
  `magasin_id` int(11) NOT NULL,
  `products` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`products`)),
  `total_amount` decimal(10,2) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `droitbycategory`
--

CREATE TABLE `droitbycategory` (
  `id` int(11) NOT NULL,
  `userid` int(11) NOT NULL,
  `categoryid` int(11) NOT NULL,
  `DroitStartIn` datetime NOT NULL,
  `DroitExpiredAt` datetime NOT NULL,
  `ResponsableId` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `droitbyclient`
--

CREATE TABLE `droitbyclient` (
  `id` int(11) NOT NULL,
  `userid` int(11) NOT NULL,
  `clientid` int(11) NOT NULL,
  `DroitStartIn` datetime NOT NULL,
  `DroitExpiredAt` datetime NOT NULL,
  `ResponsableId` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `droitbymagasin`
--

CREATE TABLE `droitbymagasin` (
  `id` int(11) NOT NULL,
  `userid` int(11) NOT NULL,
  `magasinid` int(11) NOT NULL,
  `DroitStartIn` datetime NOT NULL,
  `DroitExpiredAt` datetime NOT NULL,
  `ResponsableId` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `droitbymagasin`
--

INSERT INTO `droitbymagasin` (`id`, `userid`, `magasinid`, `DroitStartIn`, `DroitExpiredAt`, `ResponsableId`, `created_at`, `updated_at`) VALUES
(2, 2, 1, '2025-09-13 00:00:00', '2025-09-21 00:00:00', 2, '2025-09-14 00:47:32', '2025-09-14 00:47:32');

-- --------------------------------------------------------

--
-- Structure de la table `factures`
--

CREATE TABLE `factures` (
  `id` int(11) NOT NULL,
  `bon_commande_id` int(11) NOT NULL,
  `magasin_id` int(11) NOT NULL,
  `invoice_number` varchar(255) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `tax_amount` decimal(10,2) DEFAULT NULL,
  `final_amount` decimal(10,2) NOT NULL,
  `invoice_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`invoice_data`)),
  `created_by` int(11) NOT NULL,
  `status` enum('draft','sent','paid','overdue') DEFAULT 'draft',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `fournisseurs`
--

CREATE TABLE `fournisseurs` (
  `id` int(11) NOT NULL,
  `magasin_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `country` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `contact_types` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`contact_types`)),
  `created_by_user_id` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `magasins`
--

CREATE TABLE `magasins` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `responsable_id` int(11) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `available_fields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`available_fields`)),
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `magasins`
--

INSERT INTO `magasins` (`id`, `name`, `responsable_id`, `email`, `phone`, `address`, `available_fields`, `created_at`, `updated_at`) VALUES
(1, 'tissu', 2, 'med@gmail.com', '94343077', 'fgdfgdfgdfg', '[\"Taille\",\"Qualite\",\"Couleur\",\"Composition\",\"Devise\",\"Unite\",\"Incoterm\",\"Saison\",\"MarchéCible\",\"Certifications\",\"PaysOrigine\",\"HSCode\",\"Type\",\"Statut\",\"Prod_Origine\",\"Marque\",\"Version\",\"Référence\",\"Libellé\",\"CodeABarre\",\"Prix\",\"PrixMP\",\"LeadTime\",\"Poids_Net\",\"Poids_Unitaire\",\"Poids_M2\",\"Construction\",\"ClasOnze\",\"RetTRMin\",\"RetTRMax\",\"RetCHMin\",\"RetCHMax\",\"Laize\",\"Retrecissement_X\",\"Retrecissement_Y\",\"Note\",\"Domaine\",\"InstructionsEntretien\",\"InfoDurabilité\",\"SpécTechniques\",\"Images\",\"Tags\"]', '2025-09-14 01:28:40', '2025-09-14 01:28:40');

-- --------------------------------------------------------

--
-- Structure de la table `mouvements_stock`
--

CREATE TABLE `mouvements_stock` (
  `id` int(11) NOT NULL,
  `produit_id` int(11) NOT NULL,
  `magasin_id` int(11) NOT NULL,
  `bon_commande_id` int(11) DEFAULT NULL,
  `movement_type` enum('in','out') NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(10,2) DEFAULT NULL,
  `total_value` decimal(10,2) DEFAULT NULL,
  `reference_type` varchar(255) DEFAULT 'manual',
  `reference_id` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `poste`
--

CREATE TABLE `poste` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `actions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`actions`)),
  `parent_id` int(11) DEFAULT NULL,
  `position_top` int(11) DEFAULT 100,
  `position_left` int(11) DEFAULT 100,
  `position_right` int(11) DEFAULT 0,
  `position_bottom` int(11) DEFAULT 0,
  `created_by` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `poste`
--

INSERT INTO `poste` (`id`, `name`, `description`, `actions`, `parent_id`, `position_top`, `position_left`, `position_right`, `position_bottom`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'Financial Manager', 'Responsible for financial operations', '[\"view_financial_reports\",\"manage_budgets\",\"process_payments\",\"manage_permissions_finance\",\"validate_category\"]', NULL, 100, 100, 0, 0, 'admin@example.com', '2025-09-13 22:24:51', '2025-09-13 23:23:16'),
(2, 'HR Manager', 'Responsible for human resources', '{\r\n        \"permissions\": [\r\n            \"manage_employees\",\r\n            \"manage_payroll\",\r\n            \"manage_attendance\",\r\n            \"manage_permissions_rh\"\r\n        ],\r\n        \"module_access\": [\"gestion_rh\"]\r\n    }', NULL, 100, 100, 0, 0, 'admin@example.com', '2025-09-13 22:24:51', '2025-09-13 22:24:51'),
(3, 'Stock Supervisor', 'Assistant stock manager with limited permissions', '{\r\n        \"permissions\": [\r\n            \"create_category\",\r\n            \"create_product\",\r\n            \"manage_stock\",\r\n            \"view_stock_reports\",\r\n            \"create_purchase_request\"\r\n        ],\r\n        \"module_access\": [\"gestion_stock\"],\r\n        \"restrictions\": {\r\n            \"can_validate\": false,\r\n            \"can_delete\": false,\r\n            \"can_manage_permissions\": false\r\n        }\r\n    }', 1, 100, 100, 0, 0, 'stock.manager@example.com', '2025-09-13 22:24:51', '2025-09-13 22:24:51'),
(4, 'System Administrator', 'Full system access with all permissions', '{\r\n        \"permissions\": [\r\n            \"create_category\",\r\n            \"validate_category\",\r\n            \"delete_category\",\r\n            \"create_product\",\r\n            \"validate_product\",\r\n            \"delete_product\",\r\n            \"manage_stock\",\r\n            \"view_stock_reports\",\r\n            \"create_supplier\",\r\n            \"manage_suppliers\",\r\n            \"create_purchase_request\",\r\n            \"validate_purchase_request\",\r\n            \"create_purchase_order\",\r\n            \"validate_purchase_order\",\r\n            \"manage_magasin\",\r\n            \"manage_permissions_stock\",\r\n            \"view_financial_reports\",\r\n            \"manage_budgets\",\r\n            \"process_payments\",\r\n            \"manage_permissions_finance\",\r\n            \"manage_employees\",\r\n            \"manage_payroll\",\r\n            \"manage_attendance\",\r\n            \"manage_permissions_rh\"\r\n        ],\r\n        \"module_access\": [\"gestion_stock\", \"gestion_financiere\", \"gestion_rh\"],\r\n        \"is_admin\": true\r\n    }', NULL, 100, 100, 0, 0, 'system', '2025-09-13 22:24:51', '2025-09-13 22:24:51');

-- --------------------------------------------------------

--
-- Structure de la table `produits`
--

CREATE TABLE `produits` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category_id` int(11) NOT NULL,
  `magasin_id` int(11) NOT NULL,
  `product_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`product_data`)),
  `created_by` int(11) NOT NULL,
  `is_approved` tinyint(1) DEFAULT 0,
  `approved_by` varchar(255) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `stock_actuel`
--

CREATE TABLE `stock_actuel` (
  `id` int(11) NOT NULL,
  `produit_id` int(11) NOT NULL,
  `magasin_id` int(11) NOT NULL,
  `quantity_available` int(11) NOT NULL,
  `minimum_stock` int(11) DEFAULT 0,
  `last_updated` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `firstname` varchar(255) NOT NULL,
  `lastname` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `poste` int(11) DEFAULT NULL,
  `responsibleChef` int(11) DEFAULT NULL,
  `isAdmin` tinyint(1) DEFAULT 0,
  `photo` varchar(255) DEFAULT 'default.jpg',
  `validEmail` tinyint(1) DEFAULT 0,
  `verifiedProfileRh` tinyint(1) DEFAULT 0,
  `verifiedProfileDirection` tinyint(1) DEFAULT 0,
  `emailVerificationToken` varchar(255) DEFAULT NULL,
  `emailVerificationExpires` datetime DEFAULT NULL,
  `magasin_id` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `firstname`, `lastname`, `email`, `password`, `poste`, `responsibleChef`, `isAdmin`, `photo`, `validEmail`, `verifiedProfileRh`, `verifiedProfileDirection`, `emailVerificationToken`, `emailVerificationExpires`, `magasin_id`, `created_at`, `updated_at`) VALUES
(2, 'John', 'Doe', 'm.abidi.contact@gmail.com', '$2b$12$hlc.Cx/.Y0WhYnOZKY/ChOtss72cApWd2sgRpcRcltgMGD8F0170O', 4, NULL, 1, 'default.jpg', 1, 1, 1, NULL, NULL, 1, '2025-09-13 22:31:25', '2025-09-14 02:24:48');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `bons_commande`
--
ALTER TABLE `bons_commande`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_number` (`order_number`),
  ADD KEY `fournisseur_id` (`fournisseur_id`),
  ADD KEY `magasin_id` (`magasin_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Index pour la table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_category_magasin` (`name`,`magasin_id`),
  ADD KEY `magasin_id` (`magasin_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `approved_by` (`approved_by`);

--
-- Index pour la table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `demandes_achat`
--
ALTER TABLE `demandes_achat`
  ADD PRIMARY KEY (`id`),
  ADD KEY `magasin_id` (`magasin_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `approved_by` (`approved_by`);

--
-- Index pour la table `droitbycategory`
--
ALTER TABLE `droitbycategory`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_category` (`userid`,`categoryid`),
  ADD KEY `ResponsableId` (`ResponsableId`),
  ADD KEY `idx_droitbycategory_dates` (`DroitStartIn`,`DroitExpiredAt`),
  ADD KEY `idx_droitbycategory_user` (`userid`),
  ADD KEY `idx_droitbycategory_category` (`categoryid`);

--
-- Index pour la table `droitbyclient`
--
ALTER TABLE `droitbyclient`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_client` (`userid`,`clientid`),
  ADD KEY `ResponsableId` (`ResponsableId`),
  ADD KEY `idx_droitbyclient_dates` (`DroitStartIn`,`DroitExpiredAt`),
  ADD KEY `idx_droitbyclient_user` (`userid`),
  ADD KEY `idx_droitbyclient_client` (`clientid`);

--
-- Index pour la table `droitbymagasin`
--
ALTER TABLE `droitbymagasin`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_magasin` (`userid`,`magasinid`),
  ADD KEY `ResponsableId` (`ResponsableId`),
  ADD KEY `idx_droitbymagasin_dates` (`DroitStartIn`,`DroitExpiredAt`),
  ADD KEY `idx_droitbymagasin_user` (`userid`),
  ADD KEY `idx_droitbymagasin_magasin` (`magasinid`);

--
-- Index pour la table `factures`
--
ALTER TABLE `factures`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `bon_commande_id` (`bon_commande_id`),
  ADD UNIQUE KEY `invoice_number` (`invoice_number`),
  ADD KEY `magasin_id` (`magasin_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Index pour la table `fournisseurs`
--
ALTER TABLE `fournisseurs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `magasin_id` (`magasin_id`),
  ADD KEY `created_by_user_id` (`created_by_user_id`);

--
-- Index pour la table `magasins`
--
ALTER TABLE `magasins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `responsable_id` (`responsable_id`);

--
-- Index pour la table `mouvements_stock`
--
ALTER TABLE `mouvements_stock`
  ADD PRIMARY KEY (`id`),
  ADD KEY `produit_id` (`produit_id`),
  ADD KEY `magasin_id` (`magasin_id`),
  ADD KEY `bon_commande_id` (`bon_commande_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Index pour la table `poste`
--
ALTER TABLE `poste`
  ADD PRIMARY KEY (`id`),
  ADD KEY `parent_id` (`parent_id`);

--
-- Index pour la table `produits`
--
ALTER TABLE `produits`
  ADD PRIMARY KEY (`id`),
  ADD KEY `magasin_id` (`magasin_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `produits_ibfk_1` (`category_id`);

--
-- Index pour la table `stock_actuel`
--
ALTER TABLE `stock_actuel`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `produit_id` (`produit_id`),
  ADD KEY `magasin_id` (`magasin_id`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `poste` (`poste`),
  ADD KEY `responsibleChef` (`responsibleChef`),
  ADD KEY `magasin_id` (`magasin_id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `bons_commande`
--
ALTER TABLE `bons_commande`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `clients`
--
ALTER TABLE `clients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `demandes_achat`
--
ALTER TABLE `demandes_achat`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `droitbycategory`
--
ALTER TABLE `droitbycategory`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `droitbyclient`
--
ALTER TABLE `droitbyclient`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `droitbymagasin`
--
ALTER TABLE `droitbymagasin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `factures`
--
ALTER TABLE `factures`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `fournisseurs`
--
ALTER TABLE `fournisseurs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `magasins`
--
ALTER TABLE `magasins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `mouvements_stock`
--
ALTER TABLE `mouvements_stock`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `poste`
--
ALTER TABLE `poste`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `produits`
--
ALTER TABLE `produits`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `stock_actuel`
--
ALTER TABLE `stock_actuel`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `bons_commande`
--
ALTER TABLE `bons_commande`
  ADD CONSTRAINT `bons_commande_ibfk_1` FOREIGN KEY (`fournisseur_id`) REFERENCES `fournisseurs` (`id`),
  ADD CONSTRAINT `bons_commande_ibfk_2` FOREIGN KEY (`magasin_id`) REFERENCES `magasins` (`id`),
  ADD CONSTRAINT `bons_commande_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`magasin_id`) REFERENCES `magasins` (`id`),
  ADD CONSTRAINT `categories_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `categories_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `demandes_achat`
--
ALTER TABLE `demandes_achat`
  ADD CONSTRAINT `demandes_achat_ibfk_1` FOREIGN KEY (`magasin_id`) REFERENCES `magasins` (`id`),
  ADD CONSTRAINT `demandes_achat_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `demandes_achat_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `droitbycategory`
--
ALTER TABLE `droitbycategory`
  ADD CONSTRAINT `droitbycategory_ibfk_1` FOREIGN KEY (`userid`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `droitbycategory_ibfk_2` FOREIGN KEY (`categoryid`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `droitbycategory_ibfk_3` FOREIGN KEY (`ResponsableId`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `droitbyclient`
--
ALTER TABLE `droitbyclient`
  ADD CONSTRAINT `droitbyclient_ibfk_1` FOREIGN KEY (`userid`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `droitbyclient_ibfk_2` FOREIGN KEY (`clientid`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `droitbyclient_ibfk_3` FOREIGN KEY (`ResponsableId`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `droitbymagasin`
--
ALTER TABLE `droitbymagasin`
  ADD CONSTRAINT `droitbymagasin_ibfk_1` FOREIGN KEY (`userid`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `droitbymagasin_ibfk_2` FOREIGN KEY (`magasinid`) REFERENCES `magasins` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `droitbymagasin_ibfk_3` FOREIGN KEY (`ResponsableId`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `factures`
--
ALTER TABLE `factures`
  ADD CONSTRAINT `factures_ibfk_1` FOREIGN KEY (`bon_commande_id`) REFERENCES `bons_commande` (`id`),
  ADD CONSTRAINT `factures_ibfk_2` FOREIGN KEY (`magasin_id`) REFERENCES `magasins` (`id`),
  ADD CONSTRAINT `factures_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `fournisseurs`
--
ALTER TABLE `fournisseurs`
  ADD CONSTRAINT `fournisseurs_ibfk_1` FOREIGN KEY (`magasin_id`) REFERENCES `magasins` (`id`),
  ADD CONSTRAINT `fournisseurs_ibfk_2` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `magasins`
--
ALTER TABLE `magasins`
  ADD CONSTRAINT `magasins_ibfk_1` FOREIGN KEY (`responsable_id`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `mouvements_stock`
--
ALTER TABLE `mouvements_stock`
  ADD CONSTRAINT `mouvements_stock_ibfk_1` FOREIGN KEY (`produit_id`) REFERENCES `produits` (`id`),
  ADD CONSTRAINT `mouvements_stock_ibfk_2` FOREIGN KEY (`magasin_id`) REFERENCES `magasins` (`id`),
  ADD CONSTRAINT `mouvements_stock_ibfk_3` FOREIGN KEY (`bon_commande_id`) REFERENCES `bons_commande` (`id`),
  ADD CONSTRAINT `mouvements_stock_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `poste`
--
ALTER TABLE `poste`
  ADD CONSTRAINT `poste_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `poste` (`id`);

--
-- Contraintes pour la table `produits`
--
ALTER TABLE `produits`
  ADD CONSTRAINT `produits_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  ADD CONSTRAINT `produits_ibfk_2` FOREIGN KEY (`magasin_id`) REFERENCES `magasins` (`id`),
  ADD CONSTRAINT `produits_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `stock_actuel`
--
ALTER TABLE `stock_actuel`
  ADD CONSTRAINT `stock_actuel_ibfk_1` FOREIGN KEY (`produit_id`) REFERENCES `produits` (`id`),
  ADD CONSTRAINT `stock_actuel_ibfk_2` FOREIGN KEY (`magasin_id`) REFERENCES `magasins` (`id`);

--
-- Contraintes pour la table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`poste`) REFERENCES `poste` (`id`),
  ADD CONSTRAINT `users_ibfk_2` FOREIGN KEY (`responsibleChef`) REFERENCES `poste` (`id`),
  ADD CONSTRAINT `users_ibfk_3` FOREIGN KEY (`magasin_id`) REFERENCES `magasins` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
