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

    //change names,phone numbers, etc to be more logical and readable
    //test1 and test2 versus bob and test
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

  //////////////////////////////////////////////
  /**GET /:id - get detail of message. */

  test("Logged in correct user should see message details", async function () {
    const response = await request(app)
      .get(`/messages/${m1.id}`)
      .query({ _token: user1Token });
    //expect the full object; response.body equals{ message: {...} }
    expect(response.body.message).toEqual({
      id: m1.id,
      body: m1.body,
      sent_at: expect.any(String),
      read_at: null,
      from_user: {
        username: m1.from_username, //put the string of what the username should be exactly
        first_name: "Bob",
        last_name: "Smith",
        phone: "+14150000000"
      },
      to_user: {
        username: m1.to_username,
        first_name: "Joe",
        last_name: "John",
        phone: "+14150000000"
      }
    });
  });

  test("No user logged in should not see message details", async function () {
    const response = await request(app)
      .get(`/messages/${m1.id}`);

    expect(response.statusCode).toEqual(401);
  });

  //shorten lines to stay within guidelines
  test("Incorrect user logged in should not see message details", async function () {
    //better to use the model method for registering rather than the route
    const response3 = await request(app)
      .post("/auth/register")
      .send({
        username: "bill",
        password: "secret",
        first_name: "bill",
        last_name: "billiam",
        phone: "+14150000000"
      });
    const user3Token = response3.body.token;

    const response = await request(app)
      .get(`/messages/${m1.id}`)
      .query({ _token: user3Token });

    expect(response.statusCode).toEqual(401);
  });

  //////////////////////////////////////////////
  /**POST / - post message. */

  test("Creating new message", async function () {
    const response = await request(app)
      .post("/messages")
      .send(
        {
          to_username: "test",
          body: "hi hello whatever",
          _token: user1Token
        }
      );

    expect(response.statusCode).toEqual(201);
    //expect whole object again; response.body equals {message:{}}
    expect(response.body.message).toEqual(
      {
        id: expect.any(Number),
        from_username: "bob",
        to_username: "test",
        body: "hi hello whatever",
        sent_at: expect.any(String)
      }
    );
  });

  test("Creating new message for not logged in", async function () {
    const response = await request(app)
      .post("/messages")
      .send(
        {
          to_username: "doesNotExist",
          body: "hi hello whatever"
        }
      );

    expect(response.statusCode).toEqual(401);
  });


  //////////////////////////////////////////////
  /**POST/:id/read - mark message as read:*/
  test("Successfully mark message as read", async function(){
    const response = await request(app)
      .post(`/messages/${m1.id}/read`)
      .send({
        _token: user2Token
      });

    expect(response.body.message).toEqual(
      {
        id: m1.id,
        read_at: expect.any(String)
      }
    );

  });

  test("Mark message as read while not logged in", async function(){
    const response = await request(app)
      .post(`/messages/${m1.id}/read`);

    expect(response.statusCode).toEqual(401);

  });

  test("Mark message as read while logged in as sender", async function(){
    const response = await request(app)
      .post(`/messages/${m1.id}/read`)
      .send({
        _token: user1Token
      });

    expect(response.statusCode).toEqual(401);

  });




});

afterAll(async function () {
  await db.end();
});