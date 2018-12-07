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
    │   ├── / <- query params: { limit: int, orderby: lastOpened }
    │   └── /:topicId <- this is technically the `parent` field
    ├── POST
    │   └── / <- MUST specify parent in body
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
  userId: userId
  title: string
  createdAt: date
  updatedAt: date
}

Topics {
  id: serial
  userId: userId
  title: string
  parent: folderId || null <- returns { id, title } at endpoint
  notebook: JSONB <- crazy object from QuillJS
  resourceOrder: JSONB <- [<resourceIds>]
  createdAt: date
  updatedAt: date
}

Resources {
  id: serial
  parent: topicId
  title: string
  uri: string
  completed: bool
  lastOpened: date <- managed by the front-end sending a PUT request to the resource
}
```
