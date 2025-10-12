const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization?.split(' ')[1];
  if (!auth) return res.status(401).send('Unauthorized');
  try {
    const payload = jwt.verify(auth, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).send('Invalid token');
  }
}

module.exports = { authMiddleware };