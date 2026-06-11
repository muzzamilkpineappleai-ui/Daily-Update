const { Slot, UserSlot, User, Branch, StudentDetails, Role } = require('../../models/user_models/index');

const formatTimeSlot = (startTime, endTime) => {
  const [startHour] = startTime.split(':'); 
  const [endHour] = endTime.split(':'); 
  const startHourNum = parseInt(startHour, 10);
  const endHourNum = parseInt(endHour, 10);

  // Determine AM/PM for both times
  const startPeriod = startHourNum >= 12 ? 'PM' : 'AM';
  const endPeriod = endHourNum >= 12 ? 'PM' : 'AM';

  // Convert to 12-hour format
  const formattedStartHour = startHourNum % 12 === 0 ? 12 : startHourNum % 12;
  const formattedEndHour = endHourNum % 12 === 0 ? 12 : endHourNum % 12;

  // If both times are in the same period, show period only once
  if (startPeriod === endPeriod) {
    return `${formattedStartHour} - ${formattedEndHour} ${startPeriod}`;
  } else {
    // If periods differ, show only the end period
    return `${formattedStartHour} - ${formattedEndHour} ${endPeriod}`;
  }
};

exports.getDashboardSchedule = async (req, res) => {
  try {
    const { branchId } = req.query;

    const where = {};
    if (branchId) {
      where.branch_id = branchId;
    }

    const slots = await Slot.findAll({
      where,
      attributes: ['id', 'day', 'st_time', 'end_time', 'branch_id'],
      include: [
        {
          model: Branch,
          as: 'Branch',
          attributes: ['id', 'branch_name', 'country'],
        },
        {
          model: UserSlot,
          as: 'Users',
          attributes: ['user_id'],
          include: [
            {
              model: User,
              as: 'User',
              attributes: ['id', 'username', 'first_name', 'last_name'],
              include: [
                {
                  model: StudentDetails,
                  as: 'StudentDetail',
                  attributes: ['photo_url'],
                },
                {
                  model: Role,
                  as: 'Role',
                  where: { role_name: 'student' },
                  attributes: [],
                },
              ],
            },
          ],
        },
      ],
    });

    const schedule = {};

    slots.forEach((slot) => {
      const branchName = slot.Branch?.branch_name || 'Unknown';
      const timeSlot = formatTimeSlot(slot.st_time, slot.end_time);
      const day = slot.day;

      if (!schedule[branchName]) schedule[branchName] = {};
      if (!schedule[branchName][timeSlot]) schedule[branchName][timeSlot] = {};
      if (!schedule[branchName][timeSlot][day]) schedule[branchName][timeSlot][day] = [];

      slot.Users.forEach((userSlot) => {
        if (userSlot.User && userSlot.User.StudentDetail) {
          const firstName = userSlot.User.first_name || '';
          const lastName = userSlot.User.last_name || '';
          schedule[branchName][timeSlot][day].push({
            id: userSlot.User.id,
            first_name: firstName,
            last_name: lastName,
            display_name: firstName ? `${firstName.charAt(0)}.${lastName}` : lastName || 'Unknown', 
            photo_url: `${req.protocol}://${req.get('host')}${userSlot.User.StudentDetail.photo_url}`,
          });
        }
      });
    });

    // Clean up empty slots
    for (const branch in schedule) {
      for (const timeSlot in schedule[branch]) {
        for (const day in schedule[branch][timeSlot]) {
          if (schedule[branch][timeSlot][day].length === 0) {
            delete schedule[branch][timeSlot][day];
          }
        }
        if (Object.keys(schedule[branch][timeSlot]).length === 0) {
          delete schedule[branch][timeSlot];
        }
      }
    }

    res.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error('Error fetching dashboard schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard schedule',
      error: error.message,
    });
  }
};

exports.getBranches = async (req, res) => {
  try {
    const branches = await Branch.findAll({
      attributes: ['id', 'branch_name', 'country'],
    });
    res.json({
      success: true,
      data: branches,
    });
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch branches',
      error: error.message,
    });
  }
};