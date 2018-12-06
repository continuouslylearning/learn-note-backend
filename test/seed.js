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
  { title: 'Node', parent: 3001, userId: 1000 },
  { title: 'ES6', parent: 3001, userId: 1000 },
  { title: 'Spring', parent: 3002, userId: 1000 },
  { title: 'Java8', parent: 3002, userId: 1000 },
  { title: 'Binary search tree', parent: 3003, userId: 1000 },
  { title: 'Sort algorithms', parent: 3003, userId: 1000 },
  { title: 'Object oriented programming', parent: 3004, userId: 2000 },
  { title: 'Search algorithms', parent: 3005, userId: 2000 }
];


module.exports = {
  usersData, 
  foldersData, 
  topicsData
};