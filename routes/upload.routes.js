
const router = require('express').Router();
const auth = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const ctrl = require('../controllers/upload.controller');

// ===== Evaluatee =====
router.post('/evidence', auth('evaluatee'), upload.single('file'), ctrl.uploadEvidence); 
// upload.single('file'), file คือ ชื่อ field ใน form-data ไม่ถูกต้อง error multer แสดงว่า "Unexpected field"
router.get('/mine', auth('evaluatee'), ctrl.listMine);
router.delete('/:id', auth('evaluatee'), ctrl.deleteMine);
router.put('/:id/file', auth('evaluatee'), upload.single('file'), ctrl.updateFileMine);
router.patch('/:id', auth('evaluatee'), ctrl.updateMetaMine);

// ===== Evaluator =====
router.get('/evaluatee/:evaluateeId', auth('evaluator'), ctrl.listForEvaluator);

// ===== Admin =====


module.exports = router;
