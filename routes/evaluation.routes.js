const router = require('express').Router();
const ctrl = require('../controllers/evaluation.controller');

router.post('/', ctrl.create)
// router.get('/:id', ctrl.getEva)
router.get('/:id', ctrl.list)

module.exports = router;