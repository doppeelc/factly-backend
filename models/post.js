
const { resourceLimits } = require("worker_threads");
const db = require("../db");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError.js");

class Post {
    /** creates a new post from data
     * 
     * returns {id, username, content, time_posted}
     */
    static async create({username, content}) {
        const res = await db.query(
            `INSERT INTO posts (
                    username,
                    content,
                    time_posted)
             VALUES ($1, $2, current_timestamp)
             RETURNING id, username, content, time_posted AS "timePosted"`,
             [username, content],
        );

        return res.rows[0];
    }

    /** gets all posts
     * 
     * returns [ {id, username, content, timePosted}, ... ]
     */
    static async findAll() {
        const postRes = await db.query(
            `SELECT id,
                    username,
                    content,
                    time_posted AS "timePosted"
             FROM posts
             ORDER BY time_posted DESC`,
        );

        const posts = postRes.rows;

        return posts;
    }

    /** gets all posts from people username follows
     * 
     * returns [ {id, username, content, timePosted}, ...]
     */
    static async getFollowingPosts(username) {
        const postRes = await db.query(
            `SELECT p.id,
                    p.username,
                    p.content,
                    p.time_posted AS "timePosted"
            FROM posts p
            JOIN follows f
            ON p.username = f.user_followed
            WHERE f.user_following = $1
            ORDER BY time_posted DESC`,
            [username],
        );

        const posts = postRes.rows;

        return posts;
    }

    /** gets posts from user
     * 
     * return [{id, username, content, time_posted}, ...]
     */

    static async getPostsFrom(username) {
        const postsRes = await db.query(
            `SELECT id,
                    username,
                    content,
                    time_posted AS "timePosted"
             FROM posts
             WHERE username = $1
             ORDER BY time_posted DESC`,
             [username],
        );

        const posts = postsRes.rows;

        return posts;
    }

    /** gets post by id
     * 
     * returns {id, username, content, time_posted}
     */
    static async get(id) {
        const postRes = await db.query(
            `SELECT id,
                    username,
                    content,
                    time_posted AS "timePosted"
            FROM posts
            WHERE id = $1`,
            [id],
        );

        const post = postRes.rows[0];

        if(!post) {
            throw new NotFoundError(`No such post: ${id}`, 404);
        }

        return post;
    }

    /** returns usernames of those who liked this post
     */
    static async getLikes(id) {
        const likesRes = await db.query(
            `SELECT username
             FROM likes
             WHERE post_id = $1`,
             [id],
        );

        const likes = likesRes.rows;

        const usernames = likes.map(user => user.username)

        return usernames;
    }

    /** deletes post by id
     */
    static async remove(id) {
        const res = await db.query(
            `DELETE FROM posts
             WHERE id = $1
             RETURNING id`,
             [id]
        );
        const deleted = res.rows[0];

        if(!deleted) throw new NotFoundError(`No post with id: ${id}`);

        return deleted.id;
    }
}

module.exports = Post;