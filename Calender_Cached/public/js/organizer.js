// this file is responsible for executing the http-requests.
/*jshint esversion: 6 */
var disconneted = false;
function getCurrentDate() { // returns the current Date and Time used in comments
    var date = new Date();
    var month = (date.getMonth() + 1) < 10 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1);
    var day = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
    var hour = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
    var min = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
    var sec = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
    return date.getFullYear() + "." + month + "." + day + ", " + hour + ":" + min + ":" + sec;

}

function serverRequest(requestUrl, value, success) { // skeleton for performing http-request
    // requestUrl = route defined in api.js
    // value = json object storing necessary information
    // success = callback function executed if the request was successful
    xhr = new XMLHttpRequest();
    var url = requestUrl;
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function () { // if result is available
        if (xhr.readyState == 4 && xhr.status == 200) { // and request was successful,
            var json = JSON.parse(xhr.responseText);
            success(json); // // invoke 'success' function with json-result as parameter
        }
    };
    var data = JSON.stringify(value);
    xhr.send(data); // send server request
}

function disableConnection()
{
    serverRequest("/api/" + 0 + "/disconnectNetwork", {
        }, function (json) { 
            consoleAdd(0, "Successfully disconnected the interdc network: " + json.result);
			$('#lblConnectMsg').text('Disconnecting...');
			$('#lblConnectMsg').css( "visibility", "visible" );
			$( "#lblConnectMsg" ).css("background-color","#ff4d4d");
			$("#lblConnectMsg").show().delay(5000).fadeOut( "slow", function(){
				freezeSecondCalendar();
			});
			
        });
}
 
function freezeSecondCalendar()
{
	disconneted = true;
    $('#calendar1TopGroup').fadeTo('slow',.6);
	$('#calendar1TopGroup').append('<div id = "tempDivCalendar1Top" style="position: absolute;top:0;left:0;width: 100%;height:100%;z-index:2;opacity:0.3;filter: alpha(opacity = 80)"></div>');
	$('#calendar1BottomGroup').fadeTo('slow',.6);
	$('#calendar1BottomGroup').append('<div id = "tempDivCalendar1Bottom" style="position: absolute;top:0;left:0;width: 100%;height:100%;z-index:2;opacity:0.3;filter: alpha(opacity = 80)"></div>');
}

function unfreezeSecondCalendar()
{
	$('#calendar1TopGroup').css('opacity','1.0');
	$('#calendar1TopGroup').css('filter','alpha(opacity = 0)');
	$('#calendar1BottomGroup').css('opacity','1.0');
	$('#calendar1BottomGroup').css('filter','alpha(opacity = 0)');
    $('#tempDivCalendar1Top').remove();
	$('#tempDivCalendar1Bottom').remove();
	disconneted = false;
}

function enableConnection()
{
    serverRequest("/api/" + 0 + "/connectNetwork", {
        }, function (json) { 
            consoleAdd(0, "Successfully connected the interdc network: " + json.result);
			$('#lblConnectMsg').text('Connecting...');
			$('#lblConnectMsg').css( "visibility", "visible" );
			$( "#lblConnectMsg" ).css("background-color","#5cd65c");
			$("#lblConnectMsg").show().delay(10000).fadeOut( "slow", function(){
				unfreezeSecondCalendar();
			});
			
        });
}

function addNewParticipant(event) { // send addParticipant request
    let calendarId = parseInt(event.target.id.match(/\d/)[0]);
    consoleAdd(calendarId, "send AddNewParticipant Request");
    let val;

    // if the event is triggered by key 
    if (event.keyCode == 13) {
        val = document.getElementById(event.target.id).value;
    } else { // if the event is triggered by button
        val = document.getElementById("newParticipant-" + calendarId).value;
    }

    if (val == "") {
        consoleAdd(calendarId, "Participant name cannot be empty!");
    } else {
        serverRequest("/api/" + calendarId + "/addParticipant", {
            name: val
        }, function (json) { // "val" covers the new participant name
            consoleAdd(calendarId, "addNewParticipant: " + json.result); // on success, client logs information
            getUpdates(calendarId); // client requests new data, if request was successful
        });
    }
    $('#newParticipant-' + calendarId).val(""); //clear textBox, where participant was inserted
}

function removeParticipant(calendarId) { // send removeParticipant request
    consoleAdd(calendarId, "Remove Participant " + currentParticipant);
    serverRequest("/api/" + calendarId + "/removeParticipant", {
        participant: currentParticipant
    }, function (json) {
        consoleAdd(calendarId, "removeParticipant: " + json.result);
        getUpdates(calendarId); // get updates from server, after request was successful
    });
}

function editAppointment(dom) { // send editAppointment request. This is NOT invoked after solving conflicts
    let calendarId = parseInt(dom.id.match(/\d/)[0]);
    consoleAdd(calendarId, "Current ID for editing: " + currentID);
    var newApp = getAppointmentFromForm(calendarId);
    newApp = getChanges(newApp, currentEvent);
    newApp.id = currentID; // set aId depending on the current selected appointment
    serverRequest("/api/" + calendarId + "/editAppointment", {
        id: currentID,
        app: newApp,
        calendar: currentCalendar,
        comment: getCurrentDate() + ": edited by " + currentParticipant
    }, function (json) {
        consoleAdd(calendarId, "editAppointment: " + json.result);
        clearForm([calendarId]); // clear inputForm
        getUpdates(calendarId); //request new updates
        closeAppForm();
    });
}

