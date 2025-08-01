const { User } = require("../models");
const { StatusCodes } = require("http-status-codes");
const CommonResponseDTO = require("../dto/CommonResponseDTO");
const jwtTokenHelper = require("../helpers/jwtToken.helper.js");

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .send(
          new CommonResponseDTO(
            StatusCodes.UNAUTHORIZED,
            "No token provided or invalid format",
            null,
            "Authorization header missing or incorrectly formatted."
          )
        );
    }

    const token = authHeader.split(" ")[1];
    const decoded = await jwtTokenHelper.decodeToken(token);

    const user = await User.findOne({ where: { id: decoded.id } });

    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .send(
          new CommonResponseDTO(
            StatusCodes.UNAUTHORIZED,
            "Token expired or invalid. Please login again.",
            null,
            "User not found or token mismatch."
          )
        );
    }

    if (!user.accessToken) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .send(
          new CommonResponseDTO(
            StatusCodes.UNAUTHORIZED,
            "Session expired or invalid. Please log in again.",
            null,
            "Access Token not found."
          )
        );
    }

    req.userId = user.id;
    req.user = user;
    req.accessToken = token;

    next();
  } catch (error) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .send(
        new CommonResponseDTO(
          StatusCodes.UNAUTHORIZED,
          "Invalid access token",
          error.message || "Token verification failed.",
          null
        )
      );
  }
};

module.exports = { verifyToken };
