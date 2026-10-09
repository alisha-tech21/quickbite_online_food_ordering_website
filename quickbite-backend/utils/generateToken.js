const jwt = require('jsonwebtoken');

// Signs a JWT carrying the user's id and role. Role is embedded so
// authorization middleware never has to hit the DB just to check access.
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = generateToken;
