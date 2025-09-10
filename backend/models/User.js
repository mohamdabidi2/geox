const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

class User {
    constructor(userData) {
        this.id = userData.id;
        this.email = userData.email;
        this.firstname = userData.firstname;
        this.lastname = userData.lastname;
        this.poste = userData.poste; // This will now be an object or ID
        this.posteData = userData.posteData; // New field for full poste data
        this.responsibleChef = userData.responsibleChef; // Changed from responsibleChefs to responsibleChef (single poste ID)
        this.isAdmin = userData.isAdmin || false;
        this.photo = userData.photo || 'default.jpg';
        this.validEmail = userData.validEmail || false;
        this.verifiedProfileRh = userData.verifiedProfileRh || false;
        this.verifiedProfileDirection = userData.verifiedProfileDirection || false;
        this.password = userData.password;
        this.emailVerificationToken = userData.emailVerificationToken;
        this.emailVerificationExpires = userData.emailVerificationExpires;
        this.magasin_id = userData.magasin_id;
        this.createdAt = userData.createdAt;
        this.updatedAt = userData.updatedAt;
        this.magasin = userData.magasin;
    }

    // Create a new user - UPDATED
    static async create(userData) {
        const connection = await pool.getConnection();
        try {
            // Automatically determine responsibleChef from poste's parent
            let responsibleChef = null;
            if (userData.poste) {
                const [posteRows] = await connection.execute(
                    'SELECT parent_id FROM poste WHERE id = ?',
                    [userData.poste]
                );
                if (posteRows.length > 0 && posteRows[0].parent_id) {
                    responsibleChef = posteRows[0].parent_id;
                }
            }

            const sanitizedData = {
                email: userData.email,
                firstname: userData.firstname,
                lastname: userData.lastname,
                poste: userData.poste, // Store poste ID
                responsibleChef: responsibleChef, // Store parent poste ID as responsible chef
                isAdmin: userData.isAdmin || false,
                photo: userData.photo || 'default.jpg',
                validEmail: userData.validEmail || false,
                verifiedProfileRh: userData.verifiedProfileRh || false,
                verifiedProfileDirection: userData.verifiedProfileDirection || false,
                password: userData.password || null,
                emailVerificationToken: userData.emailVerificationToken || null,
                emailVerificationExpires: userData.emailVerificationExpires || null,
                magasin_id: userData.magasin_id || null
            };

            const [result] = await connection.execute(
                `INSERT INTO users (email, firstname, lastname, poste, responsibleChef, isAdmin, photo, validEmail, verifiedProfileRh, verifiedProfileDirection, password, emailVerificationToken, emailVerificationExpires, magasin_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    sanitizedData.email,
                    sanitizedData.firstname,
                    sanitizedData.lastname,
                    sanitizedData.poste,
                    sanitizedData.responsibleChef,
                    sanitizedData.isAdmin,
                    sanitizedData.photo,
                    sanitizedData.validEmail,
                    sanitizedData.verifiedProfileRh,
                    sanitizedData.verifiedProfileDirection,
                    sanitizedData.password,
                    sanitizedData.emailVerificationToken,
                    sanitizedData.emailVerificationExpires,
                    sanitizedData.magasin_id
                ]
            );
            return result.insertId;
        } finally {
            connection.release();
        }
    }

    // Alternative simpler create method for registration - UPDATED with magasin_id
    static async createForRegistration(userData) {
        const connection = await pool.getConnection();
        try {
            // Automatically determine responsibleChef from poste's parent
            let responsibleChef = null;
            if (userData.poste) {
                const [posteRows] = await connection.execute(
                    'SELECT parent_id FROM poste WHERE id = ?',
                    [userData.poste]
                );
                if (posteRows.length > 0 && posteRows[0].parent_id) {
                    responsibleChef = posteRows[0].parent_id;
                }
            }

            const [result] = await connection.execute(
                `INSERT INTO users (email, firstname, lastname, poste, responsibleChef, isAdmin, magasin_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    userData.email,
                    userData.firstname,
                    userData.lastname,
                    userData.poste,
                    responsibleChef,
                    userData.isAdmin || false,
                    userData.magasin_id || null
                ]
            );
            return result.insertId;
        } finally {
            connection.release();
        }
    }

