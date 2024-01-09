"use strict";

const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const Message = require("../models/message");

let user1Token, user2Token;

describe("User Routes tests", function () {

  beforeEach(async function () {
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");

    let response = await request(app)
      .post("/auth/register")
      .send({
        username: "bob",
        password: "secret",
        first_name: "Bob",
        last_name: "Smith",
        phone: "+14150000000"
      });
    user1Token = response.body.token;

    let response2 = await request(app)
      .post("/auth/register")
      .send({
        username: "test",
        password: "password",
        first_name: "Joe",
        last_name: "John",
        phone: "+14150000000"
      });
    user2Token = response2.body.token;

    let m1 = await Message.create({
      from_username: "bob",
      to_username: "test",
      body: "u1-to-u2",
    });
    let m2 = await Message.create({
      from_username: "test",
      to_username: "bob",
      body: "u2-to-u1",
    });
  });

  /**GET / - get list of users.*/
  describe("Test for /users", function () {
    test("Should get list of users", async function () {
      const response = await request(app)
        .get("/users")
        .query({ _token: user1Token });

      expect(response.body.users.length).toEqual(2);
    });

    test("Not logged in users test", async function () {
      const response = await request(app)
        .get("/users");
      expect(response.statusCode).toEqual(401);
    });
  });

  /**GET /users/:username - get detail of users.*/
  describe("Test for /users/:username", function () {
    test("Get details of user", async function () {
      const response = await request(app)
        .get("/users/bob")
        .query({ _token: user1Token });

      expect(response.body.user).toEqual({
        username: "bob",
        first_name: "Bob",
        last_name: "Smith",
        phone: "+14150000000",
        join_at: expect.any(String),
        last_login_at: expect.any(String),
      });
    });

    test("Not logged in user should get 401", async function () {
      const response = await request(app)
        .get("/users/bob");

      expect(response.statusCode).toEqual(401);
    });

    test("Different logged in user should get 401", async function () {
      const response = await request(app)
        .get("/users/bob")
        .query({ _token: user2Token });

      expect(response.statusCode).toEqual(401);
    });
  });

  describe("Tests for /users/:username/to", function () {
    test("Logged in user should get messages", async function () {
      const response = await request(app)
        .get("/users/bob/to")
        .query({ _token: user1Token });
      expect(response.body.messages).toEqual(
        [{
          id: expect.any(Number),
          body: "u2-to-u1",
          sent_at: expect.any(String),
          read_at: null,
          from_user: {
            username: "test",
            first_name: "Joe",
            last_name: "John",
            phone: "+14150000000"
          }
        }]);
    });

    test("Not logged in user should get 401", async function () {
      const response = await request(app)
        .get("/users/bob/to");

      expect(response.statusCode).toEqual(401);
    });

    test("Different logged in user should get 401", async function () {
      const response = await request(app)
        .get("/users/bob/to")
        .query({ _token: user2Token });

      expect(response.statusCode).toEqual(401);
    });
  });

  describe("Tests for /users/:username/from", function () {
    test("Logged in user should get messages", async function () {
      const response = await request(app)
        .get("/users/bob/from")
        .query({ _token: user1Token });
      expect(response.body.messages).toEqual(
        [{
          id: expect.any(Number),
          body: "u1-to-u2",
          sent_at: expect.any(String),
          read_at: null,
          to_user: {
            username: "test",
            first_name: "Joe",
            last_name: "John",
            phone: "+14150000000"
          }
        }]);
    });

    test("Not logged in user should get 401", async function () {
      const response = await request(app)
        .get("/users/bob/from");

      expect(response.statusCode).toEqual(401);
    });

    test("Different logged in user should get 401", async function () {
      const response = await request(app)
        .get("/users/bob/from")
        .query({ _token: user2Token });

      expect(response.statusCode).toEqual(401);
    });
  });
});

afterAll(async function () {
  await db.end();
});
