const { Attendance, User, Slot, Course, Role, StudentDetails, UserGrade, Grade, UserBranch, Branch } = require('../../models/attendance_models/index');
const moment = require('moment-timezone');
 

exports.getAttendance = async (req, res) => {
  try {
    const attendances = await Attendance.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'first_name', 'last_name'],
          as: 'User',
        },
        {
          model: Slot,
          attributes: ['id', 'st_time', 'end_time'],
          include: {
            model: Course,
            attributes: ['name'],
            as: 'Course',
          },
          as: 'Slot',
        },
      ],
      order: [['entry_date', 'DESC']],
    });

    const formattedAttendances = attendances.map(att => {
      const slotStartTime = att.Slot?.st_time
        ? moment(att.Slot.st_time, 'HH:mm:ss').format('h:mm A')
        : 'N/A';
      const slotEndTime = att.Slot?.end_time
        ? moment(att.Slot.end_time, 'HH:mm:ss').format('h:mm A')
        : 'N/A';
      const slotTime = slotStartTime !== 'N/A' && slotEndTime !== 'N/A'
        ? `${slotStartTime} - ${slotEndTime}`
        : 'N/A';

      return {
        studentName: att.User ? `${att.User.first_name} ${att.User.last_name}` : 'Unknown',
        courseName: att.Slot?.Course?.name || 'Unknown',
        status: att.attendance_status,
        entryDate: att.entry_date,
        entryTime: att.entry_time,
        slotTime,
      };
    });

    res.status(200).json(formattedAttendances);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance', details: error.message });
  }
};

exports.markAttendance = async (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  try {
    // Get current date in Asia/Kolkata timezone
    const today = moment().tz('Asia/Kolkata');
    const entryDate = today.format('YYYY-MM-DD');
    const currentTime = today.format('HH:mm:ss');

    console.log(`Marking attendance for user_id: ${user_id} on ${entryDate}`);

    // Find slots assigned to the user
    const user = await User.findOne({
      where: { id: user_id },
      include: [{
        model: Slot,
        as: 'Slots',
        include: [{
          model: Course,
          attributes: ['name'],
          as: 'Course',
        }],
      }],
    });

    if (!user || !user.Slots || user.Slots.length === 0) {
      console.log(`No slots found for user_id: ${user_id}`);
      return res.status(403).json({ error: 'User is not assigned to any slots' });
    }

    // Select the first slot for the day (or modify to handle multiple slots)
    const activeSlot = user.Slots[0];
    const slot_id = activeSlot.id;

    console.log(`Selected slot for user_id: ${user_id}`, {
      slot_id: activeSlot.id,
      start_time: activeSlot.st_time,
      end_time: activeSlot.end_time,
      course: activeSlot.Course?.name,
    });

    // Check for existing attendance
    const existing = await Attendance.findOne({
      where: {
        user_id,
        slot_id,
        entry_date: entryDate,
      },
    });

    if (existing) {
      console.debug(`Attendance already marked for user_id: ${user_id}, slot_id: ${slot_id}, date: ${entryDate}`);
      return res.status(409).json({
        message: 'Attendance already marked for this slot today',
        alreadyMarked: true,
      });
    }

    // Mark as Present (no time-based status since scanning is allowed anytime)
    const attendanceStatus = 'Present';

    // Create attendance record
    const attendance = await Attendance.create({
      user_id,
      slot_id,
      entry_date: entryDate,
      entry_time: today.format('hh:mm A'),
      attendance_status: attendanceStatus,
    });

    console.log(`Attendance marked:`, attendance);
    res.status(201).json({
      message: 'Attendance marked successfully',
      attendance,
    });
  } catch (error) {
    console.error('Attendance error:', error);
    res.status(500).json({ error: 'Failed to mark attendance', details: error.message });
  }
};

