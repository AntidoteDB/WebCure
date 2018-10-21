// this file is responsible for most of the GUI interactions. It also triggers requests
// executed by the user
/*jshint esversion: 6 */

//source field for the calendar, 'events' are the appointments
let source = {
  events: [],
  color: "black",
  textColor: "yellow"
};

let currentParticipant = ""; // currently selected participant
let currentCalendar = "Business"; // currently selected calendar => both are necessary for the view
let currentID = ""; // currently selected appointment, necessary to reset state of inputform after update
let currentEvent = {}; // current version of appointment, necessary to compare with updated one
let allDayChecked = false; // is allday radio checked? influences appearance of inputform
let participantsList = []; // list of available participants shown in the comboBox
$(document).ready(function() {
  registerServiceWorker();

  var tour = new Tour({
    steps: [
      {
        element: "body",
        title: "Welcome!",
        content:
          "Welcome to the demonstartion of the Calendar Application! We will quickly guide you through the general routine. ",
        placement: "top"
      },
      {
        element: "#newParticipant-1",
        title: "Adding a participant",
        content:
          "Firstly, type the name of the participant here in order to add it to the first calendar. Once you are done, click 'Next' to get the next instruction."
      },
      {
        element: "#btnNewParticipant-1",
        title: "Submit the data",
        content:
          "Click here or 'ENTER' on your keyboard in order to sumbit the data."
      },
      {
        element: "#cbNames-1",
        title: "List of participants",
        content:
          "Here you can see a list of participants for the current calendar."
      },
      {
        element: "#removeParticipant-1",
        title: "Removing the participant",
        content:
          "In case you made a typo, you can always use this button to remove selected participant from the list."
      },
      {
        element: "#update-2",
        title: "Updating the calendar",
        content:
          "Now let's try some magic! Click this button and calendars will be synchonized! That means that both calendars will reach the same state. That's just cool, isn't it?"
      },
      {
        element: "#newParticipant-2",
        title: "Adding a participant",
        content:
          "Let's add one more participant to the second calendar! Type the name here."
      },
      {
        element: "#update-1",
        title: "Updating the calendar",
        content:
          "Update the first calendar and check that participant you just added is in the list."
      },
      {
        element: ".fc-state-highlight:first",
        title: "Adding an appointment",
        content:
          "Now that boring part is behind, we can try to create an appointment. To do that just click at the timeline of any calendar and a pop-up will be shown."
      },
      {
        element: "#iadd-1",
        title: "Adding an appointment",
        content:
          "Fill in all the information (but tick both of the created participants!) and once you are done, click this button to add an appointment."
      },
      {
        element: "#update-2",
        title: "Updating the calendar",
        content:
          "As you already know, by updating the second caledar, you will get all the latest changes, which contain your newly created appointment"
      },
      {
        element: "#btnBreakConnection",
        title: "Disconnect the calendars",
        content:
          "There is one more interesting step. By clicking this button, you can disconnect calendars and make independent changes for both of them. Let's try it out!"
      },
      {
        element: "#addAppointment-1",
        title: "Calendar is disabled.",
        content:
          "Once the connection for calendar is broken, the main functionality of the calendar is disabled. Now you can only edit already existing appointments."
      },
      {
        element: "#calendar-1",
        title: "Experience a conflict",
        content: "Click at the appointment in the first calendar."
      },
      {
        element: "#idesc-1",
        title: "Editing the description",
        content: "Make a change here, for example."
      },
      {
        element: "#iedit-1",
        title: "Editing the appointment",
        content: "Click here to confirm the change."
      },
      {
        element: "#calendar-2",
        title: "Experience a conflict",
        content: "Now, click at the appointment in the second calendar."
      },
      {
        element: "#idesc-2",
        title: "Editing the description",
        content: "Make a change here, for example."
      },
      {
        element: "#iedit-2",
        title: "Editing the appointment",
        content: "Click here to confirm the change."
      },
      {
        element: "#btnReestablishConnection",
        title: "Reestabslish the connection",
        content:
          "Click this and take a little wait for the connection to be resumed."
      },
      {
        element: "#update-1, #update-2",
        title: "Update calendars",
        content:
          "Now, if you update the calendars, you will experience a conflict, because there was a concurrent change to this appointment. If it is not appearing, wait a little bit more and press this button again."
      },
      {
        element: "#calendar-1, #calendar-2",
        title: "Solving the conflict",
        content:
          "Click at one of these and check, which changes you want to keep. "
      },
      {
        element: "#add-1, #add-2",
        title: "Solve the conflict",
        content: "Once you are done, press this button to solve the conflict."
      },
      {
        element: "body",
        title: "The end",
        content:
          "Well done, you have successfuly finished our tutorial and gained an experience, how to use the application. ",
        placement: "top"
      }
    ]
  });
  tour.setCurrentStep(0);
  initialize(); //initializes GUI
  let $calendars = $("#calendar-1, #calendar-2");
  $calendars.each(function(i, elem) {
    $(elem).fullCalendar({
      header: {
        // set header elements and style of FullCalendar
        left: "prev,next",
        center: "",
        right: "agendaWeek"
      },
      defaultView: "agendaWeek",
      allDaySlot: true,
      minTime: "00:00:00",
      maxTime: "24:00:00",
      height: 500,
      draggable: true,
      eventSources: [],
      eventClick: function(calEvent, jsEvent, view) {
        eventClick(i + 1, calEvent); // event, if an event (appointment in fullCalendar) is clicked
      },
      dayClick: function(date, jsEvent, view) {
        dayClick(i + 1, date); //event, if empty timeslot in fullCalendar is clicked
      }
    });
  });
  if (tour.ended()) {
    tour.restart();
  } else {
    tour.init();
    tour.start();
  }
});

