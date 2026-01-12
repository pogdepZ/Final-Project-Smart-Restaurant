const modifierRepo = require("../repositories/modifierRepository");

class ModifierService {
  async getAllGroups() {
    return await modifierRepo.getAllWithOptions();
  }

  async createGroup(data) {
    const {
      name,
      selection_type,
      is_required,
      min_selections,
      max_selections,
      display_order,
    } = data;

    // --- VALIDATION LOGIC ---
    if (!name || name.trim() === "") {
      throw new Error("Tên nhóm là bắt buộc");
    }
    if (!["single", "multiple"].includes(selection_type)) {
      throw new Error("Kiểu chọn phải là 'single' hoặc 'multiple'");
    }

    let finalMin = parseInt(min_selections) || 0;
    let finalMax = parseInt(max_selections) || 0;

    if (selection_type === "single") {
      finalMax = 1;
      finalMin = is_required ? 1 : 0;
    } else {
      if (is_required && finalMin < 1) {
        throw new Error("Nếu bắt buộc, số lượng tối thiểu phải >= 1");
      }
      if (finalMax > 0 && finalMax < finalMin) {
        throw new Error("Số lượng tối đa phải lớn hơn tối thiểu");
      }
    }

    // Gọi Repo
    return await modifierRepo.createGroup({
      name,
      selection_type,
      is_required: is_required || false,
      min_selections: finalMin,
      max_selections: finalMax,
      display_order: display_order || 0,
    });
  }

  async updateGroup(id, data) {
    const updated = await modifierRepo.updateGroup(id, data);
    if (!updated) throw new Error("Nhóm không tồn tại");
    return updated;
  }

  async addOption(groupId, data) {
    const { name, price_adjustment, status } = data;

    if (!name || name.trim() === "")
      throw new Error("Tên tùy chọn là bắt buộc");

    const price = Number(price_adjustment);
    if (isNaN(price) || price < 0) throw new Error("Giá cộng thêm phải >= 0");

    // Check Group Exist
    const group = await modifierRepo.findGroupById(groupId);
    if (!group) throw new Error("Nhóm không tồn tại");

    return await modifierRepo.createOption({
      group_id: groupId,
      name,
      price,
      status: status || "active",
    });
  }

  async attachGroupToItem(itemId, groupId) {
    // Có thể thêm check Item exist nếu cần
    await modifierRepo.attachToItem(itemId, groupId);
    return { message: "Đã gắn nhóm modifier thành công" };
  }
}

module.exports = new ModifierService();
