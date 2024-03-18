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
db.host = "dpg-cns95ov109ks73e3ovo0-a";
db.connectionParameters.host = "dpg-cns95ov109ks73e3ovo0-a";

db.connect();

module.exports = db;