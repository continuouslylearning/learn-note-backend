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

## Status Codes

| Status Code  | Meaning |
| ------------- | ------------- |
| 200  | The GET request for the resource was successful  |
| 201  | The request to create, update or delete the resource was successful and the resource was returned in the response  |
| 204  | The request to create, update or delete the resource was successful but content was not returned in the response  |
| 400  | The request cannot be processed because of a client error. The request is missing a required field or an invalid value was provided for a field |
| 401  | The email & password combination provided for login or the authentication token provided in a request for a resource is invalid |
| 404  | The requested resource does not exist or does not belong to the user who made the request 
