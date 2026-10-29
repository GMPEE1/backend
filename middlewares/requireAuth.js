const jwt = require('jsonwebtoken');
module.exports = (req,res,next)=>{
  try{
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if(!token) return res.status(401).json({ success:false, message:'Missing token'});
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = { id: payload.sub || payload.id, role: payload.role, name: payload.name };
    next();
  }catch(e){
    e.status = 401;
    next(e);
    // หลีกเลี่ยงการส่ง error message ที่ละเอียดเกินไป
    // เช่น token หมดอายุ, token ไม่ถูกต้อง ฯลฯ
    // เพื่อไม่ให้ข้อมูลรั่วไหล
    // ถ้าอยาก log error ไว้ดูใน server ก็ทำได้


    // console.error(e);
    //หมายเหตุ: ถ้าอยากแยกกรณี token หมดอายุ กับ token ไม่ถูกต้อง ออกไป
    // ก็ใช้ e.name === 'TokenExpiredError' ได้
    // แต่ในที่นี้จะไม่แยก
    
    // return res.status(500).json({ success:false, message:'Internal Server Error' });
    
  }
}
