const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const userController = require('../../controllers/user_controller/userController');
const { Role, User } = require('../../models/user_models/index');
const auth = require('../../middleware/authmiddleware')

// SINGLE UPLOADS FOLDER + ROLE IN FILENAME
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', '..', 'uploads');
    await fs.mkdir(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },

  filename: async (req, file, cb) => {
    let roleName = 'other';
    let userId = 'new';

    try {
      // Try to get role from req.body.user (new registration or update)
      if (req.body.user) {
        const userData = JSON.parse(req.body.user || '{}');
        if (userData.role_name) {
          const role = await Role.findOne({ where: { role_name: userData.role_name } });
          if (role) roleName = userData.role_name.toLowerCase();
        }
        if (userData.id) userId = userData.id;
      }

      // For photo upload or profile update of existing user
      if (req.params.userId && userId === 'new') {
        const user = await User.findOne({
          where: { id: req.params.userId },
          include: [{ model: Role, as: 'Role' }]
        });
        if (user?.Role?.role_name) {
          roleName = user.Role.role_name.toLowerCase();
        }
        userId = req.params.userId;
      }
    } catch (err) {
      console.warn('Failed to determine role/userId for filename:', err.message);
    }

    // Sanitize role name
    const safeRole = roleName.replace(/[^a-z0-9]/g, '_');
    const ext = path.extname(file.originalname).toLowerCase();
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);

    // Final filename: role_userId_timestamp_random.ext
    const filename = `${safeRole}_${userId}_${timestamp}_${random}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png/;
    const ext = path.extname(file.originalname).toLowerCase();
    const mimetype = allowed.test(file.mimetype);
    const extname = allowed.test(ext);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
  }
});

const multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, error: `Upload error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
  next();
};

// Routes
router.get('/', userController.getAllUsers);
router.get('/check-student-no/:studentNo', userController.checkStudentNoExists);
router.get('/check-email', userController.checkEmailExists);
router.post('/', upload.single('photo'), multerErrorHandler, userController.finalizeUserRegistration);
router.get('/:userId/profile', userController.getUserProfile);
router.post('/:userId/photo', upload.single('photo'), multerErrorHandler, userController.uploadUserPhoto);
router.patch('/:userId', upload.single('photo'), multerErrorHandler, userController.updateUserProfile);
router.patch('/:userId/photo', upload.single('photo'), multerErrorHandler, userController.uploadUserPhoto);
router.delete('/:userId', userController.deleteUser);
router.get('/students/:studentId/branches', userController.getStudentBranches);
router.get('/students/:studentId/slots', userController.getStudentSlots);
router.get('/students/:studentId/grades', userController.getStudentGrades);
router.post('/resolve-qr', userController.resolveQRCode);
router.get('/:id/qr', userController.getUserQR);
router.post("/change-password", auth, userController.changeUserPassword);
router.post("/send-email-code", userController.sendVerificationCode);
router.post("/verify-email-code", userController.verifyEmailCode);


module.exports = router;