const express = require('express');
const router = express.Router();

const commonRoutes = require('./common.routes');
const adminRoutes = require('./admin.routes');
const teacherRoutes = require('./teacher.routes');

// Apply middleware for all routes
router.use((req, res, next) => {
  res.header("Access-Control-Allow-Headers", "x-access-token, Origin, Content-Type, Accept");
  next();
});

router.use('/v1/api/common', commonRoutes);
router.use('/v1/api/admin', adminRoutes);
router.use('/v1/api/teacher', teacherRoutes);

module.exports = router;
