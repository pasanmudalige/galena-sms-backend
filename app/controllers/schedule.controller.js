const db = require("../models");
const { httpResponseCode } = require("../constants/httpResponseCode");
const { Op } = require("sequelize");

// Get all default schedules for a class
exports.getDefaultSchedules = async (req, res) => {
  try {
    const { ClassSchedule } = db;
    const { class_id } = req.query;

    const where = {};
    if (class_id) {
      where.class_id = class_id;
    }

    const schedules = await ClassSchedule.findAll({
      where,
      include: [
        {
          model: db.Class,
          as: "class",
          attributes: ["id", "class_name", "class_code"],
        },
      ],
      order: [["day_of_week", "ASC"], ["start_time", "ASC"]],
    });

    return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: "Default schedules fetched successfully",
      data: schedules,
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to fetch default schedules",
      error: error?.message || error,
    });
  }
};

// Create default schedule
exports.createDefaultSchedule = async (req, res) => {
  try {
    const { ClassSchedule } = db;
    const { class_id, day_of_week, start_time, end_time, is_active } = req.body;

    if (!class_id || day_of_week === undefined || !start_time) {
      return res.status(httpResponseCode.HTTP_RESPONSE_BAD_REQUEST).send({
        code: httpResponseCode.HTTP_RESPONSE_BAD_REQUEST,
        message: "class_id, day_of_week, and start_time are required",
      });
    }

    // Check if schedule already exists
    const existing = await ClassSchedule.findOne({
      where: {
        class_id,
        day_of_week,
        start_time,
      },
    });

    if (existing) {
      return res.status(httpResponseCode.HTTP_RESPONSE_CONFLICT).send({
        code: httpResponseCode.HTTP_RESPONSE_CONFLICT,
        message: "Schedule already exists for this class, day, and time",
      });
    }

    const schedule = await ClassSchedule.create({
      class_id,
      day_of_week,
      start_time,
      end_time: end_time || null,
      is_active: is_active !== undefined ? is_active : true,
    });

    const scheduleWithClass = await ClassSchedule.findByPk(schedule.id, {
      include: [
        {
          model: db.Class,
          as: "class",
          attributes: ["id", "class_name", "class_code"],
        },
      ],
    });

    return res.status(httpResponseCode.HTTP_RESPONSE_CREATED).send({
      code: httpResponseCode.HTTP_RESPONSE_CREATED,
      message: "Default schedule created successfully",
      data: scheduleWithClass,
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to create default schedule",
      error: error?.message || error,
    });
  }
};

// Update default schedule
exports.updateDefaultSchedule = async (req, res) => {
  try {
    const { ClassSchedule } = db;
    const { id } = req.params;
    const { day_of_week, start_time, end_time, is_active } = req.body;

    const schedule = await ClassSchedule.findByPk(id);
    if (!schedule) {
      return res.status(httpResponseCode.HTTP_RESPONSE_NOT_FOUND).send({
        code: httpResponseCode.HTTP_RESPONSE_NOT_FOUND,
        message: "Schedule not found",
      });
    }

    // Check for conflicts if updating day or time
    if (day_of_week !== undefined || start_time) {
      const conflictWhere = {
        class_id: schedule.class_id,
        id: { [Op.ne]: id },
      };
      if (day_of_week !== undefined) conflictWhere.day_of_week = day_of_week;
      if (start_time) conflictWhere.start_time = start_time;

      const conflict = await ClassSchedule.findOne({ where: conflictWhere });
      if (conflict) {
        return res.status(httpResponseCode.HTTP_RESPONSE_CONFLICT).send({
          code: httpResponseCode.HTTP_RESPONSE_CONFLICT,
          message: "Schedule conflict: Another schedule exists for this class, day, and time",
        });
      }
    }

    await schedule.update({
      day_of_week: day_of_week !== undefined ? day_of_week : schedule.day_of_week,
      start_time: start_time || schedule.start_time,
      end_time: end_time !== undefined ? end_time : schedule.end_time,
      is_active: is_active !== undefined ? is_active : schedule.is_active,
    });

    const updatedSchedule = await ClassSchedule.findByPk(id, {
      include: [
        {
          model: db.Class,
          as: "class",
          attributes: ["id", "class_name", "class_code"],
        },
      ],
    });

    return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: "Default schedule updated successfully",
      data: updatedSchedule,
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to update default schedule",
      error: error?.message || error,
    });
  }
};

// Delete default schedule
exports.deleteDefaultSchedule = async (req, res) => {
  try {
    const { ClassSchedule } = db;
    const { id } = req.params;

    const schedule = await ClassSchedule.findByPk(id);
    if (!schedule) {
      return res.status(httpResponseCode.HTTP_RESPONSE_NOT_FOUND).send({
        code: httpResponseCode.HTTP_RESPONSE_NOT_FOUND,
        message: "Schedule not found",
      });
    }

    await schedule.destroy();

    return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: "Default schedule deleted successfully",
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to delete default schedule",
      error: error?.message || error,
    });
  }
};

