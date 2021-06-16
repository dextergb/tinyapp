/**-------------Modules and Helper Functions-------------**/

const PORT = 8080;
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");
const {
  urlsForUser,
  generateRandomString,
  getUserByEmail,
} = require("./helpers");

/**-------------Middleware-------------**/

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: "session",
    keys: ["key1", "key2"],
  })
);

/**-------------Global Variables-------------**/

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10),
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10),
  },
};

/**-------------GET Methods-------------**/

// Page to create a new shortURL
app.get("/urls/new", (req, res) => {
  const existingUser = users[req.session.user_id];
  if (existingUser) {
    const templateVars = { user: existingUser };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

// Page to edit shortURL
app.get("/urls/:shortURL", (req, res) => {
  const user = users[req.session["user_id"]];
  const checkLong = urlDatabase[req.params.shortURL];
  const userId = req.session.user_id;
  if (!user) {
    return res.status("401").send("Please Sign In To View This Page");
  } else if (checkLong.userID !== req.session["user_id"]) {
    return res.status("401").send("Not Authorized");
  } else {
    let emailPass = user.email;
    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      email: emailPass,
      user: users[userId],
    };
    res.render("urls_show", templateVars);
  }
});

// Access urlDatabase in JSON format
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Dynamic page to view, edit, and delete URLs
app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  const templateVars = {
    urls: urlsForUser(userId, urlDatabase),
    user: users[userId],
  };
  if (userId) {
    res.render("urls_index", templateVars);
  } else {
    res.status("401").send("Please Sign In To View This Page");
  }
});

// Redirect each created shortURL
app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  if (urlDatabase[shortURL]) {
    let longURL = urlDatabase[shortURL].longURL;
    res.redirect(`${longURL}`);
  } else {
    res.status("404").send("Not Found");
  }
});

// Redirect based on whether currently logged in
app.get("/", (req, res) => {
  const userId = req.session.user_id;
  if (userId) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

// Page to login
app.get("/login", (req, res) => {
  const userId = req.session.user_id;
  const templateVars = {
    user: users[req.session.user_id],
  };
  if (userId) {
    res.redirect("/urls");
    return;
  }
  res.render("login", templateVars);
});

// Page to create account
app.get("/register", (req, res) => {
  const userId = req.session.user_id;
  const templateVars = {
    user: users[req.session.user_id],
  };
  if (userId) {
    res.redirect("/urls");
  }
  res.render("register", templateVars);
});

/**-------------POST Methods-------------**/

// Submit register information
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const id = generateRandomString();
  const user = { id, email, password: hashedPassword };

  if (Object.values(req.body).some((value) => value === "")) {
    return res.status(400).send("Email and Password Cannot Be Empty");
  }
  if (getUserByEmail(email, users)) {
    return res.status(400).send("Email Already Used");
  }
  users[id] = user;
  req.session.user_id = id;
  res.redirect("/urls");
});

// Submit login information
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (Object.values(req.body).some((value) => value === "")) {
    return res.status(400).send("Email and Password Cannot Be Empty");
  }
  if (!getUserByEmail(email, users)) {
    return res.status(403).send("Email Cannot Be Found");
  }
  const userFromDatabase = getUserByEmail(email, users);
  if (!bcrypt.compareSync(password, userFromDatabase.password)) {
    return res.status(403).send("Incorrect Password");
  }
  req.session.user_id = userFromDatabase.id;
  res.redirect("/urls");
});

// Submit delete shortURL request
app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user_id) {
    if (urlDatabase[req.params.shortURL].userID === req.session.user_id) {
      const shortURL = req.params.shortURL;
      delete urlDatabase[shortURL];

      res.redirect("/urls");
    } else {
      res.redirect("/login");
    }
  } else {
    res.redirect("/login");
  }
});

// Submit urls shortURL request
app.post("/urls/:id", (req, res) => {
  let { longURL } = req.body;
  if (req.session.user_id) {
    if (urlDatabase[req.params.id].userID === req.session.user_id) {
      urlDatabase[req.params.id].longURL = longURL;
      res.redirect("/urls");
    } else {
      res.redirect("/login");
    }
  } else {
    res.redirect("/login");
  }
});

// Submit a new shortURL
app.post("/urls", (req, res) => {
  if (req.session.user_id) {
    let shortURL = generateRandomString();
    let { longURL } = req.body;
    urlDatabase[shortURL] = {
      longURL,
      userID: req.session.user_id,
    };
    res.redirect(`/urls/${shortURL}`);
  } else {
    return res.status(400).send("Could not create URL");
  }
});

// Logout and clear all cookies
app.post("/logout", (req, res) => {
  req.session = null;
  res.clearCookie("user_id");
  res.redirect("/login"); // Compass says redirect to "/url" but that doesn't make sense
});

// Notifies server is activated
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});
