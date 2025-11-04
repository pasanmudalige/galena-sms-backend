const db = require("../models");
const { httpResponseCode } = require("../constants/httpResponseCode");

exports.list = async (req, res) => {
  try {
    const { Class } = db;
    const classes = await Class.findAll({
      order: [["createdAt", "DESC"]],
      attributes: ["id", "class_name", "class_code", "teacher_name", "status", "createdAt"],
    });
    return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: "Classes fetched successfully",
      data: classes,
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to fetch classes",
      error: error?.message || error,
    });
  }
};

exports.remove = async (req, res) => {
  try {
    const { Class } = db;
    const id = req.params.id;
    const deleted = await Class.destroy({ where: { id } });
    if (!deleted) {
      return res.status(httpResponseCode.HTTP_RESPONSE_NOT_FOUND).send({
        code: httpResponseCode.HTTP_RESPONSE_NOT_FOUND,
        message: "Class not found",
      });
    }
    return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: "Class deleted successfully",
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to delete class",
      error: error?.message || error,
    });
  }
};

