const db = require("../models");
const { httpResponseCode } = require("../constants/httpResponseCode");

exports.getDashboardData = async (req, res) => {
  try {
    const { Student, Class, StudentClass, Sequelize } = db;

    const [studentsCount, classesCount] = await Promise.all([
      Student.count(),
      Class.count(),
    ]);

    const recentStudents = await Student.findAll({
      order: [["createdAt", "DESC"]],
      limit: 5,
      attributes: ["id", "student_name", "status", "createdAt"],
    });

    const recentClasses = await Class.findAll({
      order: [["createdAt", "DESC"]],
      limit: 5,
      attributes: ["id", "class_name", "class_code", "status", "createdAt"],
    });

    const activeStudentsCount = await Student.count({ where: { status: "active" } });
    const inactiveStudentsCount = studentsCount - activeStudentsCount;

    const activeClassesCount = await Class.count({ where: { status: "active" } });
    const inactiveClassesCount = classesCount - activeClassesCount;

    return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: "Dashboard data loaded successfully",
      data: {
        students: {
          total: studentsCount,
          active: activeStudentsCount,
          inactive: inactiveStudentsCount,
          recent: recentStudents,
        },
        classes: {
          total: classesCount,
          active: activeClassesCount,
          inactive: inactiveClassesCount,
          recent: recentClasses,
        },
      },
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to load dashboard data",
      error: error?.message || error,
    });
  }
};
