const express = require("express");
const { connectDB } = require("./config/db");
const path = require('path');
const cors = require('cors');
const fs = require('fs').promises;



const app = express();

const uploadDir = path.join(__dirname, 'uploads');
fs.mkdir(uploadDir, { recursive: true })
  .then(() => console.log('Uploads directory ready:', uploadDir))
  .catch(console.error);

// CORS configuration
app.use(cors({
  origin: ['https://aradanabeta.pineappleai.cloud',
            'https://aradanatesting.pineappleai.cloud',
            'https://aradanaqa.pineappleai.cloud',
            'https://aradanadev.pineappleai.cloud',
            'http://localhost:3000'
          ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
const userRouter = require('./routes/user_router/userRouter'); 
const scheduleRouter = require('./routes/slot_router/sheduleRouter');
const paymentRoutes = require('./routes/payment_router/paymentRouter');
const courseRouter = require('./routes/course_router/courseRouter');
const gradeRouter = require('./routes/course_router/gradeRouter');
const gradeFeeRouter = require('./routes/course_router/gradeFeeRouter');
const branchRouter = require('./routes/course_router/branchRouter');
const courseRouter1 = require('./routes/user_router/courseRouter1');
const slotRouter1 = require('./routes/user_router/slotRouter1');
const branchRouter1 = require('./routes/user_router/branchRouter1');
const dashboardRouter = require('./routes/dashboard_router/dashboardRouter');
const branchesRouter = require('./routes/branch_router/branchesRouter');
const roleRouter = require('./routes/role_router/roleRouter');
const attendanceRoutes = require('./routes/attendance_router/attendanceRouter');
const paymentReportRouter = require('./routes/paymentReport_router/paymentReportRoute');
const examRouter = require('./routes/exam_router/examRoute');
const authRoutes = require('./routes/auth_router/authRouter');
const examReportRoutes = require('./routes/examReport_router/examReportRoute')


app.use('/api/users', userRouter); 
app.use('/api/course', courseRouter);
app.use('/api/grade', gradeRouter);
app.use('/api/grade-fee', gradeFeeRouter);
app.use('/api/branch', branchRouter);
app.use('/api/schedule', scheduleRouter); 
app.use('/api/payments', paymentRoutes); 
app.use('/api/courses', courseRouter1);
app.use('/api/slots', slotRouter1);
app.use('/api/branches', branchRouter1);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/newBranch', branchesRouter);
app.use('/api/roles', roleRouter);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/report', paymentReportRouter);
app.use('/api/exam',examRouter);
app.use("/api/auth", authRoutes);
app.use("/api/examReport", examReportRoutes);

const resultRoutes = require("./routes/result_router/resultsRoutes");
app.use("/api/results", resultRoutes);



app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Route not found' });
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 5000;

// Connect to the database
connectDB();

app.get("/", (req, res) => {
  res.send("API is running...");
});

const http = require("http");
const { initWebSocket } = require("./websocket");

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket server
initWebSocket(server);

server.listen(PORT, () => {
  console.log(`🚀 API + WebSocket running on port ${PORT}`);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});