const db = require("../models");
const { httpResponseCode } = require("../constants/httpResponseCode");

const getStudentForUser = async (userId, authenticatedUser = null) => {
  const linkedStudent = await db.Student.findOne({ where: { user_id: userId } });
  if (linkedStudent) return linkedStudent;

  // Older student accounts may have been created before user_id linking was
  // introduced. Login already accepts these accounts by email, so student
  // portal endpoints must use the same safe fallback.
  const user = authenticatedUser || (await db.User.findByPk(userId));
  if (!user?.email) return null;

  const unlinkedStudent = await db.Student.findOne({
    where: { email: user.email, user_id: null },
  });

  if (!unlinkedStudent) return null;

  await unlinkedStudent.update({ user_id: userId, pending_access: false });
  return unlinkedStudent;
};

const studentNotFound = (res) =>
  res.status(httpResponseCode.HTTP_RESPONSE_NOT_FOUND).send({
    code: httpResponseCode.HTTP_RESPONSE_NOT_FOUND,
    message: "Student profile not found",
  });

exports.getProfile = async (req, res) => {
  try {
    const student = await getStudentForUser(req.userId, req.user);
    if (!student) return studentNotFound(res);

    return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: "Student profile fetched successfully",
      data: student,
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to fetch student profile",
    });
  }
};

exports.getEnrollments = async (req, res) => {
  try {
    const student = await getStudentForUser(req.userId, req.user);
    if (!student) return studentNotFound(res);

    const enrollments = await db.StudentClass.findAll({
      where: { student_id: student.id },
      include: [
        { model: db.Student, attributes: ["id", "student_name", "student_id"] },
        { model: db.Class },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: "Student enrollments fetched successfully",
      data: enrollments,
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to fetch student enrollments",
    });
  }
};

exports.getAttendance = async (req, res) => {
  try {
    const student = await getStudentForUser(req.userId, req.user);
    if (!student) return studentNotFound(res);

    const enrollments = await db.StudentClass.findAll({
      where: { student_id: student.id },
      attributes: ["id"],
    });
    const enrollmentIds = enrollments.map((enrollment) => enrollment.id);
    const attendance = enrollmentIds.length
      ? await db.Attendance.findAll({
          where: { enrollment_id: enrollmentIds },
          include: [
            {
              model: db.StudentClass,
              as: "enrollment",
              include: [
                { model: db.Student, attributes: ["id", "student_name", "student_id"] },
                { model: db.Class },
              ],
            },
          ],
          order: [["attendance_datetime", "DESC"]],
        })
      : [];

    return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: "Student attendance fetched successfully",
      data: attendance,
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to fetch student attendance",
    });
  }
};

exports.getEnrollment = async (req, res) => {
  try {
    const QRCode = require("qrcode");
    const student = await getStudentForUser(req.userId, req.user);
    if (!student) return studentNotFound(res);

    const enrollment = await db.StudentClass.findOne({
      where: { id: req.params.id, student_id: student.id },
      include: [
        { model: db.Student, attributes: ["id", "student_name", "student_id", "school"] },
        { model: db.Class },
      ],
    });
    if (!enrollment) return studentNotFound(res);

    const qrCodeImage = await QRCode.toDataURL(enrollment.enrollment_qr_code, {
      errorCorrectionLevel: "H",
      type: "image/png",
      width: 300,
    });

    return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: "Student enrollment fetched successfully",
      data: { enrollment, qr_code_image: qrCodeImage },
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to fetch student enrollment",
    });
  }
};
