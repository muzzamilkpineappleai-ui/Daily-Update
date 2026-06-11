const {
  User, Slot, Role, StudentDetails, LecturerDetails, OtherUserDetails,
  UserGrade, UserSlot, UserBranch, Branch, Grade, Course, sequelize
} = require('../../models/user_models/index');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

//test connection when server starts
transporter.verify((error, success) => {
  if (error) {
    console.error('Gmail connection failed:', error.message);
  } else {
    console.log('Gmail ready to send Gmails');
  }
});

// OTP memory store
let emailOtpStore = {};


const getDetailsModel = (roleName) => {
  if (roleName === 'student') {
    return { model: StudentDetails, as: 'StudentDetail', tableName: 'student_details' };
  } else if (roleName === 'teacher') {
    return { model: LecturerDetails, as: 'LecturerDetail', tableName: 'lecturer_details' };
  }
  return { model: OtherUserDetails, as: 'OtherDetail', tableName: 'other_user_details' };
};

const generateQRCode = async (data) => {
  if (!data || typeof data !== 'string' || data.trim() === '') {
    throw new Error('Invalid or empty QR code data');
  }
  return QRCode.toDataURL(data, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    quality: 0.92,
  });
};

const parseJsonSafe = (maybeJson, fallback) => {
  if (!maybeJson) return fallback;
  if (typeof maybeJson === 'object') return maybeJson;
  try {
    return JSON.parse(maybeJson);
  } catch (err) {
    return fallback;
  }
};

const safeUnlink = async (filePath) => {
  try {
    await fs.unlink(filePath);
    console.log('safeUnlink - deleted:', filePath);
  } catch (err) {
    console.warn('safeUnlink - could not delete:', filePath, 'Error:', err.message);
  }
};

const photoUrlToFsPath = (photo_url) => {
  if (!photo_url || photo_url.includes('default')) return null;
  let clean = photo_url.replace(/^https?:\/\/[^/]+/, '').replace(/^\/+/, '');
  return path.join(__dirname, '..', '..', clean);
};

