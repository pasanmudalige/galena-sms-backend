const db = require("../models");
const { httpResponseCode } = require("../constants/httpResponseCode");
const config = require("../config/auth.config");
const User = db.User;
const TempUser = db.tempuser;
const constants = require("../constants/constants");
const { sendEmail } = require("../util/email.sender.util");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const EmailTemplateDTO = require("../dto/EmailTemplateDTO");

exports.getDashboardData = async (req, res) => {
  return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
    code: httpResponseCode.HTTP_RESPONSE_OK,
    message: "getDashboard data under development",
  });
};
