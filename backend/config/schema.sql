-- Create database
CREATE DATABASE IF NOT EXISTS geox_erp;
USE geox_erp;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firstname VARCHAR(255) NOT NULL,
    lastname VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    poste INT, -- Changed to INT for foreign key reference to poste table
    responsibleChef INT, -- New field for responsible chef (poste ID)
    isAdmin BOOLEAN DEFAULT FALSE,
    photo VARCHAR(255) DEFAULT 'default.jpg',
    validEmail BOOLEAN DEFAULT FALSE,
    verifiedProfileRh BOOLEAN DEFAULT FALSE,
    verifiedProfileDirection BOOLEAN DEFAULT FALSE,
    emailVerificationToken VARCHAR(255),
    emailVerificationExpires DATETIME,
    magasin_id INT, -- New field for magasin ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (poste) REFERENCES poste(id),
    FOREIGN KEY (responsibleChef) REFERENCES poste(id),
    FOREIGN KEY (magasin_id) REFERENCES magasins(id)
);

CREATE TABLE magasins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    responsable_id INT,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    available_fields JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (responsable_id) REFERENCES users(id)
);

CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    magasin_id INT NOT NULL,
    required_fields JSON,
    created_by INT NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by VARCHAR(255),
    approved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (magasin_id) REFERENCES magasins(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE (name, magasin_id)
);

CREATE TABLE fournisseurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    magasin_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    contact_types JSON,
    created_by_user_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (magasin_id) REFERENCES magasins(id),
    FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE TABLE produits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id INT NOT NULL,
    magasin_id INT NOT NULL,
    product_data JSON,
    created_by INT NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by VARCHAR(255),
    approved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (magasin_id) REFERENCES magasins(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE demandes_achat (
    id INT AUTO_INCREMENT PRIMARY KEY,
    magasin_id INT NOT NULL,
    products JSON NOT NULL,
    total_amount DECIMAL(10, 2),
    notes TEXT,
    created_by INT NOT NULL,
    status ENUM(\'pending\', \'approved\', \'rejected\') DEFAULT \'pending\',
    approved_by INT,
    approved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (magasin_id) REFERENCES magasins(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE TABLE bons_commande (
    id INT AUTO_INCREMENT PRIMARY KEY,
    demande_achat_id TEXT, -- Stored as comma-separated IDs
    fournisseur_id INT NOT NULL,
    magasin_id INT NOT NULL,
    order_number VARCHAR(255) UNIQUE NOT NULL,
    products JSON NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_by INT NOT NULL,
    status ENUM(\'pending\', \'sent\', \'confirmed\', \'received\', \'cancelled\') DEFAULT \'pending\',
    email_sent BOOLEAN DEFAULT FALSE,
    sent_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (fournisseur_id) REFERENCES fournisseurs(id),
    FOREIGN KEY (magasin_id) REFERENCES magasins(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE factures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bon_commande_id INT NOT NULL UNIQUE,
    magasin_id INT NOT NULL,
    invoice_number VARCHAR(255) UNIQUE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2),
    final_amount DECIMAL(10, 2) NOT NULL,
    invoice_data JSON,
    created_by INT NOT NULL,
    status ENUM(\'draft\', \'sent\', \'paid\', \'overdue\') DEFAULT \'draft\',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (bon_commande_id) REFERENCES bons_commande(id),
    FOREIGN KEY (magasin_id) REFERENCES magasins(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE mouvements_stock (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produit_id INT NOT NULL,
    magasin_id INT NOT NULL,
    bon_commande_id INT,
    movement_type ENUM(\'in\', \'out\') NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2),
    total_value DECIMAL(10, 2),
    reference_type VARCHAR(255) DEFAULT \'manual\',
    reference_id INT,
    notes TEXT,
    created_by INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (produit_id) REFERENCES produits(id),
    FOREIGN KEY (magasin_id) REFERENCES magasins(id),
    FOREIGN KEY (bon_commande_id) REFERENCES bons_commande(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE stock_actuel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produit_id INT NOT NULL UNIQUE,
    magasin_id INT NOT NULL,
    quantity_available INT NOT NULL,
    minimum_stock INT DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (produit_id) REFERENCES produits(id),
    FOREIGN KEY (magasin_id) REFERENCES magasins(id)
);

CREATE TABLE poste (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    actions JSON,
    parent_id INT,
    position_top INT DEFAULT 100,
    position_left INT DEFAULT 100,
    position_right INT DEFAULT 0,
    position_bottom INT DEFAULT 0,
    created_by VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES poste(id)
);


