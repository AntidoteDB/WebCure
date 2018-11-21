// this file is responsible for executing the http-requests.
/*jshint esversion: 6 */
var disconneted = false;
function getCurrentDate() {
  // returns the current Date and Time used in comments
  var date = new Date();
  var month =
    date.getMonth() + 1 < 10
      ? "0" + (date.getMonth() + 1)
      : date.getMonth() + 1;
  var day = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
  var hour = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
  var min =
    date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
  var sec =
    date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
  return (
    date.getFullYear() +
    "." +
    month +
    "." +
    day +
    ", " +
    hour +
    ":" +
    min +
    ":" +
    sec
  );
}

function serverRequest(requestUrl, value, success) {
  // skeleton for performing http-request
  // requestUrl = route defined in api.js
  // value = json object storing necessary information
  // success = callback function executed if the request was successful
  xhr = new XMLHttpRequest();
  var url = requestUrl;
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-type", "application/json");
  xhr.onreadystatechange = function() {
    // if result is available
    if (xhr.readyState == 4 && xhr.status == 200) {
      // and request was successful,
      var json = JSON.parse(xhr.responseText);
      success(json); // // invoke 'success' function with json-result as parameter
    }
  };
  var data = JSON.stringify(value);
  xhr.send(data); // send server request
}

function disableConnection() {
  serverRequest("/api/" + 0 + "/disconnectNetwork", {}, function(json) {
    $("#lblConnectMsg").text("Disconnecting...");
    $("#lblConnectMsg").css("visibility", "visible");
    $("#lblConnectMsg").css("background-color", "#ff4d4d");
    $("#lblConnectMsg")
      .show()
      .delay(5000)
      .fadeOut("slow", function() {
        freezeSecondCalendar();
      });
  });
}

function freezeSecondCalendar() {
  disconneted = true;
  $("#calendar1TopGroup").fadeTo("slow", 0.6);
  $("#calendar1TopGroup").append(
    '<div id = "tempDivCalendar1Top" style="position: absolute;top:0;left:0;width: 100%;height:100%;z-index:2;opacity:0.3;filter: alpha(opacity = 80)"></div>'
  );
  $("#calendar1BottomGroup").fadeTo("slow", 0.6);
  $("#calendar1BottomGroup").append(
    '<div id = "tempDivCalendar1Bottom" style="position: absolute;top:0;left:0;width: 100%;height:100%;z-index:2;opacity:0.3;filter: alpha(opacity = 80)"></div>'
  );
}

function unfreezeSecondCalendar() {
  $("#calendar1TopGroup").css("opacity", "1.0");
  $("#calendar1TopGroup").css("filter", "alpha(opacity = 0)");
  $("#calendar1BottomGroup").css("opacity", "1.0");
  $("#calendar1BottomGroup").css("filter", "alpha(opacity = 0)");
  $("#tempDivCalendar1Top").remove();
  $("#tempDivCalendar1Bottom").remove();
  disconneted = false;
}

function enableConnection() {
  serverRequest("/api/" + 0 + "/connectNetwork", {}, function(json) {
    $("#lblConnectMsg").text("Connecting...");
    $("#lblConnectMsg").css("visibility", "visible");
    $("#lblConnectMsg").css("background-color", "#5cd65c");
    $("#lblConnectMsg")
      .show()
      .delay(10000)
      .fadeOut("slow", function() {
        unfreezeSecondCalendar();
      });
  });
}

const requestUserSync = () => {
  navigator.serviceWorker.ready
    .then(function(swRegistration) {
      return swRegistration.sync.register("syncUserChanges");
    })
    .catch(function(error) {
      console.log(error);
    });
};

function addNewParticipant(event) {
  // send addParticipant request
  let calendarId = parseInt(event.target.id.match(/\d/)[0]);
  let val;

  // if the event is triggered by key
  if (event.keyCode == 13) {
    val = document.getElementById(event.target.id).value;
  } else {
    // if the event is triggered by button
    val = document.getElementById("newParticipant-" + calendarId).value;
  }

  /*
   * Subscribe for the sync event
   */

  if (val !== "") {
    requestUserSync();

    fetch(`${DBHelper.SERVER_URL}/api/${calendarId}/addParticipant`, {
      method: "POST",
      body: JSON.stringify({
        name: val
      }),
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      }
    })
      .then(function(response) {
        return response.json();
      })
      .then(function(json) {
        if (json.result) {
          console.log("Participant was successfully added!");
        }
        getUpdates(calendarId);
      })
      .catch(function(error) {
        DBHelper.crdtDBPromise.then(function(db) {
          if (!db) return;

          var index = db
            .transaction("participants-" + calendarId)
            .objectStore("participants-" + calendarId);

          return index.get("users").then(function(usersObject) {
            var tx = db.transaction("participants-" + calendarId, "readwrite");
            var store = tx.objectStore("participants-" + calendarId);

            var item = usersObject;

            Object.setPrototypeOf(item, SetCRDT.prototype);
            item.add(val);
            store.put(item);

            getUpdates(calendarId);
            return tx.complete;
          });
        });
      });
  }
  $("#newParticipant-" + calendarId).val(""); //clear textBox, where participant was inserted
}

