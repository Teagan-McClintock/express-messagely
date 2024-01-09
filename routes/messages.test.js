"use strict";

const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const Message = require("../models/message");

let user1Token, user2Token;
let m1, m2;

describe("Message Routes tests", function () {

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

    m1 = await Message.create({
      from_username: "bob",
      to_username: "test",
      body: "u1-to-u2",
    });
    m2 = await Message.create({
      from_username: "test",
      to_username: "bob",
      body: "u2-to-u1",
    });
  });

  test("Logged in correct user should see message details", async function(){
    const response = await request(app)
      .get(`/messages/${m1.id}`)
      .query({ _token: user1Token });

    expect(response.body.message).toEqual({
      id: m1.id,
      body: m1.body,
      sent_at: expect.any(String),
      read_at: null,
      from_user: {username: m1.from_username,
        first_name: "Bob",
        last_name: "Smith",
        phone: "+14150000000"},
      to_user: {username: m1.to_username,
        first_name: "Joe",
        last_name: "John",
        phone: "+14150000000"}
    })
  })
});

afterAll(async function () {
  await db.end();
});