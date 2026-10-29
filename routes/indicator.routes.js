const router = require('express').Router();
const upload = require('../middlewares/upload');
const ctrl = require('../controllers/indicator.controller');

router.get('/', ctrl.getInd)
router.get('/:id', ctrl.editInd)
router.get('/:id/detail', ctrl.getdetail)
router.put('/:id', ctrl.updateInd)
router.post('/', upload.single('file'), ctrl.createInd)
router.delete('/:id', ctrl.removeInd)

module.exports = router;