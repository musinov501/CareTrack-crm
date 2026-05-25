const express = require('express');
const router = express.Router();
const patientController = require('../../controllers/patients/patientController');
const { protect, authorize } = require('../../middleware/authMiddleware');

router.use(protect); // All routes require login

router.get('/', patientController.getAllPatients);
router.get('/:id/profile', patientController.getPatientProfile);
router.get('/:id/report', authorize('ADMINISTRATOR', 'CLINICIAN'), patientController.getPatientDiagnosisReport);
router.get('/:id', patientController.getPatientById);
router.post('/', authorize('ADMINISTRATOR', 'RECEPTIONIST'), patientController.createPatient);
router.put('/:id', authorize('ADMINISTRATOR', 'CLINICIAN'), patientController.updatePatient);
router.delete('/:id', authorize('ADMINISTRATOR'), patientController.deletePatient);

module.exports = router;
