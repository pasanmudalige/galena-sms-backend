const db = require("../models");
const { httpResponseCode } = require("../constants/httpResponseCode");
const { Op } = require("sequelize");

// Helper function to validate schedule and time window
const validateScheduleAndTime = async (classId, scanDateTime) => {
  const { ClassSchedule, ExtraClass } = db;
  const scanDate = new Date(scanDateTime);
  const dayOfWeek = scanDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const scanTime = scanDate.toTimeString().slice(0, 5); // HH:MM format
  const dateOnly = scanDate.toISOString().split('T')[0]; // YYYY-MM-DD format

  // First, check for extra classes on this specific date
  const extraClasses = await ExtraClass.findAll({
    where: {
      session_date: dateOnly,
      is_active: true,
    },
    include: [
      {
        model: db.Class,
        through: db.ExtraClassClass,
        where: { id: classId },
        as: 'classes',
        required: true,
      },
    ],
  });

  if (extraClasses.length > 0) {
    // Found extra class for this date, validate time window
    for (const extraClass of extraClasses) {
      const startTime = extraClass.start_time;
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [scanHours, scanMinutes] = scanTime.split(':').map(Number);

      // Calculate start time in minutes from midnight
      const startTimeMinutes = startHours * 60 + startMinutes;
      const scanTimeMinutes = scanHours * 60 + scanMinutes;

      // Check if scan is within 1 hour before to 1 hour after start time
      const oneHourBefore = startTimeMinutes - 60;
      const oneHourAfter = startTimeMinutes + 60;

      if (scanTimeMinutes >= oneHourBefore && scanTimeMinutes <= oneHourAfter) {
        return {
          valid: true,
          scheduleType: 'extra',
          startTime: startTime,
          endTime: extraClass.end_time,
        };
      }
    }
    // Extra class exists but time window doesn't match
    const firstExtraClass = extraClasses[0];
    return {
      valid: false,
      error: 'TIME_WINDOW',
      message: `Attendance can only be marked within 1 hour before to 1 hour after the scheduled start time (${firstExtraClass.start_time})`,
      scheduleType: 'extra',
      startTime: firstExtraClass.start_time,
    };
  }

  // If no extra class, check default weekly schedule
  const defaultSchedules = await ClassSchedule.findAll({
    where: {
      class_id: classId,
      day_of_week: dayOfWeek,
      is_active: true,
    },
  });

  if (defaultSchedules.length === 0) {
    return {
      valid: false,
      error: 'NO_SCHEDULE',
      message: 'No scheduled class session found for this day and time',
    };
  }

  // Check if scan time is within any of the default schedules' time windows
  for (const schedule of defaultSchedules) {
    const startTime = schedule.start_time;
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [scanHours, scanMinutes] = scanTime.split(':').map(Number);

    const startTimeMinutes = startHours * 60 + startMinutes;
    const scanTimeMinutes = scanHours * 60 + scanMinutes;

    const oneHourBefore = startTimeMinutes - 60;
    const oneHourAfter = startTimeMinutes + 60;

    if (scanTimeMinutes >= oneHourBefore && scanTimeMinutes <= oneHourAfter) {
      return {
        valid: true,
        scheduleType: 'default',
        startTime: startTime,
        endTime: schedule.end_time,
      };
    }
  }

  // Default schedule exists but time window doesn't match
  const firstSchedule = defaultSchedules[0];
  return {
    valid: false,
    error: 'TIME_WINDOW',
    message: `Attendance can only be marked within 1 hour before to 1 hour after the scheduled start time (${firstSchedule.start_time})`,
    scheduleType: 'default',
    startTime: firstSchedule.start_time,
  };
};

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

    // Load class information for schedule validation
    const enrollmentWithClass = await StudentClass.findByPk(enrollment.id, {
      include: [
        { model: db.Class, attributes: ["id", "class_name", "class_code"] },
      ],
    });

    if (!enrollmentWithClass || !enrollmentWithClass.class) {
      return res.status(httpResponseCode.HTTP_RESPONSE_NOT_FOUND).send({
        code: httpResponseCode.HTTP_RESPONSE_NOT_FOUND,
        message: "Class information not found for this enrollment",
      });
    }

    // Validate schedule and time window
    const scheduleValidation = await validateScheduleAndTime(
      enrollmentWithClass.class.id,
      attendance_datetime
    );

    if (!scheduleValidation.valid) {
      return res.status(httpResponseCode.HTTP_RESPONSE_BAD_REQUEST).send({
        code: httpResponseCode.HTTP_RESPONSE_BAD_REQUEST,
        message: scheduleValidation.message,
        error: scheduleValidation.error,
        scheduleType: scheduleValidation.scheduleType,
        startTime: scheduleValidation.startTime,
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


