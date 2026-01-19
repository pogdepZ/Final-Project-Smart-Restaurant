const db = require("../config/db");

// Lấy danh sách ảnh của món
exports.getItemPhotos = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      "SELECT * FROM menu_item_photos WHERE menu_item_id = $1 ORDER BY is_primary DESC, created_at DESC",
      [id],
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi lấy danh sách ảnh" });
  }
};

// Upload nhiều ảnh
exports.addItemPhotos = async (req, res) => {
  const { id } = req.params;
  const files = req.files; // Array files từ Multer

  if (!files || files.length === 0) {
    return res.status(400).json({ message: "Vui lòng chọn ít nhất 1 ảnh." });
  }

  try {
    // Insert song song
    const promises = files.map((file) =>
      db.query(
        "INSERT INTO menu_item_photos (menu_item_id, url) VALUES ($1, $2) RETURNING *",
        [id, file.path],
      ),
    );
    const results = await Promise.all(promises);

    const newPhotos = results.map((r) => r.rows[0]);
    res.status(201).json(newPhotos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi lưu ảnh vào database" });
  }
};

// Xóa ảnh
exports.deletePhoto = async (req, res) => {
  const { photoId } = req.params;
  try {
    await db.query("DELETE FROM menu_item_photos WHERE id = $1", [photoId]);
    res.json({ message: "Đã xóa ảnh" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi xóa ảnh" });
  }
};

// Đặt làm ảnh chính
exports.setPrimaryPhoto = async (req, res) => {
  const { id, photoId } = req.params; // id = menu_item_id

  // Cần client để chạy transaction
  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Reset tất cả về false
    await client.query(
      "UPDATE menu_item_photos SET is_primary = false WHERE menu_item_id = $1",
      [id],
    );

    // 2. Set ảnh chọn thành true
    const result = await client.query(
      "UPDATE menu_item_photos SET is_primary = true WHERE id = $1 RETURNING url",
      [photoId],
    );

    if (result.rows.length === 0) {
      throw new Error("Ảnh không tồn tại");
    }

    await client.query("COMMIT");
    res.json({ message: "Đã đặt làm ảnh đại diện" });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    res.status(500).json({ message: e.message || "Lỗi cập nhật ảnh đại diện" });
  } finally {
    client.release();
  }
};
