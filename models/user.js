"use strict";

const db = require("../db.js");
const bcrypt = require("bcrypt");
const { sqlForPartialUpdate } = require("../helpers/sql.js");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError.js");

const { BCRYPT_WORK_FACTOR } = require("../config.js");



class User {
    /** authenticate user with (username, password)
     * 
     * Returns { username, display_name, email, is_admin }
     * 
     * Throws UnauthorizedError if user is not found or wrong password
     */
    static async authenticate(username, password) {
        // try to find the user first
        const result = await db.query(
            `SELECT username,
                    password,
                    display_name AS "displayName",
                    email,
                    is_admin AS "isAdmin"
            FROM users
            WHERE username = $1`,
        [username],
        );

        const user = result.rows[0];

        if (user) {
            // compare hashed password to a new hash from password
            const isValid = await bcrypt.compare(password, user.password);
            if (isValid === true) {
                delete user.password;
                return user;
            }
        }

        throw new UnauthorizedError("Invalid username/password");
    }

    /** Register user with data { username, password, displayName, email, isAdmin }
     * 
     * Returns { username, displayName, email, isAdmin }
     * 
     * Throws BadRequestError on duplicates
     */
    static async register({ username, password, displayName, email, isAdmin }) {
        const duplicateCheck = await db.query(
            `SELECT username
             FROM users
             WHERE username = $1`,
            [username],
        );

        if(duplicateCheck.rows[0]) {
            throw new BadRequestError(`Duplicate username: ${username}`);
        }

        const hashPass = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

        const result = await db.query(
            `INSERT INTO users
             (username,
              password,
              display_name,
              email,
              is_admin)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING username, display_name AS "displayName", email, is_admin AS "isAdmin"`,
            [
                username,
                hashPass,
                displayName,
                email,
                isAdmin,
            ],
        );

        const user = result.rows[0];

        return user;
    }

    /** Find all users
     * 
     * Returns [{ username, display_name, email, is_admin }, ...]
     */

    static async findAll() {
        const result = await db.query(
            `SELECT username,
                    display_name AS "displayName",
                    email,
                    is_admin AS "isAdmin"
             FROM users
             ORDER BY username`,
        );

        return result.rows;
    }

    /** Returns data about user from username
     * 
     * Returns { username, display_name, is_admin, posts}
     * 
     * where posts is [{post_id, username, title, content, time_posted}]
     * 
     * Throws NotFoundError if user not found
     */

    static async get(username) {
        const userRes = await db.query(
            `SELECT username,
                    display_name AS "displayName",
                    email,
                    is_admin AS "isAdmin"
             FROM users
             WHERE username = $1`,
             [username],
        );

        const user = userRes.rows[0];

        if(!user) throw new NotFoundError(`No user: ${username}`);

        return user;
    }

    /** Update user data with `data`.
     *
     * This is a "partial update" --- it's fine if data doesn't contain
     * all the fields; this only changes provided ones.
     *
     * Data can include:
     *   { firstName, lastName, password, email, isAdmin }
     *
     * Returns { username, firstName, lastName, email, isAdmin }
     *
     * Throws NotFoundError if not found.
     *
     * WARNING: this function can set a new password or make a user an admin.
     * Callers of this function must be certain they have validated inputs to this
     * or a serious security risks are opened.
     */
  
    static async update(username, data) {
      if (data.password) {
        data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
      }
  
      const { setCols, values } = sqlForPartialUpdate(
          data,
          {
            displayName: "display_name",
            isAdmin: "is_admin",
          });
      const usernameVarIdx = "$" + (values.length + 1);
  
      const querySql = `UPDATE users 
                        SET ${setCols} 
                        WHERE username = ${usernameVarIdx} 
                        RETURNING username,
                                  display_name AS "displayName",
                                  email,
                                  is_admin AS "isAdmin"`;
      const result = await db.query(querySql, [...values, username]);
      const user = result.rows[0];
  
      if (!user) throw new NotFoundError(`No user: ${username}`);
  
      delete user.password;
      return user;
    }

    /** 
     * Returns usernames this user follows
     */
    static async getFollowing(username) {
        const userRes = await db.query(
            `SELECT username
             FROM users
             WHERE username = $1`,
             [username],
        );

        const user = userRes.rows[0];

        if(!user) throw new NotFoundError(`No user: ${username}`);

        const following = await db.query(
            `SELECT user_followed AS "userFollowed"
             FROM follows
             WHERE user_following = $1`,
             [username],
        );

        let usernames = following.rows.map(u => u.userFollowed);
        
        return usernames;
    }

