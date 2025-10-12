require('dotenv').config();

const express = require("express");
const http = require("http");
const mongoose = require('mongoose');
const cors = require('cors');

const { setupWebsocket } = require('./websocket');
const docsRouter = require('./controllers/docsController');
const authRouter = require('./controllers/authController');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/docs', docsRouter);
app.use('/api/auth', authRouter);

const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

// Setup Yjs websocket server and persistence
setupWebsocket(server); // see websocket.js

// Connect to mongoose and then to server
mongoose.connect(process.env.MONGOURI).then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
  });
});