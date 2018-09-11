const app = require('../../app');
const http = require('http');
const port = 3001;
app.set('port', port);
jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;

var server = http.createServer(app);

beforeEach(function(done) {
  server.listen(port);
  done();
});

afterEach(function(done) {
  server.close(done);
});
