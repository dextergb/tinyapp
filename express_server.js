const express = require("express");
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { response, request } = require("express");

const app = express();
app.set("view engine", "ejs");

//middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

const userUrls = function (id) {
  let userDatabase = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userDatabase[url] = {
        longURL: urlDatabase[url].longURL,
      };
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
  const existingUser = users[req.cookies["user_id"]];
  if (existingUser) {
    const templateVars = { user: existingUser };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
  };
  res.render("login", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("register", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  if (req.cookies["user_id"]) {
    const shortURL = req.params.shortURL;
    const templateVars = {
      shortURL,
      longURL: urlDatabase[shortURL].longURL,
      user: req.cookies["user_id"],
    };
    res.render("urls_show", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls", (req, res) => {
  if (req.cookies["user_id"]) {
    const templateVars = {
      urls: userUrls(req.cookies["user_id"]),
      user: req.cookies["user_id"],
    };
    res.render("urls_index", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  if (!longURL) {
    return res.status("404").send("Not Found");
  }
  res.redirect(longURL);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const id = generateRandomString();
  const user = { id, email, password };

  const templateVars = { email };
  console.log("email: ", email, "password: ", password, "id: ", id);

  if (Object.values(req.body).some((value) => value === "")) {
    return res.status(400).send("Email and Password Cannot Be Empty");
  }
  if (getUserByEmail(email)) {
    return res.status(400).send("Email Already Used");
  }

  users[id] = user;

  res.cookie("user_id", id);
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const templateVars = { email };
  // console.log("email: ", email, "password: ", password, "id: ", id);

  if (Object.values(req.body).some((value) => value === "")) {
    return res.status(400).send("Email and Password Cannot Be Empty");
  }
  if (!getUserByEmail(email)) {
    return res.status(403).send("Email Cannot Be Found");
  }
  const userFromDatabase = getUserByEmail(email);
  if (userFromDatabase.password !== password) {
    return res.status(403).send("Incorrect Password");
  }

  res.cookie("user_id", userFromDatabase.id);
  console.log("cookie:", userFromDatabase.id);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/register");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  console.log("deleted");
  if (req.cookies["user_id"]) {
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
  urlDatabase[req.params.id].longURL = longURL;
  console.log("Long URL: ", longURL, "urlDatabase: ", urlDatabase);
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  let shortURL = generateRandomString();
  let { longURL } = req.body;
  urlDatabase[shortURL] = {
    longURL,
    userID: req.cookies["user_id"],
  };
  console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});
