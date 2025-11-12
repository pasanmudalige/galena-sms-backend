const db = require("../models");
const { httpResponseCode } = require("../constants/httpResponseCode");
const QRCode = require("qrcode");
const crypto = require("crypto");

// Generate unique QR code string
function generateQRCodeString(studentId, classId) {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString("hex");
  return `ENR-${studentId}-${classId}-${timestamp}-${random}`;
}

// Create enrollment
exports.create = async (req, res) => {
  try {
    const { StudentClass, Student, Class } = db;
    const { student_id, class_id, enrollment_date, card_type, custom_fee } = req.body;

    if (!student_id || !class_id || !enrollment_date) {
      return res.status(httpResponseCode.HTTP_RESPONSE_BAD_REQUEST).send({
        code: httpResponseCode.HTTP_RESPONSE_BAD_REQUEST,
        message: "student_id, class_id, and enrollment_date are required",
      });
    }

    // Check if student exists
    const student = await Student.findByPk(student_id);
    if (!student) {
      return res.status(httpResponseCode.HTTP_RESPONSE_NOT_FOUND).send({
        code: httpResponseCode.HTTP_RESPONSE_NOT_FOUND,
        message: "Student not found",
      });
    }

    // Check if class exists
    const classItem = await Class.findByPk(class_id);
    if (!classItem) {
      return res.status(httpResponseCode.HTTP_RESPONSE_NOT_FOUND).send({
        code: httpResponseCode.HTTP_RESPONSE_NOT_FOUND,
        message: "Class not found",
      });
    }

    // Check if enrollment already exists
    const existingEnrollment = await StudentClass.findOne({
      where: {
        student_id,
        class_id,
        status: "active",
      },
    });

    if (existingEnrollment) {
      return res.status(httpResponseCode.HTTP_RESPONSE_CONFLICT).send({
        code: httpResponseCode.HTTP_RESPONSE_CONFLICT,
        message: "Student is already enrolled in this class",
      });
    }

    // Generate QR code string
    let qrCodeString = generateQRCodeString(student_id, class_id);
    let qrCodeExists = true;
    let attempts = 0;

    // Ensure unique QR code
    while (qrCodeExists && attempts < 10) {
      const existing = await StudentClass.findOne({
        where: { enrollment_qr_code: qrCodeString },
      });
      if (!existing) {
        qrCodeExists = false;
      } else {
        qrCodeString = generateQRCodeString(student_id, class_id);
        attempts++;
      }
    }

    // Generate QR code image as data URL
    const qrCodeDataURL = await QRCode.toDataURL(qrCodeString, {
      errorCorrectionLevel: "H",
      type: "image/png",
      width: 300,
    });

    // Create enrollment
    const enrollment = await StudentClass.create({
      student_id,
      class_id,
      enrollment_qr_code: qrCodeString,
      enrollment_date,
      card_type: card_type || "full_card",
      custom_fee: custom_fee || null,
      status: "active",
    });

    // Fetch with associations
    const enrollmentWithDetails = await StudentClass.findByPk(enrollment.id, {
      include: [
        { model: Student, attributes: ["id", "student_name", "student_id", "school"] },
        { model: Class, attributes: ["id", "class_name", "class_code"] },
      ],
    });

    return res.status(httpResponseCode.HTTP_RESPONSE_CREATED).send({
      code: httpResponseCode.HTTP_RESPONSE_CREATED,
      message: "Student enrolled successfully",
      data: {
        enrollment: enrollmentWithDetails,
        qr_code_string: qrCodeString,
        qr_code_image: qrCodeDataURL,
      },
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to create enrollment",
      error: error?.message || error,
    });
  }
};

// List enrollments
exports.list = async (req, res) => {
  try {
    const { StudentClass, Student, Class } = db;
    const enrollments = await StudentClass.findAll({
      order: [["createdAt", "DESC"]],
      include: [
        { model: Student, attributes: ["id", "student_name", "student_id", "school", "phone"] },
        { model: Class, attributes: ["id", "class_name", "class_code", "teacher_name"] },
      ],
    });

    return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: "Enrollments fetched successfully",
      data: enrollments,
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to fetch enrollments",
      error: error?.message || error,
    });
  }
};

