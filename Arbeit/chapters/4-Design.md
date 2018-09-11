In this chapter, we are going to describe the design part of the solution.

First of all, let us briefly describe the main components:

Web Application

This is a client application, which runs in the web-browser and supports interactive commands performed by user. It sits on top of the database layer. 

These are the supported commands:

read(key) - asynchrounous function that pulls database changes with respect to the key that was passed.

update(key, op) - asynchronous function that processes user-made update:

key - the key, which is going to be updated;

op - the operation, which is going to be performed on the key;

param - any additional parameters that might be needed;

In relation to the database, it is stores user - made operations on CRDT-states for a specific key.

Server

It is a configured AntidoteDB server that supports the following scenarios:

- receiving an array of operations performed on a CRDT-object according to the key.
- applying received operations on the server;
- sending back to the client the state of requested CRDT-object / objects according to their state on the server;
- sending back states of all stored CRDT-objects, if a specific object was not asked for; 