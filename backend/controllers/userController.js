const User = require('../models/User');
const { pool } = require('../config/database');

const userController = {
  // Get all users with optional poste data, magasin name, and responsible chef name
  getAllUsers: async (req, res) => {
    try {
      const includeRelations = req.query.includeRelations === 'true';
      const users = await User.findAll(includeRelations);
      
      // Get additional details for all users
      const usersWithDetails = await Promise.all(
        users.map(async (user) => {
          const userJSON = user.toJSON();
          
          // If user has a magasin_id, get the magasin name
          if (userJSON.magasin_id) {
            try {
              const [magasinRows] = await pool.execute(
                'SELECT name FROM magasins WHERE id = ?',
                [userJSON.magasin_id]
              );
              
              if (magasinRows.length > 0) {
                userJSON.magasin_name = magasinRows[0].name;
              } else {
                userJSON.magasin_name = null;
              }
            } catch (error) {
              console.error('Error fetching magasin name:', error);
              userJSON.magasin_name = null;
            }
          } else {
            userJSON.magasin_name = null;
          }
          
          // If user has a responsibleChef, get the chef's name
          if (userJSON.responsibleChef) {
            try {
              const [chefRows] = await pool.execute(
                'SELECT firstname, lastname FROM users WHERE id = ?',
                [userJSON.responsibleChef]
              );
              
              if (chefRows.length > 0) {
                userJSON.responsibleChef_name = `${chefRows[0].firstname} ${chefRows[0].lastname}`;
              } else {
                userJSON.responsibleChef_name = null;
              }
            } catch (error) {
              console.error('Error fetching responsible chef name:', error);
              userJSON.responsibleChef_name = null;
            }
          } else {
            userJSON.responsibleChef_name = null;
          }
          
          return userJSON;
        })
      );
      
      res.json({
        success: true,
        data: usersWithDetails
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching users',
        error: error.message
      });
    }
  },

  // Get user by ID with optional poste data, magasin name, and responsible chef name
  getUserById: async (req, res) => {
    try {
      const includeRelations = req.query.includeRelations === 'true';
      const user = await User.findById(req.params.id, includeRelations);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      const userJSON = user.toJSON();
      
      // If user has a magasin_id, get the magasin name
      if (userJSON.magasin_id) {
        try {
          const [magasinRows] = await pool.execute(
            'SELECT name FROM magasins WHERE id = ?',
            [userJSON.magasin_id]
          );
          
          if (magasinRows.length > 0) {
            userJSON.magasin_name = magasinRows[0].name;
          } else {
            userJSON.magasin_name = null;
          }
        } catch (error) {
          console.error('Error fetching magasin name:', error);
          userJSON.magasin_name = null;
        }
      } else {
        userJSON.magasin_name = null;
      }
      
      // If user has a responsibleChef, get the chef's name
      if (userJSON.responsibleChef) {
        try {
          const [chefRows] = await pool.execute(
            'SELECT firstname, lastname FROM users WHERE id = ?',
            [userJSON.responsibleChef]
          );
          
          if (chefRows.length > 0) {
            userJSON.responsibleChef_name = `${chefRows[0].firstname} ${chefRows[0].lastname}`;
          } else {
            userJSON.responsibleChef_name = null;
          }
        } catch (error) {
          console.error('Error fetching responsible chef name:', error);
          userJSON.responsibleChef_name = null;
        }
      } else {
        userJSON.responsibleChef_name = null;
      }
      
      res.json({
        success: true,
        data: userJSON
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching user',
        error: error.message
      });
    }
  },

  // Create new user - UPDATED to return magasin name and responsible chef name
  createUser: async (req, res) => {
    try {
      const { email, firstname, lastname, poste, magasin_id, isAdmin, photo } = req.body;
      
      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Create user data with default validation values
      const userData = {
        email,
        firstname,
        lastname,
        poste,
        magasin_id: magasin_id || null,
        isAdmin: isAdmin || false,
        photo: photo || 'default.jpg',
        validEmail: false,
        verifiedProfileRh: false,
        verifiedProfileDirection: false
      };

      const userId = await User.create(userData);
      const newUser = await User.findById(userId, true);
      const userJSON = newUser.toJSON();
      
      // Get magasin name if user has a magasin_id
      if (userJSON.magasin_id) {
        try {
          const [magasinRows] = await pool.execute(
            'SELECT name FROM magasins WHERE id = ?',
            [userJSON.magasin_id]
          );
          
          if (magasinRows.length > 0) {
            userJSON.magasin_name = magasinRows[0].name;
          } else {
            userJSON.magasin_name = null;
          }
        } catch (error) {
          console.error('Error fetching magasin name:', error);
          userJSON.magasin_name = null;
        }
      } else {
        userJSON.magasin_name = null;
      }
      
      // Get responsible chef name if user has a responsibleChef
      if (userJSON.responsibleChef) {
        try {
          const [chefRows] = await pool.execute(
            'SELECT firstname, lastname FROM users WHERE id = ?',
            [userJSON.responsibleChef]
          );
          
          if (chefRows.length > 0) {
            userJSON.responsibleChef_name = `${chefRows[0].firstname} ${chefRows[0].lastname}`;
          } else {
            userJSON.responsibleChef_name = null;
          }
        } catch (error) {
          console.error('Error fetching responsible chef name:', error);
          userJSON.responsibleChef_name = null;
        }
      } else {
        userJSON.responsibleChef_name = null;
      }
      
      res.status(201).json({
        success: true,
        data: userJSON,
        message: 'User created successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating user',
        error: error.message
      });
    }
  },

  // Update user - UPDATED to return magasin name and responsible chef name
  updateUser: async (req, res) => {
    try {
      const { 
        email, 
        firstname, 
        lastname, 
        poste, 
        magasin_id, 
        isAdmin, 
        photo, 
        validEmail, 
        verifiedProfileRh, 
        verifiedProfileDirection 
      } = req.body;
      
      // Find the user first
      const user = await User.findById(req.params.id, false);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if email is being changed and if it already exists
      if (email && email !== user.email) {
        const existingUser = await User.findByEmail(email, false);
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'User with this email already exists'
          });
        }
      }

      // Prepare update data with all possible fields
      const updateData = {};
      if (email !== undefined) updateData.email = email;
      if (firstname !== undefined) updateData.firstname = firstname;
      if (lastname !== undefined) updateData.lastname = lastname;
      if (poste !== undefined) {
        updateData.poste = poste;
        // If poste is being updated, we need to update responsibleChef as well
        if (poste) {
          const connection = await pool.getConnection();
          try {
            const [posteRows] = await connection.execute(
              'SELECT parent_id FROM poste WHERE id = ?',
              [poste]
            );
            if (posteRows.length > 0 && posteRows[0].parent_id) {
              updateData.responsibleChef = posteRows[0].parent_id;
            } else {
              updateData.responsibleChef = null;
            }
          } finally {
            connection.release();
          }
        }
      }
      if (magasin_id !== undefined) updateData.magasin_id = magasin_id;
      if (isAdmin !== undefined) updateData.isAdmin = isAdmin;
      if (photo !== undefined) updateData.photo = photo;
      if (validEmail !== undefined) updateData.validEmail = validEmail;
      if (verifiedProfileRh !== undefined) updateData.verifiedProfileRh = verifiedProfileRh;
      if (verifiedProfileDirection !== undefined) updateData.verifiedProfileDirection = verifiedProfileDirection;

      // Update the user
      const updated = await user.update(updateData);
      if (!updated) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update user'
        });
      }

      // Fetch updated user without relations
      const updatedUser = await User.findById(req.params.id, false);
      const userJSON = updatedUser.toJSON();
      
      // Get magasin name if user has a magasin_id
      if (userJSON.magasin_id) {
        try {
          const [magasinRows] = await pool.execute(
            'SELECT name FROM magasins WHERE id = ?',
            [userJSON.magasin_id]
          );
          
          if (magasinRows.length > 0) {
            userJSON.magasin_name = magasinRows[0].name;
          } else {
            userJSON.magasin_name = null;
          }
        } catch (error) {
          console.error('Error fetching magasin name:', error);
          userJSON.magasin_name = null;
        }
      } else {
        userJSON.magasin_name = null;
      }
      
      // Get responsible chef name if user has a responsibleChef
      if (userJSON.responsibleChef) {
        try {
          const [chefRows] = await pool.execute(
            'SELECT firstname, lastname FROM users WHERE id = ?',
            [userJSON.responsibleChef]
          );
          
          if (chefRows.length > 0) {
            userJSON.responsibleChef_name = `${chefRows[0].firstname} ${chefRows[0].lastname}`;
          } else {
            userJSON.responsibleChef_name = null;
          }
        } catch (error) {
          console.error('Error fetching responsible chef name:', error);
          userJSON.responsibleChef_name = null;
        }
      } else {
        userJSON.responsibleChef_name = null;
      }
      
      res.json({
        success: true,
        data: userJSON,
        message: 'User updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating user',
        error: error.message
      });
    }
  },

  // Get all chefs with poste data, magasin name, and responsible chef name
  getAllChefs: async (req, res) => {
    try {
      const includeRelations = req.query.includeRelations === 'true';
      const allUsers = await User.findAll(includeRelations);
      
      // Filter users who have a poste (either as ID or object)
      const chefs = allUsers.filter(user => user.poste || user.posteData);
      
      // Add details to each chef
      const chefsWithDetails = await Promise.all(
        chefs.map(async (chef) => {
          const chefData = {
            id: chef.id,
            firstname: chef.firstname,
            lastname: chef.lastname,
            email: chef.email,
            poste: chef.poste,
            posteData: chef.posteData,
            magasin_id: chef.magasin_id,
            magasin_name: null,
            responsibleChef: chef.responsibleChef,
            responsibleChef_name: null
          };
          
          // Get magasin name if chef has a magasin_id
          if (chef.magasin_id) {
            try {
              const [magasinRows] = await pool.execute(
                'SELECT name FROM magasins WHERE id = ?',
                [chef.magasin_id]
              );
              
              if (magasinRows.length > 0) {
                chefData.magasin_name = magasinRows[0].name;
              }
            } catch (error) {
              console.error('Error fetching magasin name:', error);
            }
          }
          
          // Get responsible chef name if chef has a responsibleChef
          if (chef.responsibleChef) {
            try {
              const [chefRows] = await pool.execute(
                'SELECT firstname, lastname FROM users WHERE id = ?',
                [chef.responsibleChef]
              );
              
              if (chefRows.length > 0) {
                chefData.responsibleChef_name = `${chefRows[0].firstname} ${chefRows[0].lastname}`;
              }
            } catch (error) {
              console.error('Error fetching responsible chef name:', error);
            }
          }
          
          return chefData;
        })
      );
      
      res.json({
        success: true,
        data: chefsWithDetails
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching chefs',
        error: error.message
      });
    }
  },

  // Search chefs with poste data, magasin name, and responsible chef name
  searchChefs: async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.json({
          success: true,
          data: []
        });
      }

      const includeRelations = req.query.includeRelations === 'true';
      const allUsers = await User.findAll(includeRelations);
      
      // Filter users who have a poste
      const chefs = allUsers.filter(user => user.poste || user.posteData);

      const searchQuery = q.toLowerCase();
      const filteredChefs = chefs.filter(chef => 
        chef.firstname.toLowerCase().includes(searchQuery) ||
        chef.lastname.toLowerCase().includes(searchQuery) ||
        chef.email.toLowerCase().includes(searchQuery) ||
        (chef.posteData && chef.posteData.name.toLowerCase().includes(searchQuery))
      );
      
      // Add details to each chef
      const chefsWithDetails = await Promise.all(
        filteredChefs.map(async (chef) => {
          const chefData = {
            id: chef.id,
            firstname: chef.firstname,
            lastname: chef.lastname,
            email: chef.email,
            poste: chef.poste,
            posteData: chef.posteData,
            magasin_id: chef.magasin_id,
            magasin_name: null,
            responsibleChef: chef.responsibleChef,
            responsibleChef_name: null
          };
          
          // Get magasin name if chef has a magasin_id
          if (chef.magasin_id) {
            try {
              const [magasinRows] = await pool.execute(
                'SELECT name FROM magasins WHERE id = ?',
                [chef.magasin_id]
              );
              
              if (magasinRows.length > 0) {
                chefData.magasin_name = magasinRows[0].name;
              }
            } catch (error) {
              console.error('Error fetching magasin name:', error);
            }
          }
          
          // Get responsible chef name if chef has a responsibleChef
          if (chef.responsibleChef) {
            try {
              const [chefRows] = await pool.execute(
                'SELECT firstname, lastname FROM users WHERE id = ?',
                [chef.responsibleChef]
              );
              
              if (chefRows.length > 0) {
                chefData.responsibleChef_name = `${chefRows[0].firstname} ${chefRows[0].lastname}`;
              }
            } catch (error) {
              console.error('Error fetching responsible chef name:', error);
            }
          }
          
          return chefData;
        })
      );
      
      res.json({
        success: true,
        data: chefsWithDetails
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error searching chefs',
        error: error.message
      });
    }
  },

  // Delete user
  deleteUser: async (req, res) => {
    try {
      const user = await User.findById(req.params.id, false); // Don't include relations
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const deleted = await user.delete();
      if (!deleted) {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete user'
        });
      }

      res.json({
        success: true,
        message: 'User deleted successfully',
        data: user.toJSON()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting user',
        error: error.message
      });
    }
  },

  // Get all chefs (users with chef-related positions) with poste data
  getAllChefs: async (req, res) => {
    try {
      const includeRelations = req.query.includeRelations === 'true';
      const allUsers = await User.findAll(includeRelations);
      
      // Filter users who have a poste (either as ID or object)
      const chefs = allUsers.filter(user => {
        // Check if user has a poste (either as ID or posteData object)
        const hasPoste = user.poste || user.posteData;
        return hasPoste;
      });
      
      res.json({
        success: true,
        data: chefs.map(chef => ({
          id: chef.id,
          firstname: chef.firstname,
          lastname: chef.lastname,
          email: chef.email,
          poste: chef.poste, // poste ID
          posteData: chef.posteData // full poste object (if includeRelations=true)
        }))
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching chefs',
        error: error.message
      });
    }
  },

  // Search chefs with poste data
  searchChefs: async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.json({
          success: true,
          data: []
        });
      }

      const includeRelations = req.query.includeRelations === 'true';
      const allUsers = await User.findAll(includeRelations);
      
      // Filter users who have a poste
      const chefs = allUsers.filter(user => user.poste || user.posteData);

      const searchQuery = q.toLowerCase();
      const filteredChefs = chefs.filter(chef => 
        chef.firstname.toLowerCase().includes(searchQuery) ||
        chef.lastname.toLowerCase().includes(searchQuery) ||
        chef.email.toLowerCase().includes(searchQuery) ||
        (chef.posteData && chef.posteData.name.toLowerCase().includes(searchQuery))
      );
      
      res.json({
        success: true,
        data: filteredChefs.map(chef => ({
          id: chef.id,
          firstname: chef.firstname,
          lastname: chef.lastname,
          email: chef.email,
          poste: chef.poste,
          posteData: chef.posteData
        }))
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error searching chefs',
        error: error.message
      });
    }
  },

  // Validate user email
  validateUserEmail: async (req, res) => {
    try {
      const { isValid } = req.body;
      
      const user = await User.findById(req.params.id, false); // Don't include relations
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update validation status
      const updated = await user.update({ validEmail: isValid });
      if (!updated) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update email validation'
        });
      }

      const updatedUser = await User.findById(req.params.id, false); // Don't include relations
      res.json({
        success: true,
        data: updatedUser.toJSON(),
        message: `Email validation ${isValid ? 'approved' : 'rejected'}`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error validating email',
        error: error.message
      });
    }
  },

  // Validate user RH profile
  validateUserRH: async (req, res) => {
    try {
      const { isValid } = req.body;
      
      const user = await User.findById(req.params.id, false); // Don't include relations
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const updated = await user.update({ verifiedProfileRh: isValid });
      if (!updated) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update RH validation'
        });
      }

      const updatedUser = await User.findById(req.params.id, false); // Don't include relations
      res.json({
        success: true,
        data: updatedUser.toJSON(),
        message: `RH validation ${isValid ? 'approved' : 'rejected'}`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error validating RH profile',
        error: error.message
      });
    }
  },

  // Validate user Direction profile
  validateUserDirection: async (req, res) => {
    try {
      const { isValid } = req.body;
      
      const user = await User.findById(req.params.id, false); // Don't include relations
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const updated = await user.update({ verifiedProfileDirection: isValid });
      if (!updated) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update direction validation'
        });
      }

      const updatedUser = await User.findById(req.params.id, false); // Don't include relations
      res.json({
        success: true,
        data: updatedUser.toJSON(),
        message: `Direction validation ${isValid ? 'approved' : 'rejected'}`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error validating direction profile',
        error: error.message
      });
    }
  },

  // Bulk validate emails
  bulkValidateEmails: async (req, res) => {
    try {
      const { userIds, isValid } = req.body;
      
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'userIds must be a non-empty array'
        });
      }

      let updatedCount = 0;
      for (const userId of userIds) {
        const user = await User.findById(userId, false); // Don't include relations
        if (user) {
          const updated = await user.update({ validEmail: isValid });
          if (updated) updatedCount++;
        }
      }

      res.json({
        success: true,
        message: `${updatedCount} users' email validation updated`,
        data: { modifiedCount: updatedCount }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error bulk validating emails',
        error: error.message
      });
    }
  },

  // Bulk validate RH profiles
  bulkValidateRH: async (req, res) => {
    try {
      const { userIds, isValid } = req.body;
      
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'userIds must be a non-empty array'
        });
      }

      let updatedCount = 0;
      for (const userId of userIds) {
        const user = await User.findById(userId, false); // Don't include relations
        if (user) {
          const updated = await user.update({ verifiedProfileRh: isValid });
          if (updated) updatedCount++;
        }
      }

      res.json({
        success: true,
        message: `${updatedCount} users' RH validation updated`,
        data: { modifiedCount: updatedCount }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error bulk validating RH profiles',
        error: error.message
      });
    }
  },

  // Bulk validate Direction profiles
  bulkValidateDirection: async (req, res) => {
    try {
      const { userIds, isValid } = req.body;
      
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'userIds must be a non-empty array'
        });
      }

      let updatedCount = 0;
      for (const userId of userIds) {
        const user = await User.findById(userId, false); // Don't include relations
        if (user) {
          const updated = await user.update({ verifiedProfileDirection: isValid });
          if (updated) updatedCount++;
        }
      }

      res.json({
        success: true,
        message: `${updatedCount} users' direction validation updated`,
        data: { modifiedCount: updatedCount }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error bulk validating direction profiles',
        error: error.message
      });
    }
  }
};

module.exports = userController;