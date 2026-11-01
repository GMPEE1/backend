const router = require('express').Router();
const upload = require('../middlewares/upload');
const ctrl = require('../controllers/evaluation.controller');

router.post('/', ctrl.create)
router.get('/:id/get', ctrl.getEva)
router.get('/:id', ctrl.list)
router.get('/:id/getInd', ctrl.getInd)
router.post('/createEvas', ctrl.createEvaresults)

router.post('/evidence', ctrl.evidence)
router.get('/:id/:topic_id/evidence', ctrl.getEvidence)

router.post('/comment', ctrl.comment)
router.get('/:id/:topic_id/comment', ctrl.getComment)

module.exports = router;