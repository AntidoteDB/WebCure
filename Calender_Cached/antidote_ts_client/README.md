This is a JavaScript Client for [AntidoteDB](http://antidotedb.eu/).

# Installation

The library is available as an [npm package](https://www.npmjs.com/package/antidote_ts_client).
Run the following command to add it as a dependency to your project:

    npm install --save antidote_ts_client

# Documentation

Documentation is available at https://syncfree.github.io/antidote_ts_client/


# Development / Contributing

[![Build Status](https://travis-ci.org/SyncFree/antidote_ts_client.svg?branch=master)](https://travis-ci.org/SyncFree/antidote_ts_client)
  
To build and compile the library execute:

    npm install
    npm run compile
   
Tests are written in Mocha and can be found in `src/tests.ts`.
To execute the tests, start Antidote and then run the tests via npm: 

    # Start Antidote using Docker
    docker run -d --name antidote --restart always -p "4368:4368" -p "8085:8085" -p "8087:8087" -p "8099:8099" -p "9100:9100" -e NODE_NAME=antidote@127.0.0.1 mweber/antidotedb
    # Run Tests
    npm test
   
Feel free to open pull requests or open issues.