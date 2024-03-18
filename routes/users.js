"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureCorrectUserOrAdmin, ensureAdmin, ensureLoggedIn } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");
const Post = require("../models/post");

const router = express.Router();


/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, displayName, email, isAdmin }, token }
 *
 * Authorization required: admin
 **/

router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.register(req.body);
    const token = createToken(user);
    return res.status(201).json({ user, token });
  } catch (err) {
    return next(err);
  }
});


/** GET / => { users: [ {username, displayName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: logged in
 **/

router.get("/", ensureLoggedIn, async function (req, res, next) {
  try {
    const users = await User.findAll();
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});


/** GET /[username] => { user }
 *
 * Returns { username, displayName, email, isAdmin }
 *
 * Authorization required: logged in
 **/

router.get("/:username", ensureLoggedIn, async function (req, res, next) {
  try {
    const user = await User.get(req.params.username);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** GET /[username]/follows => [username, ...]
 * 
 * Authorization required: logged in
*/

router.get("/:username/follows", ensureLoggedIn, async function (req, res, next) {
  try {
    const usernames = await User.getFollowing(req.params.username);
    return res.json({ usernames });
  } catch (err) {
    return next(err);
  }
});


/** GET /[username]/likes => [{id, username, content, timePosted}, ...] */

router.get("/:username/likes", ensureLoggedIn, async function (req, res, next) {
  try {
    const posts = await User.getLikes(req.params.username);
    return res.json({ posts });
  } catch (err) {
    return next(err);
  }
});


/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { displayName, password, email }
 *
 * Returns { username, displayName, email, isAdmin }
 *
 * Authorization required: admin or same-user-as-:username
 **/

router.patch("/:username", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.update(req.params.username, req.body);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: admin or same-user-as-:username
 **/

router.delete("/:username", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    await User.remove(req.params.username);
    return res.json({ deleted: req.params.username });
  } catch (err) {
    return next(err);
  }
});


/** POST /[username]/follow/[username2]
 * 
 * Follows a user
 *
 * Authorization required: admin or same-user-as-username
 */

router.post("/:username/follow/:username2", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    const { username, username2 } = req.params;
    await User.followUser(username, username2);
    return res.json({ followed: username2 });
  } catch (err) {
    return next(err);
  }
});


/** POST /[username]/unFollow/[username2]
 * 
 * Follows a user
 *
 * Authorization required: admin or same-user-as-username
 */

router.post("/:username/unFollow/:username2", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    const { username, username2 } = req.params;
    await User.unFollowUser(username, username2);
    return res.json({ unFollowed: username2 });
  } catch (err) {
    return next(err);
  }
});


/** POST /[username]/like/[postId]
 * 
 * Likes a user's post
 * 
 * Authorization required: admin or same-user-as-username
 */

router.post("/:username/like/:postId", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    const { username, postId } = req.params;
    await User.likePost(username, postId);
    return res.json({ liked: postId });
  } catch (err) {
    return next(err);
  }
});


/** POST /[username]/unLike/[postId]
 * 
 * Unlikes a user's post
 * 
 * Authorization required: admin or same-user-as-username
 */

router.post("/:username/unLike/:postId", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    const { username, postId } = req.params;
    await User.unLikePost(username, postId);
    return res.json({ unLiked: postId });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;