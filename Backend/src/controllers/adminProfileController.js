const adminProfileService = require("../services/adminProfileService");

exports.getMyProfile = async (req, res) => {
  try {
    const me = await adminProfileService.getMyProfile(req.user);
    res.json({ item: me });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const updated = await adminProfileService.updateMyProfile(
      req.user,
      req.body
    );
    res.json({ message: "Updated", item: updated });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

exports.uploadMyAvatar = async (req, res) => {
  try {
    const updated = await adminProfileService.uploadMyAvatar(
      req.user,
      req.file
    );
    res.json({ message: "Uploaded", item: updated });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};
