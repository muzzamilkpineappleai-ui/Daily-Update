const express = require('express');
const router = express.Router();
const branchController = require('../../controllers/branch_controller/branchesController');

router.get('/', branchController.getAllBranches);
router.get('/:id', branchController.getBranchById);
router.post('/', branchController.createBranches);
router.patch('/:id', branchController.updateBranch);
router.delete('/:id', branchController.deleteBranch);

module.exports = router;