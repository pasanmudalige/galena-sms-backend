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

function generateVerificationToken() {
  const buf = crypto.randomBytes(3); // Generate 3 random bytes for a 24-bit number
  const randomNumber = buf.readUIntBE(0, 3); // Convert bytes to an integer

  // Ensure the token is a 6-digit number
  const sixDigitToken = (randomNumber % 900000) + 100000;

  return sixDigitToken;
}

function generateJWTToken(id) {
  const token = jwt.sign({ id: id }, config.secret, {
    expiresIn: 86400, // 24 hours
  });

  return token;
}

async function sendVerificationMail(fullname, email, resetToken, res) {
  try {
    const subject = "Verify Your Email";
    const template = "emailVerification";
    const data = {
      fullname: fullname,
      resetToken: resetToken,
    };
    const emailTemplateDTO = new EmailTemplateDTO(
      email,
      subject,
      template,
      data
    );
    // send mail to candidate
    await sendEmail(emailTemplateDTO);
  } catch (error) {
    res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
      code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
      message: error,
    });
  }
}

exports.login = async (req, res) => {
  // assume that password matches

  if (req.body.email != null && req.body.email != undefined) {
    const email = req.body.email;
    const user = await User.findOne({
      where: { email: email, is_active: true },
    });

    if (user) {
      const isPasswordValid = bcrypt.compareSync(req.body.password, user.password);
      if (!isPasswordValid) {
        return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
          code: 404,
          message: "Incorrect password. Please try again.",
        });
      }
      const jwtToken = await generateJWTToken(user.id);
      const data = {
        accessToken: jwtToken,
      };
      await user.update(data);
      return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
        code: httpResponseCode.HTTP_RESPONSE_OK,
        message: "User Verication Succeed.",
        accessToken: jwtToken,
      });
    } else {
      return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
        code: 404,
        message: "Active User Not Found.",
      });
    }
  } else {
    return res.status(httpResponseCode.HTTP_RESPONSE_BAD_REQUEST).send({
      code: httpResponseCode.HTTP_RESPONSE_OK,
      message: constants.RESPONSE_MESSAGE.REQUEST_ERROR,
    });
  }
};

// verifies the token
exports.verifyUser = async (req, res) => {
  try {
    // assume that password matches

    if (req.body.email != null && req.body.email != undefined) {
      const email = req.body.email;
      const token = req.body.token;
      const tempuser = await TempUser.findOne({ where: { email: email } });
      const user = await User.findOne({ where: { email: email } });

      let isNewUser = false;
      if (
        tempuser != null &&
        tempuser != undefined &&
        (user == null || user == undefined)
      ) {
        isNewUser = true;
      }

      // store token in the database
      if (user && user.otp == token) {
        const jwtToken = await generateJWTToken(user.id);

        const data = {
          isVerified: true,
          accessToken: jwtToken,
        };
        await user.update(data);
        return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
          code: httpResponseCode.HTTP_RESPONSE_OK,
          message: "User Verication Succeed.",
          accessToken: jwtToken,
        });
      } else if (tempuser && tempuser.otp == token) {
        const data = {
          isVerified: true,
        };
        await tempuser.update(data);

        let jwtToken = await generateJWTToken(tempuser.id);

        const permanentUser = await User.create({
          email: tempuser.email,
          password: tempuser.password,
          fullname: tempuser.fullname,
          isVerified: true,
          accessToken: jwtToken,
        });

        if (permanentUser != null) {
          const newJwtToken = await generateJWTToken(permanentUser.id);
          jwtToken = newJwtToken;
          await permanentUser.update({
            accessToken: newJwtToken,
          });

          await TempUser.destroy({
            where: {
              email: email,
            },
          });

          return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
            code: httpResponseCode.HTTP_RESPONSE_OK,
            message: "User Verication Succeed.",
            accessToken: jwtToken,
          });
        }
      } else {
        return res
          .status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR)
          .send({
            code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
            message: "Invalid verification code. Please try again.",
          });
      }
    } else {
      return res.status(httpResponseCode.HTTP_RESPONSE_BAD_REQUEST).send({
        code: httpResponseCode.HTTP_RESPONSE_OK,
        message: constants.RESPONSE_MESSAGE.REQUEST_ERROR,
      });
    }
  } catch (error) {
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@", error);
    return res
      .status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR)
      .send({
        code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
        message: error,
      });
  }
};

