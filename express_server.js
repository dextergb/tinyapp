const express = require("express");
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const { res, req } = require("express");

const bcrypt = require("bcrypt");

const {
  urlsForUser,
  generateRandomString,
  getUserByEmail,
} = require("./helpers");

const app = express();
app.set("view engine", "ejs");

//middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cookieSession({
    name: "session",
    keys: ["key1", "key2"],
  })
);

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

/*
* The order of route definitions matters!
* The GET /urls/new route needs to be defined before the GET /urls/:id route.
* Routes defined earlier will take precedence,
so if we place this route after the /urls/:id definition,
any calls to /urls/new will be handled by app.get("/urls/:id", ...)
because Express will think that new is a route parameter.
* A good rule of thumb to follow is that routes should be ordered from most specific to least specific.
*/

app.get("/urls/new", (req, res) => {
  const existingUser = users[req.session.user_id];
  if (existingUser) {
    const templateVars = { user: existingUser };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const userId = req.session.user_id;
  const templateVars = {
    shortURL,
    longURL: urlDatabase[shortURL].longURL,
    user: users[userId],
  };
  if (req.session.user_id) {
    res.render("urls_show", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  const templateVars = {
    urls: urlsForUser(userId, urlDatabase),
    user: users[userId],
  };
  if (userId) {
    res.render("urls_index", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL].longURL;
  if (!longURL) {
    return res.status("404").send("Not Found");
  }
  res.redirect(`http://${longURL}`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
  };
  res.render("login", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const id = generateRandomString();
  const user = { id, email, password: hashedPassword };

  const templateVars = { email };
  console.log("email: ", email, "password: ", hashedPassword, "id: ", id);

  if (Object.values(req.body).some((value) => value === "")) {
    return res.status(400).send("Email and Password Cannot Be Empty");
  }
  if (getUserByEmail(email, users)) {
    return res.status(400).send("Email Already Used");
  }

  users[id] = user;
  // console.log(res.req);
  req.session.user_id = id;

  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const templateVars = { email };
  console.log(users);

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

app.post("/urls/:shortURL/delete", (req, res) => {
  console.log("deleted");
  if (req.session.user_id) {
    const shortURL = req.params.shortURL;
    delete urlDatabase[shortURL];

    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

// POST route that updates a URL resource
app.post("/urls/:id", (req, res) => {
  let { longURL } = req.body;
  if (req.session.user_id) {
    urlDatabase[req.params.id].longURL = longURL;
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
  console.log("Long URL: ", longURL, "urlDatabase: ", urlDatabase);
});

app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  let shortURL = generateRandomString();
  let { longURL } = req.body;
  urlDatabase[shortURL] = {
    longURL,
    userID: req.session.user_id,
  };
  console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.clearCookie("user_id");
  res.redirect("/register");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
