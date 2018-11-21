## Running Instructions

#### Prerequisites 

To be able to run the application, you have to install `nodejs` and `Docker`.

#### Installing the packages

After performing steps above, open a terminal in the folder `calender-app\Application` and install latest node packages. To do that, run in that folder the command: 

````terminal 
npm i
````

#### Running docker containers

Once it is done, we can start docker containers by running in the same folder the following command:

````terminal 
docker-compose up
````

#### Running the application

After this process is finished, to start the application open a different terminal and under the same folder `calender-app\Application` run the command:

````terminal 
npm start
````

The application is going to be available under

````terminal
localhost:3000
````

Both calendars there are connected to different antidote servers.

Afterwards, follow the instructions in the application to find out how to use it. 

#### Resetting the database state

In order to reset the state of the database, run the command:

```` terminal 
docker-compose down
````

#### Hints

- The synchronization of data centers can last some seconds, so do not wonder if the updates from DC1 do not occur in DC2 immediately. The same is valid for conflicts as well.
- **For Windows users:** in case of an error happening during the execution of `link.sh`, change line break types from `Windows` to `Unix` (It is convenient to do that in `Notepad++`).