exports.finalizeUserRegistration = async (req, res) => {
  const transaction = await sequelize.transaction();
  let parsedUser = {};
  try {
    const { user, additional_details, grade_ids, slot_ids, branch_ids } = req.body;
    parsedUser = parseJsonSafe(user, {});
    const parsedDetails = parseJsonSafe(additional_details, {});
    const parsedGradeIds = parseJsonSafe(grade_ids, []);
    const parsedSlotIds = parseJsonSafe(slot_ids, []);
    const parsedBranchIds = parseJsonSafe(branch_ids, []);

    if (!parsedUser.role_name) throw new Error('Role name is required');

    const role = await Role.findOne({ where: { role_name: parsedUser.role_name }, transaction });
    if (!role) throw new Error(`Invalid role: ${parsedUser.role_name}`);

    const uniqueId = uuidv4();
    let qrCodeImage = null;
    try {
      qrCodeImage = await generateQRCode(uniqueId);
    } catch (qrErr) {
      console.warn('QR code generation skipped during registration:', qrErr.message);
    }

    const defaultPassword = 'Default@123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    if (parsedUser.role_name === 'student') {
      const studentNo = (parsedDetails.student_no || '').trim();
      if (!studentNo) throw new Error('Student number is required for students');
      const existingStudent = await StudentDetails.findOne({
        where: { student_no: studentNo },
        transaction
      });
      if (existingStudent) throw new Error('This Student Number already exists. Please choose a unique student number.');

      let cleanLastName = (parsedUser.last_name || 'student')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 15);
      if (!cleanLastName) cleanLastName = 'student';
      const cleanStudentNo = studentNo.replace(/\s+/g, '_').toUpperCase();
      parsedUser.username = `${cleanLastName}_${cleanStudentNo}`;
    } else {
      let baseName = (parsedUser.last_name || parsedUser.first_name || 'user')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 12);
      if (!baseName) baseName = 'user';
      let username;
      let attempts = 0;
      const maxAttempts = 100;
      do {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        username = `${baseName}${randomNum}`;
        attempts++;
        const exists = await User.findOne({
          where: { username },
          transaction
        });
        if (!exists) {
          parsedUser.username = username;
          break;
        }
      } while (attempts < maxAttempts);
      if (attempts >= maxAttempts) {
        parsedUser.username = `${baseName}${Date.now().toString().slice(-6)}`;
      }
    }

    const newUser = await User.create({
      ...parsedUser,
      role_id: role.id,
      password: hashedPassword,
      status: (parsedUser.status || 'active').toLowerCase(),
      id_code: uniqueId
    }, { transaction });

    const photoUrl = req.file ? `/uploads/${req.file.filename}` : '/default-avatar.png';

    const { model: DetailsModel } = getDetailsModel(parsedUser.role_name);
    const detailsPayload = {
      user_id: newUser.id,
      salutation: parsedDetails.salutation || null,
      ice_contact: parsedDetails.ice_contact || null,
      photo_url: photoUrl,
    };
    if (parsedUser.role_name === 'student') {
      detailsPayload.student_no = parsedDetails.student_no.trim();
    }
    await DetailsModel.create(detailsPayload, { transaction });

    if (parsedUser.role_name === 'student') {
      if (Array.isArray(parsedGradeIds) && parsedGradeIds.length > 0) {
        await UserGrade.bulkCreate(parsedGradeIds.map(gid => ({ user_id: newUser.id, grade_id: gid })), { transaction });
      }
      if (Array.isArray(parsedSlotIds) && parsedSlotIds.length > 0) {
        await UserSlot.bulkCreate(parsedSlotIds.map(sid => ({ user_id: newUser.id, slot_id: sid })), { transaction });
      }
      if (Array.isArray(parsedBranchIds) && parsedBranchIds.length > 0) {
        await UserBranch.bulkCreate(parsedBranchIds.map(bid => ({ user_id: newUser.id, branch_id: bid })), { transaction, ignoreDuplicates: true });
      }
    }

    await transaction.commit();
    res.status(201).json({
      success: true,
      message: `${parsedUser.role_name.charAt(0).toUpperCase() + parsedUser.role_name.slice(1)} registered successfully`,
      user_id: newUser.id,
      username: newUser.username,
      student_no: parsedUser.role_name === 'student' ? (parsedDetails.student_no || null) : null,
      role_name: parsedUser.role_name,
      photo_url: photoUrl,
      id_code: uniqueId,
      qr_code_image: qrCodeImage,
      default_password: defaultPassword,
    });
  } catch (error) {
    await transaction.rollback();
    if (req.file) {
      const filePath = path.join(__dirname, '..', '..', 'uploads', req.file.filename);
      await safeUnlink(filePath);
    }
    console.error('Registration failed:', error.message);
    let message = 'Registration failed';
    if (error.message && error.message.includes('Student Number already exists')) message = error.message;
    else if (error.message && (error.message.includes('unique constraint') || error.message.includes('Duplicate entry'))) {
      message = 'Email, username, or student number already exists';
    } else if (error.message) message = error.message;
    res.status(400).json({ success: false, message });
  }
};

