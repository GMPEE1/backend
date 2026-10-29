const router = require('express').Router();
const ctrl = require('../controllers/topic.controller');

router.get('/', ctrl.getTopic)
router.get('/:id', ctrl.editTopic)
router.put('/:id', ctrl.updateTopic)
router.post('/', ctrl.createTopic)
router.delete('/:id', ctrl.removeTopic)

module.exports = router;