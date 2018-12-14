/**
 * Ensures the request body contains all required fields.
 * @param {[]} fields - An array of fields (by name)
 * @throws a 400 response if a field is missing
 */
const requiredFields = fields => (req, res, next) => {
  if (!Array.isArray(fields)) {
    fields = Array.from(arguments);
  }

  for (const field of fields) {
    if (!(field in req.body)) {
      const err = new Error(`Missing ${field} in request body.`);
      err.status = 400;
      return next(err);
    }
  }

  return next();
};

module.exports = {
  requiredFields
};