exports.resolveQRCode = async (req, res) => {
  try {
    const { qrData } = req.body;
    if (!qrData) return res.status(400).json({ success: false, error: 'QR code data is required' });

    const user = await User.findOne({
      where: { id_code: qrData },
      include: [
        { model: Role, as: 'Role', attributes: ['role_name'] },
        { model: StudentDetails, as: 'StudentDetail', attributes: ['student_no', 'photo_url'], required: false },
        {
          model: UserGrade,
          as: 'UserGrades',
          required: false,
          include: [
            {
              model: Grade,
              as: 'Grade',
              attributes: ['id', 'grade_name'],
              include: [{ model: Course, as: 'Course', attributes: ['id', 'name'] }],
            },
          ],
        },
        {
          model: UserBranch,
          as: 'UserBranches',
          required: false,
          include: [{ model: Branch, as: 'Branch', attributes: ['id', 'branch_name'] }],
        },
      ],
    });

    if (!user) return res.status(404).json({ success: false, error: 'User not found for this QR code' });

    let qrCodeImage = null;
    try {
      qrCodeImage = await generateQRCode(user.id_code);
    } catch (qrErr) {
      console.warn('Failed to generate QR image for resolveQRCode:', qrErr.message);
    }

    const userData = {
      id: user.id,
      role_name: user.Role.role_name,
      student_no: user.StudentDetail?.student_no || null,
      first_name: user.first_name,
      last_name: user.last_name,
      photo_url: user.StudentDetail?.photo_url || null,
      id_code: user.id_code || null,
      qr_code_image: qrCodeImage,
    };

    if (user.Role.role_name === 'student') {
      userData.courses = (user.UserGrades || []).map(ug => ({
        course_id: ug.Grade?.Course?.id || null,
        course_name: ug.Grade?.Course?.name || 'N/A',
        grade_id: ug.Grade?.id || null,
        grade_name: ug.Grade?.grade_name || 'N/A',
      }));
      userData.branches = (user.UserBranches || []).map(ub => ({
        branch_id: ub.Branch?.id || null,
        branch_name: ub.Branch?.branch_name || 'N/A'
      }));
    } else {
      userData.courses = [];
      userData.branches = [];
    }

    res.json({ success: true, user: userData });
  } catch (error) {
    console.error('Error resolving QR code:', error.message, error.stack);
    res.status(400).json({ success: false, error: error.message || 'Failed to resolve QR' });
  }
};

