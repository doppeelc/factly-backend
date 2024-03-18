"use strict";
/** Database setup for facts. */
const { Client } = require("pg");
const { getDatabaseUri } = require("./config");

let db;

if (process.env.NODE_ENV === "production") {
  db = new Client({
    connectionString: getDatabaseUri(),
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  db = new Client({
    connectionString: getDatabaseUri(),
  });
}
db.host = "localhost";
db.connectionParameters.host = "localhost";

db.connect();

module.exports = db;