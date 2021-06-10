const urlsForUser = function (id) {
  let userDatabase = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userDatabase[url] = urlDatabase[url];
      // userDatabase[url] = {
      //   longURL: urlDatabase[url].longURL,
      // };
    }
  }
  return userDatabase;
};

const getUserByEmail = function (email) {
  for (id of Object.keys(users)) {
    if (users[id].email === email) {
      return users[id];
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
