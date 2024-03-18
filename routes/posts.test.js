"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app");
const Post = require("../models/post");

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

/************************************** POST /posts */

describe("POST /posts", function () {
    test("works for admin", async function () {
        const resp = await request(app)
            .post("/posts")
            .send({
                content:"New Post"
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            post:{
                id: 7,
                username: "admin",
                content: "New Post",
                timePosted: expect.any(String),
            }
        });
    });
    
    test("works for non admin user", async function () {
        const resp = await request(app)
            .post("/posts")
            .send({
                content:"New Post"
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            post:{
                id: 8,
                username: "u1",
                content: "New Post",
                timePosted: expect.any(String),
            }
        });
    });
    
    test("does not work for anon", async function () {
        const resp = await request(app)
            .post("/posts")
            .send({
                content:"New Post"
            });
        expect(resp.statusCode).toEqual(401);
    });
});

/************************************** GET /posts */

describe("GET /posts", function () {
    test("works for admin", async function () {
        const resp = await request(app)
            .get("/posts")
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body.posts.length).toEqual(6);
        expect(resp.body.posts[0]).toEqual({
            id: 6,
            username: "u3",
            content: "User 3 Post 2",
            timePosted: expect.any(String),
        });
    });
    
    test("works for non admin user", async function () {
        const resp = await request(app)
            .get("/posts")
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.body.posts.length).toEqual(6);
        expect(resp.body.posts[0]).toEqual({
            id: 6,
            username: "u3",
            content: "User 3 Post 2",
            timePosted: expect.any(String),
        });
    });
    
    test("doesnt work for anon", async function () {
        const resp = await request(app)
            .get("/posts");
        expect(resp.statusCode).toEqual(401);
    });
});

/************************************** GET /posts/:username/followFeed */

describe("GET /posts/:username/followFeed", function () {
    test("works for admin", async function () {
        const resp = await request(app)
            .get("/posts/u1/followFeed")
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body.posts.length).toEqual(4);
        expect(resp.body.posts[0]).toEqual({
            id: 6,
            username: "u3",
            content: "User 3 Post 2",
            timePosted: expect.any(String),
        });
    });
    
    test("works for correct user", async function () {
        const resp = await request(app)
            .get("/posts/u1/followFeed")
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.body.posts.length).toEqual(4);
        expect(resp.body.posts[0]).toEqual({
            id: 6,
            username: "u3",
            content: "User 3 Post 2",
            timePosted: expect.any(String),
        });
    });
    
    test("does not work for incorrect user", async function () {
        const resp = await request(app)
            .get("/posts/u1/followFeed")
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(401);
    });
    
    test("does not work for anon", async function () {
        const resp = await request(app)
            .get("/posts/u1/followFeed");
        expect(resp.statusCode).toEqual(401);
    });
});

/************************************** GET /posts/:username/posts */

describe("GET /posts/:username/posts", function () {
    test("works for admin", async function () {
        const resp = await request(app)
            .get("/posts/u1/posts")
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body.posts.length).toEqual(2);
        expect(resp.body.posts).toEqual([
            {
                id: 2,
                username: "u1",
                content: "User 1 Post 2",
                timePosted: expect.any(String),
            },
            {
                id: 1,
                username: "u1",
                content: "User 1 Post 1",
                timePosted: expect.any(String),
            },
        ]);
    });
    
    test("works for non admin", async function () {
        const resp = await request(app)
            .get("/posts/u1/posts")
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.body.posts.length).toEqual(2);
        expect(resp.body.posts).toEqual([
            {
                id: 2,
                username: "u1",
                content: "User 1 Post 2",
                timePosted: expect.any(String),
            },
            {
                id: 1,
                username: "u1",
                content: "User 1 Post 1",
                timePosted: expect.any(String),
            },
        ]);
    });
    
    test("does not work for anon", async function () {
        const resp = await request(app)
            .get("/posts/u1/posts");
        expect(resp.statusCode).toEqual(401);
    });

});

/************************************** GET /posts/:id */

describe("GET /posts/:id", function () {
    test("works for admin", async function () {
        const resp = await request(app)
            .get("/posts/1")
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body.post).toEqual({
            id: 1,
            username: "u1",
            content: "User 1 Post 1",
            timePosted: expect.any(String),
        });
    });
    
    test("works for non admin user", async function () {
        const resp = await request(app)
            .get("/posts/1")
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.body.post).toEqual({
            id: 1,
            username: "u1",
            content: "User 1 Post 1",
            timePosted: expect.any(String),
        });
    });
    
    test("does not work for anon", async function () {
        const resp = await request(app)
            .get("/posts/1");
        expect(resp.statusCode).toEqual(401);
    });
});

/************************************** DELETE /posts/:id */

describe("DELETE /posts/:id", function () {
    test("works for admin", async function () {
        const resp = await request(app)
            .delete("/posts/1")
            .set("authorization", `Bearer ${adminToken}`);
        const posts = await Post.findAll();
        expect(resp.body.deleted).toEqual(1);
        expect(posts.length).toEqual(5);
    });
    
    test("works for correct user", async function () {
        const resp = await request(app)
            .delete("/posts/1")
            .set("authorization", `Bearer ${u1Token}`);
        const posts = await Post.findAll();
        expect(resp.body.deleted).toEqual(1);
        expect(posts.length).toEqual(5);
    });
    
    test("does not work for incorrect user", async function () {
        const resp = await request(app)
            .delete("/posts/1")
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(401);
    });
    
    test("does not work for anon", async function () {
        const resp = await request(app)
            .delete("/posts/1");
        expect(resp.statusCode).toEqual(401);
    });
});