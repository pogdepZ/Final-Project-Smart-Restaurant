const adminProfileRepo = require("../repositories/adminProfileRepository");

exports.getMyProfile = async (user) => {
  const me = await adminProfileRepo.getById(user.id);
  if (!me) throw new Error("Không tìm thấy user");
  return me;
};

exports.updateMyProfile = async (user, body) => {
  const name = (body.name || "").trim();
  if (!name) throw new Error("Tên không được trống");

  return adminProfileRepo.updateName({ id: user.id, name });
};

exports.uploadMyAvatar = async (user, file) => {
  if (!file) throw new Error("Thiếu file");

  // ✅ cloudinary url
  const avatarUrl = file.path; 

  return adminProfileRepo.updateAvatar({
    id: user.id,
    avatar_url: avatarUrl,
  });
};