exports.markAbsentStudents = async (req, res) => {
  const { slot_id, entry_date } = req.body;

  if (!slot_id || !entry_date) {
    return res.status(400).json({ error: 'slot_id and entry_date are required' });
  }
  if (!moment(entry_date, 'YYYY-MM-DD', true).isValid()) {
    return res.status(400).json({ error: 'Invalid entry_date format. Use YYYY-MM-DD' });
  }

  try {
    const usersInSlot = await User.findAll({
      include: [{
        model: Slot,
        as: 'Slots',
        where: { id: slot_id },
        required: true,
      }],
    });

    if (!usersInSlot.length) {
      return res.status(404).json({ error: 'No users assigned to this slot' });
    }

    const existingAttendance = await Attendance.findAll({
      where: {
        slot_id,
        entry_date,
      },
    });

    const attendedUserIds = existingAttendance.map(record => record.user_id);

    const absentUsers = usersInSlot.filter(user => !attendedUserIds.includes(user.id));

    if (!absentUsers.length) {
      return res.status(200).json({ message: 'All users have attendance marked for this slot' });
    }

    const attendanceRecords = await Attendance.bulkCreate(
      absentUsers.map(user => ({
        user_id: user.id,
        slot_id,
        entry_date,
        entry_time: '00:00',
        attendance_status: 'Absent',
      }))
    );

    res.status(201).json({
      message: 'Absent students marked successfully',
      attendanceRecords,
    });
  } catch (error) {
    console.error('Error marking absent students:', error);
    res.status(500).json({ error: 'Failed to mark absent students' });
  }
};

exports.resolveQRCode = async (req, res) => {
  try {
    const { qrData } = req.body;
    if (!qrData) {
      throw new Error('QR code data is required');
    }

    const user = await User.findOne({
      where: { id_code: qrData },
      include: [
        { model: Role, as: 'Role', attributes: ['role_name'] },
        { 
          model: StudentDetails, 
          as: 'student_details', 
          attributes: ['student_no', 'photo_url'], 
          required: true // Enforce StudentDetails existence
        },
        {
          model: UserGrade,
          as: 'UserGrades',
          include: [
            {
              model: Grade,
              as: 'Grade',
              attributes: ['id', 'grade_name'],
              include: [
                { model: Course, as: 'Course', attributes: ['id', 'name'] },
              ],
            },
          ],
          required: false,
        },
        {
          model: UserBranch,
          as: 'UserBranches',
          include: [
            { model: Branch, as: 'Branch', attributes: ['id', 'branch_name'] },
          ],
          required: false,
        },
      ],
    });

    if (!user) {
      throw new Error('User not found or missing student details for this QR code');
    }

    // // Generate QR code image on-demand for the response
    // let qrCodeImage = null;
    // try {
    //   qrCodeImage = await generateQRCode(user.id_code);
    // } catch (qrError) {
    //   console.warn('Failed to generate QR code for response:', qrError.message);
    //   // Continue without QR code image to avoid blocking
    // }

    // Prepare response data
    const userData = {
      id: user.id,
      role_name: user.Role.role_name,
      student_no: user.student_details?.student_no || null,
      first_name: user.first_name,
      last_name: user.last_name,
      photo_url: user.student_details?.photo_url || null,
      id_code: user.id_code || null,
      // qr_code_image: qrCodeImage,
    };

    // Add course, grade, and branch details if the user is a student
    if (user.Role.role_name === 'student') {
      userData.courses = user.UserGrades?.map(ug => ({
        course_id: ug.Grade?.Course?.id || null,
        course_name: ug.Grade?.Course?.name || 'N/A',
        grade_id: ug.Grade?.id || null,
        grade_name: ug.Grade?.grade_name || 'N/A',
      })) || [];
      userData.branches = user.UserBranches?.map(ub => ({
        branch_id: ub.Branch?.id || null,
        branch_name: ub.Branch?.branch_name || 'N/A',
      })) || [];
    } else {
      userData.courses = [];
      userData.branches = [];
    }

    res.json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error('Error resolving QR code:', error.message, error.stack);
    res.status(400).json({ success: false, error: error.message });
  }
};

