const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// User management routes
router.get('/', userController.getAllUsers);
router.get('/find/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/update/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

// Chef-specific routes
router.get('/chefs', userController.getAllChefs);
router.get('/chefs/search', userController.searchChefs);

// Validation routes
router.put('/:id/validate-email', userController.validateUserEmail);
router.put('/:id/validate-rh', userController.validateUserRH);
router.put('/:id/validate-direction', userController.validateUserDirection);

// Bulk validation routes
router.put('/validate/bulk-email', userController.bulkValidateEmails);
router.put('/validate/bulk-rh', userController.bulkValidateRH);
router.put('/validate/bulk-direction', userController.bulkValidateDirection);

module.exports = router;

