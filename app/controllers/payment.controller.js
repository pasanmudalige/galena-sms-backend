const db = require("../models");
const { httpResponseCode } = require("../constants/httpResponseCode");
const { Op } = require("sequelize");

// Simple helper: check if payment is paid
const isPaymentPaid = (payment) => {
  return payment && payment.payment_status === 'paid';
};

// Get payments for a student (by enrollment_id or all enrollments for a student)
exports.getStudentPayments = async (req, res) => {
  try {
    const { Payment, StudentClass, Student } = db;
    const { enrollment_id, month_year } = req.query;
    const userId = req.userId; // From auth middleware

    // Get student ID from user
    const student = await Student.findOne({
      where: { user_id: userId },
    });

    if (!student) {
      return res.status(httpResponseCode.HTTP_RESPONSE_NOT_FOUND).send({
        code: httpResponseCode.HTTP_RESPONSE_NOT_FOUND,
        message: "Student not found",
      });
    }

    const where = {};
    const includeWhere = {};

    // If enrollment_id is provided, filter by it
    if (enrollment_id) {
      // Verify the enrollment belongs to this student
      const enrollment = await StudentClass.findOne({
        where: {
          id: enrollment_id,
          student_id: student.id,
        },
      });

      if (!enrollment) {
        return res.status(httpResponseCode.HTTP_RESPONSE_FORBIDDEN).send({
          code: httpResponseCode.HTTP_RESPONSE_FORBIDDEN,
          message: "Access denied to this enrollment",
        });
      }

      where.enrollment_id = enrollment_id;
    } else {
      // Get all enrollments for this student
      const enrollments = await StudentClass.findAll({
        where: { student_id: student.id },
        attributes: ["id"],
      });

      const enrollmentIds = enrollments.map((e) => e.id);
      if (enrollmentIds.length === 0) {
        return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
          code: httpResponseCode.HTTP_RESPONSE_OK,
          message: "No payments found",
          data: [],
        });
      }

      where.enrollment_id = { [Op.in]: enrollmentIds };
    }

    // Filter by month_year if provided
    if (month_year) {
      where.month_year = month_year;
    }

    const payments = await Payment.findAll({
      where,
      include: [
        {
          model: StudentClass,
          as: "enrollment",
          include: [
            { model: Student, attributes: ["id", "student_name", "student_id"] },
            { model: db.Class, attributes: ["id", "class_name", "class_code"] },
          ],
        },
      ],
      order: [["month_year", "DESC"], ["createdAt", "DESC"]],
    });

    // Get current month for pending check
    const currentDate = new Date();
    const currentMonth = currentDate.getFullYear() + '-' + String(currentDate.getMonth() + 1).padStart(2, '0');
    
    // Get all enrollments for this student
    const allEnrollments = await StudentClass.findAll({
      where: { student_id: student.id },
      include: [
        { model: db.Class, attributes: ["id", "class_name", "class_code", "class_fee"] },
      ],
    });

    // Find enrollments without paid payments for current month
    const pendingEnrollments = [];
    for (const enrollment of allEnrollments) {
      const paymentForCurrentMonth = payments.find(
        p => p.enrollment_id === enrollment.id && p.month_year === currentMonth
      );
      
      if (!paymentForCurrentMonth || paymentForCurrentMonth.payment_status !== 'paid') {
        // Get class data - Sequelize includes it as 'Class' but JSON serializes it
        const classData = enrollment.Class || enrollment.class || null;
        pendingEnrollments.push({
          enrollment_id: enrollment.id,
          class: classData ? {
            id: classData.id,
            class_name: classData.class_name,
            class_code: classData.class_code,
            class_fee: classData.class_fee,
          } : null,
          month_year: currentMonth,
        });
      }
    }

    return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: "Payments fetched successfully",
      data: payments,
      pending_enrollments: pendingEnrollments, // Enrollments without paid payments for current month
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to fetch payments",
      error: error?.message || error,
    });
  }
};

