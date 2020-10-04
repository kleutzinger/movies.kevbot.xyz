const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const axios = require('axios');
const PORT = process.env.PORT || 5000;
const app = express();
const _ = require('lodash');
const bodyParser = require('body-parser');
const morgan = require('morgan');

const path = require('path');
var fs = require('fs');
app.use(bodyParser.json());

// app.set('view engine', 'pug');
var cors = require('cors');
app.use(cors());
app.use(express.static('static'));
app.use(morgan('tiny'));

const server = app.listen(PORT, () => {
  console.log('server at http://localhost:' + PORT);
});

// const { apiRouter, get_upload_history } = require('./api.js');
// app.use('/api', apiRouter);

app.get('/', async function(req, res, next) {
  try {
    res.json('resp to be here');
  } catch (error) {
    next(error);
  }
});
