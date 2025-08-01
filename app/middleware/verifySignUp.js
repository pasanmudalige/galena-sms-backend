// verifysignup middleware
const db = require("../models");
const { httpResponseCode } = require("../constants/httpResponseCode");
const ROLES = db.ROLES;
const User = db.user;
const TempUser = db.tempuser;
const bcrypt = require("bcryptjs");
const checkDuplicateEmail = async (req, res, next) => {

  const user = await User.findOne({
    where: {
      email: req.body.email
    }
  });

  const tempuser = await TempUser.findOne({
    where: {
      email: req.body.email
    }
  })

  if (tempuser != null || user != null) {
    res.status(httpResponseCode.HTTP_RESPONSE_BAD_REQUEST).send({
      code: 400,
      message: "Failed! Email is already in use!"
    });
    return;
  }
  next();
};

const checkUserExists = async (req, res, next) => {

  const user = await User.findOne({
    where: {
      email: req.body.email
    }
  });

  const tempuser = await TempUser.findOne({
    where: {
      email: req.body.email
    }
  })

  if (tempuser == null && user == null) {
    res.status(httpResponseCode.HTTP_RESPONSE_NOT_FOUND).send({
      code: 404,
      message: "User doesn't Exist!"
    });
    return;
  }
  next();
};

const checkPasswordMatches = async (req, res, next) => {

  if (req.body.password != null && req.body.password != undefined) {
    const password = req.body.password;

    const user = await User.findOne({
      where: {
        email: req.body.email
      }
    });

    const tempuser = await TempUser.findOne({
      where: {
        email: req.body.email
      }
    })

      if (user) {
        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) {
          return res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
            message: "Incorrect Password"
          });
        }

      }
      if (tempuser) {
        const passwordIsValid = bcrypt.compareSync(password, tempuser.password);
        if (!passwordIsValid) {
          return res.status(httpResponseCode.HTTP_RESPONSE_UNAUTHORIZED).send({
            message: "Incorrect Password"
          });
        }
      }
    // }
    next();
  }
  else {
    return res.status(httpResponseCode.HTTP_RESPONSE_BAD_REQUEST).send({
      message: "Request Error!"
    });
  }


};

const checkRolesExisted = async (req, res, next) => {

  try {

    console.log(req.body.roles);

    if (req.body.roles != null && req.body.roles != undefined) {
      const rolesarray = await req.body.roles.split(',');

      for (let i of rolesarray) {
        if (!ROLES.includes(rolesarray[i - 1])) {
          res.status(httpResponseCode.HTTP_RESPONSE_BAD_REQUEST).send({
            message: "Failed! Role does not exist = " + req.body.roles[i]
          });
          return;
        }
      }
    }
    else {
      res.status(httpResponseCode.HTTP_RESPONSE_BAD_REQUEST).send({
        message: "Failed! Role does not exist = " + req.body.roles[i]
      });
      return;
    }

    next();

  } catch (error) {

    return res.status(httpResponseCode.HTTP_RESPONSE_BAD_REQUEST).send({
      message: "Request Failed!"
    });

  }


};

const verifySignUp = {
  checkDuplicateEmail: checkDuplicateEmail,
  checkRolesExisted: checkRolesExisted,
  checkUserExists: checkUserExists,
  checkPasswordMatches: checkPasswordMatches,
};

module.exports = verifySignUp;
