# learn-note-backend

## Endpoints 

```
.
└── /auth
    └── POST
        ├── /refresh
        └── /login
/api
.
├── /users
│   └── POST
├── /folders
│   ├── GET
│   │   └── /
│   ├── POST
│   │   └── /
│   ├── PUT
│   │   └── /:id
│   └── DELETE
│       └── /:id
├── /topics
│   ├── GET
│   │   └── /
│   ├── POST
│   │   └── /
│   ├── PUT
│   │   └── /:id
│   └── DELETE
│       └── /:id
└── /resources
    ├── GET
    │   ├── / <- query params: { limit: int, orderby: last_opened }
    │   └── /:topicId 
    ├── POST
    │   └── / <- MUST specify topicId in body
    ├── PUT
    │   └── /:id
    └── DELETE
        └── /:id
```

## Data Model

```
Users {
  id: serial
  email: string
  password: string
  name: string
}

Folders {
  id: serial
  user_id: foreign_key<users>
  title: string
  created_at: date
  updated_at: date
}

Folders-Topics {
  folder-id: foreign_key<folders>
  topic-id: foreign_key<topics>
}

Topics {
  id: serial
  user_id: foreign_key<users>
  title: string
  parent: foreign_key<folders> || null
  last_opened: date
  notebook: JSONB <- crazy object from QuillJS
  resourceOrder: JSONB <- [<resourceIds>]
  created_at: date
  updated_at: date
}

Resources {
  id: serial,
  parent: foreign_key<topics>
  title: string
  uri: string
  last_opened: date <- managed by the front-end sending a PUT request to the resource
}
```
