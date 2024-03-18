"use strict";

const request = require("supertest");

const db = require("../db.js");
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

/************************************** create */

describe("create", function () {
    const newPost = {username:"u1", content:"User 1 Post 3"};
    test("creates a new post", async function () {
        const post = await Post.create(newPost);
        expect(post).toEqual({
            id: 7,
            username: "u1",
            content: "User 1 Post 3",
            timePosted: expect.any(Object),
        });
    });
});

/************************************** findAll */

describe("findAll", function () {
    test("gets all posts", async function () {
        const posts = await Post.findAll();
        expect(posts[0]).toEqual({
            id: 6,
            username: "u3",
            content: "User 3 Post 2",
            timePosted: expect.any(Object),
        });
    });
});

/************************************** getFollowing */

describe("getFollowing", function () {
    test("gets posts from followed users", async function () {
        const posts = await Post.getFollowingPosts("u1");
        expect(posts.length).toEqual(4);
        expect(posts[0]).toEqual({
            id: 6,
            username: "u3",
            content: "User 3 Post 2",
            timePosted: expect.any(Object),
        });
    });
});

/************************************** getPostsFrom */

describe("getPostsFrom", function () {
    test("gets posts from user", async function () {
        const posts = await Post.getPostsFrom("u1");
        expect(posts.length).toEqual(2);
        expect(posts[0]).toEqual({
            id: 2,
            username: "u1",
            content: "User 1 Post 2",
            timePosted: expect.any(Object),
        });
    });
});

/************************************** get */

describe("get", function () {
    test("gets post by id", async function () {
        const post = await Post.get(1);
        expect(post).toEqual({
            id: 1,
            username: "u1",
            content: "User 1 Post 1",
            timePosted: expect.any(Object),
        });
    });
});

/************************************** getLikes */

describe("getLikes", function () {
    test("gets usernames of those who liked post", async function () {
        const users = await Post.getLikes(3);
        expect(users.length).toEqual(2);
        expect(users).toEqual([
            "u1",
            "u3",
        ]);
    });
});

/************************************** remove */

describe("remove", function () {
    test("removes post", async function () {
        const deleted = await Post.remove(1);
        expect(deleted).toEqual(1);
        const posts = await Post.findAll();
        expect(posts.length).toEqual(5);
    });
});