// Express app configuration
const express = require("express");
const swaggerUI = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const cors = require('cors');

const app = express();
app.use(express.json());

const allowedOrigins = [
  'http://localhost:4200',
  'https://janagam-community-web-test.vercel.app',
  'https://mala-jangam-community.vercel.app',
  
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerSpec));
app.use("/api", require("./routes/registration.routes"));

module.exports = app;