exports.sendVerificationEmail = async (req, res) => {
  try {
    if (req.body.email != null && req.body.email != undefined) {
      const email = req.body.email;
      const resetToken = await generateVerificationToken();

      const user = await User.findOne({ where: { email: email } });
      const tempUser = await TempUser.findOne({ where: { email: email } });
      const data = {
        otp: resetToken,
      };
      if (user) {
        await user.update(data);
      }
      if (tempUser) {
        await tempUser.update(data);
      }

      sendVerificationMail(user.fullname, email, resetToken, res);
      return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
        code: httpResponseCode.HTTP_RESPONSE_OK,
        message: "Successfully sent the verification email.",
      });
    } else {
      return res.status(httpResponseCode.HTTP_RESPONSE_BAD_REQUEST).send({
        code: 400,
        message: constants.RESPONSE_MESSAGE.REQUEST_ERROR,
      });
    }
  } catch (error) {
    return res
      .status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR)
      .send({
        code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
        error: error,
        message: "Failed.",
      });
  }
};

exports.verifiyOTP = async (req, res) => {
  try {
    if (
      req.body.email != null &&
      req.body.email != undefined &&
      req.body.code != null &&
      req.body.code != undefined
    ) {
      const email = req.body.email;
      const code = req.body.code;

      const user = await User.findOne({ where: { email: email, otp: code } });
      const tempUser = await TempUser.findOne({
        where: { email: email, otp: code },
      });

      if (user || tempUser) {
        return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
          code: httpResponseCode.HTTP_RESPONSE_OK,
          message: "Successfully verified the user.",
        });
      } else {
        return res
          .status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR)
          .send({
            code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
            message: "Invalid verification code. Please try again.",
          });
      }
    } else {
      return res.status(httpResponseCode.HTTP_RESPONSE_BAD_REQUEST).send({
        code: 400,
        message: constants.RESPONSE_MESSAGE.REQUEST_ERROR,
      });
    }
  } catch (error) {
    return res
      .status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR)
      .send({
        code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
        error: error,
        message: "Failed.",
      });
  }
};

exports.userGoogleSignIn = async (req, res) => {
  try {
    if (
      req.body.email != null &&
      req.body.token != null &&
      req.body.email != undefined &&
      req.body.token != undefined
    ) {
      const email = req.body.email;
      // prefilled with google
      // const token = req.body.token;

      const user = await User.findOne({
        where: { email: email, isVerified: true },
      });

      if (user) {
        const token = await generateJWTToken(user.id);

        const passwordIsValid = bcrypt.compareSync(
          constants.DUMMY_PW,
          user.password
        );

        if (!passwordIsValid) {
          return res.status(httpResponseCode.HTTP_RESPONSE_UNAUTHORIZED).send({
            message: "Incorrect Password",
          });
        } else {
          const data = {
            accessToken: token,
          };
          await user.update(data);

          return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
            code: httpResponseCode.HTTP_RESPONSE_OK,
            message: "Signin Succcess.",
            accessToken: token,
          });
        }
      } else {
        // save token in localStorage
        return res.status(httpResponseCode.HTTP_RESPONSE_NOT_FOUND).send({
          code: 404,
          message: "Verified User Not Found. Please create an account.",
        });
      }
    } else {
      return res.status(httpResponseCode.HTTP_RESPONSE_BAD_REQUEST).send({
        code: 400,
        message: "Request Error",
      });
    }
  } catch (error) {
    return res
      .status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR)
      .send({
        code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
        message: "Failed to signup. Please try again later",
        error,
      });
  }
};

exports.userSignOut = async (req, res) => {
  try {
    if (req.body.email != null && req.body.email != undefined) {
      const email = req.body.email;
      const user = await User.findOne({ where: { email: email } });

      if (user) {
        const data = {
          accessToken: null,
          otp: null,
        };
        await user.update(data);

        return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
          code: httpResponseCode.HTTP_RESPONSE_OK,
          message: "Signout Succcess.",
        });
      } else {
        return res.status(httpResponseCode.HTTP_RESPONSE_NOT_FOUND).send({
          code: 404,
          message: "User Not Found.",
        });
      }
    } else {
      return res.status(httpResponseCode.HTTP_RESPONSE_BAD_REQUEST).send({
        code: 400,
        message: "Request Error",
      });
    }
  } catch (error) {
    return res
      .status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR)
      .send({
        code: httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR,
        message: "Failed to sign out. Please try again later",
        error,
      });
  }
};

exports.defaultmeth = async (req, res) => {
  return res.status(httpResponseCode.HTTP_RESPONSE_OK).send({
    code: httpResponseCode.HTTP_RESPONSE_OK,
    message: "Signout Succcess.",
  });
};
