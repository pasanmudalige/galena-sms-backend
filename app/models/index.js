// index configuration
const config = require("../config/db.config.js");

const Sequelize = require("sequelize");
const sequelize = new Sequelize(
  config.DB,
  config.USER,
  config.PASSWORD,
  {
    host: config.HOST,
    dialect: config.dialect,
    pool: {
      max: config.pool.max,
      min: config.pool.min,
      acquire: config.pool.acquire,
      idle: config.pool.idle
    }
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = require("./user.model.js")(sequelize, Sequelize);
db.Student = require("./student.model.js")(sequelize, Sequelize);
db.Class = require("./classes.model.js")(sequelize, Sequelize);
db.StudentClass = require("./student-classes.model.js")(sequelize, Sequelize);
db.Attendance = require("./attendance.model.js")(sequelize, Sequelize);

// Associations
db.Student.belongsToMany(db.Class, {
  through: db.StudentClass,
  foreignKey: 'student_id',
  otherKey: 'class_id'
});
db.Class.belongsToMany(db.Student, {
  through: db.StudentClass,
  foreignKey: 'class_id',
  otherKey: 'student_id'
});

db.StudentClass.belongsTo(db.Student, { foreignKey: 'student_id' });
db.StudentClass.belongsTo(db.Class, { foreignKey: 'class_id' });
db.Student.hasMany(db.StudentClass, { foreignKey: 'student_id' });
db.Class.hasMany(db.StudentClass, { foreignKey: 'class_id' });

// Attendance associations
db.Attendance.belongsTo(db.StudentClass, { foreignKey: 'enrollment_id', as: 'enrollment' });
db.StudentClass.hasMany(db.Attendance, { foreignKey: 'enrollment_id', as: 'attendances' });

module.exports = db;
