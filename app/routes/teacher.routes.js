const router = require("express").Router();
const authJwt = require("../middleware/authJwt");
const quiz = require("../controllers/quiz.controller");

router.use(authJwt.verifyToken, authJwt.requireTeacher);
router.get("/quizzes", quiz.list);
router.post("/quizzes", quiz.create);
router.post("/quizzes/images", quiz.uploadImage);
router.get("/quizzes/:id", quiz.get);
router.put("/quizzes/:id", quiz.update);
router.delete("/quizzes/:id", quiz.remove);
router.put("/quizzes/:id/session", quiz.saveSession);

module.exports = router;
