# General

### Pagination
All the "List" calls accept a `limit` param, together with `page` OR `offset` params.

`GET /users?limit=10&page=3`
will return the same docs as:
`GET /users?limit=10&offset=20`


### OrderBy parameters
`orderby` parameters accept a comma-separated list of sort keys. Each key sorts ascending by default, but may be reversed with the `desc` modifier, separated from the key with a space. Example usage for listing users:
`GET /users?orderBy=nodeCount desc,name`
This will put users with more nodes first, and then users with the same number of nodes sorted by name.

### Parameters / Input
Parameters are appended to the query string with a `?`:
`OPERATION /path?key1=value1&key2=value2`
Inputs are passed in the body as an object:
`OPERATION /path`, Body: `{ key1: value1, key2: value2 }`

### Nested data

Collaborator, Change, Commit, and Node are all nested inside each other. So when getting or listing them it makes sense to be able to specify their parents in the path. For example:


`GET /change/:change_id`
can also be: `GET /commit/:commit_id/change/:change_id`
or: `GET /node/:node_id/commit/:commit_id/change/:change_id`
or: `GET /tree/:tree_id/node/:node_id/commit/:commit_id/change/:change_id`


# User
```
{
  Username: string,
  Password: string,
  Roles: enum{ADMIN, MODERATOR}[],
  Nodes: Node[],
  Creation: Date,
  LastOnline: Date,
  banned: boolean,
  active: boolean
}
```

### List users
`GET /users`

##### Parameters:
Name|Type|Notes
--- | --- | ---
active | boolean | default: true
banned | boolean | default: true
orderby | string | valid keys: username, creation, nodeCount, lastOnline


### Get one user
#### By id:
`GET /user/:user_id`
#### By name:
`GET /user`
##### Parameters:
Name|Type|Notes
--- | --- | ---
name | string

### Update
`PATCH /user/:user_id`

##### Input:
Name|Type|Notes
--- | --- | ---
roles | string[]
lastOnline | Date
banned | boolean
active | boolean

### Create
`POST /users`


##### Input:
Name|Type|Notes
--- | --- | ---
username | string | **required**
password | string | **required**
active | boolean | default: false
roles | string[]

### Delete
`DELETE /user/:user_id`


# Video Data
```
{
  Name: string,
  Description: string,
  Duration: number,
  Url: string,
  Creation: Date,
  SubtitleTrees: SubtitleTree[]
}
```

### List videos
`GET /videos`

##### Parameters:
Name|Type|Notes
--- | --- | ---
orderby | string | valid keys: name, creation, subtitleTreeCount, duration

### Get one video
##### By id:
`GET /video/:video_id`
##### By name:
`GET /video`
##### Parameters:
Name|Type|Notes
--- | --- | ---
name | string

### Update
`PATCH /video/video_id`

##### Input:
Name|Type|Notes
--- | --- | ---
name | string |
description | string
duration | string
url | string


### Create
`POST /videos`

##### Input:
Name|Type|Notes
--- | --- | ---
name | string | **required**
description | string
duration | string | **required**
url | string


### Delete
`DELETE /video/video_id`

# SubtitleTree
```
{
  Creation: Date,
  Description: string,
  Language: string,
  Subtitle: Subtitle,
  Nodes: Node[]
}
```
### Get one Subtitle Tree
`GET /tree/:tree_id`

### List Subtitle Trees
`GET /trees`

##### Parameters:
Name|Type|Notes
--- | --- | ---
language | string
orderby | string | valid keys: creation, nodeCount

### Create
`POST /trees`

##### Input:
Name|Type|Notes
--- | --- | ---
language | string | **required**
description | string

Will create a node with an empty parentless commit inside as shown bellow, as to ensure a parentless commit is not accidentally created in any other way:
```
{
    collaborators: [],
    status: "APPROVED",
    commits: [{
        creation: { ...DateObj... },
        description: "",
        parent: null,
        comments: [],
        changes: []
    }]
}
```

### Delete
`DELETE /tree/:tree_id`

# Subtitle
```
{
  Lines:SubtitleLine[]
}
```
### Get one Subtitle
`GET /subtitle/:subtitle_id`

Deleting a tree also deletes all the nodes inside, and by extension all the commits, comments, changes, and collaborators.

### Create
`POST /subtitles`

