const db = require("../models");
const path = require("path");
const fs = require("fs");

const uploadsDir = path.join(__dirname, "../../uploads/quizzes");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const include = [
  { model: db.QuizQuestion, as: "questions", include: [{ model: db.QuizAnswer, as: "answers" }] },
  { model: db.QuizTeam, as: "teams" },
];

const normalize = (programme) => {
  const data = programme.toJSON();
  data.questions = (data.questions || []).sort((a, b) => a.position - b.position);
  data.questions.forEach((q) => { q.answers = (q.answers || []).sort((a, b) => a.position - b.position); });
  data.teams = (data.teams || []).sort((a, b) => a.position - b.position);
  return data;
};

const owned = (id, teacherId, options = {}) => db.QuizProgramme.findOne({
  where: { id, teacher_id: teacherId }, ...options,
});

const imagePathsFrom = (programme) => {
  const data = programme?.toJSON ? programme.toJSON() : programme;
  const paths = [];
  for (const question of data?.questions || []) {
    if (question.image_path) paths.push(question.image_path);
    for (const answer of question.answers || []) if (answer.image_path) paths.push(answer.image_path);
  }
  return new Set(paths);
};

const imagePathsFromPayload = (body) => {
  const paths = [];
  for (const question of body.questions || []) {
    if (question.image_path) paths.push(question.image_path);
    for (const answer of question.answers || []) if (answer.image_path) paths.push(answer.image_path);
  }
  return new Set(paths);
};

const removeQuizImages = (paths) => {
  for (const storedPath of paths) {
    if (typeof storedPath !== "string" || !storedPath.startsWith("/uploads/quizzes/")) continue;
    const filename = path.basename(storedPath);
    const absolutePath = path.join(uploadsDir, filename);
    fs.unlink(absolutePath, (error) => {
      if (error && error.code !== "ENOENT") console.error(`Failed to remove quiz image ${filename}:`, error.message);
    });
  }
};

exports.list = async (req, res) => {
  try {
    const rows = await db.QuizProgramme.findAll({ where: { teacher_id: req.userId }, order: [["updatedAt", "DESC"]] });
    return res.send({ code: 200, data: rows });
  } catch (error) { return res.status(500).send({ code: 500, message: "Failed to load quiz programmes", error: error.message }); }
};

exports.get = async (req, res) => {
  try {
    const row = await owned(req.params.id, req.userId, { include });
    if (!row) return res.status(404).send({ code: 404, message: "Quiz programme not found" });
    return res.send({ code: 200, data: normalize(row) });
  } catch (error) { return res.status(500).send({ code: 500, message: "Failed to load quiz programme", error: error.message }); }
};

const validatePayload = (body) => {
  if (!body.title?.trim()) return "Programme title is required";
  if (!Array.isArray(body.teams) || body.teams.length < 1) return "At least one team is required";
  if (!Array.isArray(body.questions) || body.questions.length < 1) return "At least one question is required";
  for (const q of body.questions) {
    if (!q.question_text?.trim()) return "Every question needs text";
    if (!Array.isArray(q.answers) || q.answers.length < 4 || q.answers.length > 5) return "Each question needs 4 or 5 answers";
    if (q.answers.filter((a) => a.is_correct).length !== 1) return "Each question needs exactly one correct answer";
  }
  return null;
};

const replaceChildren = async (programme, body, transaction) => {
  await db.QuizQuestion.destroy({ where: { quiz_programme_id: programme.id }, transaction });
  await db.QuizTeam.destroy({ where: { quiz_programme_id: programme.id }, transaction });
  for (let i = 0; i < body.teams.length; i += 1) {
    const team = body.teams[i];
    await db.QuizTeam.create({ quiz_programme_id: programme.id, name: String(team.name || `Team ${i + 1}`).trim(), score: Math.max(0, Number(team.score) || 0), position: i }, { transaction });
  }
  for (let i = 0; i < body.questions.length; i += 1) {
    const q = body.questions[i];
    const question = await db.QuizQuestion.create({
      quiz_programme_id: programme.id, category: q.category?.trim() || "QUIZ ROUND",
      question_text: q.question_text.trim(), time_seconds: Math.max(15, Number(q.time_seconds) || 120),
      image_path: q.image_path || null, position: i,
    }, { transaction });
    for (let j = 0; j < q.answers.length; j += 1) {
      const a = q.answers[j];
      await db.QuizAnswer.create({ question_id: question.id, answer_text: a.answer_text?.trim() || null, image_path: a.image_path || null, is_correct: Boolean(a.is_correct), position: j }, { transaction });
    }
  }
};

