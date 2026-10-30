const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'book-review-local-secret';

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/customer', session({
  secret: process.env.SESSION_SECRET || 'fingerprint_customer',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' }
}));

app.use('/customer/auth/*', function auth(req, res, next) {
  const authorization = req.get('authorization') || '';
  const bearer = authorization.match(/^Bearer\s+(.+)$/i);

  if (bearer) {
    try {
      const payload = jwt.verify(bearer[1], JWT_SECRET);
      req.user = { username: payload.username };
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  }

  if (req.session.username) {
    req.user = { username: req.session.username };
    return next();
  }

  return res.status(401).json({ message: 'Authentication required' });
});

app.use('/customer', customer_routes);
app.use('/', genl_routes);

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  return res.status(500).json({ message: 'Internal server error' });
});

const PORT = Number(process.env.PORT) || 5000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
}

module.exports = app;
