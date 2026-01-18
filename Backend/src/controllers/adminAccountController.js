// src/controllers/adminAccountController.js
const adminAccountService = require("../services/adminAccountService");

exports.getAccounts = async (req, res) => {
  try {
    const result = await adminAccountService.getAccounts(req.query);
    return res.json(result);
  } catch (e) {
    console.log("getAccounts error:", e);
    return res.status(500).json({ message: e.message || "Server error" });
  }
};

exports.createStaffAccount = async (req, res) => {
  try {
    const created = await adminAccountService.createStaffAccount(
      req.body,
      req.user,
    );
    return res.status(201).json({ message: "Created", item: created });
  } catch (e) {
    console.log("createStaffAccount error:", e);
    const status = e.statusCode || 400;
    return res
      .status(status)
      .json({ message: e.message || "Create account failed" });
  }
};

exports.setVerified = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_verified } = req.body;
    const updated = await adminAccountService.setVerified(id, is_verified);
    return res.json({ message: "Updated", item: updated });
  } catch (e) {
    console.log("setVerified error:", e);
    const status = e.statusCode || 400;
    return res
      .status(status)
      .json({ message: e.message || "Update verified failed" });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await adminAccountService.deleteAccount(id, req.user);
    return res.json({ message: "Deleted", item: deleted });
  } catch (e) {
    console.log("deleteAccount error:", e);
    const status = e.statusCode || 400;
    return res.status(status).json({ message: e.message || "Delete failed" });
  }
};

exports.setActived = async (req, res, next) => {
  try {
    const id = req.params.id;

    // FE gửi { isActived: true/false }
    const { isActived } = req.body;

    const updated = await adminAccountService.setActived({
      id,
      is_actived: isActived,
    });

    return res.json({
      message: "Updated is_actived",
      item: updated,
    });
  } catch (e) {
    next(e);
  }
};
