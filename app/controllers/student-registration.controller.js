const db = require("../models");
const { httpResponseCode } = require("../constants/httpResponseCode");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { generateStudentId } = require("../utils/student-id-generator");

// Generate random password
function generateRandomPassword(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Public student registration
exports.register = async (req, res) => {
  try {
    const { Student } = db;
    const {
      student_name,
      student_id,
      school,
      phone,
      parent_phone,
      email,
      address,
      year_of_al,
      hear_about_us,
    } = req.body;

    if (!student_name || !phone || !email) {
      return res.status(httpResponseCode.HTTP_RESPONSE_BAD_REQUEST).send({
        code: httpResponseCode.HTTP_RESPONSE_BAD_REQUEST,
        message: "student_name, phone, and email are required",
      });
    }

    // Check if email already exists
    const existingStudent = await Student.findOne({ where: { email } });
    if (existingStudent) {
      return res.status(httpResponseCode.HTTP_RESPONSE_BAD_REQUEST).send({
        code: httpResponseCode.HTTP_RESPONSE_BAD_REQUEST,
        message: "Email already registered",
      });
    }

    // Convert hear_about_us array to JSON string if it's an array
    let hearAboutUsValue = null;
    if (hear_about_us) {
      if (Array.isArray(hear_about_us)) {
        hearAboutUsValue = JSON.stringify(hear_about_us);
      } else if (typeof hear_about_us === "string") {
        hearAboutUsValue = hear_about_us;
      }
    }

    // Generate student_id if not provided
    let finalStudentId = student_id;
    if (!finalStudentId) {
      finalStudentId = await generateStudentId(year_of_al);
    }

    const student = await Student.create({
      student_name,
      student_id: finalStudentId,
      school: school || null,
      phone,
      parent_phone: parent_phone || null,
      email,
      address: address || null,
      year_of_al: year_of_al || null,
      hear_about_us: hearAboutUsValue,
      status: "active",
      pending_access: true, // Mark as pending access
    });

    return res.status(httpResponseCode.HTTP_RESPONSE_CREATED).send({
      code: httpResponseCode.HTTP_RESPONSE_CREATED,
      message: "Registration successful. Please wait for admin approval.",
      data: {
        student_id: student.student_id,
        student_name: student.student_name,
      },
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to register student",
      error: error?.message || error,
    });
  }
};

// Grant access to student (admin only)
exports.grantAccess = async (req, res) => {
  try {
    const { Student, User } = db;
    const { id } = req.params;

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(httpResponseCode.HTTP_RESPONSE_NOT_FOUND).send({
        code: httpResponseCode.HTTP_RESPONSE_NOT_FOUND,
        message: "Student not found",
      });
    }

    if (!student.email) {
      return res.status(httpResponseCode.HTTP_RESPONSE_BAD_REQUEST).send({
        code: httpResponseCode.HTTP_RESPONSE_BAD_REQUEST,
        message: "Student email is required to grant access",
      });
    }

    // Check if user already exists
    let user = await User.findOne({ where: { email: student.email } });
    const password = generateRandomPassword(8);
    const hashedPassword = bcrypt.hashSync(password, 8);

    if (user) {
      // Update existing user
      await user.update({
        password: hashedPassword,
        role: "student",
        is_active: true,
      });
    } else {
      // Create new user
      user = await User.create({
        full_name: student.student_name,
        email: student.email,
        password: hashedPassword,
        role: "student",
        is_active: true,
      });
    }

    // Link student to user
    await student.update({
      user_id: user.id,
      pending_access: false,
    });

    return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: "Access granted successfully",
      data: {
        username: student.email,
        password: password,
        student_id: student.student_id,
        student_name: student.student_name,
      },
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to grant access",
      error: error?.message || error,
    });
  }
};

// Reset student password (admin only)
exports.resetPassword = async (req, res) => {
  try {
    const { Student, User } = db;
    const { id } = req.params;

    const student = await Student.findByPk(id, {
      include: [{ model: User, as: "user" }],
    });

    if (!student) {
      return res.status(httpResponseCode.HTTP_RESPONSE_NOT_FOUND).send({
        code: httpResponseCode.HTTP_RESPONSE_NOT_FOUND,
        message: "Student not found",
      });
    }

    if (!student.user_id) {
      return res.status(httpResponseCode.HTTP_RESPONSE_BAD_REQUEST).send({
        code: httpResponseCode.HTTP_RESPONSE_BAD_REQUEST,
        message: "Student does not have access granted yet",
      });
    }

    const password = generateRandomPassword(8);
    const hashedPassword = bcrypt.hashSync(password, 8);

    await student.user.update({
      password: hashedPassword,
    });

    return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: "Password reset successfully",
      data: {
        username: student.email,
        password: password,
        student_id: student.student_id,
        student_name: student.student_name,
      },
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to reset password",
      error: error?.message || error,
    });
  }
};


