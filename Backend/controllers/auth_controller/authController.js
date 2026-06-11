const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../models/auth_models'); 
require('dotenv').config();

const { User, Role } = db;
const { Op } = db.Sequelize;

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-2025';
const JWT_EXPIRES_IN = '8h';
 
exports.register = async (req, res) => {
  try {
    const {
      first_name, last_name, gender, username, password, email,
      phn_num, date_of_birth, role_name, status = 'active', address, id_code
    } = req.body;

    if (!first_name || !last_name || !username || !password || !email || !role_name || !id_code) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    const existingUser = await User.findOne({
      where: { [Op.or]: [{ username }, { email }] }
    });
    if (existingUser) return res.status(400).json({ message: 'Username or email already taken' });

    const role = await Role.findOne({
      where: { role_name: { [Op.iLike]: role_name.trim() } }
    });

    if (!role) {
      const available = await Role.findAll({ attributes: ['role_name'] });
      return res.status(400).json({
        message: 'Invalid role name',
        available_roles: available.map(r => r.role_name)
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      first_name, last_name, gender, username,
      password: hashedPassword, email, phn_num, date_of_birth,
      role_id: role.id, status, address, id_code
    });

    return res.status(201).json({
      message: 'User registered successfully!',
      user: {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        role: role.role_name
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

 
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await User.findOne({
      where: { username },
      include: [{
        model: Role,
        as: 'Role',
        attributes: ['role_name']
      }]
    });

    if (!user || user.status !== 'active') {
      return res.status(401).json({ message: 'Invalid credentials or account inactive' });
    }

    if (!user.Role) {
      return res.status(403).json({ message: 'Access denied: No role assigned' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if role name contains "admin"  
    const roleName = user.Role.role_name.toLowerCase();
    const isAdmin = roleName.includes('admin');

    if (!isAdmin) {
      return res.status(403).json({
        message: 'Access Denied',
        error: 'This portal is only for Admin users. Your role is not authorized.'
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role_id: user.role_id,
        role: user.Role.role_name,
        status: user.status
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      message: 'Login successful! Welcome Admin',
      token,
      user: {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.Role.role_name,
        status: user.status
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

 
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Role, as: 'Role', attributes: ['role_name'] }]
    });

    if (!user || !user.Role) {
      return res.status(404).json({ message: 'User or role not found' });
    }

    const isAdmin = user.Role.role_name.toLowerCase().includes('admin');
    if (!isAdmin) {
      return res.status(403).json({
        message: 'Access Denied',
        error: 'Only Admin users can access this portal.'
      });
    }

    res.json({
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        email: user.email,
        role: user.Role.role_name,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};