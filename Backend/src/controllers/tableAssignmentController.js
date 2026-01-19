// src/controllers/tableAssignmentController.js
const service = require("../services/tableAssignmentService");

exports.getWaiters = async (req, res, next) => {
  try {
    const data = await service.getWaiters();
    return res.json(data);
  } catch (e) {
    return next(e);
  }
};

exports.getByWaiter = async (req, res, next) => {
  try {
    const waiterId = String(req.params.waiterId || "");
    const data = await service.getAssignmentsByWaiter(waiterId);
    return res.json(data);
  } catch (e) {
    return next(e);
  }
};

exports.replaceByWaiter = async (req, res, next) => {
  try {
    const waiterId = String(req.params.waiterId || "");
    const tableIds = Array.isArray(req.body?.tableIds) ? req.body.tableIds : [];
    const data = await service.replaceAssignments(waiterId, tableIds);
    return res.json(data);
  } catch (e) {
    return next(e);
  }
};

// bonus
exports.listAll = async (req, res, next) => {
  try {
    const data = await service.listAll();
    return res.json(data);
  } catch (e) {
    return next(e);
  }
};
