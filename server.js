const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const passport = require("passport");
const cookieSession = require("cookie-session");
const helmet = require("helmet");
require('dotenv').config();

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

const allowedOrigins = (process.env.ADMIN_FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    const normalizedOrigin = origin?.replace(/\/$/, '');
    if (!origin || allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
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

// Serve static files (uploads)
const path = require("path");
app.use(
  "/uploads",
  (req, res, next) => {
    // Uploaded images are intentionally embedded by the separately hosted frontend.
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "uploads"))
);

// routes
const routes = require("./app/routes");
app.use(routes);


// set port, listen for requests
const PORT = process.env.PORT || 8080;

const startServer = async () => {
  try {
    await db.sequelize.sync({ force: false });
    console.log('Database sync has been established successfully.');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}.`);
    });
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
};

startServer();

