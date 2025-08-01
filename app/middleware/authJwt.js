// auth middleware
const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const db = require("../models");
const User = db.user;
const { httpResponseCode } = require("../constants/httpResponseCode");

const verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"];

  if (!token) {
    return res.status(httpResponseCode.HTTP_RESPONSE_FORBIDDEN).send({
      message: "No token provided!"
    });
  }

  jwt.verify(token, config.secret, async (err, decoded) => {
    if (err) {
      return res.status(httpResponseCode.HTTP_RESPONSE_UNAUTHORIZED).send({
        message: "Unauthorized!"
      });
    }
    else{
      console.log("OK")

      const user = await User.findOne({ where: { id:decoded.id, accessToken: token } })
      if(user != null){
        req.userId = decoded.id;
      }
      else{
        return res.status(httpResponseCode.HTTP_RESPONSE_UNAUTHORIZED).send({
          message: "Token Expired! Please login"
        });
      }
    }
    next();
  });
};

const isAdmin = (req, res, next) => {

  try {
    User.findByPk(req.userId).then(user => {
      if(user.getRoles()){
        user.getRoles().then(roles => {
          for (let i = 0; i < roles.length; i++) {
            if (roles[i].name === "admin") {
              next();
              return;
            }
          }
    
          res.status(httpResponseCode.HTTP_RESPONSE_FORBIDDEN).send({
            message: "Require Admin Role!"
          });
          return;
        });
      }
      else{
        res.status(httpResponseCode.HTTP_RESPONSE_FORBIDDEN).send({
          message: "Roles not found"
        });
      }
  
    }).catch (error=>{
      res.status(httpResponseCode.HTTP_RESPONSE_FORBIDDEN).send({
        message: "User Not Found"
      });
    });
  } catch (error) {
    res.status(httpResponseCode.HTTP_RESPONSE_FORBIDDEN).send({
      message: "Roles not found"
    });
  }

};

const isUser = (req, res, next) => {
  User.findByPk(req.userId).then(user => {
    if(user){
      user.getRoles().then(roles => {
        for (let i = 0; i < roles.length; i++) {
          if (roles[i].name === "user") {
            next();
            return;
          }
        }
  
        res.status(httpResponseCode.HTTP_RESPONSE_FORBIDDEN).send({
          message: "Require User Role!"
        });
        return;
      });
    }
    else{
      res.status(httpResponseCode.HTTP_RESPONSE_INTERNAL_SERVER_ERROR).send({
        message: "User Doesn't exist!"
      });
    }

  });
};

const isModerator = (req, res, next) => {
  User.findByPk(req.userId).then(user => {
    user.getRoles().then(roles => {
      for (let i = 0; i < roles.length; i++) {
        if (roles[i].name === "moderator") {
          next();
          return;
        }
      }

      res.status(httpResponseCode.HTTP_RESPONSE_FORBIDDEN).send({
        message: "Require Moderator Role!"
      });
    });
  });
};

const isModeratorOrAdmin = (req, res, next) => {
  User.findByPk(req.userId).then(user => {
    user.getRoles().then(roles => {
      for (let i = 0; i < roles.length; i++) {
        if (roles[i].name === "moderator") {
          next();
          return;
        }

        if (roles[i].name === "admin") {
          next();
          return;
        }
      }

      res.status(httpResponseCode.HTTP_RESPONSE_FORBIDDEN).send({
        message: "Require Moderator or Admin Role!"
      });
    });
  });
};

const isUserorOrAdmin = (req, res, next) => {
  User.findByPk(req.userId).then(user => {
    user.getRoles().then(roles => {
      for (let i = 0; i < roles.length; i++) {
        if (roles[i].name === "user") {
          next();
          return;
        }

        if (roles[i].name === "admin") {
          next();
          return;
        }
      }

      res.status(httpResponseCode.HTTP_RESPONSE_FORBIDDEN).send({
        message: "Require User or Admin Role!"
      });
    });
  });
};

const authJwt = {
  verifyToken: verifyToken,
  isAdmin: isAdmin,
  isModerator: isModerator,
  isModeratorOrAdmin: isModeratorOrAdmin,
  isUserorOrAdmin: isUserorOrAdmin,
  isUser: isUser
};
module.exports = authJwt;