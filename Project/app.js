'use strict';

const antidote = require('antidote_ts_client');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const bodyParser = require('body-parser');
const compression = require('compression');
const helmet = require('helmet');

const conf = require('./config');

const app = express();

function log(...args) {
  console.log(...args);
}

app.use(helmet());
app.use(compression()); // Compress all routes
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);
app.use(cookieParser());
app.use('/', express.static(__dirname));
app.use(express.static(path.join(__dirname, 'css')));
app.use(express.static(path.join(__dirname, 'js')));
app.use(express.static(path.join(__dirname, 'img')));
app.use(express.static(path.join(__dirname, 'data')));

// Initialize Antidote clients
var atdClient = antidote.connect(
  conf.antidote.port,
  conf.antidote.host
);

/* Static web page routing. */
var staticRouter = express.Router();

staticRouter.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.use('/', staticRouter);

/* API routing. */
var apiRouter = express.Router();

// Counter API
apiRouter
  .route('/count/:counter_id')
  .get(function(req, res) {
    var counterId = req.params.counter_id;
    var lastCommitTimestamp = atdClient.getLastCommitTimestamp();
    log('### Last commit: ', lastCommitTimestamp);
    atdClient
      .counter(counterId)
      .read()
      .then(content => {
        log('### Get', counterId, 'from replica');
        log('### content', JSON.stringify(content));
        res.json({
          status: 'OK',
          cont: content
        });
      })
      .catch(function(error) {
        console.log('Antidote error: ' + error);
      });
  })
  .put(function(req, res) {
    var counterId = req.params.counter_id;
    atdClient.update(atdClient.counter(counterId).increment(1)).then(() => {
      //log('Increment', counterId, 'on replica', repId);
      res.json({
        status: 'OK'
      });
    });
  })
  .delete(function(req, res) {
    var counterId = req.params.counter_id;
    atdClient.update(atdClient.counter(counterId).increment(-1)).then(() => {
      //log('Decrement', counterId, 'on replica', repId);
      res.json({
        status: 'OK'
      });
    });
  });

// Set API
apiRouter
  .route('/set/:set_id')
  .get(function(req, res) {
    var setId = req.params.set_id;
    atdClient
      .set(setId)
      .read()
      .then(content => {
        log('### Get set', setId);
        res.json({ status: 'OK', cont: content });
      });
  })
  .put(function(req, res) {
    log(JSON.stringify(req.params));
    log(JSON.stringify(req.body));
    var setId = req.params.set_id;
    var value = req.body.value;
    atdClient.update(atdClient.set(setId).add(value)).then(resp => {
      log('Add', value, 'to', setId);
      res.json({ status: 'OK' });
    });
  })
  .delete(function(req, res) {
    var setId = req.params.set_id;
    var value = req.body.value;
    atdClient.update(atdClient.set(setId).remove(value)).then(resp => {
      log('Remove', value, 'from', setId);
      res.json({ status: 'OK' });
    });
  });

app.use('/api', apiRouter);

module.exports = app;
