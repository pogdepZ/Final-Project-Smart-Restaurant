const Joi = require("joi");

// Validate tạo món ăn
const createItemSchema = Joi.object({
  name: Joi.string().min(2).max(80).required().messages({
    "string.min": "Tên món phải từ 2 ký tự trở lên",
    "string.max": "Tên món không quá 80 ký tự",
    "any.required": "Tên món là bắt buộc",
  }),
  price: Joi.number().positive().required().messages({
    "number.positive": "Giá tiền phải lớn hơn 0",
    "any.required": "Giá tiền là bắt buộc",
  }),
  categoryId: Joi.string().required(),
  description: Joi.string().allow("", null),
  image: Joi.string().uri().allow("", null).messages({
    "string.uri": "Link ảnh không hợp lệ",
  }),
  prepTimeMinutes: Joi.number().integer().min(0).max(240).default(0).messages({
    "number.max": "Thời gian chuẩn bị tối đa 240 phút",
  }),
  status: Joi.string()
    .valid("AVAILABLE", "UNAVAILABLE", "SOLD_OUT")
    .default("AVAILABLE"),
  isChefRecommended: Joi.boolean().default(false),
  modifierGroupIds: Joi.array().items(Joi.string()).default([]),
});

// Validate tạo danh mục
const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    "string.min": "Tên danh mục phải từ 2 ký tự trở lên",
    "string.max": "Tên danh mục không quá 50 ký tự",
    "any.required": "Tên danh mục là bắt buộc",
  }),
  description: Joi.string().allow("", null),

  // Display order: Integer, >= 0
  displayOrder: Joi.number().integer().min(0).default(0).messages({
    "number.base": "Thứ tự hiển thị phải là số",
    "number.min": "Thứ tự hiển thị không được âm",
  }),

  status: Joi.string().valid("ACTIVE", "INACTIVE").default("ACTIVE"),
});

module.exports = {
  createItemSchema,
  createCategorySchema,
};
