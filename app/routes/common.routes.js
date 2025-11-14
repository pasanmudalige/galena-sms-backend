const express = require("express");
const router = express.Router();
const authJwt = require("../middleware/authJwt");
const healthController = require("../controllers/health.controller");
const studentRegistrationController = require("../controllers/student-registration.controller");
const documentController = require("../controllers/document.controller");
const paymentController = require("../controllers/payment.controller");

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

/**
 * Student document routes (auth required)
 */
router.get("/student/documents", [authJwt.verifyToken], documentController.listForStudent);
router.get("/student/documents/:id/view", [authJwt.verifyToken], documentController.view);

/**
 * Student payment routes (auth required)
 */
router.get("/student/payments", [authJwt.verifyToken], paymentController.getStudentPayments);
router.post("/student/payments/mark-paid", [authJwt.verifyToken], paymentController.markPaymentAsPaid);

module.exports = router;