exports.getUserQR = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) return res.status(400).json({ success: false, error: 'Invalid user id' });

    const user = await User.findOne({ where: { id: userId }, attributes: ['id_code'] });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    if (!user.id_code) return res.status(404).json({ success: false, error: 'User does not have an id_code' });

    let qrCodeImage = null;
    try {
      qrCodeImage = await generateQRCode(user.id_code);
    } catch (qrErr) {
      console.warn('Failed to generate QR image for getUserQR:', qrErr.message);
      return res.status(500).json({ success: false, error: 'Failed to generate QR code' });
    }

    res.json({ success: true, qr_code_image: qrCodeImage, id_code: user.id_code });
  } catch (error) {
    console.error('getUserQR error:', error.message, error.stack);
    res.status(500).json({ success: false, error: 'Failed to fetch user QR' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { role, status, page = 1, limit = 9 } = req.query;
    const offset = (page - 1) * limit;
    const where = {};
    if (role) where['$Role.role_name$'] = role;
    if (status) where.status = status;

    const { rows: users, count: total } = await User.findAndCountAll({
      where,
      limit: Number(limit),
      offset: Number(offset),
      include: [
        { model: Role, as: 'Role', attributes: ['id', 'role_name'], required: true },
        { model: StudentDetails, as: 'StudentDetail', attributes: ['student_no', 'salutation', 'ice_contact', 'photo_url'], required: false },
        { model: LecturerDetails, as: 'LecturerDetail', attributes: ['salutation', 'ice_contact', 'photo_url'], required: false },
        { model: OtherUserDetails, as: 'OtherDetail', attributes: ['salutation', 'ice_contact', 'photo_url'], required: false }
      ],
      attributes: ['id', 'first_name', 'last_name', 'username', 'email', 'phn_num', 'gender', 'date_of_birth', 'address', 'status', 'role_id', 'id_code'],
      order: [['id', 'DESC']]
    });

    const formatted = users.map((user) => {
      const details = user.StudentDetail || user.LecturerDetail || user.OtherDetail || {};
      return {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        name: `${user.first_name} ${user.last_name}`.trim(),
        username: user.username,
        email: user.email,
        phn_num: user.phn_num,
        gender: user.gender,
        date_of_birth: user.date_of_birth,
        address: user.address,
        status: user.status,
        role_id: user.role_id,
        role_name: user.Role?.role_name || 'N/A',
        id_code: user.id_code,
        qr_code_image: null,
        salutation: details.salutation || null,
        ice_contact: details.ice_contact || null,
        photo_url: details.photo_url || null,
        student_no: user.StudentDetail?.student_no || null,
        details
      };
    });

    res.json({
      success: true,
      data: formatted,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error.message, error.stack);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch users' });
  }
};

exports.createUserProfile = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const user = await User.findOne({ where: { id: req.params.userId }, include: [{ model: Role, as: 'Role' }], transaction });
    if (!user) throw new Error('User does not exist');

    const roleName = user.Role.role_name;
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const { model: DetailsModel } = getDetailsModel(roleName);
    if (roleName === 'student' && (!req.body.student_no || !req.body.student_no.trim())) {
      throw new Error('Student number is required');
    }

    const payload = {
      user_id: req.params.userId,
      salutation: req.body.salutation || null,
      ice_contact: req.body.ice_contact || null,
      photo_url: photoUrl,
    };
    if (roleName === 'student') payload.student_no = req.body.student_no;

    const profile = await DetailsModel.create(payload, { transaction });
    await transaction.commit();

    return res.status(201).json({
      success: true,
      profile,
      photo_url: photoUrl,
      role_name: roleName,
      id_code: user.id_code || null,
      qr_code_image: null,
    });
  } catch (error) {
    await transaction.rollback();
    if (req.file) {
      const filePath = path.join(__dirname, '..', '..', 'uploads', req.file.filename);
      await safeUnlink(filePath);
    }
    console.error('Error creating profile:', error.message, error.stack);
    res.status(400).json({ success: false, error: error.message || 'Profile creation failed' });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({
      where: { id: req.params.userId },
      include: [
        { model: Role, as: 'Role', attributes: ['id', 'role_name'] },
        { model: StudentDetails, as: 'StudentDetail', attributes: ['student_no', 'salutation', 'ice_contact', 'photo_url'], required: false },
        { model: LecturerDetails, as: 'LecturerDetail', attributes: ['salutation', 'ice_contact', 'photo_url'], required: false },
        { model: OtherUserDetails, as: 'OtherDetail', attributes: ['salutation', 'ice_contact', 'photo_url'], required: false },
      ],
      attributes: ['id', 'first_name', 'last_name', 'username', 'email', 'phn_num', 'gender', 'date_of_birth', 'address', 'status', 'role_id', 'id_code'],
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const roleName = user.Role.role_name;
    const { as: detailsAs } = getDetailsModel(roleName);
    const details = user[detailsAs] || {};

    res.json({
      ...user.toJSON(),
      role_name: roleName,
      details,
      id_code: user.id_code || null,
      qr_code_image: null,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error.message, error.stack);
    res.status(500).json({ error: error.message || 'Failed to fetch user profile' });
  }
};

exports.updateUserProfile = async (req, res) => {
  const transaction = await sequelize.transaction();
  let userDetails = {};
  let additionalDetails = {};
  let gradeIds = [];
  let slotIds = [];
  let roleName = 'other';
  let photoUrl = null;

  try {
    if (req.body.user) userDetails = parseJsonSafe(req.body.user, {});
    if (req.body.additional_details) additionalDetails = parseJsonSafe(req.body.additional_details, {});
    if (req.body.grade_ids) gradeIds = parseJsonSafe(req.body.grade_ids, []);
    if (req.body.slot_ids) slotIds = parseJsonSafe(req.body.slot_ids, []);

    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) throw new Error('Invalid user ID');

    const user = await User.findOne({ where: { id: userId }, transaction });
    if (!user) throw new Error('User not found');

    const role = await Role.findOne({ where: { id: user.role_id }, transaction });
    roleName = role.role_name;
    let roleId = user.role_id;

    if (userDetails.role_name) {
      const newRole = await Role.findOne({ where: { role_name: userDetails.role_name }, transaction });
      if (!newRole) throw new Error(`Invalid role: ${userDetails.role_name}`);
      roleId = newRole.id;
      roleName = newRole.role_name;
    }

    const validStatuses = ['active', 'inactive'];
    if (req.body.status && !validStatuses.includes(req.body.status.toLowerCase())) {
      throw new Error('Invalid status value. Must be "active" or "inactive".');
    }

    let idCode = user.id_code;
    if ((userDetails.email && userDetails.email !== user.email) || (userDetails.username && userDetails.username !== user.username)) {
      idCode = uuidv4();
    }

    const password = userDetails.password ? await bcrypt.hash(userDetails.password, 10) : user.password;

    await User.update({
      first_name: userDetails.first_name || user.first_name,
      last_name: userDetails.last_name || user.last_name,
      username: userDetails.username || user.username,
      email: userDetails.email || user.email,
      phn_num: userDetails.phn_num || user.phn_num,
      gender: userDetails.gender || user.gender,
      date_of_birth: userDetails.date_of_birth || user.date_of_birth,
      address: userDetails.address || user.address,
      role_id: roleId,
      password,
      status: req.body.status?.toLowerCase() || user.status,
      id_code: idCode,
    }, { where: { id: userId }, transaction });

    const { model: DetailsModel } = getDetailsModel(roleName);
    const existingDetails = await DetailsModel.findOne({ where: { user_id: userId }, transaction });

    if (req.file) {
      photoUrl = `/uploads/${req.file.filename}`;
      if (existingDetails?.photo_url && !existingDetails.photo_url.includes('default')) {
        const oldPath = photoUrlToFsPath(existingDetails.photo_url);
        if (oldPath) await safeUnlink(oldPath);
      }
    } else {
      photoUrl = existingDetails?.photo_url || null;
    }

    const updateData = {
      salutation: additionalDetails.salutation ?? existingDetails?.salutation,
      ice_contact: additionalDetails.ice_contact ?? existingDetails?.ice_contact,
      photo_url: photoUrl,
    };
    if (roleName === 'student') {
      updateData.student_no = additionalDetails.student_no?.trim() || existingDetails?.student_no || null;
      if (!updateData.student_no) throw new Error('Student number is required for students');
    }

    const entries = Object.fromEntries(Object.entries(updateData).filter(([_, v]) => v !== undefined));
    const [detailsUpdated] = await DetailsModel.update(entries, { where: { user_id: userId }, transaction });

    if (detailsUpdated === 0 && Object.keys(entries).length > 0) {
      await DetailsModel.create({ user_id: userId, ...entries }, { transaction });
    }

    if (roleName === 'student') {
      if (Array.isArray(gradeIds) && gradeIds.length > 0) {
        await UserGrade.destroy({ where: { user_id: userId }, transaction });
        await UserGrade.bulkCreate(gradeIds.map(gid => ({ user_id: userId, grade_id: parseInt(gid, 10) })), { transaction });
      }
      if (Array.isArray(slotIds) && slotIds.length > 0) {
        await UserSlot.destroy({ where: { user_id: userId }, transaction });
        await UserSlot.bulkCreate(slotIds.map(sid => ({ user_id: userId, slot_id: parseInt(sid, 10) })), { transaction });
      }
    }

    await transaction.commit();
    res.json({ success: true, photo_url: photoUrl, role_name: roleName, id_code: idCode });
  } catch (error) {
    await transaction.rollback();
    if (req.file) {
      const filePath = path.join(__dirname, '..', '..', 'uploads', req.file.filename);
      await safeUnlink(filePath);
    }
    console.error('Error updating user:', error.message, error.stack);
    res.status(400).json({
      error: error.message && error.message.includes('unique constraint') ? 'Email, username, or id_code already exists' : (error.message || 'Failed to update user'),
    });
  }
};

exports.uploadUserPhoto = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const user = await User.findOne({ where: { id: req.params.userId }, include: [{ model: Role, as: 'Role' }], transaction });
    if (!user) throw new Error('User not found');
    if (!req.file) throw new Error('No file uploaded');

    const photoUrl = `/uploads/${req.file.filename}`;

    const { model: DetailsModel } = getDetailsModel(user.Role.role_name);
    const existing = await DetailsModel.findOne({ where: { user_id: req.params.userId }, transaction });

    if (existing?.photo_url && !existing.photo_url.includes('default')) {
      const oldPath = photoUrlToFsPath(existing.photo_url);
      if (oldPath) await safeUnlink(oldPath);
    }

    const [updated] = await DetailsModel.update({ photo_url: photoUrl }, { where: { user_id: req.params.userId }, transaction });
    if (updated === 0) {
      await DetailsModel.create({ user_id: req.params.userId, photo_url: photoUrl, salutation: null, ice_contact: null }, { transaction });
    }

    await transaction.commit();
    res.json({ success: true, photo_url: photoUrl, id_code: user.id_code || null });
  } catch (error) {
    await transaction.rollback();
    if (req.file) {
      const filePath = path.join(__dirname, '..', '..', 'uploads', req.file.filename);
      await safeUnlink(filePath);
    }
    console.error('Error uploading photo:', error.message, error.stack);
    res.status(400).json({ error: error.message || 'Failed to upload photo' });
  }
};

