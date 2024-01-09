"use strict";

const Router = require("express").Router;
const router = new Router();
const { UnauthorizedError } = require("../expressError");
const Message = require("../models/message");
const { ensureLoggedIn } = require("../middleware/auth");
router.use(ensureLoggedIn);

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Makes sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get("/:id", async function (req, res) {
  const id = req.params.id;
  const message = await Message.get(id);
  const currLoggedInUser = res.locals.user.username;
  if (message.from_user.username === currLoggedInUser
    || message.to_user.username === currLoggedInUser) {
    return res.json({ message });
  } else {
    throw new UnauthorizedError("You are not the correct user to view this message");
  }
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post("/", async function (req, res) {
  const { to_username, body } = req.body;
  const from_username = res.locals.user.username;
  const message = await Message.create({ from_username, to_username, body });
  return res.json({ message });
});


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Makes sure that the only the intended recipient can mark as read.
 *
 **/

router.post("/:id/read", async function (req, res) {
  const id = req.params.id;
  const messageDetails = await Message.get(id);
  if (messageDetails.to_user.username === res.locals.user.username) {
    const message = await Message.markRead(id);
    return res.json({ message });
  } else {
    throw new UnauthorizedError("Not allowed to mark message as read");
  }
});


module.exports = router;