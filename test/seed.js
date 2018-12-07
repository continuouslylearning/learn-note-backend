const usersData = [
  { id: 1000, name: 'Name', email: 'random@email.com', password: 'secret1000' },
  { id: 2000, name: 'AnotherName', email: 'different@email.com', password: 'notsosecret'}
];

const foldersData = [
  { id: 3000, title: 'Python', userId: 1000 },
  { id: 3001, title: 'Javascript', userId: 1000 },
  { id: 3002, title: 'Java', userId: 1000 },
  { id: 3003, title: 'Algorithms', userId: 1000 },
  { id: 3004, title: 'Java', userId: 2000 },
  { id: 3005, title: 'Algorithms', userId: 2000 },
];

const topicsData = [
  { id: 4000, title: 'Node', parent: 3001, userId: 1000 },
  { id: 4001, title: 'ES6', parent: 3001, userId: 1000 },
  { id: 4002, title: 'Spring', parent: 3002, userId: 1000 },
  { id: 4003, title: 'Java8', parent: 3002, userId: 1000 },
  { id: 4004, title: 'Binary search tree', parent: 3003, userId: 1000 },
  { id: 4005, title: 'Sort algorithms', parent: 3003, userId: 1000 },
  { id: 4006, title: 'Object oriented programming', parent: 3004, userId: 2000 },
  { id: 4007, title: 'Search algorithms', parent: 3005, userId: 2000 }
];

const resourcesData = [
  { parent: 4000, title: 'Resource #1', uri: 'uri #1', completed: false, userId: 1000 },
  { parent: 4000, title: 'Resource #2', uri: 'uri #2', completed: false, userId: 1000 },
  { parent: 4001, title: 'Resource #3', uri: 'uri #3', completed: false, userId: 1000 },
  { parent: 4001, title: 'Resource #4', uri: 'uri #4', completed: false, userId: 1000 },
  { parent: 4002, title: 'Resource #5', uri: 'uri #5', completed: false, userId: 1000 },
  { parent: 4002, title: 'Resource #6', uri: 'uri #6', completed: false, userId: 1000 },
  { parent: 4003, title: 'Resource #7', uri: 'uri #7', completed: false, userId: 1000 },
  { parent: 4003, title: 'Resource #8', uri: 'uri #8', completed: false, userId: 1000 },
  { parent: 4004, title: 'Resource #9', uri: 'uri #9', completed: false, userId: 1000 },
  { parent: 4004, title: 'Resource #10', uri: 'uri #10', completed: false, userId: 1000 },
  { parent: 4005, title: 'Resource #11', uri: 'uri #11', completed: false, userId: 1000 },
  { parent: 4005, title: 'Resource #12', uri: 'uri #12', completed: false, userId: 1000 },
  { parent: 4001, title: 'Resource #13', uri: 'uri #13', completed: false, userId: 1000 },
  { parent: 4002, title: 'Resource #14', uri: 'uri #14', completed: false, userId: 1000 },
  { parent: 4003, title: 'Resource #15', uri: 'uri #15', completed: false, userId: 1000 }
];

module.exports = {
  usersData, 
  foldersData, 
  topicsData, 
  resourcesData
};