exports.deleteUser = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) throw new Error('Invalid user ID');

    const user = await User.findOne({
      where: { id: userId },
      include: [{ model: Role, as: 'Role' }],
      transaction
    });
    if (!user) throw new Error('User not found');

    const roleName = user.Role.role_name;
    const { model: DetailsModel } = getDetailsModel(roleName);

    await Promise.all([
      sequelize.query(`DELETE FROM attendance WHERE user_id = :userId`, { replacements: { userId }, type: sequelize.QueryTypes.DELETE, transaction }),
      sequelize.query(`DELETE FROM exam_student WHERE user_id = :userId`, { replacements: { userId }, type: sequelize.QueryTypes.DELETE, transaction }),
      roleName === 'student'
        ? sequelize.query(`DELETE p FROM payment p INNER JOIN student_details sd ON p.student_details_id = sd.id WHERE sd.user_id = :userId`, { replacements: { userId }, type: sequelize.QueryTypes.DELETE, transaction })
        : Promise.resolve(),
      UserGrade.destroy({ where: { user_id: userId }, transaction }),
      UserSlot.destroy({ where: { user_id: userId }, transaction }),
      UserBranch.destroy({ where: { user_id: userId }, transaction }),
    ]);

    const details = await DetailsModel.findOne({ where: { user_id: userId }, transaction });
    if (details) {
      await DetailsModel.destroy({ where: { user_id: userId }, transaction });
    }

    await User.destroy({ where: { id: userId }, transaction });

    if (details?.photo_url && !details.photo_url.includes('default')) {
      const filePath = photoUrlToFsPath(details.photo_url);
      if (filePath) await safeUnlink(filePath);
    }

    await transaction.commit();
    return res.json({
      success: true,
      message: `${roleName.charAt(0).toUpperCase() + roleName.slice(1)} deleted permanently`
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting user:', error.message, error.stack);
    const msg = error.message || '';
    if (msg.includes('foreign key constraint')) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete user",
        message: "This user has attendance records, exam participation, or payments. Remove all related data first.",
        details: msg
      });
    }
    res.status(500).json({
      success: false,
      error: "Failed to delete user",
      details: msg
    });
  }
};

