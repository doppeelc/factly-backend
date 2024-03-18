"use strict";

const request = require("supertest");

const db = require("../db.js");
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
const { UnauthorizedError, BadRequestError, NotFoundError } = require("../expressError.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** authenticate */

describe("authenticate", function () {
    test("returns user w/o password", async function () {
        const user = await User.authenticate("u1", "password1");
        expect(user).toEqual({
            username: "u1",
            displayName: "U1D",
            email: "user1@user.com",
            isAdmin: false
        });
    });

    test("throws UnauthorizedError if incorrect username/password", async function () {
        try {
            await User.authenticate("notAUser", "password1");
        } catch (err) {
            expect(err instanceof UnauthorizedError).toBeTruthy();
        }

        try {
            await User.authenticate("u1", "NotAPassword");
        } catch (err) {
            expect(err instanceof UnauthorizedError).toBeTruthy();
        }
    });
});

/************************************** register */

describe("authenticate", function () {
    test("returns user w/o password", async function () {
        const newUser = await User.register({
            username: "newUser",
            password: "newPassword",
            displayName: "New User",
            email: "newUser@user.com",
            isAdmin: false,
        });
        expect(newUser).toEqual({
            username: "newUser",
            displayName: "New User",
            email: "newUser@user.com",
            isAdmin: false
        });
        const user = await User.authenticate("newUser", "newPassword");
        expect(user).toEqual({
            username: "newUser",
            displayName: "New User",
            email: "newUser@user.com",
            isAdmin: false
        });
    });

    test("throws BadRequestError if duplicate username", async function () {
        try {
            await User.register({
                username: "u1",
                password: "password",
                displayName: "Bad User",
                email: "BadUser@user.com",
                isAdmin: false,
            });
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** findAll */

describe("findAll", function () {
    test("gets all users", async function () {
        const users = await User.findAll();
        expect(users.length).toEqual(3);
        expect(users[0]).toEqual({
            username: "u1",
            displayName: "U1D",
            email: "user1@user.com",
            isAdmin: false,
        });
    });
});

/************************************** get */

describe("get", function () {
    test("returns user by username", async function () {
        const user = await User.get("u1");
        expect(user).toEqual({
            username: "u1",
            displayName: "U1D",
            email: "user1@user.com",
            isAdmin: false,
        });
    });
});

/************************************** update */

describe("update", function () {
    test("updates user with given data", async function () {
        const userData = {
            displayName: "updatedDisplayName",
            email: "updatedEmail@user.com"
        };
        const user = await User.update("u1", userData);
        expect(user).toEqual({
            username: "u1",
            displayName: "updatedDisplayName",
            email: "updatedEmail@user.com",
            isAdmin: false,
        });
    });
});

/************************************** getFollowing */

describe("getFollowing", function () {
    test("gets users followed by username", async function () {
        const users = await User.getFollowing("u1");
        expect(users).toEqual([
            "u2",
            "u3"
        ]);
    });
});

/************************************** getFollowers */

describe("getFollowers", function () {
    test("gets users following username", async function () {
        const users = await User.getFollowers("u2");
        expect(users).toEqual([
            "u1",
            "u3"
        ]);
    });
});

/************************************** getLikes */

describe("getLikes", function () {
    test("get liked posts", async function () {
        const posts = await User.getLikes("u1");
        expect(posts[0]).toEqual({
            id: 3,
            username: "u2",
            content: "User 2 Post 1",
            timePosted: expect.any(Object)
        });
    });
});

/************************************** likePost */

describe("likePost", function () {
    test("likes a post", async function () {
        const postId = await User.likePost("u1", 5);
        expect(postId.postId).toEqual(5);
        const posts = await User.getLikes("u1");
        expect(posts[1]).toEqual({
            id: 5,
            username: "u3",
            content: "User 3 Post 1",
            timePosted: expect.any(Object)
        });
    });
});

/************************************** unLikePost */

describe("unLikePost", function () {
    test("likes a post", async function () {
        const postId = await User.unLikePost("u1", 3);
        expect(postId.postId).toEqual(3);
        const posts = await User.getLikes("u1");
        expect(posts).toEqual([]);
    });
});

/************************************** followUser */

describe("followUser", function () {
    test("follows another user", async function () {
        const user = await User.followUser("u2", "u1");
        expect(user.userFollowed).toEqual("u1");
        const users = await User.getFollowing("u2");
        expect(users).toEqual([
            "u1"
        ]);
    });
});

/************************************** unFollowUser */

describe("unFollowUser", function () {
    test("unfollows another user", async function () {
        const user = await User.unFollowUser("u1", "u2");
        expect(user.userUnfollowed).toEqual("u2");
        const users = await User.getFollowing("u1");
        expect(users).toEqual([
            "u3"
        ]);
    });
});

/************************************** remove */

describe("remove", function () {
    test("deletes user", async function () {
        const user = await User.remove("u1");
        expect(user.deleted).toEqual("u1");
        try {
            await User.get("u1");
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});