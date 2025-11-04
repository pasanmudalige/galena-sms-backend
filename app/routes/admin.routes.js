const express = require('express');
const router = express.Router();
const authController = require("../controllers/auth.controller");
const dashboardController = require("../controllers/dashboard.controller");
const studentController = require("../controllers/student.controller");
const classesController = require("../controllers/classes.controller");
const authJwt = require("../middleware/authJwt");

router.post("/auth/login", authController.login);
router.get("/auth/getDashboardData",[authJwt.verifyToken], dashboardController.getDashboardData);
router.get("/auth/get-user-data",[authJwt.verifyToken], authController.getUserData);

// Students
router.get("/students", [authJwt.verifyToken], studentController.list);
router.delete("/students/:id", [authJwt.verifyToken], studentController.remove);

// Classes
router.get("/classes", [authJwt.verifyToken], classesController.list);
router.delete("/classes/:id", [authJwt.verifyToken], classesController.remove);

module.exports = router;