/**
 * Register a service worker
 */

const registerServiceWorker = () => {
  if (!navigator.serviceWorker) return;

  navigator.serviceWorker
    .register("/sw.js")
    .then(function() {
      console.log("Service Worker registered!");
    })
    .catch(function() {
      console.log("Registration of the Service Worker failed");
    });
};

function onEnterNewParticipant(
  event // event, if new participant is entered in regarding textBox and 'enter' is clicked
) {
  code = event.keyCode;
  if (code == 13) addNewParticipant(event); //send addParticipant request to server
}

function onEnterComment(
  event // event, ... new comment ...
) {
  code = event.keyCode;
  if (code == 13) addComment(event); //send addComment request to server
}

function onChangeCbNames(e) {
  // event, if another participant was selected
  let calendarId = parseInt(e.id.match(/\d/)[0]);
  let valueSelected = e.value;
  currentParticipant = valueSelected;
  clearForm([calendarId]); // set all textfields to empty
  getUpdates(calendarId); //request data for the new view from the server
}

function onAllDayClick(dom) {
  let calendarId = parseInt(dom.id.match(/\d/)[0]);
  handleAllDayCBClick(calendarId, dom);
}

function handleAllDayCBClick(calendarId, cb) {
  //depending on the selection of 'allDay' the 'endDate' field is shown or not
  allDayChecked = cb.checked;
  if (allDayChecked)
    document.getElementById("iendDate-" + calendarId).style.visibility =
      "hidden";
  else
    document.getElementById("iendDate-" + calendarId).style.visibility =
      "visible";
}

function onRemoveParticipants(dom) {
  // send removeParticipant-request to the server
  let calendarId = parseInt(dom.id.match(/\d/)[0]);
  removeParticipant(calendarId);
}

function getAppointmentFromForm(calendarId) {
  // read appointment from inputform
  let name = document.getElementById("iname-" + calendarId).value;
  //if( navigator.userAgent.toLowerCase().indexOf('firefox') > -1 ){
  let sVarformatDate = document.getElementById("istartDate-" + calendarId)
    .value;
  sDate = formatDate(sVarformatDate);
  sDate = new Date(sDate);

  let eVarformatDate = document.getElementById("iendDate-" + calendarId).value;
  eDate = formatDate(eVarformatDate);
  eDate = new Date(eDate);
  //}else{
  //sDate = new Date(document.getElementById('istartDate-' + calendarId).value);
  //eDate = new Date(document.getElementById('iendDate-' + calendarId).value);
  //}

  sDate.setHours(sDate.getHours());
  eDate.setHours(eDate.getHours());
  let desc = $("#desc-" + calendarId).val();
  let allday = isAllDayChecked();
  let description = document.getElementById("idesc-" + calendarId).value;
  let priority = document.getElementById("ipriority-" + calendarId).value;
  let res = {
    id: 0,
    title: name,
    start: sDate,
    end: eDate,
    allDay: allday,
    description: description,
    participants: getSelectedParticipants(calendarId),
    priority: priority
  };
  return res;
}

function formatDate(date) {
  var formattedData = replaceAll(date, "-", "/");
  formattedData = formattedData.replace("T", " ");
  formattedData = formattedData.concat(" UTC");
  return formattedData;
}