// Mark payment as paid (student action)
exports.markPaymentAsPaid = async (req, res) => {
  try {
    const { Payment, StudentClass, Student } = db;
    const { payment_id, paid_amount, payment_method, transaction_reference, notes } = req.body;
    const userId = req.userId; // From auth middleware

    if (!payment_id) {
      return res.status(httpResponseCode.HTTP_RESPONSE_BAD_REQUEST).send({
        code: httpResponseCode.HTTP_RESPONSE_BAD_REQUEST,
        message: "payment_id is required",
      });
    }

    // Get payment
    const payment = await Payment.findByPk(payment_id, {
      include: [
        {
          model: StudentClass,
          as: "enrollment",
          include: [{ model: Student }],
        },
      ],
    });

    if (!payment) {
      return res.status(httpResponseCode.HTTP_RESPONSE_NOT_FOUND).send({
        code: httpResponseCode.HTTP_RESPONSE_NOT_FOUND,
        message: "Payment not found",
      });
    }

    // Verify the payment belongs to the logged-in student
    const student = await Student.findOne({
      where: { user_id: userId },
    });

    if (!student || payment.enrollment.student_id !== student.id) {
      return res.status(httpResponseCode.HTTP_RESPONSE_FORBIDDEN).send({
        code: httpResponseCode.HTTP_RESPONSE_FORBIDDEN,
        message: "Access denied to this payment",
      });
    }

    // Update payment
    const updateData = {
      payment_status: "paid",
      payment_datetime: new Date(),
    };

    if (paid_amount !== undefined) {
      updateData.paid_amount = paid_amount;
    } else {
      // If no amount specified, use expected amount
      updateData.paid_amount = payment.expected_amount;
    }

    if (payment_method) {
      updateData.payment_method = payment_method;
    }

    if (transaction_reference) {
      updateData.transaction_reference = transaction_reference;
    }

    if (notes) {
      updateData.notes = notes;
    }

    await payment.update(updateData);

    // Fetch updated payment with details
    const updatedPayment = await Payment.findByPk(payment.id, {
      include: [
        {
          model: StudentClass,
          as: "enrollment",
          include: [
            { model: Student, attributes: ["id", "student_name", "student_id"] },
            { model: db.Class, attributes: ["id", "class_name", "class_code"] },
          ],
        },
      ],
    });

    return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: "Payment marked as paid successfully",
      data: updatedPayment,
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to mark payment as paid",
      error: error?.message || error,
    });
  }
};

// Admin: Get all payments
exports.getAllPayments = async (req, res) => {
  try {
    const { Payment, StudentClass, Student } = db;
    const { enrollment_id, month_year, payment_status, student_id, class_id } = req.query;

    const where = {};
    const includeWhere = {};

    if (enrollment_id) {
      where.enrollment_id = enrollment_id;
    }

    if (month_year) {
      where.month_year = month_year;
    }

    if (payment_status) {
      where.payment_status = payment_status;
    }

    if (student_id) {
      includeWhere.student_id = student_id;
    }

    if (class_id) {
      includeWhere.class_id = class_id;
    }

    const payments = await Payment.findAll({
      where,
      include: [
        {
          model: StudentClass,
          as: "enrollment",
          where: Object.keys(includeWhere).length > 0 ? includeWhere : undefined,
          include: [
            { model: Student, attributes: ["id", "student_name", "student_id", "school"] },
            { model: db.Class, attributes: ["id", "class_name", "class_code"] },
          ],
        },
      ],
      order: [["month_year", "DESC"], ["createdAt", "DESC"]],
    });

    return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: "Payments fetched successfully",
      data: payments,
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to fetch payments",
      error: error?.message || error,
    });
  }
};

