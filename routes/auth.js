"use strict";

const Router = require("express").Router;
const router = new Router();
const { SECRET_KEY, BCRYPT_WORK_FACTOR } = require("../config");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

/** POST /login: {username, password} => {token} */

router.post("/login", async function (req, res) {
  if (req.body === undefined
    || !("username" in req.body)
    || !("password" in req.body)) throw new BadRequestError();
  const username = req.body.username;
  const password = req.body.password;

  const isValidCredentials = await User.authenticate(username, password);
  if (isValidCredentials) {
    const lastLogin = await User.updateLoginTimestamp(username);
    const payload = { "username": username };
    const token = jwt.sign(payload, SECRET_KEY);
    return res.json({ token });
  }
  else {
    throw new UnauthorizedError("Invalid user/password");
  }
});


/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */

router.post("/register", async function (req, res) {
  if (req.body === undefined
    || !("username" in req.body)
    || !("password" in req.body)
    || !("first_name" in req.body)
    || !("last_name" in req.body)
    || !("phone" in req.body)) throw new BadRequestError();

  const { username, password, first_name, last_name, phone } = req.body;
  const newUser = await User.register(
    { username, password, first_name, last_name, phone });
  const lastLogin = await User.updateLoginTimestamp(newUser.username);
  const payload = {
    "username": newUser.username,
  };

  const token = jwt.sign(payload, SECRET_KEY);
  return res.json({ token });

});

module.exports = router;