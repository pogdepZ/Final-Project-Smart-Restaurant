const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    return res.status(400).json({ error: "Dữ liệu không hợp lệ", details: errorMessages });
  }
  
  next();
};

module.exports = validate;