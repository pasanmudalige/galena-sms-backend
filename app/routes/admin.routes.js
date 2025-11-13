const express = require('express');
const router = express.Router();
const authController = require("../controllers/auth.controller");
const dashboardController = require("../controllers/dashboard.controller");
const studentController = require("../controllers/student.controller");
const studentRegistrationController = require("../controllers/student-registration.controller");
const classesController = require("../controllers/classes.controller");
const enrollmentController = require("../controllers/enrollment.controller");
const attendanceController = require("../controllers/attendance.controller");
const constantsController = require("../controllers/constants.controller");
const documentController = require("../controllers/document.controller");
const authJwt = require("../middleware/authJwt");

router.post("/auth/login", authController.login);
router.get("/auth/getDashboardData",[authJwt.verifyToken], dashboardController.getDashboardData);
router.get("/auth/get-user-data",[authJwt.verifyToken], authController.getUserData);

// Constants
router.get("/constants/al-years", [authJwt.verifyToken], constantsController.getALYears);

// Students
router.get("/students", [authJwt.verifyToken], studentController.list);
router.post("/students", [authJwt.verifyToken], studentController.create);
router.put("/students/:id", [authJwt.verifyToken], studentController.update);
router.delete("/students/:id", [authJwt.verifyToken], studentController.remove);
router.post("/students/:id/grant-access", [authJwt.verifyToken], studentRegistrationController.grantAccess);
router.post("/students/:id/reset-password", [authJwt.verifyToken], studentRegistrationController.resetPassword);

// Classes
router.get("/classes", [authJwt.verifyToken], classesController.list);
router.post("/classes", [authJwt.verifyToken], classesController.create);
router.put("/classes/:id", [authJwt.verifyToken], classesController.update);
router.delete("/classes/:id", [authJwt.verifyToken], classesController.remove);

// Enrollments
router.get("/enrollments", [authJwt.verifyToken], enrollmentController.list);
router.post("/enrollments", [authJwt.verifyToken], enrollmentController.create);
router.get("/enrollments/:id", [authJwt.verifyToken], enrollmentController.getById);
router.get("/enrollments/qr/:qr_code", enrollmentController.getByQRCode); // Public for QR scan
router.put("/enrollments/:id", [authJwt.verifyToken], enrollmentController.update);
router.delete("/enrollments/:id", [authJwt.verifyToken], enrollmentController.remove);

// Attendance
router.get("/attendance", [authJwt.verifyToken], attendanceController.list);
router.post("/attendance/manual", [authJwt.verifyToken], attendanceController.markManual);
router.post("/attendance/qr-scan", attendanceController.markQRScan); // Public for QR scan
router.get("/attendance/:id", [authJwt.verifyToken], attendanceController.getById);

// Documents
router.get("/documents", [authJwt.verifyToken], documentController.list);
router.post("/documents", [authJwt.verifyToken], documentController.upload);
router.get("/documents/:id", [authJwt.verifyToken], documentController.getById);
router.put("/documents/:id", [authJwt.verifyToken], documentController.update);
router.delete("/documents/:id", [authJwt.verifyToken], documentController.remove);

module.exports = router;