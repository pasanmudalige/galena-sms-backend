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
db.Document = require("./document.model.js")(sequelize, Sequelize);
db.DocumentClass = require("./document-class.model.js")(sequelize, Sequelize);
db.DocumentView = require("./document-view.model.js")(sequelize, Sequelize);

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

// Student-User association
db.Student.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });
db.User.hasOne(db.Student, { foreignKey: 'user_id', as: 'student' });

// Document associations
db.Document.belongsToMany(db.Class, {
  through: db.DocumentClass,
  foreignKey: 'document_id',
  otherKey: 'class_id',
  as: 'classes'
});
db.Class.belongsToMany(db.Document, {
  through: db.DocumentClass,
  foreignKey: 'class_id',
  otherKey: 'document_id',
  as: 'documents'
});

db.DocumentClass.belongsTo(db.Document, { foreignKey: 'document_id', as: 'document' });
db.DocumentClass.belongsTo(db.Class, { foreignKey: 'class_id', as: 'class' });
db.Document.hasMany(db.DocumentClass, { foreignKey: 'document_id', as: 'documentClasses' });
db.Class.hasMany(db.DocumentClass, { foreignKey: 'class_id', as: 'documentClasses' });

// DocumentView associations
db.DocumentView.belongsTo(db.Document, { foreignKey: 'document_id', as: 'document' });
db.DocumentView.belongsTo(db.Student, { foreignKey: 'student_id', as: 'student' });
db.Document.hasMany(db.DocumentView, { foreignKey: 'document_id', as: 'views' });
db.Student.hasMany(db.DocumentView, { foreignKey: 'student_id', as: 'documentViews' });

module.exports = db;
