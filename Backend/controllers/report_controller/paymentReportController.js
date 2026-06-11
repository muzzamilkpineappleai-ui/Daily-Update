const {Payment,StudentDetails,User,GradeFee,UserBranch,Branch,Grade,UserGrade,Course,} = require("../../models/payment_models/index");
const { Op } = require("sequelize");
const moment = require("moment-timezone");


const getMonthlyFeeForStudent = async (studentDetailsId) => {
  try {
    const student = await StudentDetails.findByPk(studentDetailsId, {
      attributes: ["user_id"],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id"],
          include: [
            {
              model: UserBranch,
              as: "user_branch",
              required: false,
              include: [
                {
                  model: Branch,
                  as: "branch",
                  attributes: ["id", "branch_name"],
                  required: false,
                },
              ],
            },
          ],
        },
      ],
    });

    if (!student || !student.user_id) {
      return 1000;
    }

    const branchId = student.user?.user_branch?.[0]?.branch?.id || null;

    const latestGrade = await UserGrade.findOne({
      where: { user_id: student.user_id },
      attributes: ["grade_id", "created_at"],
      order: [["created_at", "DESC"]],
    });

    if (!latestGrade?.grade_id) {
      return 1000;
    }

    const feeRecord = await GradeFee.findOne({
      where: {
        grade_id: latestGrade.grade_id,
        branch_id: branchId,
      },
      attributes: ["fee"],
    });

    if (!feeRecord) {
      return 1000;
    }

    return feeRecord.fee;
  } catch (err) {
    return 1000;
  }
};


exports.getCurrentMonthReport = async (req, res) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);

    const students = await StudentDetails.findAll({
      attributes: ["id", "student_no", "photo_url"],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "first_name", "last_name"],
          required: true,
          include: [
            {
              model: UserBranch,
              as: "user_branch",
              required: false,
              include: [
                {
                  model: Branch,
                  as: "branch",
                  attributes: ["branch_name"],
                  required: false,
                },
              ],
            },
          ],
        },
        {
          model: Payment,
          as: "Payments",
          attributes: ["status", "amount"],
          required: false,
          where: {
            payment_date: {
              [Op.gte]: monthStart,
              [Op.lte]: monthEnd,
            },
          },
        },
      ],
    });

    const report = await Promise.all(
      students.map(async (s) => {
        const user = s.user;
        const branch = user?.user_branch?.[0]?.branch;
        const fullName = `${user.first_name} ${user.last_name}`;
        const photo = s.photo_url
          ? s.photo_url.startsWith('/')
            ? s.photo_url
            : `/${s.photo_url}`
          : `https://www.gravatar.com/avatar/${s.id}?d=mp&f=y`;


        const monthlyFee = await getMonthlyFeeForStudent(s.id);
        const currentPay = s.Payments?.[0];
        const status = currentPay?.status === "Paid" ? "Paid" : "Pending";
        const amountPaid = currentPay?.amount || 0;

        return {
          student_details_id: s.id,
          student_no: s.student_no,
          full_name: fullName,
          photo_url: photo,
          branch_name: branch?.branch_name || "N/A",
          current_month: now.toLocaleString("en-US", {
            month: "long",
            year: "numeric",
          }),
          status,
          amount_due: monthlyFee,
          amount_paid: amountPaid,
        };
      })
    );

    // Sort: Pending students appear first
    report.sort((a, b) =>
      a.status === "Pending" && b.status === "Paid" ? -1 : 1
    );

    res.json(report);
  } catch (error) {
    console.error("getCurrentMonthReport error:", error);
    res
      .status(500)
      .json({ error: "Failed to generate current month report" });
  }
};


exports.getStudentPaymentHistory = async (req, res) => {
  try {
    const { student_details_id } = req.params;
    if (!student_details_id || isNaN(student_details_id)) {
      return res.status(400).json({ error: "Valid student_details_id required" });
    }

    const student = await StudentDetails.findByPk(student_details_id, {
      attributes: ["student_no", "created_at"],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "first_name", "last_name"],
          include: [
            {
              model: UserBranch,
              as: "user_branch",
              required: false,
              include: [
                {
                  model: Branch,
                  as: "branch",
                  attributes: ["branch_name"],
                  required: false,
                },
              ],
            },
          ],
        },
      ],
    });

    if (!student)
      return res.status(404).json({ message: "Student not found" });

    const fullName = `${student.user.first_name} ${student.user.last_name}`;
    const branchName =
      student.user?.user_branch?.[0]?.branch?.branch_name || "N/A";

    const payments = await Payment.findAll({
      where: { student_details_id },
      attributes: ["payment_date", "amount", "status"],
      order: [["payment_date", "ASC"]],
    });

    const userGrades = await UserGrade.findAll({
      where: { user_id: student.user.id },
      attributes: [],
      include: [
        {
          model: Grade,
          attributes: ["grade_name"],
          include: [{ model: Course, attributes: ["name"] }],
        },
      ],
      order: [["created_at", "ASC"]],
    });

    const courses = userGrades.map((ug) => ({
      name: ug.Grade.Course.name,
      grade: ug.Grade.grade_name.replace("Grade ", ""),
    }));

    const monthlyFee = await getMonthlyFeeForStudent(student_details_id);
    const now = moment().tz("Asia/Colombo").startOf("month");

    // Build a map of paid months
    const paidMonths = {};
    payments.forEach((p) => {
      if (p.status === "Paid" && p.payment_date) {
        const key = moment(p.payment_date).format("YYYY-MM");
        paidMonths[key] = {
          month: moment(p.payment_date).format("MMMM"),
          payment_date: moment(p.payment_date).format("YYYY-MM-DD"),
          branch_name: branchName,
          amount: p.amount,
          status: "Paid",
        };
      }
    });

    let joinDate = moment(student.created_at).tz("Asia/Colombo").startOf("month");
    let startOfYear = moment(now).startOf("year");
    let startDate = joinDate.isBefore(startOfYear) ? joinDate : startOfYear;

    const allHistory = [];

    let cur = startDate.clone();
    while (cur.isSameOrBefore(now)) {
      const key = cur.format("YYYY-MM");
      if (paidMonths[key]) {
        allHistory.push(paidMonths[key]);
      } else {
        allHistory.push({
          month: cur.format("MMMM"),
          payment_date: cur.clone().date(10).format("YYYY-MM-DD"),
          branch_name: branchName,
          amount: monthlyFee,
          status: "Pending",
        });
      }
      cur.add(1, "month");
    }

    payments.forEach((p) => {
      if (p.status === "Paid" && p.payment_date) {
        const date = moment(p.payment_date).tz("Asia/Colombo").startOf("month");
        if (date.isAfter(now)) {
          allHistory.push({
            month: date.format("MMMM"),
            payment_date: moment(p.payment_date).format("YYYY-MM-DD"),
            branch_name: branchName,
            amount: p.amount,
            status: "Paid",
          });
        }
      }
    });

    // Sort by payment_date ascending
    allHistory.sort(
      (a, b) => new Date(a.payment_date) - new Date(b.payment_date)
    );

    res.json({
      student_details_id: Number(student_details_id),
      student_no: student.student_no,
      full_name: fullName,
      branch_name: branchName,
      courses,
      paymentHistory: allHistory,
      total_pending: allHistory
        .filter((p) => p.status === "Pending")
        .reduce((sum, p) => sum + p.amount, 0),
    });
  } catch (error) {
    console.error("getStudentPaymentHistory error:", error);
    res.status(500).json({ error: "Failed to fetch payment history" });
  }
};

