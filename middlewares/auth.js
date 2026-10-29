const jwt = require('jsonwebtoken');

// module.exports = (...roles) => {
//   return (req,res,next)=>{
//     try{
//       const header = req.headers.authorization || '';
//       const token = header.startsWith('Bearer ') ? header.slice(7) : null;
//       if(!token) return res.status(401).json({success:false, message:'Missing token'});
//       const payload = jwt.verify(token, process.env.JWT_SECRET);
//       if(roles.length && !roles.includes(payload.role)){
//         return res.status(403).json({success:false, message:'Forbidden'});
//       }
//       req.user = payload;
//       console.log('Auth payload=', payload);
//       next();// ผ่าน ทุกด่าน       
//     }catch(e){
//       e.status = e.name === 'JsonWebTokenError' ? 401 : 500;
//       next(e);
//     }
//   }
// }
// auth.js (เฉพาะช่วง debug)


module.exports = (...roles) => {
  return (req, res, next) => {
    try {
      // 1) เข้ามาถึง middleware ไหม + method/path
      console.log('[AUTH] hit:', req.method, req.originalUrl);

      // 2) ดู Authorization header ที่ส่งมา *จริง*
      const header = req.headers.authorization || '';
      console.log('[AUTH] header:', header || '(empty)');

      // 3) กรณีเบราว์เซอร์ส่ง OPTIONS (preflight) ให้ผ่านเลย (กัน CORS กวนตอน debug)
      if (req.method === 'OPTIONS') {
        console.log('[AUTH] skip OPTIONS');
        return res.sendStatus(204);
      }

      const token = header.startsWith('Bearer ') ? header.slice(7) : null;
      if (!token) {
        console.log('[AUTH] -> 401 Missing token');
        return res.status(401).json({ success: false, message: 'Missing token' });
      }

      // 4) ลอง decode ดูค่า (dev only)
      // console.log('[AUTH] decode:', jwt.decode(token));

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      console.log('[AUTH] verified payload:', payload);

      if (roles.length && !roles.includes(payload.role)) {
        console.log('[AUTH] -> 403 Forbidden (role not allowed)', roles, 'got:', payload.role);
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      req.user = payload;
      return next();
    } catch (e) {
      console.log('[AUTH] ERROR:', e.name, e.message);
      e.status = e.name === 'JsonWebTokenError' ? 401 : 500;
      next(e);
    }
  };
};
