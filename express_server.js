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
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
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
  const templateVars = {
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("register", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
  };
  res.render("urls_show", templateVars);
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_index", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = `http://${urlDatabase[req.params.shortURL]}`;
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
  users[id] = user;
  const templateVars = { email };
  console.log("email: ", email, "password: ", password, "id: ", id);

  if (Object.values(req.body).some((value) => value === "")) {
    res.status(400).send("Email and Password Cannot Be Empty");
  }

  res.cookie("user_id", id);
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  res.cookie("username", req.body.login);
  console.log("cookie:", req.body.login);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/register");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  console.log("deleted");
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// POST route that updates a URL resource
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.editURL;
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});
