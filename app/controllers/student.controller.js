const db = require("../models");
const { httpResponseCode } = require("../constants/httpResponseCode");

exports.list = async (req, res) => {
  try {
    const { Student } = db;
    const students = await Student.findAll({
      order: [["createdAt", "DESC"]],
      attributes: ["id","student_id", "student_name", "school", "phone", "parent_phone", "email", "address", "year_of_al", "hear_about_us", "status", "pending_access", "user_id", "createdAt"],
      include: [
        {
          model: db.User,
          as: "user",
          attributes: ["id", "email", "is_active"],
          required: false,
        },
      ],
    });
    return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: "Students fetched successfully",
      data: students,
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to fetch students",
      error: error?.message || error,
    });
  }
};

exports.create = async (req, res) => {
  try {
    const { Student } = db;
    const { student_name, student_id, school, phone, parent_phone, email, address, year_of_al, hear_about_us } = req.body;

    if (!student_name || !phone) {
      return res.status(httpResponseCode.HTTP_RESPONSE_BAD_REQUEST).send({
        code: httpResponseCode.HTTP_RESPONSE_BAD_REQUEST,
        message: "student_name and phone are required",
      });
    }

    // Convert hear_about_us array to JSON string if it's an array
    let hearAboutUsValue = null;
    if (hear_about_us) {
      if (Array.isArray(hear_about_us)) {
        hearAboutUsValue = JSON.stringify(hear_about_us);
      } else if (typeof hear_about_us === 'string') {
        hearAboutUsValue = hear_about_us;
      }
    }

    const created = await Student.create({
      student_name,
      student_id: student_id || null,
      school: school || null,
      phone,
      parent_phone: parent_phone || null,
      email: email || null,
      address: address || null,
      year_of_al: year_of_al || null,
      hear_about_us: hearAboutUsValue,
      status: 'active',
    });

    return res.status(httpResponseCode.HTTP_RESPONSE_CREATED).send({
      code: httpResponseCode.HTTP_RESPONSE_CREATED,
      message: "Student created successfully",
      data: created,
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to create student",
      error: error?.message || error,
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { Student } = db;
    const id = req.params.id;
    const { student_name, student_id, school, phone, parent_phone, email, address, year_of_al, hear_about_us, status } = req.body;

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(httpResponseCode.HTTP_RESPONSE_NOT_FOUND).send({
        code: httpResponseCode.HTTP_RESPONSE_NOT_FOUND,
        message: "Student not found",
      });
    }

    if (!student_name || !phone) {
      return res.status(httpResponseCode.HTTP_RESPONSE_BAD_REQUEST).send({
        code: httpResponseCode.HTTP_RESPONSE_BAD_REQUEST,
        message: "student_name and phone are required",
      });
    }

    // Convert hear_about_us array to JSON string if it's an array
    let hearAboutUsValue = student.hear_about_us;
    if (hear_about_us !== undefined) {
      if (Array.isArray(hear_about_us)) {
        hearAboutUsValue = JSON.stringify(hear_about_us);
      } else if (typeof hear_about_us === 'string') {
        hearAboutUsValue = hear_about_us;
      } else if (hear_about_us === null) {
        hearAboutUsValue = null;
      }
    }

    await student.update({
      student_name,
      student_id: student_id !== undefined ? student_id : student.student_id,
      school: school !== undefined ? school : student.school,
      phone,
      parent_phone: parent_phone !== undefined ? parent_phone : student.parent_phone,
      email: email !== undefined ? email : student.email,
      address: address !== undefined ? address : student.address,
      year_of_al: year_of_al !== undefined ? year_of_al : student.year_of_al,
      hear_about_us: hearAboutUsValue,
      status: status !== undefined ? status : student.status,
    });

    const updated = await Student.findByPk(id);
    return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: "Student updated successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to update student",
      error: error?.message || error,
    });
  }
};

exports.remove = async (req, res) => {
  try {
    const { Student } = db;
    const id = req.params.id;
    const deleted = await Student.destroy({ where: { id } });
    if (!deleted) {
      return res.status(httpResponseCode.HTTP_RESPONSE_NOT_FOUND).send({
        code: httpResponseCode.HTTP_RESPONSE_NOT_FOUND,
        message: "Student not found",
      });
    }
    return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: "Student deleted successfully",
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to delete student",
      error: error?.message || error,
    });
  }
};

