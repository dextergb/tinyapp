const urlsForUser = function (id, urlDatabase) {
  let userDatabase = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userDatabase[url] = urlDatabase[url];
    }
  }
  return userDatabase;
};

const getUserByEmail = function (email, database) {
  for (id of Object.keys(database)) {
    if (database[id].email === email) {
      return database[id];
    }
  }
  return null;
};

function generateRandomString() {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let string = "";
  for (let i = 0; i <= 5; i++) {
    string += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return string;
}

module.exports = { urlsForUser, generateRandomString, getUserByEmail };
