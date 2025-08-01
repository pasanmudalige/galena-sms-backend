const express = require("express");
const router = express.Router();
const authJwt = require("../middleware/authJwt");
const healthController = require("../controllers/health.controller");

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

module.exports = router;
