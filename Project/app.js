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

/* API routing. */
var apiRouter = express.Router();

var setTheTimestamp = function(timestamp, update_clock) {
  if (timestamp && timestamp.data && timestamp.data !== 'null') {
    timestamp = bytebuffer.fromBase64(timestamp.data);
    console.log(timestamp);
    atdClient.monotonicSnapshots = true;
    atdClient.setLastCommitTimestamp(timestamp);
    atdClient.update_clock = update_clock;
  }
};

// Counter API+
apiRouter.route('/count/:counter_id/timestamp').put(async function(req, res, next) {
  try {
    var counterId = req.params.counter_id;
    var timestamp = req.body.timestamp;
    var update_clock = req.body.update_clock;

    setTheTimestamp(timestamp, update_clock);

    let tx = await atdClient.startTransaction();
    let counter = tx.counter(counterId);
    let val = await counter.read();
    await tx.commit();

    if (!update_clock) {
      atdClient.update_clock = true;
    }

    res.json({
      status: 'OK',
      cont: val,
      lastCommitTimestamp: atdClient.getLastCommitTimestamp().toBase64()
    });
  } catch (error) {
    next(error);
  }
});

apiRouter.route('/count_sync/:counter_id').put(async function(req, res, next) {
  try {
    var counterId = req.params.counter_id;
    var lastCommitTimestamp = req.body.lastCommitTimestamp;
    var updates = req.body.updates;

    setTheTimestamp(lastCommitTimestamp, false);
    let tx = await atdClient.startTransaction();
    let counter = tx.counter(counterId);

    var antidoteUpdates = [];
    updates.forEach(element => {
      antidoteUpdates.push(counter.increment(element));
    });

    await tx.update(antidoteUpdates);
    await tx.commit();
    atdClient.update_clock = true;

    res.json({
      status: 'OK',
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
      setTheTimestamp(lastCommitTimestamp, false);

      let tx = await atdClient.startTransaction();
      let counter = tx.counter(counterId);

      await tx.update(counter.increment(1));
      await tx.commit();
      atdClient.update_clock = true;
      res.json({
        status: 'OK',
        lastCommitTimestamp: atdClient.getLastCommitTimestamp().toBase64()
      });
    } catch (error) {
      next(error);
    }
  })
  .delete(async function(req, res, next) {
    try {
      var counterId = req.params.counter_id;
      var lastCommitTimestamp = req.body.lastCommitTimestamp;
      setTheTimestamp(lastCommitTimestamp, false);

      let tx = await atdClient.startTransaction(false);
      let counter = tx.counter(counterId);

      await tx.update(counter.increment(-1));
      await tx.commit();
      res.json({
        status: 'OK',
        lastCommitTimestamp: atdClient.getLastCommitTimestamp().toBase64()
      });
    } catch (error) {
      next(error);
    }
  });

// Set API

apiRouter.route('/set/:set_id/timestamp').put(async function(req, res, next) {
  try {
    var setId = req.params.set_id;
    var timestamp = req.body.timestamp;
    var update_clock = req.body.update_clock;

    setTheTimestamp(timestamp, update_clock);

    let tx = await atdClient.startTransaction();
    let set = tx.set(setId);
    let val = await set.read();
    await tx.commit();

    if (!update_clock) {
      atdClient.update_clock = true;
    }

    res.json({
      status: 'OK',
      cont: val,
      lastCommitTimestamp: atdClient.getLastCommitTimestamp().toBase64()
    });
  } catch (error) {
    next(error);
  }
});

apiRouter.route('/set_sync/:set_id').put(async function(req, res, next) {
  try {
    var setId = req.params.set_id;
    var lastCommitTimestamp = req.body.lastCommitTimestamp;
    var updates = req.body.updates;

    console.log(updates);
    console.log(lastCommitTimestamp);
    setTheTimestamp(lastCommitTimestamp, false);
    let tx = await atdClient.startTransaction();
    let set = tx.set(setId);

    var antidoteUpdates = [];
    updates.forEach(element => {
      if (element.type === 'add') {
        antidoteUpdates.push(set.add(element.value));
      } else if (element.type === 'remove') {
        antidoteUpdates.push(set.remove(element.value));
      }
    });

    await tx.update(antidoteUpdates);
    await tx.commit();
    atdClient.update_clock = true;

    res.json({
      status: 'OK',
      lastCommitTimestamp: atdClient.getLastCommitTimestamp().toBase64()
    });
  } catch (error) {
    next(error);
  }
});

apiRouter
  .route('/set/:set_id')
  .put(async function(req, res, next) {
    try {
      var setId = req.params.set_id;
      var lastCommitTimestamp = req.body.lastCommitTimestamp;
      setTheTimestamp(lastCommitTimestamp, false);

      var value = req.body.value;

      let tx = await atdClient.startTransaction();
      let set = tx.set(setId);

      await tx.update(set.add(value));
      await tx.commit();
      atdClient.update_clock = true;
      res.json({
        status: 'OK',
        lastCommitTimestamp: atdClient.getLastCommitTimestamp().toBase64()
      });
    } catch (error) {
      next(error);
    }
  })
  .delete(async function(req, res, next) {
    try {
      var setId = req.params.set_id;
      var lastCommitTimestamp = req.body.lastCommitTimestamp;
      setTheTimestamp(lastCommitTimestamp, false);

      var value = req.body.value;

      let tx = await atdClient.startTransaction();
      let set = tx.set(setId);

      await tx.update(set.remove(value));
      await tx.commit();
      atdClient.update_clock = true;
      res.json({
        status: 'OK',
        lastCommitTimestamp: atdClient.getLastCommitTimestamp().toBase64()
      });
    } catch (error) {
      next(error);
    }
  });

// MVR API
apiRouter.route('/mvr/:mvr_id/timestamp').put(async function(req, res, next) {
  try {
    var mvrId = req.params.mvr_id;
    var timestamp = req.body.timestamp;
    var update_clock = req.body.update_clock;

    setTheTimestamp(timestamp, update_clock);

    let tx = await atdClient.startTransaction();

    let mvr = tx.multiValueRegister(mvrId);
    let val = await mvr.read();
    await tx.commit();

    if (!update_clock) {
      atdClient.update_clock = true;
    }

    res.json({
      status: 'OK',
      cont: val,
      lastCommitTimestamp: atdClient.getLastCommitTimestamp().toBase64()
    });
  } catch (error) {
    next(error);
  }
});

apiRouter.route('/mvr_sync/:mvr_id').put(async function(req, res, next) {
  try {
    var mvrId = req.params.mvr_id;
    var lastCommitTimestamp = req.body.lastCommitTimestamp;
    var updates = req.body.updates;

    console.log(updates);
    console.log(lastCommitTimestamp);
    setTheTimestamp(lastCommitTimestamp, false);
    let tx = await atdClient.startTransaction();
    let mvr = tx.multiValueRegister(mvrId);

    var antidoteUpdates = [];

    updates.forEach(element => {
      if (element.type === 'assign') {
        antidoteUpdates.push(mvr.set(element.value));
      } else if (element.type === 'reset') {
        antidoteUpdates.push(mvr.set());
      }
    });

    await tx.update(antidoteUpdates);
    await tx.commit();
    atdClient.update_clock = true;

    res.json({
      status: 'OK',
      lastCommitTimestamp: atdClient.getLastCommitTimestamp().toBase64()
    });
  } catch (error) {
    next(error);
  }
});

apiRouter
  .route('/mvr/:mvr_id')
  .put(async function(req, res, next) {
    try {
      var mvrId = req.params.mvr_id;
      var lastCommitTimestamp = req.body.lastCommitTimestamp;
      setTheTimestamp(lastCommitTimestamp, false);

      var value = req.body.value;

      let tx = await atdClient.startTransaction();
      let mvr = tx.multiValueRegister(mvrId);

      await tx.update(mvr.set(value));
      await tx.commit();
      atdClient.update_clock = true;
      res.json({
        status: 'OK',
        lastCommitTimestamp: atdClient.getLastCommitTimestamp().toBase64()
      });
    } catch (error) {
      next(error);
    }
  })
  .delete(async function(req, res, next) {
    try {
      var mvrId = req.params.mvr_id;
      var lastCommitTimestamp = req.body.lastCommitTimestamp;
      setTheTimestamp(lastCommitTimestamp, false);

      let tx = await atdClient.startTransaction();
      let mvr = tx.multiValueRegister(mvrId);

      await tx.update(mvr.set());
      await tx.commit();
      atdClient.update_clock = true;
      res.json({
        status: 'OK',
        lastCommitTimestamp: atdClient.getLastCommitTimestamp().toBase64()
      });
    } catch (error) {
      next(error);
    }
  });

// Map API
/* apiRouter.route('/map/:map_id/timestamp').put(async function(req, res, next) {
  try {
    var mapId = req.params.map_id;
    var timestamp = req.body.timestamp;
    var update_clock = req.body.update_clock;

    setTheTimestamp(timestamp, update_clock);

    let tx = await atdClient.startTransaction();

    let map = tx.rrmap(mapId);
    let val = await map.read();
    await tx.commit();

    if (!update_clock) {
      atdClient.update_clock = true;
    }

    res.json({
      status: 'OK',
      cont: val,
      lastCommitTimestamp: atdClient.getLastCommitTimestamp().toBase64()
    });
  } catch (error) {
    next(error);
  }
}); */

/* apiRouter.route('/map_sync/:map_id').put(async function(req, res, next) {
  try {
    var mapId = req.params.map_id;
    var lastCommitTimestamp = req.body.lastCommitTimestamp;
    var updates = req.body.updates;

    console.log(updates);
    console.log(lastCommitTimestamp);
    setTheTimestamp(lastCommitTimestamp, false);
    let tx = await atdClient.startTransaction();
    let map = tx.rrmap(mapId);

    var antidoteUpdates = [];

    // TODO REDO
     updates.forEach(element => {
      if (element.type === 'assign') {
        antidoteUpdates.push(mvr.set(element.value));
      } else if (element.type === 'reset') {
        antidoteUpdates.push(mvr.set());
      }
    }); 

    await tx.update(antidoteUpdates);
    await tx.commit();
    atdClient.update_clock = true;

    res.json({
      status: 'OK',
      lastCommitTimestamp: atdClient.getLastCommitTimestamp().toBase64()
    });
  } catch (error) {
    next(error);
  }
}); */

/* apiRouter
  .route('/map/:map_id')
  .put(async function(req, res, next) {
    try {
      var mapId = req.params.map_id;
      var lastCommitTimestamp = req.body.lastCommitTimestamp;
      setTheTimestamp(lastCommitTimestamp, false);

      var value = req.body.value;

      let tx = await atdClient.startTransaction();
      let map = tx.rrmap(mapId);

      await tx.update(map.set(value));
      await tx.commit();
      atdClient.update_clock = true;
      res.json({
        status: 'OK',
        lastCommitTimestamp: atdClient.getLastCommitTimestamp().toBase64()
      });
    } catch (error) {
      next(error);
    }
  })
  .delete(async function(req, res, next) {
    try {
      var mapId = req.params.map_id;
      var lastCommitTimestamp = req.body.lastCommitTimestamp;
      setTheTimestamp(lastCommitTimestamp, false);

      let tx = await atdClient.startTransaction();
      let map = tx.rrmap(mapId);

      await tx.update(map.set());
      await tx.commit();
      atdClient.update_clock = true;
      res.json({
        status: 'OK',
        lastCommitTimestamp: atdClient.getLastCommitTimestamp().toBase64()
      });
    } catch (error) {
      next(error);
    }
  }); */

/*the below route will have the functionality to respond with a list of requested values to specific keys*/
/* apiRouter.route('/readAll').get(async function(req, res, next) {
  try {
    console.log('test');

    let counter1 = atdClient.counter('a');
    let counter2 = atdClient.counter('b');
    let r = atdClient.readBatch([counter1, counter2]);
    r.then(list => {
      res.json({
        status: 'OK',
        result: list
      });
    });
  } catch (error) {
    next(error);
  }
}); */

app.use('/api', apiRouter);

module.exports = app;
