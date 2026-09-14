// CRUD_Project/server/routes/auth.routes.js
const yr6v = require("express");
const zmq4h = yr6v.Router();
const {
  register: mdue4u,
  login: msnzh,
  refreshToken: q2c5o,
  logout: tq7e,
  getMe: gbp83
} = require("../controllers/denim.controller")
const {
  registerValidation: k15fl,
  loginValidation: vfujlq,
  refreshTokenValidation: i06o3,
  handleValidationErrors: cenrz // âœ… Import the error handler
} = require("../validators/denim.validator")
const {
  protect: ne03
} = require("../middlewares/denim.middleware")
const g7hm0 = require("express-rate-limit");

// Rate limiting for auth endpoints
const db8ra4 = g7hm0({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false
});
zmq4h.use(db8ra4);

// âœ… Public routes - validation + error handler + controller
zmq4h.post("/register", k15fl, cenrz, mdue4u);
zmq4h.post("/login", vfujlq, cenrz, msnzh);
zmq4h.post("/refresh", i06o3, cenrz, q2c5o);

// âœ… Protected routes
zmq4h.get("/me", ne03, gbp83);
zmq4h.post("/logout", ne03, tq7e);
module.exports = zmq4h;