    // Find user by email - UPDATED to include poste data
    static async findByEmail(email, includeRelations = false) {
        const connection = await pool.getConnection();
        try {
            let query = 'SELECT u.*';
            if (includeRelations) {
                query += ', m.id as magasin_id, m.name as magasin_name, m.address as magasin_address';
                query += ', p.id as poste_id, p.name as poste_name, p.description as poste_description, p.actions as poste_actions, p.parent_id as poste_parent_id';
            }
            query += ' FROM users u';
            if (includeRelations) {
                query += ' LEFT JOIN magasins m ON u.magasin_id = m.id';
                query += ' LEFT JOIN poste p ON u.poste = p.id';
            }
            query += ' WHERE u.email = ?';
            
            const [rows] = await connection.execute(query, [email]);
            
            if (rows.length > 0) {
                const userData = rows[0];
                if (userData.responsibleChef) {
                    // responsibleChef is now just a poste ID, no need to parse JSON
                    userData.responsibleChef = userData.responsibleChef;
                }
                
                // If including relations, create magasin and poste objects
                if (includeRelations) {
                    // Magasin data
                    if (userData.magasin_id) {
                        userData.magasin = {
                            id: userData.magasin_id,
                            name: userData.magasin_name,
                            address: userData.magasin_address,
                            city: userData.magasin_city
                        };
                        delete userData.magasin_id;
                        delete userData.magasin_name;
                        delete userData.magasin_address;
                        delete userData.magasin_city;
                    }
                    
                    // Poste data
                    if (userData.poste_id) {
                        userData.posteData = {
                            id: userData.poste_id,
                            name: userData.poste_name,
                            description: userData.poste_description,
                            actions: userData.poste_actions ? JSON.parse(userData.poste_actions) : [],
                            parent_id: userData.poste_parent_id
                        };
                        delete userData.poste_id;
                        delete userData.poste_name;
                        delete userData.poste_description;
                        delete userData.poste_actions;
                        delete userData.poste_parent_id;
                    }
                }
                
                return new User(userData);
            }
            return null;
        } finally {
            connection.release();
        }
    }

    // Find user by ID - UPDATED to include poste data
    static async findById(id, includeRelations = false) {
        const connection = await pool.getConnection();
        try {
            let query = 'SELECT u.*';
            if (includeRelations) {
                query += ', m.id as magasin_id, m.name as magasin_name, m.address as magasin_address';
                query += ', p.id as poste_id, p.name as poste_name, p.description as poste_description, p.actions as poste_actions, p.parent_id as poste_parent_id';
            }
            query += ' FROM users u';
            if (includeRelations) {
                query += ' LEFT JOIN magasins m ON u.magasin_id = m.id';
                query += ' LEFT JOIN poste p ON u.poste = p.id';
            }
            query += ' WHERE u.id = ?';
            
            const [rows] = await connection.execute(query, [id]);
            
            if (rows.length > 0) {
                const userData = rows[0];
                if (userData.responsibleChef) {
                    // responsibleChef is now just a poste ID, no need to parse JSON
                    userData.responsibleChef = userData.responsibleChef;
                }
                
                // If including relations, create magasin and poste objects
                if (includeRelations) {
                    // Magasin data
                    if (userData.magasin_id) {
                        userData.magasin = {
                            id: userData.magasin_id,
                            name: userData.magasin_name,
                            address: userData.magasin_address,
                            city: userData.magasin_city
                        };
                        delete userData.magasin_id;
                        delete userData.magasin_name;
                        delete userData.magasin_address;
                        delete userData.magasin_city;
                    }
                    
                    // Poste data
                    if (userData.poste_id) {
                        userData.posteData = {
                            id: userData.poste_id,
                            name: userData.poste_name,
                            description: userData.poste_description,
                            actions: userData.poste_actions ? JSON.parse(userData.poste_actions) : [],
                            parent_id: userData.poste_parent_id
                        };
                        delete userData.poste_id;
                        delete userData.poste_name;
                        delete userData.poste_description;
                        delete userData.poste_actions;
                        delete userData.poste_parent_id;
                    }
                }
                
                return new User(userData);
            }
            return null;
        } finally {
            connection.release();
        }
    }