// Admin: Create payment record
exports.createPayment = async (req, res) => {
  try {
    const { Payment, StudentClass } = db;
    const {
      enrollment_id,
      month_year,
      expected_amount,
      paid_amount,
      due_date,
      payment_status,
      payment_method,
      payment_datetime,
      transaction_reference,
      notes,
    } = req.body;

    if (!enrollment_id || !month_year || !expected_amount) {
      return res.status(httpResponseCode.HTTP_RESPONSE_BAD_REQUEST).send({
        code: httpResponseCode.HTTP_RESPONSE_BAD_REQUEST,
        message: "enrollment_id, month_year, and expected_amount are required",
      });
    }

    // Check if enrollment exists
    const enrollment = await StudentClass.findByPk(enrollment_id);
    if (!enrollment) {
      return res.status(httpResponseCode.HTTP_RESPONSE_NOT_FOUND).send({
        code: httpResponseCode.HTTP_RESPONSE_NOT_FOUND,
        message: "Enrollment not found",
      });
    }

    // Check if payment already exists for this enrollment and month
    const existingPayment = await Payment.findOne({
      where: {
        enrollment_id,
        month_year,
      },
    });

    if (existingPayment) {
      return res.status(httpResponseCode.HTTP_RESPONSE_CONFLICT).send({
        code: httpResponseCode.HTTP_RESPONSE_CONFLICT,
        message: "Payment record already exists for this enrollment and month",
        data: existingPayment,
      });
    }

    // Set default due_date if not provided (end of the month)
    let defaultDueDate = due_date;
    if (!defaultDueDate) {
      const [year, month] = month_year.split('-');
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      defaultDueDate = `${year}-${month}-${lastDay}`;
    }

    // If payment_status is not provided, default to 'pending'
    // If paid_amount is provided and equals expected_amount, set to 'paid'
    let autoPaymentStatus = payment_status;
    if (!autoPaymentStatus) {
      if (paid_amount && paid_amount >= expected_amount) {
        autoPaymentStatus = 'paid';
      } else {
        autoPaymentStatus = 'pending';
      }
    }

    const payment = await Payment.create({
      enrollment_id,
      month_year,
      expected_amount,
      paid_amount: paid_amount || 0,
      due_date: defaultDueDate,
      payment_status: autoPaymentStatus,
      payment_method: payment_method || null,
      payment_datetime: payment_datetime || (autoPaymentStatus === 'paid' ? new Date() : null),
      transaction_reference: transaction_reference || null,
      notes: notes || null,
    });

    const paymentWithDetails = await Payment.findByPk(payment.id, {
      include: [
        {
          model: StudentClass,
          as: "enrollment",
          include: [
            { model: db.Student, attributes: ["id", "student_name", "student_id"] },
            { model: db.Class, attributes: ["id", "class_name", "class_code"] },
          ],
        },
      ],
    });

    return res.status(httpResponseCode.HTTP_RESPONSE_CREATED).send({
      code: httpResponseCode.HTTP_RESPONSE_CREATED,
      message: "Payment record created successfully",
      data: paymentWithDetails,
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to create payment record",
      error: error?.message || error,
    });
  }
};

// Admin: Update payment
exports.updatePayment = async (req, res) => {
  try {
    const { Payment } = db;
    const { id } = req.params;
    const {
      expected_amount,
      paid_amount,
      payment_status,
      payment_method,
      payment_datetime,
      due_date,
      transaction_reference,
      notes,
      received_by,
    } = req.body;

    const payment = await Payment.findByPk(id);
    if (!payment) {
      return res.status(httpResponseCode.HTTP_RESPONSE_NOT_FOUND).send({
        code: httpResponseCode.HTTP_RESPONSE_NOT_FOUND,
        message: "Payment not found",
      });
    }

    const updateData = {};
    if (expected_amount !== undefined) updateData.expected_amount = expected_amount;
    if (paid_amount !== undefined) updateData.paid_amount = paid_amount;
    if (payment_method !== undefined) updateData.payment_method = payment_method;
    if (payment_datetime !== undefined) updateData.payment_datetime = payment_datetime;
    if (due_date !== undefined) updateData.due_date = due_date;
    if (transaction_reference !== undefined) updateData.transaction_reference = transaction_reference;
    if (notes !== undefined) updateData.notes = notes;
    if (received_by !== undefined) updateData.received_by = received_by;

    // If paid_amount is updated and equals or exceeds expected_amount, auto-set to 'paid'
    if (paid_amount !== undefined && payment_status === undefined) {
      if (paid_amount >= payment.expected_amount) {
        updateData.payment_status = 'paid';
        if (!payment.payment_datetime) {
          updateData.payment_datetime = new Date();
        }
      }
    } else if (payment_status !== undefined) {
      updateData.payment_status = payment_status;
    }

    await payment.update(updateData);

    const updatedPayment = await Payment.findByPk(id, {
      include: [
        {
          model: StudentClass,
          as: "enrollment",
          include: [
            { model: db.Student, attributes: ["id", "student_name", "student_id"] },
            { model: db.Class, attributes: ["id", "class_name", "class_code"] },
          ],
        },
      ],
    });

    return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: "Payment updated successfully",
      data: updatedPayment,
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to update payment",
      error: error?.message || error,
    });
  }
};

// Admin: Delete payment
exports.deletePayment = async (req, res) => {
  try {
    const { Payment } = db;
    const { id } = req.params;

    const payment = await Payment.findByPk(id);
    if (!payment) {
      return res.status(httpResponseCode.HTTP_RESPONSE_NOT_FOUND).send({
        code: httpResponseCode.HTTP_RESPONSE_NOT_FOUND,
        message: "Payment not found",
      });
    }

    await payment.destroy();

    return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: "Payment deleted successfully",
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to delete payment",
      error: error?.message || error,
    });
  }
};

