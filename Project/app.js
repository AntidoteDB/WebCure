'use strict';

const antidote = require('./antidote_ts_client');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const bodyParser = require('body-parser');
const compression = require('compression');
const helmet = require('helmet');
const bytebuffer = require('bytebuffer');

const conf = require('./config');

const app = express();

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

// Counter API+
apiRouter.route('/count/:counter_id/timestamp').put(async function(req, res, next) {
  try {
    var counterId = req.params.counter_id;
    var timestamp = req.body.timestamp;

    if (timestamp !== 'null') {
      timestamp = bytebuffer.fromBase64(timestamp);
      atdClient.monotonicSnapshots = true;
      atdClient.setLastCommitTimestamp(timestamp);
      atdClient.update_clock = false;
    }

    let tx = await atdClient.startTransaction();
    let counter = tx.counter(counterId);
    let val = await counter.read();
    await tx.commit();
    atdClient.update_clock = true;

    res.json({
      status: 'OK',
      cont: val,
      lastCommitTimestamp: atdClient.getLastCommitTimestamp().toBase64()
    });
  } catch (error) {
    next(error);
  }
});

apiRouter.route('/count/:counter_id').get(async function(req, res, next) {
  try {
    var counterId = req.params.counter_id;

    let tx = await atdClient.startTransaction();
    let counter = tx.counter(counterId);
    let val = await counter.read();

    await tx.commit();
    res.json({
      status: 'OK',
      cont: val,
      lastCommitTimestamp: atdClient.getLastCommitTimestamp().toBase64()
    });
  } catch (error) {
    next(error);
  }
});

apiRouter
  .route('/count/:counter_id')
  .put(async function(req, res, next) {
    try {
      var counterId = req.params.counter_id;
      var lastCommitTimestamp = req.body.lastCommitTimestamp;
      if (lastCommitTimestamp) {
        lastCommitTimestamp = bytebuffer.fromBase64(lastCommitTimestamp.data);
        console.log(lastCommitTimestamp);
        atdClient.monotonicSnapshots = true;
        atdClient.setLastCommitTimestamp(lastCommitTimestamp);
        atdClient.update_clock = false;
      }

      let tx = await atdClient.startTransaction();
      let counter = tx.counter(counterId);

      await tx.update(counter.increment(1));
      await tx.commit();
      atdClient.update_clock = true;
      res.json({ status: 'OK' });
    } catch (error) {
      next(error);
    }
  })
  .delete(async function(req, res, next) {
    try {
      var counterId = req.params.counter_id;
      var lastCommitTimestamp = req.body.lastCommitTimestamp;

      if (lastCommitTimestamp) {
        lastCommitTimestamp = bytebuffer.fromBase64(lastCommitTimestamp.data);
        console.log(lastCommitTimestamp);
        atdClient.monotonicSnapshots = true;
        atdClient.setLastCommitTimestamp(lastCommitTimestamp);
      }

      let tx = await atdClient.startTransaction(false);
      let counter = tx.counter(counterId);

      await tx.update(counter.increment(-1));
      await tx.commit();
      res.json({ status: 'OK' });
    } catch (error) {
      next(error);
    }
  });

// Set API

apiRouter.route('/set/:set_id/timestamp').put(async function(req, res, next) {
  try {
    var setId = req.params.set_id;
    var timestamp = req.body.timestamp;

    if (timestamp !== 'null') {
      timestamp = bytebuffer.fromBase64(timestamp);
      atdClient.monotonicSnapshots = true;
      atdClient.setLastCommitTimestamp(timestamp);
      atdClient.update_clock = false;
    }

    let tx = await atdClient.startTransaction();
    let set = tx.set(setId);
    let val = await set.read();
    await tx.commit();
    atdClient.update_clock = true;

    res.json({
      status: 'OK',
      cont: val,
      lastCommitTimestamp: atdClient.getLastCommitTimestamp().toBase64()
    });
  } catch (error) {
    next(error);
  }
});

apiRouter
  .route('/set/:set_id')
  .get(async function(req, res, next) {
    try {
      var setId = req.params.set_id;

      let tx = await atdClient.startTransaction();
      let set = tx.set(setId);
      let val = await set.read();

      await tx.commit();
      res.json({
        status: 'OK',
        cont: val,
        lastCommitTimestamp: atdClient.getLastCommitTimestamp().toBase64()
      });
    } catch (error) {
      next(error);
    }
  })
  .put(async function(req, res, next) {
    try {
      var setId = req.params.set_id;
      var lastCommitTimestamp = req.body.lastCommitTimestamp;
      if (lastCommitTimestamp) {
        lastCommitTimestamp = bytebuffer.fromBase64(lastCommitTimestamp.data);
        console.log(lastCommitTimestamp);
        atdClient.monotonicSnapshots = true;
        atdClient.setLastCommitTimestamp(lastCommitTimestamp);
        atdClient.update_clock = false;
      }

      var value = req.body.value;

      let tx = await atdClient.startTransaction();
      let set = tx.set(setId);

      await tx.update(set.add(value));
      await tx.commit();
      atdClient.update_clock = true;
      res.json({ status: 'OK' });
    } catch (error) {
      next(error);
    }
  })
  .delete(async function(req, res, next) {
    try {
      var setId = req.params.set_id;
      var lastCommitTimestamp = req.body.lastCommitTimestamp;
      if (lastCommitTimestamp) {
        lastCommitTimestamp = bytebuffer.fromBase64(lastCommitTimestamp.data);
        console.log(lastCommitTimestamp);
        atdClient.monotonicSnapshots = true;
        atdClient.setLastCommitTimestamp(lastCommitTimestamp);
        atdClient.update_clock = false;
      }

      var value = req.body.value;

      let tx = await atdClient.startTransaction();
      let set = tx.set(setId);

      await tx.update(set.remove(value));
      await tx.commit();
      atdClient.update_clock = true;
      res.json({ status: 'OK' });
    } catch (error) {
      next(error);
    }
  });

app.use('/api', apiRouter);

module.exports = app;