    // Find user by verification token - UPDATED
    static async findByVerificationToken(token) {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM users WHERE emailVerificationToken = ? AND emailVerificationExpires > NOW()',
                [token]
            );
            if (rows.length > 0) {
                const userData = rows[0];
                if (userData.responsibleChef) {
                    // responsibleChef is now just a poste ID, no need to parse JSON
                    userData.responsibleChef = userData.responsibleChef;
                }
                return new User(userData);
            }
            return null;
        } finally {
            connection.release();
        }
    }

    // Update user - UPDATED to handle magasin_id
    async update(updateData) {
        const connection = await pool.getConnection();
        try {
            const fields = [];
            const values = [];

            Object.keys(updateData).forEach(key => {
                if (updateData[key] !== undefined) {
                    fields.push(`${key} = ?`);
                    // No special handling needed for responsibleChef since it's just a poste ID
                    values.push(updateData[key]);
                }
            });

            if (fields.length === 0) return false;

            values.push(this.id);
            const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
            
            const [result] = await connection.execute(query, values);
            return result.affectedRows > 0;
        } finally {
            connection.release();
        }
    }

    // Hash password
    static async hashPassword(password) {
        return await bcrypt.hash(password, 12);
    }

    // Compare password
    async comparePassword(password) {
        if (!this.password) return false;
        return await bcrypt.compare(password, this.password);
    }

    // Get all users (for admin) - UPDATED to include poste data
    static async findAll(includeRelations = false) {
        const connection = await pool.getConnection();
        try {
            let query = 'SELECT u.*';
            if (includeRelations) {
                query += ', m.id as magasin_id, m.name as magasin_name, m.address as magasin_address';
                query += ', p.id as poste_id, p.name as poste_name, p.description as poste_description, p.actions as poste_actions, p.parent_id as poste_parent_id';
            }
            query += ' FROM users u';
            if (includeRelations) {
                query += ' LEFT JOIN magasins m ON u.magasin_id = m.id';
                query += ' LEFT JOIN poste p ON u.poste = p.id';
            }
            query += ' ORDER BY u.createdAt DESC';
            
            const [rows] = await connection.execute(query);
            
            return rows.map(userData => {
                if (userData.responsibleChef) {
                    // responsibleChef is now just a poste ID, no need to parse JSON
                    userData.responsibleChef = userData.responsibleChef;
                }
                
                // If including relations, create magasin and poste objects
                if (includeRelations) {
                    // Magasin data
                    if (userData.magasin_id) {
                        userData.magasin = {
                            id: userData.magasin_id,
                            name: userData.magasin_name,
                            address: userData.magasin_address,
                            city: userData.magasin_city
                        };
                        delete userData.magasin_id;
                        delete userData.magasin_name;
                        delete userData.magasin_address;
                        delete userData.magasin_city;
                    }
                    
                    // Poste data
                    if (userData.poste_id) {
                        userData.posteData = {
                            id: userData.poste_id,
                            name: userData.poste_name,
                            description: userData.poste_description,
                            actions: userData.poste_actions ? JSON.parse(userData.poste_actions) : [],
                            parent_id: userData.poste_parent_id
                        };
                        delete userData.poste_id;
                        delete userData.poste_name;
                        delete userData.poste_description;
                        delete userData.poste_actions;
                        delete userData.poste_parent_id;
                    }
                }
                
                return new User(userData);
            });
        } finally {
            connection.release();
        }
    }

    // Find users by magasin_id
    static async findByMagasinId(magasinId, includeRelations = false) {
        const connection = await pool.getConnection();
        try {
            let query = 'SELECT u.*';
            if (includeRelations) {
                query += ', m.id as magasin_id, m.name as magasin_name, m.address as magasin_address';
                query += ', p.id as poste_id, p.name as poste_name, p.description as poste_description, p.actions as poste_actions, p.parent_id as poste_parent_id';
            }
            query += ' FROM users u';
            if (includeRelations) {
                query += ' LEFT JOIN magasins m ON u.magasin_id = m.id';
                query += ' LEFT JOIN poste p ON u.poste = p.id';
            }
            query += ' WHERE u.magasin_id = ? ORDER BY u.createdAt DESC';
            
            const [rows] = await connection.execute(query, [magasinId]);
            
            return rows.map(userData => {
                if (userData.responsibleChef) {
                    // responsibleChef is now just a poste ID, no need to parse JSON
                    userData.responsibleChef = userData.responsibleChef;
                }
                
                // If including relations, create magasin and poste objects
                if (includeRelations) {
                    // Magasin data
                    if (userData.magasin_id) {
                        userData.magasin = {
                            id: userData.magasin_id,
                            name: userData.magasin_name,
                            address: userData.magasin_address,
                            city: userData.magasin_city
                        };
                        delete userData.magasin_id;
                        delete userData.magasin_name;
                        delete userData.magasin_address;
                        delete userData.magasin_city;
                    }
                    
                    // Poste data
                    if (userData.poste_id) {
                        userData.posteData = {
                            id: userData.poste_id,
                            name: userData.poste_name,
                            description: userData.poste_description,
                            actions: userData.poste_actions ? JSON.parse(userData.poste_actions) : [],
                            parent_id: userData.poste_parent_id
                        };
                        delete userData.poste_id;
                        delete userData.poste_name;
                        delete userData.poste_description;
                        delete userData.poste_actions;
                        delete userData.poste_parent_id;
                    }
                }
                
                return new User(userData);
            });
        } finally {
            connection.release();
        }
    }

    // Get full poste hierarchy for this user
    async getPosteHierarchy() {
        if (!this.poste) return null;
        
        const connection = await pool.getConnection();
        try {
            const [posts] = await connection.execute(
                `SELECT p.*, parent.name as parent_name 
                 FROM poste p 
                 LEFT JOIN poste parent ON p.parent_id = parent.id 
                 WHERE p.id = ?`,
                [this.poste]
            );
            
            if (posts.length > 0) {
                const post = posts[0];
                post.actions = post.actions ? JSON.parse(post.actions) : [];
                return post;
            }
            return null;
        } finally {
            connection.release();
        }
    }

    // Delete user
    async delete() {
        const connection = await pool.getConnection();
        try {
            const [result] = await connection.execute('DELETE FROM users WHERE id = ?', [this.id]);
            return result.affectedRows > 0;
        } finally {
            connection.release();
        }
    }

    // Convert to JSON (exclude sensitive data)
    toJSON() {
        const { password, emailVerificationToken, emailVerificationExpires, ...userWithoutSensitiveData } = this;
        return userWithoutSensitiveData;
    }
}

module.exports = User;