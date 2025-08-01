const express = require('express');
const router = express.Router();
const authController = require("../controllers/auth.controller");
const dashboardController = require("../controllers/dashboard.controller");
const authJwt = require("../middleware/authJwt");

router.post("/auth/login", authController.login);
router.get("/auth/getDashboardData",[authJwt.verifyToken], dashboardController.getDashboardData);

module.exports = router;