##### Input:
Name|Type|Notes
--- | --- | ---
lines | Object[] | Example: `[{startTime: 0:00:05, endTime: 0:00:06, text: "Hi..."}, {startTime: 0:00:06, endTime: 0:00:07, text: "This is an example", positionY: 0.5}]`

### Delete
`DELETE /subtitle/:subtitle_id`

# SubtitleLine
```
{
  StartTime:number,
  EndTime:number,
  Text:string,
  PositionX:number,
  PositionY:number
}
```

No queries for Subtitle Line.

# Node
```
{
  Collaborators: Collaborator[],
  Status: enum{UNMODIFIED, IN_PROGRESS, FINISHED, APPROVED, MERGED},
  Deleted: boolean,
  Commits: Commit[]
}
```

### List nodes
`GET /nodes`
(and nested paths)

##### Parameters:
Name|Type|Notes
--- | --- | ---
orderby | string | valid keys: status, deleted, collaboratorCount, commitCount


### Get one node
`GET /node/:node_id`
(and nested paths)

### Update
`PATCH /node/:node_id`
(and nested paths)

##### Input:
Name|Type|Notes
--- | --- | ---
status | string
deleted | boolean

### Create
`POST /trees/:tree_id/nodes/`

`status` is `UNMODIFIED` by default. Assigning `MERGED` status is only through the merge query.

### Merge nodes
`POST trees/:tree_id/nodes/:node_id/merge/:target_node_id`

Target node must be approved otherwise 400 Bad Request.

# Commit
```
{
  Creation: Date,
  Description: string,
  Parent: Commit,
  IsMergeCommit: boolean,
  Comments: Comment[],
  Changes: Change[]
}
```

### List Commits
`GET /commits`
(and nested paths)

##### Parameters:
Name|Type|Notes
--- | --- | ---
orderby | string | valid keys: creation, isMergeCommit, commentCount, changeCount

### Get one commit
`GET /commit/:commit_id`
(and nested paths)



### Update
`PATCH /commit/:commit_id`
(and nested paths)

##### Input:
Name|Type|Notes
--- | --- | ---
description | string


### Create
`POST /node/:node_id/commit`
(and nested paths)

##### Input:
Name|Type|Notes
--- | --- | ---
description | string |
partent | string | **required**

# Change
```
{
  SubtitleLineIds: ObjectId[]
  User: User,
  Type: enum{CREATE, EDIT, TIME_SHIFT, DELETE}
  Data: {
    StartTime: number,
    EndTime: number,
    Text: string,
    Position: enum{TOP, BOTTOM}
  },
  Comments: Comment[]
}
```

### List changes

`GET /changes`
(and nested paths)

##### Parameters:
Name|Type|Notes
--- | --- | ---
orderby | string | valid keys: status, deleted, collaboratorCount, commitCount


### Get one change
`GET /change/:change_id`
(and nested paths)

### Create
`POST /commit/:commit_id/change`
(and nested paths)

##### Input:
Name|Type|Notes
--- | --- | ---
subtitleLineIds | string[] | **required**
user | string | **required**
type | string | **required**
data | Object | **required**


# Collaborator
```
{
  User: User,
  Creator: boolean
  Admin: boolean
  Banned: boolean
}
```
### Add a user as a collaborator
`PUT /nodes/:node_id/collaborators/:user_id`
(and nested paths)

##### Parameters:
Name|Type|Notes
--- | --- | ---
admin | boolean | default: false

Also adds the node in the user's node field.


### Update
`PATCH /collaborators/:collaborator_id`
(and nested paths)

##### Parameters:
Name|Type|Notes
--- | --- | ---
admin | boolean
banned | boolean

### Delete
`DELETE /nodes/:node_id/collaborators/:collaborator_id`
(and nested paths)

Also deletes the reference in the node.

# Comment
```
{
  Type: enum{COMMIT, CHANGE}
  Created: Date
  Author: User
  Content: string
}
```

### List comments

`GET /comments`
(and nested paths)

##### Parameters:
Name|Type|Notes
--- | --- | ---
orderby | string | valid keys: created, author, type


### Get one comment
`GET /comment/:comment_id`
(and nested paths)

### Create

##### On a change
`POST /change/:change_id/comment`
(and nested paths)
##### On a commit
`POST /commit/:commit_id/comment`
(and nested paths)

##### Input:
Name|Type|Notes
--- | --- | ---
author | string | **required**
content | string | **required**
