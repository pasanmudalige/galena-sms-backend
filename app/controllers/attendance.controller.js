const db = require("../models");
const { httpResponseCode } = require("../constants/httpResponseCode");
const { Op } = require("sequelize");

// Mark attendance manually
exports.markManual = async (req, res) => {
  try {
    const { Attendance, StudentClass } = db;
    const { enrollment_id, attendance_datetime, notes, override_allowed, override_reason } = req.body;
    const userId = req.userId; // From auth middleware

    if (!enrollment_id || !attendance_datetime) {
      return res.status(httpResponseCode.HTTP_RESPONSE_BAD_REQUEST).send({
        code: httpResponseCode.HTTP_RESPONSE_BAD_REQUEST,
        message: "enrollment_id and attendance_datetime are required",
      });
    }

    // Check if enrollment exists and is active
    const enrollment = await StudentClass.findByPk(enrollment_id);
    if (!enrollment) {
      return res.status(httpResponseCode.HTTP_RESPONSE_NOT_FOUND).send({
        code: httpResponseCode.HTTP_RESPONSE_NOT_FOUND,
        message: "Enrollment not found",
      });
    }

    if (enrollment.status !== "active") {
      return res.status(httpResponseCode.HTTP_RESPONSE_BAD_REQUEST).send({
        code: httpResponseCode.HTTP_RESPONSE_BAD_REQUEST,
        message: "Enrollment is not active",
      });
    }

    // Check if attendance already marked for today
    const today = new Date(attendance_datetime);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await Attendance.findOne({
      where: {
        enrollment_id,
        attendance_datetime: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
      },
    });

    if (existingAttendance) {
      return res.status(httpResponseCode.HTTP_RESPONSE_CONFLICT).send({
        code: httpResponseCode.HTTP_RESPONSE_CONFLICT,
        message: "Attendance already marked for this date",
        data: existingAttendance,
      });
    }

    // Get IP address
    const ipAddress = req.ip || req.connection.remoteAddress || null;

    // Create attendance record
    const attendance = await Attendance.create({
      enrollment_id,
      attendance_datetime,
      attendance_status: override_allowed ? "manual_override" : "present",
      entry_method: "manual",
      override_allowed: override_allowed || false,
      override_reason: override_reason || null,
      override_by: override_allowed ? userId : null,
      ip_address: ipAddress,
      notes: notes || null,
    });

    // Fetch with enrollment details
    const attendanceWithDetails = await Attendance.findByPk(attendance.id, {
      include: [
        {
          model: StudentClass,
          as: "enrollment",
          include: [
            { model: db.Student, attributes: ["id", "student_name", "student_id", "school"] },
            { model: db.Class, attributes: ["id", "class_name", "class_code"] },
          ],
        },
      ],
    });

    return res.status(httpResponseCode.HTTP_RESPONSE_CREATED).send({
      code: httpResponseCode.HTTP_RESPONSE_CREATED,
      message: "Attendance marked successfully",
      data: attendanceWithDetails,
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to mark attendance",
      error: error?.message || error,
    });
  }
};

