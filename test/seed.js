const usersData = [
  { id: 1000, name: 'Name', email: 'random@email.com', password: 'password' },
  {
    id: 2000,
    name: 'AnotherName',
    email: 'different@email.com',
    password: 'password'
  }
];

const foldersData = [
  { id: 3000, title: 'Python', userId: 1000 },
  { id: 3001, title: 'Javascript', userId: 1000 },
  { id: 3002, title: 'Java', userId: 1000 },
  { id: 3003, title: 'Algorithms', userId: 1000 },
  { id: 3004, title: 'Java', userId: 2000 },
  { id: 3005, title: 'Algorithms', userId: 2000 }
];

const topicsData = [
  {
    id: 4000,
    title: 'Node',
    parent: 3001,
    userId: 1000,
    resourceOrder: [1, 2]
  },
  { id: 4001, title: 'ES6', parent: 3001, userId: 1000, resourceOrder:[3,4,13] },
  { id: 4002, title: 'Spring', parent: 3002, userId: 1000, resourceOrder:[5,6,14] },
  { id: 4003, title: 'Java8', parent: 3002, userId: 1000, resourceOrder:[7,8,15]  },
  { id: 4004, title: 'Binary search tree', parent: 3003, userId: 1000, resourceOrder:[9,10]  },
  { id: 4005, title: 'Sort algorithms', parent: 3003, userId: 1000, resourceOrder:[11,12]  },
  {
    id: 4006,
    title: 'Object oriented programming',
    parent: 3004,
    userId: 2000
  },
  { id: 4007, title: 'Search algorithms', parent: 3005, userId: 2000 }
];

// EXPECT 'Resource #4' to be first when orderedBy=lastOpened
const resourcesData = [
  {
    id: 1
    parent: 4000,
    title: 'Resource #1',
    uri: '4DfzRRkiPX4',
    completed: false,
    userId: 1000,
    type: 'youtube',
    lastOpened: new Date(Date.now() - Math.random() * 100000000).toISOString()
  },
  {
    id: 2,
    parent: 4000,
    title: 'Resource #2',
    uri: 'B7hVxCmfPtM',
    completed: false,
    userId: 1000,
    type: 'youtube',
    lastOpened: new Date(Date.now() - Math.random() * 100000000).toISOString()
  },
  {
    id: 3,
    parent: 4001,
    title: 'Resource #3',
    uri: 'B7hVxCmfPtM',
    completed: false,
    userId: 1000,
    type: 'youtube',
    lastOpened: new Date(Date.now() - Math.random() * 100000000).toISOString()
  },
  {
    id: 4,
    parent: 4001,
    title: 'Resource #4',
    uri: 'B7hVxCmfPtM',
    completed: false,
    userId: 1000,
    type: 'youtube',
    lastOpened: new Date(Date.now()).toISOString()
  },
  {
    id: 5,
    parent: 4002,
    title: 'Resource #5',
    uri: 'https://medium.com/s/story/antitrusts-most-wanted-6c05388bdfb7',
    completed: false,
    userId: 1000,
    type: 'other',
    lastOpened: new Date(Date.now() - Math.random() * 100000000).toISOString()
  },
  {
    id: 6,
    parent: 4002,
    title: 'Resource #6',
    uri: 'https://react-redux.js.org/using-react-redux/connect-mapdispatch',
    completed: false,
    userId: 1000,
    type: 'other',
    lastOpened: new Date(Date.now() - Math.random() * 100000000).toISOString()
  },
  {
    id: 7,
    parent: 4003,
    title: 'Resource #7',
    uri: 'IhZkqUj0hRM',
    completed: false,
    userId: 1000,
    type: 'youtube',
    lastOpened: new Date(Date.now() - Math.random() * 100000000).toISOString()
  },
  {
    id: 8,
    parent: 4003,
    title: 'Resource #8',
    uri: 'https://knexjs.org/#Builder-join',
    completed: false,
    userId: 1000,
    type: 'other',
    lastOpened: new Date(Date.now() - Math.random() * 100000000).toISOString()
  },
  {
    id: 9,
    parent: 4004,
    title: 'Resource #9',
    uri: 'Vo27zNDDuw0',
    completed: false,
    userId: 1000,
    type: 'youtube',
    lastOpened: new Date(Date.now() - Math.random() * 100000000).toISOString()
  },
  {
    id: 10,
    parent: 4004,
    title: 'Resource #10',
    uri: 'VWHlPH23P-w',
    completed: false,
    userId: 1000,
    type: 'youtube',
    lastOpened: new Date(Date.now() - Math.random() * 100000000).toISOString()
  },
  {
    id: 11,
    parent: 4005,
    title: 'Resource #11',
    uri: 'https://expressjs.com/en/4x/api.html#req.query',
    completed: false,
    userId: 1000,
    type: 'other',
    lastOpened: new Date(Date.now() - Math.random() * 100000000).toISOString()
  },
  {
    id: 12,
    parent: 4005,
    title: 'Resource #12',
    uri: 'nOvclikfXZY',
    completed: false,
    userId: 1000,
    type: 'youtube',
    lastOpened: new Date(Date.now() - Math.random() * 100000000).toISOString()
  },
  {
    id: 13,
    parent: 4001,
    title: 'Resource #13',
    uri:
      'https://stackoverflow.com/questions/24253814/cant-select-an-existing-column-in-postgresql',
    completed: false,
    userId: 1000,
    type: 'other',
    lastOpened: new Date(Date.now() - Math.random() * 100000000).toISOString()
  },
  {
    id: 14,
    parent: 4002,
    title: 'Resource #14',
    uri: 'vorkmWa7He8',
    completed: false,
    userId: 1000,
    type: 'youtube',
    lastOpened: new Date(Date.now() - Math.random() * 100000000).toISOString()
  },
  {
    id: 15,
    parent: 4003,
    title: 'Resource #15',
    uri:
      'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now',
    completed: false,
    userId: 1000,
    type: 'other',
    lastOpened: new Date(Date.now() - Math.random() * 100000000).toISOString()
  }
];

module.exports = {
  usersData,
  foldersData,
  topicsData,
  resourcesData
};
