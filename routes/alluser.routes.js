const router = require('express').Router();
const ctrl = require('../controllers/alluser.controller');

router.get('/', ctrl.getAllUser);
router.get('/evaluator', ctrl.getEva);
router.get('/user', ctrl.getUser);

router.get('/:id', ctrl.editUser);
router.put('/:id', ctrl.updateUser);
router.post('/', ctrl.createUser);
router.delete('/:id', ctrl.removeUser);

router.post('/createuser', ctrl.createUser);
router.post('/createeva', ctrl.createEva);

router.post('/:id/resetpw', ctrl.resetPassword);
router.put('/:id/updatepw', ctrl.updatePassword);

router.put('/:id/editInfo', ctrl.editInfo);
module.exports = router;

