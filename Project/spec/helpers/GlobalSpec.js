const app = require('../../app');
const http = require('http');
const port = 3001;
app.set('port', port);
jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
var cmd = require('node-cmd');

var server = http.createServer(app);

var stopDocker = function(callback) {
  console.log('##################### Stopping docker-container ...');
  cmd.get('docker rm antidoteClientProject -f', function() {
    console.log('##################### Docker-container stopped ...');
    callback();
  });
};

var runDocker = function(callback) {
  console.log('##################### Restarting docker-container ...');
  cmd.run('docker-compose up');
  setTimeout(function() {
    console.log('##################### Docker-container restarted ...');
    callback();
  }, 5000);
};

beforeAll(function(done) {
  stopDocker(function() {
    runDocker(done);
  });
});

beforeEach(function(done) {
  server.listen(port);
  done();
});

afterEach(function(done) {
  server.close(done);
});

afterAll(function(done) {
  stopDocker(done);
});
