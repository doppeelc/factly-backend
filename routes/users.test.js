"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app");
const User = require("../models/user");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
  adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /users */

describe("POST /users", function () {
  test("works for admins: create non-admin", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          displayName: "display-new",
          password: "password-new",
          email: "new@email.com",
          isAdmin: false,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        username: "u-new",
        displayName: "display-new",
        email: "new@email.com",
        isAdmin: false,
      }, token: expect.any(String),
    });
  });

  test("works for admins: create admin", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          displayName: "display-new",
          password: "password-new",
          email: "new@email.com",
          isAdmin: true,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        username: "u-new",
        displayName: "display-new",
        email: "new@email.com",
        isAdmin: true,
      }, token: expect.any(String),
    });
  });

  test("unauth for users", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          displayName: "display-new",
          password: "password-new",
          email: "new@email.com",
          isAdmin: true,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          displayName: "display-new",
          password: "password-new",
          email: "new@email.com",
          isAdmin: true,
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request if missing data", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request if invalid data", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          displayName: "display-new",
          password: "password-new",
          email: "not-an-email",
          isAdmin: true,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /users */

describe("GET /users", function () {
  test("works for admins", async function () {
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      users: [
        {
          username: "u1",
          displayName: "U1D",
          email: "user1@user.com",
          isAdmin: false,
        },
        {
          username: "u2",
          displayName: "U2D",
          email: "user2@user.com",
          isAdmin: false,
        },
        {
          username: "u3",
         displayName: "U3D",
          email: "user3@user.com",
          isAdmin: false,
        },
      ],
    });
  });

  test("works for non-admin users", async function () {
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${u1Token}`);
        expect(resp.body).toEqual({
            users: [
              {
                username: "u1",
                displayName: "U1D",
                email: "user1@user.com",
                isAdmin: false,
              },
              {
                username: "u2",
                displayName: "U2D",
                email: "user2@user.com",
                isAdmin: false,
              },
              {
                username: "u3",
               displayName: "U3D",
                email: "user3@user.com",
                isAdmin: false,
              },
            ],
          });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .get("/users");
    expect(resp.statusCode).toEqual(401);
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE users CASCADE");
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /users/:username */

describe("GET /users/:username", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .get(`/users/u1`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        displayName: "U1D",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
  });

  test("works for same user", async function () {
    const resp = await request(app)
        .get(`/users/u1`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        displayName: "U1D",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
  });

  test("works for other users", async function () {
    const resp = await request(app)
        .get(`/users/u1`)
        .set("authorization", `Bearer ${u2Token}`);
        expect(resp.body).toEqual({
          user: {
            username: "u1",
            displayName: "U1D",
            email: "user1@user.com",
            isAdmin: false,
          },
        });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .get(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if user not found", async function () {
    const resp = await request(app)
        .get(`/users/nope`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** GET /users/:username/follows */

describe("GET /users/:username/follows", () => {
  test("works for admins", async function () {
    const resp = await request(app)
        .get(`/users/u1/follows`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      usernames:[
          "u2",
          "u3"
      ]
    });
  });

  test("works for non admin users", async function () {
    const resp = await request(app)
        .get(`/users/u1/follows`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      usernames:[
          "u2",
          "u3"
      ]
    });
  });

  test("doesnt work for anon", async function () {
    const resp = await request(app)
        .get(`/users/u1/follows`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if user not found", async function () {
    const resp = await request(app)
        .get(`/users/nope/follows`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** GET /user/:username/likes */

describe("GET /users/:username/likes", () => {
  test("works for admins", async function () {
    const resp = await request(app)
        .get(`/users/u1/likes`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      posts: [
        {
          id:3,
          username:"u2",
          content:"User 2 Post 1",
          timePosted: expect.any(String)
        }
      ]
    });
  });
  
  test("works for users", async function () {
    const resp = await request(app)
        .get(`/users/u1/likes`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      posts: [
        {
          id:3,
          username:"u2",
          content:"User 2 Post 1",
          timePosted: expect.any(String)
        }
      ]
    });
  });
  
  test("does not work for anon", async function () {
    const resp = await request(app)
        .get(`/users/u1/likes`);
    expect(resp.statusCode).toEqual(401);
  });
});

/************************************** PATCH /users/:username */

describe("PATCH /users/:username", () => {
  test("works for admins", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          displayName: "New",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        displayName: "New",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
  });

  test("works for same user", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          displayName: "New",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        displayName: "New",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
  });

  test("unauth if not same user", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          displayName: "New",
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          displayName: "New",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if no such user", async function () {
    const resp = await request(app)
        .patch(`/users/nope`)
        .send({
          displayName: "Nope",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request if invalid data", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          displayName: 42,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("works: can set new password", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          password: "new-password",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        displayName: "U1D",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
    const isSuccessful = await User.authenticate("u1", "new-password");
    expect(isSuccessful).toBeTruthy();
  });
});

/************************************** DELETE /users/:username */

describe("DELETE /users/:username", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .delete(`/users/u1`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: "u1" });
  });

  test("works for same user", async function () {
    const resp = await request(app)
        .delete(`/users/u1`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: "u1" });
  });

  test("unauth if not same user", async function () {
    const resp = await request(app)
        .delete(`/users/u1`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if user missing", async function () {
    const resp = await request(app)
        .delete(`/users/nope`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** POST /users/:username/follow/username2 */

describe("POST /users/:username1/follow/username2", function () {
  test("works for admin", async function () {
    let resp = await request(app)
        .post(`/users/u2/follow/u1`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(await User.getFollowing("u2")).toEqual(
      [
        "u1"
      ]
    );
  });
  
  test("works for correct user", async function () {
    let resp = await request(app)
        .post(`/users/u2/follow/u1`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(await User.getFollowing("u2")).toEqual(
      [
        "u1"
      ]
    );
  });
  
  test("does not work for other users", async function () {
    let resp = await request(app)
        .post(`/users/u2/follow/u1`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });
});

/************************************** POST /users/:username/unFollow/username2 */

describe("POST /users/:username/unFollow/:username2", () => {
  test("works for admin", async function () {
    const resp = await request(app)
        .post(`/users/u1/unFollow/u2`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(await User.getFollowing("u1")).toEqual(
      [
        "u3"
      ]
    );
  });
  
  test("works for correct user", async function () {
    const resp = await request(app)
        .post(`/users/u1/unFollow/u2`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(await User.getFollowing("u1")).toEqual(
      [
        "u3"
      ]
    );
  });
  
  test("does not work for other users", async function () {
    const resp = await request(app)
        .post(`/users/u1/unFollow/u2`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });
});

/************************************** POST /users/:username/like/:postId */

describe("POST /users/:username/like/:postId", () => {
  test("works for admin", async function () {
    const resp = await request(app)
        .post(`/users/u1/like/4`)
        .set("authorization", `Bearer ${adminToken}`);
    expect((await User.getLikes("u1")).length).toEqual(2);
  });
  
  test("works for correct user", async function () {
    const resp = await request(app)
        .post(`/users/u1/like/4`)
        .set("authorization", `Bearer ${u1Token}`);
    expect((await User.getLikes("u1")).length).toEqual(2);
  });
  
  test("does not work for other users", async function () {
    const resp = await request(app)
        .post(`/users/u1/like/4`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });
});

/************************************** POST /users/:username/unLike/:postId */

describe("POST /users/:username/like/:postId", () => {
  test("works for admin", async function () {
    const resp = await request(app)
        .post(`/users/u1/unLike/3`)
        .set("authorization", `Bearer ${adminToken}`);
    expect((await User.getLikes("u1")).length).toEqual(0);
  });
  
  test("works for correct user", async function () {
    const resp = await request(app)
        .post(`/users/u1/unLike/3`)
        .set("authorization", `Bearer ${u1Token}`);
    expect((await User.getLikes("u1")).length).toEqual(0);
  });
  
  test("does not work for other users", async function () {
    const resp = await request(app)
        .post(`/users/u1/unLike/3`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });
});