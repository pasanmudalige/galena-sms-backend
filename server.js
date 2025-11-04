const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const passport = require("passport");
const cookieSession = require("cookie-session");
const helmet = require("helmet");
require('dotenv').config();
const config = require('./environmentUtils');

const app = express();

app.use(
  cookieSession({
    name: "session",
    keys: ["cyberwolve"],
    maxAge: 24 * 60 * 60 * 100
  })
);

app.use(passport.initialize());
app.use(passport.session());

const corsOptions = {
  origin: [process.env.ADMIN_FRONTEND_URL],
  credentials: true, 
};


app.use(cors(corsOptions));
// app.use(cors({
//   origin: 'http://localhost:9000', // or use '*' for all origins (not recommended for production)
//   credentials: true, // if using cookies or HTTP auth
// }))

// parse requests of content-type - application/json
app.use(express.json({ limit: '100mb' }));

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ limit: '100mb', extended: true }));

app.use(fileUpload());

// database

const db = require("./app/models");
const constants = require("./app/constants/constants");
const Role = db.role;

db.sequelize.sync().then(() => {
  console.log('DB Sync has been established successfully.');
})
  .catch(err => {
    console.error('DB Sync failed with:', err.toString());
  });

// force: true will drop the table if it already exists
db.sequelize.sync({force: false}).then(() => {
  console.log('Drop and Resync Database with { force: true }');
  // initial();
});


app.use(helmet.frameguard({ action: "SAMEORIGIN" }));

app.use(helmet());

const header = helmet.contentSecurityPolicy({
  directives: {
    "default-src": ["'self'", `${process.env.ADMIN_FRONTEND_URL} *`],
    "img-src": ["'self'", `${process.env.AWS_STORAGE} *`],
    "script-src": ["'self'", "'data:'", process.env.ADMIN_FRONTEND_URL],
    blockAllMixedContent: [], // Compliant
    frameAncestors: [process.env.ADMIN_FRONTEND_URL] // Compliant
  },
  reportOnly: false,
});

app.use(header);

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Node JS application." });
});

// routes
const routes = require("./app/routes");
app.use(routes);


// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