function replaceAll(str, find, replace) {
  return str.replace(new RegExp(find, "g"), replace);
}

function clearForm(calendarIds) {
  // set all input fields to empty and shows inputform
  calendarIds.forEach(function(calendarId) {
    currentID = "";
    document.getElementById("iallDay-" + calendarId).checked = false;
    handleAllDayCBClick(
      calendarId,
      document.getElementById("iallDay-" + calendarId)
    );
    document.getElementById("istartDate-" + calendarId).value = new Date();
    document.getElementById("iendDate-" + calendarId).value = new Date();
    $("#iname-" + calendarId).val("");
    $("#idesc-" + calendarId).val("");
    $("#ipriority-" + calendarId).val("");
    setComments(calendarId, []);
    document.getElementById("iedit-" + calendarId).disabled = true;
    document.getElementById("idelete-" + calendarId).disabled = true;
    document.getElementById("iadd-" + calendarId).disabled = true;
    document.getElementById("iCommentInput-" + calendarId).disabled = true;
    let $container = $("#iSelParticipants-" + calendarId);
    let inputs = $container.find("input");
    let id = inputs.length;
    for (
      let i = 1;
      i <= id;
      i++ //deselect all patricipants
    )
      $container.find("#participant" + i)[0].checked = false;
    showInput(calendarId);
  });
}

function setEventToForm(calendarId, ev) {
  //if an event(appointment) was clicked, the regarding data is set to the inputform
  // ev is a appointment JSON-structure
  currentID = ev.id;
  document.getElementById("iallDay-" + calendarId).checked = ev.allDay;
  handleAllDayCBClick(
    calendarId,
    document.getElementById("iallDay-" + calendarId)
  );
  let start = new Date(ev.start);
  let end;
  if (ev.end == null) {
    // if its an allDay event, the 'end' property has to be set to a value to prevent nullpointerExpt
    end = start;
    end.setMinutes(start.getMinutes() + 30);
  } else end = new Date(ev.end);
  let str1 =
    start.getFullYear() +
    "-" + // transform date to string in format: 'yyyy-mm-ddThh:mm'
    ((start.getMonth() + 1).toString().length < 2
      ? "0" + (start.getMonth() + 1)
      : start.getMonth() + 1) +
    "-" +
    (start.getDate().toString().length < 2
      ? "0" + start.getDate()
      : start.getDate()) +
    "T" +
    ((start.getHours() - 2).toString().length < 2
      ? "0" + (start.getHours() - 2)
      : start.getHours() - 2) +
    ":" +
    (start.getMinutes().toString().length < 2
      ? "0" + start.getMinutes()
      : start.getMinutes());
  document.getElementById("istartDate-" + calendarId).value = str1;
  let str2 =
    end.getFullYear() +
    "-" +
    ((end.getMonth() + 1).toString().length < 2
      ? "0" + (end.getMonth() + 1)
      : end.getMonth() + 1) +
    "-" +
    (end.getDate().toString().length < 2
      ? "0" + end.getDate()
      : end.getDate()) +
    "T" +
    ((end.getHours() - 2).toString().length < 2
      ? "0" + (end.getHours() - 2)
      : end.getHours() - 2) +
    ":" +
    (end.getMinutes().toString().length < 2
      ? "0" + end.getMinutes()
      : end.getMinutes());
  document.getElementById("iendDate-" + calendarId).value = str2;
  $("#iname-" + calendarId).val(ev.title);
  $("#idesc-" + calendarId).val(ev.description);
  $("#ipriority-" + calendarId).val(ev.priority);
  let comments = ev.comments;
  setComments(calendarId, comments); //add comments to regarding div
  setSelectedParticipants(calendarId, ev.participants); // select assigned participants
}

function isAllDayChecked() {
  //returns flag, if field 'allDay' is checked in the current appointment
  return allDayChecked;
}

function initialize() {
  // initializes GUI and fullCalendar with default values
  // clear forms of both calendars
  clearForm([1, 2]); //
  currentCalendar = "Business";
  $("#cbcalendars").val(currentCalendar);
}

function dayClick(calendarId, date) {
  // if an empty time slot is clicked, add the time and ...
  // ...the current selected patricipant to the inputform. date is of type Date
  if (!disconneted) {
    performDayClick(calendarId, date);
  } else {
    if (calendarId == 2) {
      performDayClick(calendarId, date);
    }
  }
}

