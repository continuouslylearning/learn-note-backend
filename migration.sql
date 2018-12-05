DROP TABLE users;

CREATE TABLE users (
  id serial PRIMARY KEY, 
  name varchar NOT NULL,
  password varchar NOT NULL,
  email varchar NOT NULL UNIQUE
);
