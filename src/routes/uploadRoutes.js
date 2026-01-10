const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');

// POST /api/upload
router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Chưa chọn file ảnh' });
  }
  // Trả về URL ảnh đã upload
  res.json({ url: req.file.path });
});

module.exports = router;