    /**
     * Returns usernames this user is followed by
     */
    static async getFollowers(username) {
        const userRes = await db.query(
            `SELECT username
             FROM users
             WHERE username = $1`,
             [username],
        );

        const user = userRes.rows[0];

        if(!user) throw new NotFoundError(`No user: ${username}`);

        const followers = await db.query(
            `SELECT user_following AS "userFollowing"
             FROM follows
             WHERE user_followed = $1`,
             [username],
        );

        let usernames = followers.rows.map(u => u.userFollowing);
        
        return usernames;
    }

    /** Returns posts this user has liked
     * 
     * Returns [{postId, username, title, content, time_posted}, ...]
     */
    static async getLikes(username) {
        const userRes = await db.query(
            `SELECT username
             FROM users
             WHERE username = $1`,
             [username],
        );

        const user = userRes.rows[0];

        if(!user) throw new NotFoundError(`No user: ${username}`);
        
        const likesRes = await db.query(
            `SELECT l.post_id AS "id",
                    p.username AS "username",
                    p.content AS "content",
                    p.time_posted AS "timePosted"
             FROM likes l
             JOIN posts p
             ON (p.id = l.post_id)
             WHERE l.username = $1`,
             [username],
        );
        
        const likes = likesRes.rows;

        return likes;
    }

    /** Likes a user's post */

    static async likePost(username, postId) {
        const userRes = await db.query(
            `SELECT username
             FROM users
             WHERE username=$1`,
             [username],
        );
        const user = userRes.rows[0];

        if (!user) throw new NotFoundError(`No username: ${username}`);

        const postRes = await db.query(
            `SELECT id
             FROM posts
             WHERE id = $1`,
             [postId],
        );
        const post = postRes.rows[0];

        if (!post) throw new NotFoundError(`No post with id: ${postId}`);

        const id = await db.query(
            `INSERT INTO likes (username, post_id)
             VALUES ($1, $2)
             RETURNING post_id AS "postId"`,
             [username, postId],
        );

        return id.rows[0];
    }

    /** Likes a user's post */

    static async unLikePost(username, postId) {
        
        const userRes = await db.query(
            `SELECT username
             FROM users
             WHERE username=$1`,
             [username],
        );
        const user = userRes.rows[0];

        if (!user) throw new NotFoundError(`No username: ${username}`);

        const postRes = await db.query(
            `SELECT id
             FROM posts
             WHERE id = $1`,
             [postId],
        );
        const post = postRes.rows[0];

        if (!post) throw new NotFoundError(`No post with id: ${postId}`);
        
        const id = await db.query(
            `DELETE FROM likes
             WHERE username = $1
             AND post_id = $2
             RETURNING post_id AS "postId"`,
             [username, postId],
        );

        return id.rows[0];
    }

    /** Follows a user
     * 
     * username1 follows username2
    */

    static async followUser(username1, username2) {
        const user1Res = await db.query(
            `SELECT username
             FROM users
             WHERE username=$1`,
             [username1],
        );
        const user1 = user1Res.rows[0];

        if (!user1) throw new NotFoundError(`No username: ${username1}`);

        const user2Res = await db.query(
            `SELECT username
             FROM users
             WHERE username=$1`,
             [username2],
        );
        const user2 = user2Res.rows[0];

        if (!user2) throw new NotFoundError(`No username: ${username2}`);

        const followed = await db.query(
            `INSERT INTO follows (user_following, user_followed)
             VALUES ($1, $2)
             RETURNING user_followed AS "userFollowed"`,
             [username1, username2],
        );
        
        return followed.rows[0];
    }

    /** Unfollows a user
     * 
     * returns { unfollowed: username }
     */
    
    static async unFollowUser(username1, username2) {
        const user1Res = await db.query(
            `SELECT username
             FROM users
             WHERE username=$1`,
             [username1],
        );
        const user1 = user1Res.rows[0];

        if (!user1) throw new NotFoundError(`No username: ${username1}`);

        const user2Res = await db.query(
            `SELECT username
             FROM users
             WHERE username=$1`,
             [username2],
        );
        const user2 = user2Res.rows[0];

        if (!user2) throw new NotFoundError(`No username: ${username2}`);
        
        const unFollow = await db.query(
            `DELETE FROM follows
             WHERE user_following = $1
             AND user_followed = $2
             RETURNING user_followed AS "userUnfollowed"`,
             [username1, username2],
        );
        
        return unFollow.rows[0];
    }

    /** Deletes a user
     * 
     * returns { deleted: username }
     */

    static async remove(username) {

        const userCheck = await db.query(
            `SELECT username
             FROM users
             WHERE username = $1`,
             [username]
        );

        const user = userCheck.rows[0];

        if(!user) { throw new NotFoundError(`No user with username: ${username}`) }

        const deleted = await db.query(
            `DELETE FROM users
             WHERE username = $1
             RETURNING username`,
             [username],
        );

        return {deleted: deleted.rows[0].username}
    }
}

module.exports = User;