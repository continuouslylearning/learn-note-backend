const usersData = [
  { id: 1000, name: 'Name', email: 'random@email.com', password: 'secret1000' },
  { id: 2000, name: 'AnotherName', email: 'different@email.com', password: 'notsosecre'}
];

const foldersData = [
  { name: 'Python', userId: 1000 },
  { name: 'Javascript', userId: 1000 },
  { name: 'Java', userId: 1000 },
  { name: 'Algorithms', userId: 1000 },
  { name: 'Java', userId: 2000 },
  { name: 'Algorithms', userId: 2000 },
];

module.exports = {
  usersData, 
  foldersData
};