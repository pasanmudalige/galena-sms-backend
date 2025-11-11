const express = require("express");
const router = express.Router();
const authJwt = require("../middleware/authJwt");
const healthController = require("../controllers/health.controller");
const studentRegistrationController = require("../controllers/student-registration.controller");

/**
 * Main Health check function (Without JWT Verification)
 */
router.get("/health", healthController.healthCheck);

/**
 * Health check with JWT Verification
 */
router.get("/api/health/verify", [authJwt.verifyToken], (req, res) => {
  res.json({ message: "Health check passed with jwt verification successfully." });
});

/**
 * Public student registration (no auth required)
 */
router.post("/student/register", studentRegistrationController.register);

/**
 * Public A/L years endpoint (no auth required for registration)
 */
const constantsController = require("../controllers/constants.controller");
router.get("/constants/al-years", constantsController.getALYears);

module.exports = router;