function removeParticipant(calendarId) {
  if (currentParticipant !== "") {
    requestUserSync();

    fetch(`${DBHelper.SERVER_URL}/api/${calendarId}/removeParticipant`, {
      method: "POST",
      body: JSON.stringify({
        participant: currentParticipant
      }),
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      }
    })
      .then(function(response) {
        return response.json();
      })
      .then(function() {
        getUpdates(calendarId);
      })
      .catch(function(error) {
        DBHelper.crdtDBPromise.then(function(db) {
          if (!db) return;

          var index = db
            .transaction("participants-" + calendarId)
            .objectStore("participants-" + calendarId);

          return index.get("users").then(function(usersObject) {
            var tx = db.transaction("participants-" + calendarId, "readwrite");
            var store = tx.objectStore("participants-" + calendarId);

            var item = usersObject;

            Object.setPrototypeOf(item, SetCRDT.prototype);
            item.remove(currentParticipant);
            store.put(item);

            getUpdates(calendarId);
            return tx.complete;
          });
        });
        //log(`Failed to increment the id ${name.value}: ${error}`);
      });
  }
}

function editAppointment(dom) {
  // send editAppointment request. This is NOT invoked after solving conflicts
  let calendarId = parseInt(dom.id.match(/\d/)[0]);
  var newApp = getAppointmentFromForm(calendarId);
  newApp = getChanges(newApp, currentEvent);
  newApp.id = currentID; // set aId depending on the current selected appointment
  serverRequest(
    "/api/" + calendarId + "/editAppointment",
    {
      id: currentID,
      app: newApp,
      calendar: currentCalendar,
      comment: getCurrentDate() + ": edited by " + currentParticipant
    },
    function(json) {
      clearForm([calendarId]); // clear inputForm
      getUpdates(calendarId); //request new updates
      closeAppForm();
    }
  );
}

function removeAppointment(dom) {
  // send removeAppointment request
  let calendarId = parseInt(dom.id.match(/\d/)[0]);
  serverRequest(
    "/api/" + calendarId + "/removeAppointment",
    {
      id: currentID
    },
    function(json) {
      clearForm([calendarId]);
      getUpdates(calendarId);
      closeAppForm();
    }
  );
}

function addAppointment(dom) {
  // send addAppointment request
  let calendarId = parseInt(dom.id.match(/\d/)[0]);
  if (
    currentParticipant == "" ||
    typeof currentParticipant == "undefined" ||
    $("#iname-" + calendarId).val() == ""
  ) {
    alert("Calendar name, title and participants should be filled out!");
    return;
  }
  var app = getAppointmentFromForm(calendarId);
  app.comments = [getCurrentDate() + ": created by " + currentParticipant];
  serverRequest(
    "/api/" + calendarId + "/addAppointment",
    {
      calendar: currentCalendar,
      appointment: app
    },
    function(json) {
      clearForm([calendarId]);
      getUpdates(calendarId);
      currentID = ""; //after an new appointment was created, set currentID to empty.
      // otherwise you could modify an "old" appointment
      closeAppForm();
    }
  );
}

function closeAppForm() {
  let $spans = $("#close-1, #close-2");
  $spans.each(function(i, elem) {
    $(elem).click();
  });
}

function addComment(event) {
  // send addComment request
  let calendarId = parseInt(event.target.id.match(/\d/)[0]);
  var val = document.getElementById("iCommentInput-" + calendarId).value;
  $("#iCommentInput-" + calendarId).val("");
  serverRequest(
    "/api/" + calendarId + "/addComment",
    {
      id: currentID,
      comment: getCurrentDate() + ", " + currentParticipant + ": " + val
    },
    function(json) {
      getUpdates(calendarId);
    }
  );
}

