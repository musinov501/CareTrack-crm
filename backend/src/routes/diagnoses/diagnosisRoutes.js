const express = require('express');
const router = express.Router();
const diagnosisController = require('../../controllers/diagnoses/diagnosisController');
const { protect, authorize } = require('../../middleware/authMiddleware');

router.use(protect);

router.get('/', authorize('ADMINISTRATOR', 'CLINICIAN'), diagnosisController.getAllDiagnoses);
router.get('/patient/:patientId', authorize('ADMINISTRATOR', 'CLINICIAN'), diagnosisController.getDiagnosesByPatient);
router.post('/', authorize('ADMINISTRATOR', 'CLINICIAN'), diagnosisController.createDiagnosis);
router.put('/:id', authorize('ADMINISTRATOR', 'CLINICIAN'), diagnosisController.updateDiagnosis);
router.delete('/:id', authorize('ADMINISTRATOR'), diagnosisController.deleteDiagnosis);

module.exports = router;