function performDayClick(calendarId, date) {
  let start = new Date(date);
  start.setHours(start.getHours());
  let end = new Date(date);
  end.setMinutes(end.getMinutes() + 30);
  end.setHours(end.getHours());
  clearForm([calendarId]);
  setEventToForm(calendarId, {
    start: start,
    end: end,
    participants: [currentParticipant]
  });
  openModel(calendarId);
  document.getElementById("iadd-" + calendarId).disabled = false;
}

function eventClick(calendarId, ev) {
  // if an event(appointment) is clicked, set the values to the inputform. ev is the JSON-struct

  if ("conflict" in ev) {
    // in case of a conflict, the event consists of ev.app and ev. conflict. Else, it covers just the properties
    openModel(calendarId);
    showChoose(calendarId); //if a conflict is detected, change the inputform to the chooseform (with value versions)
    setEventToChooseForm(calendarId, ev.app); //and add the conflicting values to it
    return;
  }
  setEventToForm(calendarId, ev);
  currentEvent = ev;
  document.getElementById("iadd-" + calendarId).disabled = true;
  document.getElementById("iedit-" + calendarId).disabled = false;
  document.getElementById("idelete-" + calendarId).disabled = false;
  document.getElementById("iCommentInput-" + calendarId).disabled = false;
  getUpdates(calendarId); // get new updates to check, if appointment has changed
  openModel(calendarId);
}

function getSelectedParticipants(calendarId) {
  // return a list of selected participants of inputform
  let $container = $("#iSelParticipants-" + calendarId);
  let inputs = $container.find("input");
  let id = inputs.length;
  let names = [];
  for (let i = 1; i <= id; i++) {
    let $x = $container.find("#participant" + i);
    if ($x[0].checked) names.push($x[0].value);
  }
  return names;
}

function setSelectedParticipants(calendarId, participants) {
  // select participants in inputform, if they appear in 'participants'
  if (participants == undefined) return;
  let $container = $("#iSelParticipants-" + calendarId);
  let inputs = $container.find("input");
  let id = inputs.length;
  for (let i = 0; i < participants.length; i++)
    for (let j = 1; j <= id; j++) {
      let $x = $container.find("#participant" + j);
      if ($x[0].value == participants[i]) $x[0].checked = true;
    }
}

function addCheckbox(calendarId, name) {
  //add new Checkbox for the given 'name' to the regarding field in the inputform
  let container = $("#iSelParticipants-" + calendarId);
  let inputs = container.find("input");
  let id = inputs.length + 1;
  let newItem = $("<li>");
  $("<input />", {
    type: "checkbox",
    id: "participant" + id,
    value: name
  }).appendTo(newItem);
  $("<label />", {
    for: "cb" + id,
    text: name
  }).appendTo(newItem);
  newItem.appendTo(container);
}

function setParticipants(calendarId, participants) {
  // set available participants to comboBox (selectable for view)
  participantsList = participants;
  let tmp = currentParticipant;
  let isEmpty =
    currentParticipant == "" || typeof currentParticipant == "undefined"
      ? true
      : false;
  let x = document.getElementById("cbNames-" + calendarId);
  $("#cbNames-" + calendarId).empty();
  x.size = 1;
  $("#iSelParticipants-" + calendarId).empty();
  for (let i = 0; i < participants.length; i++) {
    let option1 = document.createElement("option");
    option1.text = participants[i];
    let option2 = document.createElement("option");
    option2.text = participants[i];
    x.add(option1);
  }
  for (let i in participants) {
    addCheckbox(calendarId, participants[i]);
  }
  if (isEmpty) {
    x.value = participants[0];
    currentParticipant = participants[0];
    if (!(currentParticipant == "" || currentParticipant == undefined))
      getUpdates(calendarId);
  } else {
    x.value = tmp;
    currentParticipant = tmp;
  }
}

function setComments(calendarId, comments) {
  //add comments to field in inputform
  if (comments == undefined) return;
  comments.sort(); //sort all comments to date of creation
  $("#iCommentBox-" + calendarId).empty();
  for (var i in comments) {
    $("#iCommentBox-" + calendarId).append(
      $("<li></li>").append($("<span>").text(comments[i]))
    );
  }
}

function showInput(calendarId) {
  //show inputform (for appointment)
  let input = $("#appInputForm-" + calendarId);
  let choose = $("#appChooseForm-" + calendarId);
  choose.hide();
  input.show();
}

function showChoose(calendarId) {
  //show chooseForm (for conflicting values in appointment)
  let input = $("#appInputForm-" + calendarId);
  let choose = $("#appChooseForm-" + calendarId);
  input.hide();
  choose.show();
}

