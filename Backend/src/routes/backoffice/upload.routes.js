const express = require('express');
const router = express.Router();
const upload = require('../../middlewares/upload');
const { protect, adminOnly } = require('../../middlewares/authMiddleware');

router.post('/', protect, adminOnly, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Chưa chọn file ảnh' });
  res.json({ url: req.file.path });
});

module.exports = router;
