const express = require('express');
const router = express.Router();
const roleController = require('../../controllers/user_controller/roleController'); 

router.get('/', roleController.getAllRoles);

module.exports = router;