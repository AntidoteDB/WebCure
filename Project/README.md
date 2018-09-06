Tested with Travis: 
[![Build Status](https://travis-ci.com/red17electro/MasterThesis.svg?token=rP4eqxmTqQ9TJrEQ14nv&branch=master)](https://travis-ci.com/red17electro/MasterThesis)

# Documentation 

## Install the docker-image with 'no-cert' flag

First of all, build the docker-image by moving to the `docker-container` folder and running there the following command:

`docker build . -t antidotedb/antidote:nocert`

## Run the docker container

In order to run the docker container, please type the following command in the root folder of the project:
`docker-compose up`

## Run the server & application served by nodeJS

Open the terminal and run the command:

`npm start`

The application now should be available under `http://localhost:3000`
