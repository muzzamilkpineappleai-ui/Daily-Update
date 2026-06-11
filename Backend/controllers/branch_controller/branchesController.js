const { Branch } = require("../../models/branch_model/index");
const { Op } = require('sequelize');

exports.getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.findAll({
      attributes: ['id', 'country', 'branch_name', 'currency', 'created_at', 'updated_at'],
    });
    console.log('Fetched branches:', JSON.stringify(branches, null, 2));
    res.status(200).json(branches);
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ error: 'Failed to fetch branches', details: error.message });
  }
};

exports.getBranchById = async (req, res) => {
  try {
    const branch = await Branch.findByPk(req.params.id, {
      attributes: ['id', 'country', 'branch_name', 'currency', 'created_at', 'updated_at'],
    });
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    console.log('Fetched branch:', JSON.stringify(branch, null, 2));
    res.status(200).json(branch);
  } catch (error) {
    console.error('Error fetching branch:', error);
    res.status(500).json({ error: 'Failed to fetch branch', details: error.message });
  }
};

exports.createBranches = async (req, res) => {
  try {
    const branches = Array.isArray(req.body) ? req.body : [req.body];
    console.log('Received branches for creation:', JSON.stringify(branches, null, 2));
    
    const createdBranches = [];

    for (const branchData of branches) {
      const { country, branch_name, currency } = branchData;

      if (!country || !branch_name || !currency || typeof country !== 'string' || country.trim() === '') {
        return res.status(400).json({ 
          error: `Missing or invalid required fields: ${!country ? 'country' : ''} ${!branch_name ? 'branch_name' : ''} ${!currency ? 'currency' : ''} ${typeof country !== 'string' || country.trim() === '' ? 'country must be a non-empty string' : ''}`.trim() 
        });
      }

      const existingBranch = await Branch.findOne({
        where: {
          country: { [Op.like]: country },
          branch_name: { [Op.like]: branch_name },
        },
      });

      if (existingBranch) {
        return res.status(400).json({
          error: `Branch "${branch_name}" in "${country}" already exists`,
        });
      }

      const newBranch = await Branch.create({
        country: country.trim(),
        branch_name: branch_name.trim(),
        currency: currency.trim(),
      });
      createdBranches.push(newBranch);
    }

    console.log('Created branches:', JSON.stringify(createdBranches, null, 2));
    res.status(201).json(createdBranches);
  } catch (error) {
    console.error('Error creating branches:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({
        error: `Branch "${req.body.branch_name || 'unknown'}" in "${req.body.country || 'unknown'}" already exists`,
      });
    } else if (error.name === 'SequelizeDatabaseError') {
      res.status(500).json({
        error: `Database error: ${error.message}`,
      });
    } else {
      res.status(500).json({ error: 'Failed to create branches', details: error.message });
    }
  }
};

exports.updateBranch = async (req, res) => {
  try {
    console.log(`PATCH request received for branch ID ${req.params.id}:`, JSON.stringify(req.body, null, 2));
    const { country, branch_name, currency } = req.body;

    // find the branch first
    const branch = await Branch.findByPk(req.params.id);
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    // build an update object only with provided fields
    const updateData = {};
    if (country !== undefined) {
      if (typeof country !== 'string' || country.trim() === '') {
        return res.status(400).json({ error: 'Country must be a non-empty string' });
      }
      updateData.country = country.trim();
    }
    if (branch_name !== undefined) {
      if (typeof branch_name !== 'string' || branch_name.trim() === '') {
        return res.status(400).json({ error: 'Branch name must be a non-empty string' });
      }
      updateData.branch_name = branch_name.trim();
    }
    if (currency !== undefined) {
      if (typeof currency !== 'string' || currency.trim() === '') {
        return res.status(400).json({ error: 'Currency must be a non-empty string' });
      }
      updateData.currency = currency.trim();
    }

    // prevent update if no valid fields provided
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    updateData.updated_at = new Date();
    await branch.update(updateData);

    console.log('Updated branch:', JSON.stringify(branch, null, 2));
    res.status(200).json(branch);
  } catch (error) {
    console.error('Error updating branch:', error);
    res.status(500).json({ error: 'Failed to update branch', details: error.message });
  }
};


exports.deleteBranch = async (req, res) => {
  try {
    const branch = await Branch.findByPk(req.params.id);
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    await branch.destroy();
    console.log('Deleted branch ID:', req.params.id);
    res.status(200).json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Error deleting branch:', error);
    res.status(500).json({ error: 'Failed to delete branch', details: error.message });
  }
};