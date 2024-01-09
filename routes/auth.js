"use strict";

const Router = require("express").Router;
const router = new Router();
const { SECRET_KEY, BCRYPT_WORK_FACTOR } = require("../config");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

/** POST /login: {username, password} => {token} */

router.post("/login", async function(req, res){
  if (req.body === undefined) throw new BadRequestError();
  const username = req.body.username;
  const password = req.body.password;

  const isValidCredentials = await User.authenticate(username,password);
  if(isValidCredentials){
    const payload = { "username": username };
    const token = jwt.sign(payload, SECRET_KEY);
    return res.json({ token });
  }else{
    throw new UnauthorizedError("Invalid user/password");
  }
});


/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */

module.exports = router;