function enableInput(calendarId) {
  //enable inputform in 'no global' calendar
  $("#appInputForm-" + calendarId).removeClass("disabledbutton");
}

function disableInput(calendarId) {
  // disable inputform by 'global' calendar => readonly
  $("#appInputForm-" + calendarId).addClass("disabledbutton");
}

function getAppointmentFromChooseForm(calendarId) {
  // get the solved conflict appointment from chooseForm
  let sDate;
  let eDate;
  let name = document.getElementById("cname-" + calendarId).value;
  let x = document.getElementById("cstartDate-" + calendarId).value;
  let sVarformatDate = document.getElementById("cstartDate-" + calendarId)
    .value;
  sDate = formatDate(sVarformatDate);
  sDate = new Date(sDate);

  let eVarformatDate = document.getElementById("cendDate-" + calendarId).value;
  eDate = formatDate(eVarformatDate);
  eDate = new Date(eDate);
  sDate.setHours(sDate.getHours());
  eDate.setHours(eDate.getHours());

  let allday =
    document.getElementById("cendDate-" + calendarId).value == "true"
      ? true
      : false;
  let description = document.getElementById("cdesc-" + calendarId).value;
  let priority = document.getElementById("cpriority-" + calendarId).value;
  let res = {
    id: 0,
    title: name,
    start: sDate,
    end: eDate,
    allDay: allday,
    description: description,
    participants: [],
    priority: priority
  };
  return res;
}

function setEventToChooseForm(calendarId, ev) {
  // set conflicting appointment to chooseForm (comboBoxes)
  currentID = ev.id[0];
  $("#cname-" + calendarId).empty();
  let x = document.getElementById("cname-" + calendarId);
  for (let i = 0; i < ev.title.length; i++) {
    let option1 = document.createElement("option");
    option1.text = ev.title[i];
    x.add(option1);
  }
  $("#cdesc-" + calendarId).empty();
  x = document.getElementById("cdesc-" + calendarId);
  for (let i = 0; i < ev.description.length; i++) {
    let option1 = document.createElement("option");
    option1.text = ev.description[i];
    x.add(option1);
  }
  $("#cpriority-" + calendarId).empty();
  x = document.getElementById("cpriority-" + calendarId);
  for (let i = 0; i < ev.priority.length; i++) {
    let option1 = document.createElement("option");
    option1.text = ev.priority[i];
    x.add(option1);
  }
  $("#cstartDate-" + calendarId).empty();
  x = document.getElementById("cstartDate-" + calendarId);
  let y = document.getElementById("cendDate-" + calendarId);
  for (let i = 0; i < ev.start.length; i++) {
    let start = new Date(ev.start[i]);
    let str1 =
      start.getFullYear() +
      "-" +
      ((start.getMonth() + 1).toString().length < 2
        ? "0" + (start.getMonth() + 1)
        : start.getMonth() + 1) +
      "-" +
      (start.getDate().toString().length < 2
        ? "0" + start.getDate()
        : start.getDate()) +
      "T" +
      ((start.getHours() - 2).toString().length < 2
        ? "0" + (start.getHours() - 2)
        : start.getHours() - 2) +
      ":" +
      (start.getMinutes().toString().length < 2
        ? "0" + start.getMinutes()
        : start.getMinutes());
    let option1 = document.createElement("option");
    option1.text = str1;
    x.add(option1);
  }
  $("#cendDate-" + calendarId).empty();

  for (let i = 0; i < ev.end.length; i++) {
    let end = new Date(ev.end[i]);
    let str2 =
      end.getFullYear() +
      "-" +
      ((end.getMonth() + 1).toString().length < 2
        ? "0" + (end.getMonth() + 1)
        : end.getMonth() + 1) +
      "-" +
      (end.getDate().toString().length < 2
        ? "0" + end.getDate()
        : end.getDate()) +
      "T" +
      ((end.getHours() - 2).toString().length < 2
        ? "0" + (end.getHours() - 2)
        : end.getHours() - 2) +
      ":" +
      (end.getMinutes().toString().length < 2
        ? "0" + end.getMinutes()
        : end.getMinutes());
    let option1 = document.createElement("option");
    option1.text = str2;
    if (document.getElementById("cendDate-" + calendarId) != null)
      y.add(option1);
  }
  for (let i = 0; i < ev.allDay.length; i++) {
    let option1 = document.createElement("option");
    option1.text = ev.allDay[i];
    if (option1.text == "true")
      if (document.getElementById("cendDate-" + calendarId) != null)
        y.add(option1);
  }
}
