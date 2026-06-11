const WebSocket = require("ws");

const {
  User,
  StudentDetails,
  LecturerDetails,
  OtherUserDetails,
  Role,
  Payment
} = require("./models/user_models/index");

/**
 * Convert payment_month → "January 2025"
 */
function formatMonth(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

/**
 * Fetch NEW REGISTERED USER notifications
 */
async function fetchUserNotifications() {
  const users = await User.findAll({
    attributes: ["id", "first_name", "last_name", "role_id", "created_at"],
    include: [
      {
        model: Role,
        as: "Role",
        attributes: ["role_name"],
      },
      {
        model: StudentDetails,
        as: "StudentDetail",
        attributes: ["photo_url"],
        required: false,
      },
      {
        model: LecturerDetails,
        as: "LecturerDetail",
        attributes: ["photo_url"],
        required: false,
      },
      {
        model: OtherUserDetails,
        as: "OtherDetail",
        attributes: ["photo_url"],
        required: false,
      },
    ],
    order: [["created_at", "DESC"]],
  });

  return users.map((user) => {
    const fullName = `${user.first_name} ${user.last_name}`.trim();
    const roleName = user.Role?.role_name || "user";

    const photo =
      user.StudentDetail?.photo_url ||
      user.LecturerDetail?.photo_url ||
      user.OtherDetail?.photo_url ||
      "/default-avatar.png";

    return {
      type: "registration",
      id: user.id,
      full_name: fullName,
      role_name: roleName,
      message: `New ${roleName} registered`,
      created_at: user.created_at,
      photo,
    };
  });
}

/**
 * Fetch PAYMENT RECEIVED notifications
 */
async function fetchPaymentNotifications() {
  const payments = await Payment.findAll({
    attributes: ["id", "amount", "status", "payment_date", "created_at"],
    where: { status: "paid" },
    include: [
      {
        model: StudentDetails,
        as: "student_details",
        include: [
          {
            model: User,
            as: "User",
            attributes: ["first_name", "last_name"],
          },
        ],
      },
    ],
    order: [["created_at", "DESC"]],
  });

  return payments.map((p) => {
    const student = p.student_details;
    const user = student?.User;

    const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();
    const photo = student?.photo_url || "/default-avatar.png";

    return {
      type: "payment",
      id: p.id,
      full_name: fullName,
      message: `Payment received – ${formatMonth(p.payment_date)}`,
      created_at: p.created_at,
      photo,
    };
  });
}

/**
 * Initialize WebSocket Server
 */
function initWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  console.log("WebSocket initialized");

  wss.on("connection", async (ws) => {
    console.log("WebSocket client connected");

    try {
      const users = await fetchUserNotifications();
      const payments = await fetchPaymentNotifications();

      const combined = [...users, ...payments].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      ws.send(
        JSON.stringify({
          type: "INIT_USERS",
          users: combined,
        })
      );
    } catch (err) {
      console.error("❌ Error sending initial WebSocket data:", err);
    }
  });
}

module.exports = { initWebSocket };
