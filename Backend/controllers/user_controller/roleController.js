const { Role } = require('../../models/user_models/index');

exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({
      attributes: ['id', 'role_name'],
    });
    res.json(roles.map(role => ({
      id: role.id,
      role_name: role.role_name,
    })));
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch roles',
    });
  }
};