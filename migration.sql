DROP TABLE users;

CREATE TABLE users (
  id SERIAL PRIMARY KEY, 
  username VARCHAR,
  password VARCHAR
);