// Mark attendance via QR scan
exports.markQRScan = async (req, res) => {
  try {
    const { Attendance, StudentClass } = db;
    const { qr_code, attendance_datetime, notes } = req.body;

    if (!qr_code || !attendance_datetime) {
      return res.status(httpResponseCode.HTTP_RESPONSE_BAD_REQUEST).send({
        code: httpResponseCode.HTTP_RESPONSE_BAD_REQUEST,
        message: "qr_code and attendance_datetime are required",
      });
    }

    // Find enrollment by QR code
    const enrollment = await StudentClass.findOne({
      where: { enrollment_qr_code: qr_code },
    });

    if (!enrollment) {
      return res.status(httpResponseCode.HTTP_RESPONSE_NOT_FOUND).send({
        code: httpResponseCode.HTTP_RESPONSE_NOT_FOUND,
        message: "Invalid QR code - Enrollment not found",
      });
    }

    if (enrollment.status !== "active") {
      return res.status(httpResponseCode.HTTP_RESPONSE_BAD_REQUEST).send({
        code: httpResponseCode.HTTP_RESPONSE_BAD_REQUEST,
        message: "Enrollment is not active",
        attendance_status: "blocked_unpaid",
      });
    }

    // Check if attendance already marked for today
    const today = new Date(attendance_datetime);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await Attendance.findOne({
      where: {
        enrollment_id: enrollment.id,
        attendance_datetime: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
      },
    });

    if (existingAttendance) {
      return res.status(httpResponseCode.HTTP_RESPONSE_CONFLICT).send({
        code: httpResponseCode.HTTP_RESPONSE_CONFLICT,
        message: "Attendance already marked for this date",
        data: existingAttendance,
      });
    }

    // TODO: Check payment status - if payment is overdue, mark as blocked_unpaid
    // For now, we'll mark as present
    const attendanceStatus = "present"; // Can be changed based on payment check

    // Get IP address
    const ipAddress = req.ip || req.connection.remoteAddress || null;

    // Create attendance record
    const attendance = await Attendance.create({
      enrollment_id: enrollment.id,
      attendance_datetime,
      attendance_status: attendanceStatus,
      entry_method: "qr_scan",
      ip_address: ipAddress,
      notes: notes || null,
    });

    // Fetch with enrollment details
    const attendanceWithDetails = await Attendance.findByPk(attendance.id, {
      include: [
        {
          model: StudentClass,
          as: "enrollment",
          include: [
            { model: db.Student, attributes: ["id", "student_name", "student_id", "school"] },
            { model: db.Class, attributes: ["id", "class_name", "class_code"] },
          ],
        },
      ],
    });

    return res.status(httpResponseCode.HTTP_RESPONSE_CREATED).send({
      code: httpResponseCode.HTTP_RESPONSE_CREATED,
      message: "Attendance marked successfully via QR scan",
      data: attendanceWithDetails,
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to mark attendance",
      error: error?.message || error,
    });
  }
};

// List attendance records
exports.list = async (req, res) => {
  try {
    const { Attendance, StudentClass } = db;
    const { enrollment_id, date_from, date_to, limit = 100 } = req.query;

    const where = {};
    if (enrollment_id) {
      where.enrollment_id = enrollment_id;
    }

    if (date_from || date_to) {
      where.attendance_datetime = {};
      if (date_from) {
        where.attendance_datetime[Op.gte] = new Date(date_from);
      }
      if (date_to) {
        const endDate = new Date(date_to);
        endDate.setHours(23, 59, 59, 999);
        where.attendance_datetime[Op.lte] = endDate;
      }
    }

    const attendances = await Attendance.findAll({
      where,
      order: [["attendance_datetime", "DESC"]],
      limit: parseInt(limit),
      include: [
        {
          model: StudentClass,
          as: "enrollment",
          include: [
            { model: db.Student, attributes: ["id", "student_name", "student_id", "school"] },
            { model: db.Class, attributes: ["id", "class_name", "class_code"] },
          ],
        },
      ],
    });

    return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: "Attendance records fetched successfully",
      data: attendances,
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to fetch attendance records",
      error: error?.message || error,
    });
  }
};

// Get attendance by ID
exports.getById = async (req, res) => {
  try {
    const { Attendance } = db;
    const { id } = req.params;

    const attendance = await Attendance.findByPk(id, {
      include: [
        {
          model: StudentClass,
          as: "enrollment",
          include: [
            { model: db.Student, attributes: ["id", "student_name", "student_id", "school"] },
            { model: db.Class, attributes: ["id", "class_name", "class_code"] },
          ],
        },
      ],
    });

    if (!attendance) {
      return res.status(httpResponseCode.HTTP_RESPONSE_NOT_FOUND).send({
        code: httpResponseCode.HTTP_RESPONSE_NOT_FOUND,
        message: "Attendance record not found",
      });
    }

    return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: "Attendance record fetched successfully",
      data: attendance,
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to fetch attendance record",
      error: error?.message || error,
    });
  }
};

