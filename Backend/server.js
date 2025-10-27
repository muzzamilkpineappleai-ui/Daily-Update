const express = require("express");
const { connectDB } = require("./config/db");
const path = require('path');
const cors = require('cors');
const fs = require('fs').promises;

const app = express();

// CORS configuration
app.use(cors({
  origin: ['https://aradanabeta.pineappleai.cloud','https://aradanatesting.pineappleai.cloud','https://aradanaqa.pineappleai.cloud','https://aradanadev.pineappleai.cloud','http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes


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

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});