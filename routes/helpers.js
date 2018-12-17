/**
 * Given the object to modify, adds the parent field OR null
 * @param {{}} obj
 * @param {number} id
 * @param {string} title
 */
const appendParent = (obj, id, title) => {
  if (id && title) {
    obj.parent = { id, title };
  } else obj.parent = null;
};

module.exports = {
  appendParent
};
