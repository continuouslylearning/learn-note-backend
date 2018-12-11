const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRY } = require('../config');
const router = express.Router();
const localAuth = require('../strategies/local');
const jwtAuth = require('../strategies/jwt');

router.use(express.json());

function createAuthToken(user) {
  return jwt.sign({ user }, JWT_SECRET, {
    subject: user.email,
    expiresIn: JWT_EXPIRY
  });
}

router.post('/login', localAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.json({ ...req.user, authToken });
});

router.post('/refresh', jwtAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.json({ ...req.user, authToken });
});

module.exports = router;
