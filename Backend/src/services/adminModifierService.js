const repo = require("../repositories/adminModifierRepository");

exports.getModifierGroups = async (query) => {
  const status = query?.status || "active";
  const rows = await repo.listGroupsWithOptions({ status });

  // group rows -> nested JSON
  const map = new Map();

  for (const r of rows) {
    if (!map.has(r.group_id)) {
      map.set(r.group_id, {
        id: r.group_id,
        name: r.group_name,
        selectionType: r.selection_type,
        isRequired: !!r.is_required,
        minSelections: r.min_selections ?? 0,
        maxSelections: r.max_selections ?? 0,
        displayOrder: r.display_order ?? 0,
        status: r.group_status,
        createdAt: r.group_created_at,
        updatedAt: r.group_updated_at,
        options: [],
      });
    }

    if (r.option_id) {
      map.get(r.group_id).options.push({
        id: r.option_id,
        name: r.option_name,
        priceAdjustment: Number(r.price_adjustment ?? 0),
        status: r.option_status,
        createdAt: r.option_created_at,
      });
    }
  }

  return { groups: Array.from(map.values()) };
};