function removeAppointment(dom) { // send removeAppointment request
    let calendarId = parseInt(dom.id.match(/\d/)[0]);
    consoleAdd(calendarId, "Current ID for deleting: " + currentID);
    serverRequest("/api/" + calendarId + "/removeAppointment", {
        id: currentID
    }, function (json) {
        consoleAdd(calendarId, "removeAppointment: " + json.result);
        clearForm([calendarId]);
        getUpdates(calendarId);
        closeAppForm();
    });
}

function addAppointment(dom) { // send addAppointment request 
    let calendarId = parseInt(dom.id.match(/\d/)[0]);
    if (currentParticipant == "" || (typeof currentParticipant == "undefined") || $('#iname-' + calendarId).val() == "") {
        alert("Calendar name, title and participants should be filled out!");
        return;
    }
    var app = getAppointmentFromForm(calendarId);
    app.comments = [getCurrentDate() + ": created by " + currentParticipant];
    serverRequest("/api/" + calendarId + "/addAppointment", {
        calendar: currentCalendar,
        appointment: app
    }, function (json) {
        consoleAdd(calendarId, "addAppointment: " + json.result);
        clearForm([calendarId]);
        getUpdates(calendarId);
        currentID = ""; //after an new appointment was created, set currentID to empty.
        // otherwise you could modify an "old" appointment
        closeAppForm();
    });
}

function closeAppForm(){
    let $spans = $('#close-1, #close-2');	
    $spans.each(function (i, elem){
        $(elem).click();
    });
}

function addComment(event) { // send addComment request
    let calendarId = parseInt(event.target.id.match(/\d/)[0]);
    var val = document.getElementById("iCommentInput-" + calendarId).value;
    $('#iCommentInput-' + calendarId).val("");
    if (val == "") {
        consoleAdd(calendarId, "Comment cannot be empty!");
    } else {
        consoleAdd(calendarId, "New Comment: " + val);
    }
    serverRequest("/api/" + calendarId + "/addComment", {
        id: currentID,
        comment: getCurrentDate() + ", " + currentParticipant + ": " + val
    }, function (json) {
        consoleAdd(calendarId, "addComment: " + json.result);
        getUpdates(calendarId);
    });
}

function solveAppointment(dom) { // after the "right" value versions were selected, a editAppointment request is performed
    let calendarId = parseInt(dom.id.match(/\d/)[0]);
    consoleAdd(calendarId, "Solving conflict as 'editNewAppointment' with " + currentID);
    var app = getAppointmentFromChooseForm(calendarId);
    app.id = currentID; // set aId depending on the current selected appointment
    serverRequest("/api/" + calendarId + "/editAppointment", {
        id: currentID,
        app: app,
        calendar: currentCalendar,
        comment: getCurrentDate() + ": conflict solved by " + currentParticipant
    }, function (json) {
        consoleAdd(calendarId, "editAppointment: " + json.result);
        clearForm([calendarId]); // empty inputForm
        getUpdates(calendarId); //request Updates
    });
    // show Inputform here as well, because this request can last some time!
    showInput(calendarId); //  show default inputForm instead of chooseForm
    clearForm([calendarId]); // empty inputForm
}

function getUpdates(calendarId) { // request new calendar data from the server
    if (typeof calendarId === "object"){
        calendarId = parseInt(calendarId.id.match(/\d/)[0]);
    }
    consoleAdd(calendarId, "update request");
    var selectedParticipants = getSelectedParticipants(calendarId);
    serverRequest("/api/" + calendarId + "/update", {
        participant: currentParticipant,
        calendar: currentCalendar
    }, function (json) {
        setParticipants(calendarId, json.participants);
        setSelectedParticipants(calendarId, selectedParticipants);
        setEvents(calendarId, json.apps);
    });
}

function consoleAdd(calendarId, text) { // add come text to the 'console'. This is useful for debugging client
    let $console = $('#console-' + calendarId);
    $console.val($console.val() + "\n" + text);
}


function getChanges(editedEvent, currentEvent) { //compare appointment and changed appointment for changes since only them are
    // sent to the server
    var result = {};
    if (editedEvent.title != currentEvent.title)
        result.title = editedEvent.title;
    if (editedEvent.description != currentEvent.description)
        result.description = editedEvent.description;
    if (new Date(editedEvent.start).getTime() !== new Date(currentEvent.start).getTime())
        result.start = editedEvent.start;
    if (new Date(editedEvent.end).getTime() !== new Date(currentEvent.end).getTime())
        result.end = editedEvent.end;
    if (editedEvent.priority != currentEvent.priority)
        result.priority = editedEvent.priority;
    if (editedEvent.allDay != currentEvent.allDay)
        result.allDay = editedEvent.allDay;

    result.addedParticipants = []; // instead of 'selectedParticipants' we add 'removed/added Participants'
    // see 'Obstacles' in Bachelor thesis
    result.removedParticipants = [];
    for (var p in participantsList) {
        var name = participantsList[p];
        if (editedEvent.participants.includes(name) && !currentEvent.participants.includes(name))
            result.addedParticipants.push(name);
        if (!editedEvent.participants.includes(name) && currentEvent.participants.includes(name))
            result.removedParticipants.push(name);
    }
    return result;
}


function setEvents(calendarId, events) { // set events to fullCalendar.
    let $calendar = $('#calendar-' + calendarId);
    $calendar.fullCalendar('removeEventSources');
    source.events = [];
    $calendar.fullCalendar('addEventSource', source);
    for (var i = 0; i < events.length; i++) {
        var app = events[i];
        if ("conflict" in app) { //true: app has conflict flag and app, else only the properties
            app.backgroundColor = "red";
        }
        source.events.push(events[i]);
        if (app.id == currentID) {
            setEventToForm(calendarId, app);
        }
    }
    $calendar.fullCalendar('addEventSource', source);
}