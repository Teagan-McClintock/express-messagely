"use strict";

/** User of the site. */

const { NotFoundError } = require("../expressError");
const db = require("../db");

const bcrypt = require("bcrypt");

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const result = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING username, password, first_name, last_name, phone
      `, [username, password, first_name, last_name, phone]);

    return result.rows[0];
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT username, password
        FROM users
        WHERE username = $1
      `, [username]);

    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user ${username}`);

    if (await bcrypt.compare(password, user.password) === true){
      return true;
    }
    else {
      return false;
    }
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const result = await db.query(
      `UPDATE users
        SET last_login_at = current_timestamp
        WHERE username = $1
        RETURNING username, last_login_at
      `, [username]);

    const user = result.rows[0];
    if (!user) throw new NotFoundError(`No user ${username}`);
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const results = await db.query(
      `SELECT username, first_name, last_name
        FROM users
      `);
    return results.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at
        FROM users
        WHERE username = $1
      `, [username]);

    const user = result.rows[0];
    if (!user) throw new NotFoundError(`No user ${username}`);
    return user;
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const results = await db.query(
    `SELECT m.id,
        t.username,
        t.first_name,
        t.last_name,
        t.phone,
        m.body,
        m.sent_at,
        m.read_at
      FROM messages AS m
      JOIN users AS t
        ON m.to_username = t.username
      WHERE m.from_username = $1
    `, [username]);

    //TODO: Distinguish between no user with username and username exists but no messages

    const messages = results.rows.map(function(r){ return {"id": r.id,
      "to_user": {"username": r.username,
        "first_name": r.first_name,
        "last_name": r.last_name,
        "phone": r.phone},
      "sent_at": r.sent_at,
      "read_at": r.read_at}});
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
  }
}


module.exports = User;