exports.create = async (req, res) => {
  const errorMessage = validatePayload(req.body);
  if (errorMessage) return res.status(400).send({ code: 400, message: errorMessage });
  const transaction = await db.sequelize.transaction();
  try {
    const programme = await db.QuizProgramme.create({ teacher_id: req.userId, title: req.body.title.trim() }, { transaction });
    await replaceChildren(programme, req.body, transaction);
    await transaction.commit();
    return exports.get({ ...req, params: { id: programme.id } }, res);
  } catch (error) { await transaction.rollback(); return res.status(500).send({ code: 500, message: "Failed to create quiz programme", error: error.message }); }
};

exports.update = async (req, res) => {
  const errorMessage = validatePayload(req.body);
  if (errorMessage) return res.status(400).send({ code: 400, message: errorMessage });
  const transaction = await db.sequelize.transaction();
  try {
    const programme = await owned(req.params.id, req.userId, { transaction, include });
    if (!programme) { await transaction.rollback(); return res.status(404).send({ code: 404, message: "Quiz programme not found" }); }
    const previousImages = imagePathsFrom(programme);
    const retainedImages = imagePathsFromPayload(req.body);
    await programme.update({ title: req.body.title.trim() }, { transaction });
    await replaceChildren(programme, req.body, transaction);
    await transaction.commit();
    removeQuizImages([...previousImages].filter((storedPath) => !retainedImages.has(storedPath)));
    return exports.get(req, res);
  } catch (error) { await transaction.rollback(); return res.status(500).send({ code: 500, message: "Failed to update quiz programme", error: error.message }); }
};

exports.remove = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const programme = await owned(req.params.id, req.userId, { include, transaction });
    if (!programme) {
      await transaction.rollback();
      return res.status(404).send({ code: 404, message: "Quiz programme not found" });
    }
    const images = imagePathsFrom(programme);
    const questionIds = programme.questions.map((question) => question.id);
    if (questionIds.length) {
      await db.QuizAnswer.destroy({ where: { question_id: questionIds }, transaction });
    }
    await db.QuizQuestion.destroy({ where: { quiz_programme_id: programme.id }, transaction });
    await db.QuizTeam.destroy({ where: { quiz_programme_id: programme.id }, transaction });
    await programme.destroy({ transaction });
    await transaction.commit();
    removeQuizImages(images);
    return res.send({ code: 200, message: "Quiz programme deleted" });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).send({ code: 500, message: "Failed to delete quiz programme", error: error.message });
  }
};

exports.uploadImage = async (req, res) => {
  try {
    const file = req.files?.file;
    if (!file) return res.status(400).send({ code: 400, message: "Image is required" });
    if (!file.mimetype?.startsWith("image/") || file.size > 2 * 1024 * 1024) return res.status(400).send({ code: 400, message: "Use an image smaller than 2 MB" });
    const ext = path.extname(file.name).toLowerCase() || ".jpg";
    const filename = `${req.userId}_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    await file.mv(path.join(uploadsDir, filename));
    return res.status(201).send({ code: 201, data: { path: `/uploads/quizzes/${filename}` } });
  } catch (error) { return res.status(500).send({ code: 500, message: "Failed to upload image", error: error.message }); }
};

exports.saveSession = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const programme = await owned(req.params.id, req.userId, { transaction });
    if (!programme) { await transaction.rollback(); return res.status(404).send({ code: 404, message: "Quiz programme not found" }); }
    const teams = Array.isArray(req.body.teams) ? req.body.teams : [];
    for (const team of teams) {
      await db.QuizTeam.update({ score: Math.max(0, Number(team.score) || 0) }, { where: { id: team.id, quiz_programme_id: programme.id }, transaction });
    }
    await programme.update({ current_question_index: Math.max(0, Number(req.body.current_question_index) || 0), answer_revealed: Boolean(req.body.answer_revealed), is_finished: Boolean(req.body.is_finished) }, { transaction });
    await transaction.commit();
    return res.send({ code: 200, message: "Quiz progress saved" });
  } catch (error) { await transaction.rollback(); return res.status(500).send({ code: 500, message: "Failed to save quiz progress", error: error.message }); }
};
