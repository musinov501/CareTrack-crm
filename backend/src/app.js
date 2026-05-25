const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Serve Static Frontend
app.use(express.static(path.join(__dirname, '../../frontend')));

// Routes
const authRoutes = require('./routes/auth/authRoutes');
const doctorRoutes = require('./routes/doctors/doctorRoutes');
const patientRoutes = require('./routes/patients/patientRoutes');
const diagnosisRoutes = require('./routes/diagnoses/diagnosisRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const referralRoutes = require('./routes/referrals/referralRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/diagnoses', diagnosisRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/referrals', referralRoutes);

app.get('/', (req, res) => {
    res.redirect('/login/index.html');
});

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

module.exports = app;
