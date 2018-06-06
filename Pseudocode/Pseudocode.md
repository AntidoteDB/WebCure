# Pseudocode 

#### Initial state 

```pseudocode
if the main database is not empty:
    Process the data from the main database 
if the temp database is not empty:
	Process the data from the temp database 

Dispay processed data in the UI

Send GET-request to receive states[values + metadata] from the server
	if the response is successful:
		for every i in updates 
			if (updates[i].timestamp is later than latest timestamp on a client)
				Process received data and show changes in the UI // (*)
				Store newly received data to the main database

Send POST-request with data (operations) from the temp database to the server
	if the response is successful:
		Update main database with received data along with timestamps
		Clean temp database
	else 
		Try to send the request to the server again
```

###### Comments in the code:

At the point, which marked as (*), it is not clear, what should be done with temp data:**

* Try to show newly received data from the server along with data in main database & temp database; 
* Show only newly received data along with the data from the main database and add changes from temp data base only after it was sent to the server, where it was successfully applied.

#### Adding data through the Client

````pseudocode
Add an event listener to the 'submit' button

if input is not empty and button was pressed:
	Send POST-request with data (operations) to the server
		if the response is successful:
			Update the main database with received data along with timestamps
			Update the UI
		else:
			Add the entry to the temporary database
			Update the UI
````

#### Client is offline

````pseudocode
if the main database is not empty:
	Process the data from the main database
if the temp database is not empty:
	Process the data from the temp database
	
Display processed data in the UI
````

