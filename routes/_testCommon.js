"use strict";

const db = require("../db.js");
const User = require("../models/user");
const Post = require("../models/post");
const { createToken } = require("../helpers/tokens");


async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM posts");

  await db.query("ALTER SEQUENCE posts_id_seq RESTART")


  await User.register({
    username: "u1",
    displayName: "U1D",
    email: "user1@user.com",
    password: "password1",
    isAdmin: false,
  });
  await User.register({
    username: "u2",
    displayName: "U2D",
    email: "user2@user.com",
    password: "password2",
    isAdmin: false,
  });
  await User.register({
    username: "u3",
    displayName: "U3D",
    email: "user3@user.com",
    password: "password3",
    isAdmin: false,
  });


  await User.followUser("u1", "u2");
  await User.followUser("u1", "u3");
  await User.followUser("u3", "u2");


  await Post.create({
    username: "u1",
    content: "User 1 Post 1",
  });

  await Post.create({
    username: "u1",
    content: "User 1 Post 2",
  });
  
  await Post.create({
    username: "u2",
    content: "User 2 Post 1",
  });
  
  await Post.create({
    username: "u2",
    content: "User 2 Post 2",
  });
  
  await Post.create({
    username: "u3",
    content: "User 3 Post 1",
  });
  
  await Post.create({
    username: "u3",
    content: "User 3 Post 2",
  });


  await User.likePost("u1", 3);
  await User.likePost("u2", 1);
  await User.likePost("u3", 5);
  await User.likePost("u3", 3);

}

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}


const u1Token = createToken({ username: "u1", isAdmin: false });
const u2Token = createToken({ username: "u2", isAdmin: false });
const adminToken = createToken({ username: "admin", isAdmin: true });


module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
  adminToken,
};