exports.getStudentGrades = async (req, res) => {
  try {
    const student = await User.findOne({ where: { id: req.params.userId }, include: [{ model: Role, as: 'Role', where: { role_name: 'student' } }] });
    if (!student) throw new Error('Student not found');

    const grades = await UserGrade.findAll({
      where: { user_id: req.params.userId },
      include: [{ model: Grade, as: 'Grade', attributes: ['id', 'grade_name', 'course_id'] }],
    });

    res.json(grades.map(g => ({ id: g.Grade.id, grade_name: g.Grade.grade_name, course_id: g.Grade.course_id })));
  } catch (error) {
    console.error('Error fetching student grades:', error.message, error.stack);
    res.status(404).json({ error: error.message || 'Failed to fetch grades' });
  }
};

exports.getStudentBranches = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const branches = await Branch.findAll({
      attributes: ['id', 'branch_name'],
      include: [{
        model: UserBranch,
        as: 'UserBranches',
        where: { user_id: studentId },
        attributes: [],
        include: [{
          model: User,
          as: 'User',
          where: { id: studentId },
          include: [{ model: Role, as: 'Role', where: { role_name: 'student' } }],
          attributes: [],
        }],
      }],
    });
    res.json(branches);
  } catch (error) {
    console.error('Error fetching student branches:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
};

exports.getStudentSlots = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const slots = await UserSlot.findAll({
      where: { user_id: studentId },
      include: [
        {
          model: Slot,
          as: 'Slot',
          attributes: ['id', 'day', 'st_time', 'end_time', 'branch_id', 'course_id', 'grade_id'],
          include: [
            { model: Branch, as: 'Branch', attributes: ['id', 'branch_name'] },
            { model: Course, as: 'Course', attributes: ['id', 'name'] },
            { model: Grade, as: 'Grade', attributes: ['id', 'grade_name'] },
          ],
        },
      ],
    });

    res.json(slots.map(slot => ({
      id: slot.Slot.id,
      day: slot.Slot.day || 'N/A',
      st_time: slot.Slot.st_time || 'N/A',
      end_time: slot.Slot.end_time || 'N/A',
      time: (slot.Slot.st_time && slot.Slot.end_time) ? `${slot.Slot.st_time}-${slot.Slot.end_time}` : 'N/A',
      branch_id: slot.Slot.branch_id || null,
      course_id: slot.Slot.course_id || null,
      grade_id: slot.Slot.grade_id || null,
      course: slot.Slot.Course?.name || 'N/A',
      grade: slot.Slot.Grade?.grade_name || 'N/A',
    })));
  } catch (error) {
    console.error('Error fetching student slots:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
};

exports.checkStudentNoExists = async (req, res) => {
  try {
    const { studentNo } = req.params;
    if (!studentNo || studentNo.trim() === '') {
      return res.status(400).json({ exists: false });
    }
    const trimmedNo = studentNo.trim();
    const existing = await StudentDetails.findOne({
      where: { student_no: trimmedNo },
      attributes: ['id']
    });
    return res.json({ exists: !!existing });
  } catch (error) {
    console.error('Error checking student_no existence:', error);
    return res.status(500).json({ exists: false });
  }
};

exports.changeUserPassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { current_password, new_password } = req.body;

    // Find the logged-in user
    const user = await User.findOne({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Block default admin change
    if (user.username === "admin") {
      return res.status(400).json({
        error: "Default admin account password cannot be changed."
      });
    }

    //Validate current password
    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect." });
    }

    // Hash new password
    const hashed = await bcrypt.hash(new_password, 10);

    // Update password
    await User.update(
      { password: hashed },
      { where: { id: userId } }
    );

    return res.json({
      success: true,
      message: "Password updated successfully."
    });

  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ error: "Failed to change password" });
  }
};

