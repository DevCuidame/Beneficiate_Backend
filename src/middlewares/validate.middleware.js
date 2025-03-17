// middleware/validate.middleware.js
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res
      .status(400)
      .json({
        errors: error.details.map((detail) => detail.message.replace(/"/g, '')),
      });
  }
  next();
};

module.exports = validate;
