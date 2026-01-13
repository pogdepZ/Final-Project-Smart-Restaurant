const db = require("../config/db"); // pool hoặc client tuỳ bạn

exports.listGroupsWithOptions = async ({ status = "active" } = {}) => {
  const params = [];
  let where = "";

  if (status && status !== "ALL") {
    params.push(status);
    where = `WHERE g.status = $${params.length}`;
  }

  const sql = `
    SELECT
      g.id AS group_id,
      g.name AS group_name,
      g.selection_type,
      g.is_required,
      g.min_selections,
      g.max_selections,
      g.display_order,
      g.status AS group_status,
      g.created_at AS group_created_at,
      g.updated_at AS group_updated_at,

      o.id AS option_id,
      o.name AS option_name,
      o.price_adjustment,
      o.status AS option_status,
      o.created_at AS option_created_at
    FROM modifier_groups g
    LEFT JOIN modifier_options o
      ON o.group_id = g.id
      AND o.status = 'active'
    ${where}
    ORDER BY g.display_order ASC, g.created_at DESC, o.created_at ASC
  `;

  const { rows } = await db.query(sql, params);
  return rows;
};
