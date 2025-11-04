const db = require("../models");
const { httpResponseCode } = require("../constants/httpResponseCode");

exports.list = async (req, res) => {
  try {
    const { Student } = db;
    const students = await Student.findAll({
      order: [["createdAt", "DESC"]],
      attributes: ["id", "student_name", "phone", "email", "status", "createdAt"],
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

