const express = require('express');
const router = express.Router();
const healthController = require("../controllers/health.controller");

router.get("/auth/login", healthController.healthCheck);

module.exports = router;