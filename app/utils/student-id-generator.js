const db = require("../models");
const { Op } = require("sequelize");

/**
 * Generate student ID in format: GLN/{year_of_al}/{sequential_id}
 * @param {string} yearOfAL - Year of A/L (e.g., "2028")
 * @returns {Promise<string>} Generated student ID
 */
async function generateStudentId(yearOfAL) {
  const { Student } = db;
  
  // Default year if not provided
  const year = yearOfAL || new Date().getFullYear().toString();
  
  // Find the last student ID across ALL years (not just this year)
  // This ensures sequential numbers are unique globally
  const lastStudent = await Student.findOne({
    where: {
      student_id: {
        [Op.like]: `GLN/%/%`,
      },
    },
    order: [["student_id", "DESC"]],
  });

  let nextNumber = 400;

  if (lastStudent && lastStudent.student_id) {
    // Extract the sequential number from the last ID
    // Format: GLN/2028/400
    const parts = lastStudent.student_id.split("/");
    if (parts.length === 3 && parts[0] === "GLN") {
      const lastNumber = parseInt(parts[2], 10);
      if (!isNaN(lastNumber) && lastNumber >= 400) {
        nextNumber = lastNumber + 1;
      }
    }
  }

  // Format: GLN/2028/400 (3-digit number with leading zeros)
  const sequentialId = nextNumber.toString().padStart(3, "0");
  return `GLN/${year}/${sequentialId}`;
}

module.exports = {
  generateStudentId,
};

