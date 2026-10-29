// const multer = require('multer');
// const path = require('path');

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, 'uploads'),
//   filename: (req, file, cb) => {
//     const unique = 'std-it-' + Date.now() + path.extname(file.originalname);
//     cb(null, unique);
//   }
// });

// module.exports = multer({ storage });
// middlewares/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const MAX_MB = Number(process.env.UPLOAD_MAX_MB || 10);
const MAX_BYTES = MAX_MB * 1024 * 1024;

// อนุญาต mimetype ทั่วไป (แนะนำ: map ตาม evidence_type ในชั้น controller เพิ่มเติม)
const ALLOWED = new Set([
  'application/pdf',
  'image/png', 'image/jpeg', 'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip', 'application/x-zip-compressed'
]);

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // ใช้ period_id + evaluatee_id (จาก JWT หรือ body สำหรับ admin)
    console.log('__dirname', __dirname);
    const base = path.join(__dirname, '..', 'uploads');
    const period = String(req.body.ind_id || 'misc');
    // const evaluatee = String((req.user && req.user.id) || req.body.evaluatee_id || 'unknown');
    const dest = path.join(base, period);
    ensureDir(dest);
    console.log('Upload destination:', dest);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safe = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9._-]/g, '_');
    const name = `${Date.now()}_${safe}${ext}`;
    cb(null, name);
  }
});

function fileFilter(req, file, cb) {
  if (!ALLOWED.has(file.mimetype)) {
    return cb(new Error('Unsupported file type'), false);
  }
  cb(null, true);
}


const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_BYTES } });
module.exports = upload;   // ← export อินสแตนซ์ตรง ๆ

// function single(field) {
//   return multer({ storage, fileFilter, limits: { fileSize: MAX_BYTES } }).single(field);
// }
// module.exports = { single };
