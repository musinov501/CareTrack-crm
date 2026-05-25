const express = require('express');
const router = express.Router();
const referralController = require('../../controllers/referrals/referralController');
const { protect, authorize } = require('../../middleware/authMiddleware');

router.use(protect);

router.get('/', authorize('ADMINISTRATOR', 'CLINICIAN', 'RECEPTIONIST'), referralController.getAllReferrals);
router.get('/patient/:patientId', authorize('ADMINISTRATOR', 'CLINICIAN', 'RECEPTIONIST'), referralController.getReferralsByPatient);
router.post('/', authorize('ADMINISTRATOR', 'CLINICIAN'), referralController.createReferral);
router.put('/:id', authorize('ADMINISTRATOR', 'CLINICIAN'), referralController.updateReferral);
router.delete('/:id', authorize('ADMINISTRATOR'), referralController.deleteReferral);

module.exports = router;