// Get enrollment by ID
exports.getById = async (req, res) => {
  try {
    const { StudentClass, Student, Class } = db;
    const { id } = req.params;

    const enrollment = await StudentClass.findByPk(id, {
      include: [
        { model: Student, attributes: ["id", "student_name", "student_id", "school", "phone"] },
        { model: Class, attributes: ["id", "class_name", "class_code", "teacher_name"] },
      ],
    });

    if (!enrollment) {
      return res.status(httpResponseCode.HTTP_RESPONSE_NOT_FOUND).send({
        code: httpResponseCode.HTTP_RESPONSE_NOT_FOUND,
        message: "Enrollment not found",
      });
    }

    // Generate QR code image
    const qrCodeDataURL = await QRCode.toDataURL(enrollment.enrollment_qr_code, {
      errorCorrectionLevel: "H",
      type: "image/png",
      width: 300,
    });

    return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: "Enrollment fetched successfully",
      data: {
        enrollment,
        qr_code_image: qrCodeDataURL,
      },
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to fetch enrollment",
      error: error?.message || error,
    });
  }
};

// Get enrollment by QR code
exports.getByQRCode = async (req, res) => {
  try {
    const { StudentClass, Student, Class } = db;
    const { qr_code } = req.params;

    const enrollment = await StudentClass.findOne({
      where: { enrollment_qr_code: qr_code },
      include: [
        { model: Student, attributes: ["id", "student_name", "student_id", "school", "phone"] },
        { model: Class, attributes: ["id", "class_name", "class_code", "teacher_name"] },
      ],
    });

    if (!enrollment) {
      return res.status(httpResponseCode.HTTP_RESPONSE_NOT_FOUND).send({
        code: httpResponseCode.HTTP_RESPONSE_NOT_FOUND,
        message: "Enrollment not found for this QR code",
      });
    }

    return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: "Enrollment found",
      data: enrollment,
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to fetch enrollment",
      error: error?.message || error,
    });
  }
};

// Update enrollment
exports.update = async (req, res) => {
  try {
    const { StudentClass } = db;
    const { id } = req.params;
    const { enrollment_date, card_type, custom_fee, status } = req.body;

    const enrollment = await StudentClass.findByPk(id);
    if (!enrollment) {
      return res.status(httpResponseCode.HTTP_RESPONSE_NOT_FOUND).send({
        code: httpResponseCode.HTTP_RESPONSE_NOT_FOUND,
        message: "Enrollment not found",
      });
    }

    await enrollment.update({
      enrollment_date: enrollment_date !== undefined ? enrollment_date : enrollment.enrollment_date,
      card_type: card_type !== undefined ? card_type : enrollment.card_type,
      custom_fee: custom_fee !== undefined ? custom_fee : enrollment.custom_fee,
      status: status !== undefined ? status : enrollment.status,
    });

    const updated = await StudentClass.findByPk(id, {
      include: [
        { model: db.Student, attributes: ["id", "student_name", "student_id", "school"] },
        { model: db.Class, attributes: ["id", "class_name", "class_code"] },
      ],
    });

    return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: "Enrollment updated successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to update enrollment",
      error: error?.message || error,
    });
  }
};

// Delete enrollment
exports.remove = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { StudentClass, Attendance } = db;
    const { id } = req.params;

    // Check if enrollment exists
    const enrollment = await StudentClass.findByPk(id);
    if (!enrollment) {
      await transaction.rollback();
      return res.status(httpResponseCode.HTTP_RESPONSE_NOT_FOUND).send({
        code: httpResponseCode.HTTP_RESPONSE_NOT_FOUND,
        message: "Enrollment not found",
      });
    }

    // Delete all attendance records for this enrollment
    await Attendance.destroy({
      where: { enrollment_id: id },
      transaction,
    });

    // Delete the enrollment
    await StudentClass.destroy({
      where: { id },
      transaction,
    });

    await transaction.commit();

    return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: "Enrollment and all related records deleted successfully",
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to delete enrollment",
      error: error?.message || error,
    });
  }
};