function solveAppointment(dom) {
  // after the "right" value versions were selected, a editAppointment request is performed
  let calendarId = parseInt(dom.id.match(/\d/)[0]);
  var app = getAppointmentFromChooseForm(calendarId);
  app.id = currentID; // set aId depending on the current selected appointment
  serverRequest(
    "/api/" + calendarId + "/editAppointment",
    {
      id: currentID,
      app: app,
      calendar: currentCalendar,
      comment: getCurrentDate() + ": conflict solved by " + currentParticipant
    },
    function(json) {
      clearForm([calendarId]); // empty inputForm
      getUpdates(calendarId); //request Updates
    }
  );
  // show Inputform here as well, because this request can last some time!
  showInput(calendarId); //  show default inputForm instead of chooseForm
  clearForm([calendarId]); // empty inputForm
}

function getUpdates(calendarId) {
  // request new calendar data from the server
  if (typeof calendarId === "object") {
    calendarId = parseInt(calendarId.id.match(/\d/)[0]);
  }
  var selectedParticipants = getSelectedParticipants(calendarId);

  let timestampStore = `timestamps-${calendarId}`;
  let setsStore = `participants-${calendarId}`;

  DBHelper.crdtDBPromise.then(function(db) {
    if (!db) return;
    var index = db.transaction(timestampStore).objectStore(timestampStore);
    return index.get(0).then(function(storedTimestamp) {
      fetch(`${DBHelper.SERVER_URL}/api/${calendarId}/update`, {
        headers: {
          "Content-Type": "application/json; charset=utf-8"
        },
        method: "POST",
        body: JSON.stringify({
          timestamp: storedTimestamp ? storedTimestamp : { data: "null" },
          participant: currentParticipant,
          calendar: currentCalendar
        })
      })
        .then(function(response) {
          return response.json();
        })
        .then(function(json) {
          DBHelper.crdtDBPromise
            .then(function(db) {
              if (!db) return;

              var tx = db.transaction(setsStore, "readwrite");
              var store = tx.objectStore(setsStore);

              var item = new SetCRDT("users", json.participants);

              store.put(item);

              setParticipants(calendarId, json.participants);
              setSelectedParticipants(calendarId, selectedParticipants);
              setEvents(calendarId, json.apps);

              return tx.complete;
            })
            .then(function() {
              DBHelper.crdtDBPromise.then(function(db) {
                if (!db) return;

                var tx = db.transaction(timestampStore, "readwrite");
                var store = tx.objectStore(timestampStore);
                var temp = json.lastCommitTimestamp;

                if (temp) {
                  store.put({ id: 0, data: temp });
                }

                return tx.complete;
              });
            });
        })
        .catch(function() {
          // TODO add the functionality when the key is not created yet and don't forget to recreate the select element
          DBHelper.crdtDBPromise.then(function(db) {
            if (!db) return;

            var index = db.transaction(setsStore).objectStore(setsStore);

            return index.get("users").then(function(state) {
              if (state) {
                Object.setPrototypeOf(state, SetCRDT.prototype);
                // TODO rewrite this logic
                setParticipants(calendarId, state.calculateState());
                setSelectedParticipants(calendarId, selectedParticipants);
                // TODO YOU NEED TO UNCOMMENT THIS!!
                //setEvents(calendarId, json.apps);
              } else {
                log("[Offline] Selected key is not available offline.");
              }
            });
          });
        });
    });
  });
}

function getChanges(editedEvent, currentEvent) {
  //compare appointment and changed appointment for changes since only them are
  // sent to the server
  var result = {};
  if (editedEvent.title != currentEvent.title) result.title = editedEvent.title;
  if (editedEvent.description != currentEvent.description)
    result.description = editedEvent.description;
  if (
    new Date(editedEvent.start).getTime() !==
    new Date(currentEvent.start).getTime()
  )
    result.start = editedEvent.start;
  if (
    new Date(editedEvent.end).getTime() !== new Date(currentEvent.end).getTime()
  )
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
    if (
      editedEvent.participants.includes(name) &&
      !currentEvent.participants.includes(name)
    )
      result.addedParticipants.push(name);
    if (
      !editedEvent.participants.includes(name) &&
      currentEvent.participants.includes(name)
    )
      result.removedParticipants.push(name);
  }
  return result;
}

function setEvents(calendarId, events) {
  // set events to fullCalendar.
  let $calendar = $("#calendar-" + calendarId);
  $calendar.fullCalendar("removeEventSources");
  source.events = [];
  $calendar.fullCalendar("addEventSource", source);
  for (var i = 0; i < events.length; i++) {
    var app = events[i];
    if ("conflict" in app) {
      //true: app has conflict flag and app, else only the properties
      app.backgroundColor = "red";
    }
    source.events.push(events[i]);
    if (app.id == currentID) {
      setEventToForm(calendarId, app);
    }
  }
  $calendar.fullCalendar("addEventSource", source);
}
