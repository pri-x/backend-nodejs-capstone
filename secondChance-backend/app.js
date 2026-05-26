/*jshint esversion: 8 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pinoLogger = require('./logger');

const connectToDatabase = require('./models/db');
const {loadData} = require("./util/import-mongo/index");

const app = express();
app.use("*",cors());
const port = 3060;

connectToDatabase().then(() => {
    pinoLogger.info('Connected to DB');
})
    .catch((e) => console.error('Failed to connect to DB', e));

app.use(express.json());

// authRoutes Step 2: import the authRoutes
const authRoutes = require('./routes/authRoutes');

// Items API Task 1: import the secondChanceItemsRoutes
const secondChanceItemsRoutes = require('./routes/secondChanceItemsRoutes');

// Search API Task 1: import the searchRoutes
const searchRoutes = require('./routes/searchRoutes');

const pinoHttp = require('pino-http');
const logger = require('./logger');

app.use(pinoHttp({ logger }));

// authRoutes
app.use('/api/auth', authRoutes);

// Items API
app.use('/api/secondchance/items', secondChanceItemsRoutes);

// Search API
app.use('/api/secondchance/search', searchRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Internal Server Error');
});

app.get("/",(req,res)=>{
    res.send("Inside the server")
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