exports.sendVerificationCode = async (req, res) => {
  try {
    const { email, userId } = req.body;   
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    emailOtpStore[normalizedEmail] = {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000,
    };

    const uniqueTag = Date.now();

    const mailOptions = {
      from: `"ARADANA Music Academy" <${process.env.EMAIL_USER}>`,
      to: normalizedEmail,
      subject: `ARADANA Email Verification Code`, 
      html: `
        <div>
          <h2>Your verification code</h2>
          <h1 style="text-align:center">${code}</h1>
          <span style="font-size:1px; color:#fff;">ID:${uniqueTag}</span>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    return res.json({
      success: true,
      message: "Verification code sent successfully",
    });

  } catch (error) {
    console.error("Send OTP failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to send verification code. Please try again.",
    });
  }
};

exports.verifyEmailCode = (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email and code are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const record = emailOtpStore[normalizedEmail];

    // No OTP request found
    if (!record) {
      return res.status(400).json({
        success: false,
        message: "No verification code found. Please request a new one.",
      });
    }

    // Expired
    if (Date.now() > record.expiresAt) {
      delete emailOtpStore[normalizedEmail];
      return res.status(400).json({
        success: false,
        message: "Verification code has expired",
      });
    }

    // Wrong code
    if (record.code !== code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    delete emailOtpStore[normalizedEmail];

    return res.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

exports.checkEmailExists = async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  try {
    const user = await User.findOne({ where: { email } });
    return res.json({ exists: !!user });
  } catch (err) {
    console.error('Email check error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};


module.exports = exports;

