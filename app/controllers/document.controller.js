const db = require("../models");
const { httpResponseCode } = require("../constants/httpResponseCode");
const { Op } = require("sequelize");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../../uploads/documents");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Upload document
exports.upload = async (req, res) => {
  try {
    const { Document, DocumentClass, Class } = db;
    const { document_name, views_per_student, expires_at } = req.body;
    
    // Handle class_ids from FormData - can be array or string
    let class_ids = req.body.class_ids;
    
    // Check if it's in the array format from form data parser
    if (!class_ids && req.body['class_ids[]']) {
      class_ids = req.body['class_ids[]'];
    }
    
    if (!Array.isArray(class_ids)) {
      // If it's a string, try to parse it as JSON first
      if (typeof class_ids === 'string') {
        try {
          class_ids = JSON.parse(class_ids);
        } catch (e) {
          // If parsing fails, check if it's a single value or comma-separated
          if (class_ids.includes(',')) {
            class_ids = class_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
          } else if (class_ids.trim() !== '') {
            class_ids = [parseInt(class_ids)].filter(id => !isNaN(id));
          } else {
            class_ids = [];
          }
        }
      } else if (class_ids !== undefined && class_ids !== null) {
        // Single value, convert to array
        class_ids = [class_ids];
      } else {
        class_ids = [];
      }
    }
    
    // Convert all class_ids to integers
    if (Array.isArray(class_ids)) {
      class_ids = class_ids.map(id => parseInt(id)).filter(id => !isNaN(id));
    }

    if (!req.files || !req.files.file) {
      return res.status(httpResponseCode.HTTP_RESPONSE_BAD_REQUEST).send({
        code: httpResponseCode.HTTP_RESPONSE_BAD_REQUEST,
        message: "File is required",
      });
    }

    if (!document_name) {
      return res.status(httpResponseCode.HTTP_RESPONSE_BAD_REQUEST).send({
        code: httpResponseCode.HTTP_RESPONSE_BAD_REQUEST,
        message: "document_name is required",
      });
    }

    if (!class_ids || !Array.isArray(class_ids) || class_ids.length === 0) {
      return res.status(httpResponseCode.HTTP_RESPONSE_BAD_REQUEST).send({
        code: httpResponseCode.HTTP_RESPONSE_BAD_REQUEST,
        message: "At least one class_id is required",
      });
    }

    const file = req.files.file;
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/gif"];
    
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(httpResponseCode.HTTP_RESPONSE_BAD_REQUEST).send({
        code: httpResponseCode.HTTP_RESPONSE_BAD_REQUEST,
        message: "Invalid file type. Only PDF and images are allowed",
      });
    }

    // Determine file type
    const fileType = file.mimetype === "application/pdf" ? "pdf" : "image";

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const ext = path.extname(file.name);
    const filename = `${timestamp}_${random}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    // Save file
    await file.mv(filePath);

    // Calculate expiration date (default 2 weeks from now)
    let expirationDate;
    if (expires_at) {
      expirationDate = new Date(expires_at);
    } else {
      expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 14); // 2 weeks
    }

    // Create document record
    const document = await Document.create({
      document_name,
      file_path: `/uploads/documents/${filename}`,
      file_type: fileType,
      file_size: file.size,
      views_per_student: views_per_student || 1,
      expires_at: expirationDate,
      status: "active",
    });

    // Assign document to classes
    const documentClasses = [];
    for (const classId of class_ids) {
      // Verify class exists
      const classItem = await Class.findByPk(classId);
      if (!classItem) {
        // If class doesn't exist, delete the document and file
        await Document.destroy({ where: { id: document.id } });
        fs.unlinkSync(filePath);
        return res.status(httpResponseCode.HTTP_RESPONSE_NOT_FOUND).send({
          code: httpResponseCode.HTTP_RESPONSE_NOT_FOUND,
          message: `Class with id ${classId} not found`,
        });
      }

      const docClass = await DocumentClass.create({
        document_id: document.id,
        class_id: classId,
      });
      documentClasses.push(docClass);
    }

    // Fetch document with classes
    const documentWithClasses = await Document.findByPk(document.id, {
      include: [
        {
          model: Class,
          as: "classes",
          attributes: ["id", "class_name", "class_code"],
          through: { attributes: [] },
        },
      ],
    });

    return res.status(httpResponseCode.HTTP_RESPONSE_CREATED).send({
      code: httpResponseCode.HTTP_RESPONSE_CREATED,
      message: "Document uploaded successfully",
      data: documentWithClasses,
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to upload document",
      error: error?.message || error,
    });
  }
};

// List documents (admin)
exports.list = async (req, res) => {
  try {
    const { Document, Class } = db;
    const { status, class_id } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }

    // Check if document is expired
    const now = new Date();
    await Document.update(
      { status: "expired" },
      {
        where: {
          status: "active",
          expires_at: { [Op.lt]: now },
        },
      }
    );

    const include = [
      {
        model: Class,
        as: "classes",
        attributes: ["id", "class_name", "class_code"],
        through: { attributes: [] },
      },
    ];

    if (class_id) {
      include[0].where = { id: class_id };
    }

    const documents = await Document.findAll({
      where,
      include,
      order: [["createdAt", "DESC"]],
    });

    return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: "Documents fetched successfully",
      data: documents,
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to fetch documents",
      error: error?.message || error,
    });
  }
};

// Get document by ID (admin)
exports.getById = async (req, res) => {
  try {
    const { Document, Class } = db;
    const { id } = req.params;

    const document = await Document.findByPk(id, {
      include: [
        {
          model: Class,
          as: "classes",
          attributes: ["id", "class_name", "class_code"],
          through: { attributes: [] },
        },
      ],
    });

    if (!document) {
      return res.status(httpResponseCode.HTTP_RESPONSE_NOT_FOUND).send({
        code: httpResponseCode.HTTP_RESPONSE_NOT_FOUND,
        message: "Document not found",
      });
    }

    return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: "Document fetched successfully",
      data: document,
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to fetch document",
      error: error?.message || error,
    });
  }
};

// Update document
exports.update = async (req, res) => {
  try {
    const { Document, DocumentClass, Class } = db;
    const { id } = req.params;
    const { document_name, views_per_student, expires_at, class_ids, status } = req.body;

    const document = await Document.findByPk(id);
    if (!document) {
      return res.status(httpResponseCode.HTTP_RESPONSE_NOT_FOUND).send({
        code: httpResponseCode.HTTP_RESPONSE_NOT_FOUND,
        message: "Document not found",
      });
    }

    // Update document fields
    const updateData = {};
    if (document_name !== undefined) updateData.document_name = document_name;
    if (views_per_student !== undefined) updateData.views_per_student = views_per_student;
    if (expires_at !== undefined) updateData.expires_at = new Date(expires_at);
    if (status !== undefined) updateData.status = status;

    await document.update(updateData);

    // Update class assignments if provided
    if (class_ids && Array.isArray(class_ids)) {
      // Delete existing assignments
      await DocumentClass.destroy({ where: { document_id: id } });

      // Create new assignments
      for (const classId of class_ids) {
        const classItem = await Class.findByPk(classId);
        if (classItem) {
          await DocumentClass.create({
            document_id: id,
            class_id: classId,
          });
        }
      }
    }

    // Fetch updated document with classes
    const updatedDocument = await Document.findByPk(id, {
      include: [
        {
          model: Class,
          as: "classes",
          attributes: ["id", "class_name", "class_code"],
          through: { attributes: [] },
        },
      ],
    });

    return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: "Document updated successfully",
      data: updatedDocument,
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to update document",
      error: error?.message || error,
    });
  }
};

// Delete document
exports.remove = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { Document, DocumentClass, DocumentView } = db;
    const { id } = req.params;

    const document = await Document.findByPk(id);
    if (!document) {
      await transaction.rollback();
      return res.status(httpResponseCode.HTTP_RESPONSE_NOT_FOUND).send({
        code: httpResponseCode.HTTP_RESPONSE_NOT_FOUND,
        message: "Document not found",
      });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, "../..", document.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete related records
    await DocumentView.destroy({ where: { document_id: id }, transaction });
    await DocumentClass.destroy({ where: { document_id: id }, transaction });
    await Document.destroy({ where: { id }, transaction });

    await transaction.commit();

    return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: "Document deleted successfully",
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to delete document",
      error: error?.message || error,
    });
  }
};

// View document (student) - with access control and view tracking
exports.view = async (req, res) => {
  try {
    const { Document, DocumentView, DocumentClass, StudentClass, Student } = db;
    const { id } = req.params;
    const userId = req.userId; // From auth middleware

    // Get student from user
    const student = await Student.findOne({ where: { user_id: userId } });
    if (!student) {
      return res.status(httpResponseCode.HTTP_RESPONSE_FORBIDDEN).send({
        code: httpResponseCode.HTTP_RESPONSE_FORBIDDEN,
        message: "Student record not found",
      });
    }

    // Get document
    const document = await Document.findByPk(id);
    if (!document) {
      return res.status(httpResponseCode.HTTP_RESPONSE_NOT_FOUND).send({
        code: httpResponseCode.HTTP_RESPONSE_NOT_FOUND,
        message: "Document not found",
      });
    }

    // Check if document is expired
    if (document.status === "expired" || new Date(document.expires_at) < new Date()) {
      return res.status(httpResponseCode.HTTP_RESPONSE_GONE).send({
        code: httpResponseCode.HTTP_RESPONSE_GONE,
        message: "Document has expired",
      });
    }

    // Check if document is active
    if (document.status !== "active") {
      return res.status(httpResponseCode.HTTP_RESPONSE_FORBIDDEN).send({
        code: httpResponseCode.HTTP_RESPONSE_FORBIDDEN,
        message: "Document is not available",
      });
    }

    // Get classes assigned to this document
    const documentClasses = await DocumentClass.findAll({
      where: { document_id: id },
      attributes: ["class_id"],
    });
    const classIds = documentClasses.map((dc) => dc.class_id);

    if (classIds.length === 0) {
      return res.status(httpResponseCode.HTTP_RESPONSE_FORBIDDEN).send({
        code: httpResponseCode.HTTP_RESPONSE_FORBIDDEN,
        message: "Document is not assigned to any class",
      });
    }

    // Check if student is enrolled in any of these classes
    const enrollment = await StudentClass.findOne({
      where: {
        student_id: student.id,
        class_id: { [Op.in]: classIds },
        status: "active",
      },
    });

    if (!enrollment) {
      return res.status(httpResponseCode.HTTP_RESPONSE_FORBIDDEN).send({
        code: httpResponseCode.HTTP_RESPONSE_FORBIDDEN,
        message: "You are not enrolled in any class that has access to this document",
      });
    }

    // Check view count
    const viewCount = await DocumentView.count({
      where: {
        document_id: id,
        student_id: student.id,
      },
    });

    if (viewCount >= document.views_per_student) {
      return res.status(httpResponseCode.HTTP_RESPONSE_FORBIDDEN).send({
        code: httpResponseCode.HTTP_RESPONSE_FORBIDDEN,
        message: "You have reached the maximum number of views for this document",
      });
    }

    // Record view
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers["x-forwarded-for"] || null;
    const userAgent = req.headers["user-agent"] || null;

    await DocumentView.create({
      document_id: id,
      student_id: student.id,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    // Get file path and send file
    const filePath = path.join(__dirname, "../..", document.file_path);
    if (!fs.existsSync(filePath)) {
      return res.status(httpResponseCode.HTTP_RESPONSE_NOT_FOUND).send({
        code: httpResponseCode.HTTP_RESPONSE_NOT_FOUND,
        message: "Document file not found",
      });
    }

    // Set headers to prevent download and sharing
    res.setHeader("Content-Type", document.file_type === "pdf" ? "application/pdf" : `image/${document.file_type}`);
    res.setHeader("Content-Disposition", "inline; filename=" + encodeURIComponent(document.document_name));
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");

    // Send file
    return res.sendFile(path.resolve(filePath));
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to view document",
      error: error?.message || error,
    });
  }
};

// View document (admin) - unlimited access, no view tracking
exports.viewAsAdmin = async (req, res) => {
  try {
    const { Document } = db;
    const { id } = req.params;

    // Get document
    const document = await Document.findByPk(id);
    if (!document) {
      return res.status(httpResponseCode.HTTP_RESPONSE_NOT_FOUND).send({
        code: httpResponseCode.HTTP_RESPONSE_NOT_FOUND,
        message: "Document not found",
      });
    }

    // Get file path and send file
    const filePath = path.join(__dirname, "../..", document.file_path);
    if (!fs.existsSync(filePath)) {
      return res.status(httpResponseCode.HTTP_RESPONSE_NOT_FOUND).send({
        code: httpResponseCode.HTTP_RESPONSE_NOT_FOUND,
        message: "Document file not found",
      });
    }

    // Set headers to prevent download and sharing
    res.setHeader("Content-Type", document.file_type === "pdf" ? "application/pdf" : `image/${document.file_type}`);
    res.setHeader("Content-Disposition", "inline; filename=" + encodeURIComponent(document.document_name));
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");

    // Send file
    return res.sendFile(path.resolve(filePath));
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to view document",
      error: error?.message || error,
    });
  }
};

// List documents for student (only documents for enrolled classes)
exports.listForStudent = async (req, res) => {
  try {
    const { Document, DocumentClass, StudentClass, Class,DocumentView,Student } = db;
    const userId = req.userId; // From auth middleware

    // Get student from user
    const student = await Student.findOne({ where: { user_id: userId } });
    if (!student) {
      return res.status(httpResponseCode.HTTP_RESPONSE_FORBIDDEN).send({
        code: httpResponseCode.HTTP_RESPONSE_FORBIDDEN,
        message: "Student record not found",
      });
    }

    // Get student's enrolled classes
    const enrollments = await StudentClass.findAll({
      where: {
        student_id: student.id,
        status: "active",
      },
      attributes: ["class_id"],
    });

    const classIds = enrollments.map((e) => e.class_id);
    if (classIds.length === 0) {
      return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
        code: httpResponseCode.HTTP_RESPONSE_OK,
        message: "No documents available",
        data: [],
      });
    }

    // Get documents assigned to these classes
    const documentClasses = await DocumentClass.findAll({
      where: { class_id: { [Op.in]: classIds } },
      attributes: ["document_id"],
    });

    const documentIds = [...new Set(documentClasses.map((dc) => dc.document_id))];

    if (documentIds.length === 0) {
      return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
        code: httpResponseCode.HTTP_RESPONSE_OK,
        message: "No documents available",
        data: [],
      });
    }

    // Get documents with view count for this student
    const now = new Date();
    const documents = await Document.findAll({
      where: {
        id: { [Op.in]: documentIds },
        status: "active",
        expires_at: { [Op.gte]: now },
      },
      include: [
        {
          model: Class,
          as: "classes",
          attributes: ["id", "class_name", "class_code"],
          through: { attributes: [] },
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Add view count for each document
    const documentsWithViews = await Promise.all(
      documents.map(async (doc) => {
        const viewCount = await DocumentView.count({
          where: {
            document_id: doc.id,
            student_id: student.id,
          },
        });

        const docData = doc.toJSON();
        docData.view_count = viewCount;
        docData.views_remaining = Math.max(0, doc.views_per_student - viewCount);
        return docData;
      })
    );

    return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: "Documents fetched successfully",
      data: documentsWithViews,
    });
  } catch (error) {
    return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: "Failed to fetch documents",
      error: error?.message || error,
    });
  }
};

