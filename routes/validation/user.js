const EMAIL_PATTERN = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

function validateUser(req, res, next){

  const { email } = req.body;

  const trimmedFields = ['email', 'password'];
  const nonTrimmedFields = trimmedFields.find(field => field in req.body && (req.body[field].trim() !== req.body[field]));
  if(nonTrimmedFields){
    const err = new Error(`${nonTrimmedFields} cannot start or end with whitespace`);
    err.status = 400;
    return next(err);
  }

  const fieldSizes = {
    password: {
      min: 8,
      max: 72
    }
  };

  const tooSmallField = Object.keys(fieldSizes).find(
    field => 'min' in fieldSizes[field] && req.body[field].trim().length < fieldSizes[field].min
  );
  const tooLargeField = Object.keys(fieldSizes).find(
    field => 'max' in fieldSizes[field] && req.body[field].trim().length > fieldSizes[field].max
  );

  if(tooSmallField || tooLargeField){
    const message = tooSmallField 
      ? `${tooSmallField} must be at least ${fieldSizes[tooSmallField].min} characters long`
      : `${tooLargeField} must be at most ${fieldSizes[tooLargeField].max} characters long`;
    const err = new Error(message);
    err.status = 400;
    return next(err);
  }

  if(!email.match(EMAIL_PATTERN)){
    const err = new Error('Email is not valid');
    err.status = 400;
    return next(err);
  }

  return next();
}

module.exports = validateUser;