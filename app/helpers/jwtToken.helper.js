const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");

exports.generateToken = async(id)=> {
    const token = jwt.sign({ id: id }, config.secret, {
        expiresIn: 86400 // 24 hours
        // expiresIn: 7776000 // 90 days in seconds
    });

    return token;
}

exports.decodeToken = async(token)=> {
    return jwt.verify(token, config.secret);
}