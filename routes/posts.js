"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureCorrectUserOrAdmin, ensureAdmin, ensureLoggedIn } = require("../middleware/auth");
const { BadRequestError, UnauthorizedError } = require("../expressError");
const Post = require("../models/post");
const { createToken } = require("../helpers/tokens");
const postNewSchema = require("../schemas/postNew.json");
const User = require("../models/user");
const g = require("file-saver");

const router = express.Router();


/** POST / { post } => { post }
 * 
 * post should be { content }
 */

router.post("/", ensureLoggedIn, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, postNewSchema);
        if(!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const content = req.body.content;
        const username = res.locals.user.username;
        const post = await Post.create({content, username});
        return res.status(201).json({ post });
    } catch (err) {
        return next(err);
    }
});


/** GET / => { posts: [ {id, username, content, timePosted}, ... ] }
 * 
 * Returns a list of all posts.
 * 
 * Authorization required: admin
 */

router.get("/", ensureLoggedIn, async function (req, res, next) {
    try {
        const posts = await Post.findAll();
        return res.json({ posts });
    } catch (err) {
        return next(err);
    }
});


/** GET /[username]/followFeed
 * 
 * Returns posts of who user follows
*/

router.get("/:username/followFeed", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    const posts = await Post.getFollowingPosts(req.params.username);
    return res.json({ posts });
  } catch (err) {
    return next(err);
  }
});


/** GET /[username]/posts
 * 
 * get posts of user
*/

router.get("/:username/posts", ensureLoggedIn, async function (req, res, next) {
    try {
        const posts = await Post.getPostsFrom(req.params.username);
        return res.json({ posts });
    } catch (err) {
        return next(err);
    }
});


/** GET /[id] => { post }
 * 
 * Returns { id, username, content, timePosted }
 * 
 * Authorization required: is-logged-in
 */

router.get("/:id", ensureLoggedIn, async function (req, res, next) {
    try {
        const post = await Post.get(req.params.id);
        return res.json({ post });
    } catch (err) {
        return next(err);
    }
});


/** DELETE /[postId] => { deleted: postId }
 * 
 * Authorization required: admin or same-user-as-:username
 */

router.delete("/:id", ensureLoggedIn, async function (req, res, next) {
    try {
        const postId = req.params.id;
        const post = await Post.get(postId);
        
        if(!(res.locals.user.isAdmin || post.username == res.locals.user.username)) {
            throw new UnauthorizedError("Only the post's owner or an admin may delete a post");
        }

        let id = await Post.remove(postId);
        return res.json({ deleted: id });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;