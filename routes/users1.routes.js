    const router = require('express').Router();
    // routes/users.routes.js
    const auth = require('../middlewares/auth');
    const ctrl = require('../controllers/users1.controller');
 
    
// หมายเหตุเพื่อการสอน:
// - list/listServer/get: ให้ทุกบทบาทที่ล็อกอินแล้วเรียกได้ (admin/evaluator/evaluatee)
// - create/update/delete: ตัวอย่างนี้จำกัด admin (นักเรียนจะเห็นการควบคุมสิทธิ์ชัดเจน)

router.get('/server', auth('admin','evaluator','evaluatee'), ctrl.listServer);
router.get('/',       auth('admin','evaluator','evaluatee'), ctrl.list);
router.get('/:id',    auth('admin','evaluator','evaluatee'), ctrl.get);

router.post('/',      auth('admin'), ctrl.create);
// router.post('/',  ctrl.create);
router.put('/:id',    auth('admin'), ctrl.update);
router.delete('/:id', auth('admin'), ctrl.remove);

module.exports = router;








    module.exports = router;