// Get all extra classes
exports.getExtraClasses = async (req, res) => {
  try {
    const { ExtraClass } = db;
    const { date_from, date_to, class_id } = req.query;

    const where = {};
    if (date_from || date_to) {
      where.session_date = {};
      if (date_from) {
        where.session_date[Op.gte] = date_from;
      }
      if (date_to) {
        where.session_date[Op.lte] = date_to;
      }
    }

    const includeOptions = [
      {
        model: db.Class,
        through: db.ExtraClassClass,
        as: "classes",
        attributes: ["id", "class_name", "class_code"],
      },
    ];

    // Filter by class_id if provided
    if (class_id) {
      includeOptions[0].where = { id: class_id };
      includeOptions[0].required = true;
    }

    const extraClasses = await ExtraClass.findAll({
      where,
      include: includeOptions,
      order: [["session_date", "ASC"], ["start_time", "ASC"]],
    });

    return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: "Extra classes fetched successfully",
      data: extraClasses,
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to fetch extra classes",
      error: error?.message || error,
    });
  }
};

// Create extra class
exports.createExtraClass = async (req, res) => {
  try {
    const { ExtraClass, ExtraClassClass } = db;
    const { session_date, start_time, end_time, description, class_ids, is_active } = req.body;

    if (!session_date || !start_time || !class_ids || !Array.isArray(class_ids) || class_ids.length === 0) {
      return res.status(httpResponseCode.HTTP_RESPONSE_BAD_REQUEST).send({
        code: httpResponseCode.HTTP_RESPONSE_BAD_REQUEST,
        message: "session_date, start_time, and class_ids (array) are required",
      });
    }

    const extraClass = await ExtraClass.create({
      session_date,
      start_time,
      end_time: end_time || null,
      description: description || null,
      is_active: is_active !== undefined ? is_active : true,
    });

    // Associate classes with extra class
    const classAssociations = class_ids.map((classId) => ({
      extra_class_id: extraClass.id,
      class_id: classId,
    }));

    await ExtraClassClass.bulkCreate(classAssociations);

    const extraClassWithClasses = await ExtraClass.findByPk(extraClass.id, {
      include: [
        {
          model: db.Class,
          through: db.ExtraClassClass,
          as: "classes",
          attributes: ["id", "class_name", "class_code"],
        },
      ],
    });

    return res.status(httpResponseCode.HTTP_RESPONSE_CREATED).send({
      code: httpResponseCode.HTTP_RESPONSE_CREATED,
      message: "Extra class created successfully",
      data: extraClassWithClasses,
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to create extra class",
      error: error?.message || error,
    });
  }
};

// Update extra class
exports.updateExtraClass = async (req, res) => {
  try {
    const { ExtraClass, ExtraClassClass } = db;
    const { id } = req.params;
    const { session_date, start_time, end_time, description, class_ids, is_active } = req.body;

    const extraClass = await ExtraClass.findByPk(id);
    if (!extraClass) {
      return res.status(httpResponseCode.HTTP_RESPONSE_NOT_FOUND).send({
        code: httpResponseCode.HTTP_RESPONSE_NOT_FOUND,
        message: "Extra class not found",
      });
    }

    await extraClass.update({
      session_date: session_date || extraClass.session_date,
      start_time: start_time || extraClass.start_time,
      end_time: end_time !== undefined ? end_time : extraClass.end_time,
      description: description !== undefined ? description : extraClass.description,
      is_active: is_active !== undefined ? is_active : extraClass.is_active,
    });

    // Update class associations if provided
    if (class_ids && Array.isArray(class_ids)) {
      // Remove existing associations
      await ExtraClassClass.destroy({
        where: { extra_class_id: id },
      });

      // Create new associations
      if (class_ids.length > 0) {
        const classAssociations = class_ids.map((classId) => ({
          extra_class_id: id,
          class_id: classId,
        }));
        await ExtraClassClass.bulkCreate(classAssociations);
      }
    }

    const updatedExtraClass = await ExtraClass.findByPk(id, {
      include: [
        {
          model: db.Class,
          through: db.ExtraClassClass,
          as: "classes",
          attributes: ["id", "class_name", "class_code"],
        },
      ],
    });

    return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: "Extra class updated successfully",
      data: updatedExtraClass,
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to update extra class",
      error: error?.message || error,
    });
  }
};

// Delete extra class
exports.deleteExtraClass = async (req, res) => {
  try {
    const { ExtraClass } = db;
    const { id } = req.params;

    const extraClass = await ExtraClass.findByPk(id);
    if (!extraClass) {
      return res.status(httpResponseCode.HTTP_RESPONSE_NOT_FOUND).send({
        code: httpResponseCode.HTTP_RESPONSE_NOT_FOUND,
        message: "Extra class not found",
      });
    }

    await extraClass.destroy();

    return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: "Extra class deleted successfully",
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to delete extra class",
      error: error?.message || error,
    });
  }
};

