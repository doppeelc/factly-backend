\echo 'Delete and recreate facts db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE facts;
CREATE DATABASE facts;
\connect facts

\i facts-schema.sql
\i facts-seed.sql

\echo 'Delete and recreate facts_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE facts_test;
CREATE DATABASE facts_test;
\connect facts_test

\i facts-schema.sql
