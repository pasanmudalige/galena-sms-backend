const db = require("../models");
const { httpResponseCode } = require("../constants/httpResponseCode");

exports.list = async (req, res) => {
  try {
    const { Class } = db;
    const classes = await Class.findAll({
      order: [["createdAt", "DESC"]],
      attributes: ["id", "class_name", "class_code", "teacher_name", "class_fee", "max_capacity", "description", "status", "createdAt"],
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

exports.create = async (req, res) => {
  try {
    const { Class } = db;
    const { class_name, class_code, teacher_name, class_fee, max_capacity, description } = req.body;

    if (!class_name) {
      return res.status(httpResponseCode.HTTP_RESPONSE_BAD_REQUEST).send({
        code: httpResponseCode.HTTP_RESPONSE_BAD_REQUEST,
        message: "class_name is required",
      });
    }

    const created = await Class.create({
      class_name,
      class_code: class_code || null,
      teacher_name: teacher_name || null,
      class_fee: class_fee || 0,
      max_capacity: max_capacity || null,
      description: description || null,
      status: 'active',
    });

    return res.status(httpResponseCode.HTTP_RESPONSE_CREATED).send({
      code: httpResponseCode.HTTP_RESPONSE_CREATED,
      message: "Class created successfully",
      data: created,
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to create class",
      error: error?.message || error,
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { Class } = db;
    const id = req.params.id;
    const { class_name, class_code, teacher_name, class_fee, max_capacity, description, status } = req.body;

    const classItem = await Class.findByPk(id);
    if (!classItem) {
      return res.status(httpResponseCode.HTTP_RESPONSE_NOT_FOUND).send({
        code: httpResponseCode.HTTP_RESPONSE_NOT_FOUND,
        message: "Class not found",
      });
    }

    if (!class_name) {
      return res.status(httpResponseCode.HTTP_RESPONSE_BAD_REQUEST).send({
        code: httpResponseCode.HTTP_RESPONSE_BAD_REQUEST,
        message: "class_name is required",
      });
    }

    await classItem.update({
      class_name,
      class_code: class_code !== undefined ? class_code : classItem.class_code,
      teacher_name: teacher_name !== undefined ? teacher_name : classItem.teacher_name,
      class_fee: class_fee !== undefined ? class_fee : classItem.class_fee,
      max_capacity: max_capacity !== undefined ? max_capacity : classItem.max_capacity,
      description: description !== undefined ? description : classItem.description,
      status: status !== undefined ? status : classItem.status,
    });

    const updated = await Class.findByPk(id);
    return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: "Class updated successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to update class",
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

