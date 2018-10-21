/*jshint esversion: 6 */
let Promise = require("bluebird");
Promise.longStackTraces();
let express = Promise.promisifyAll(require('express'));
let app = express();
const conf = require('./config');
let	antidoteClient = Promise.promisifyAll(require('./antidote_ts_client'));


//Requies for executing cmd
const util = require('util');
const exec = util.promisify(require('child_process').exec);

// Initialize Antidote clients
var atdClis = [];
var userSets = [];
var appMaps = [];

for (var i in conf.antidote) {
    atdClis.push(antidoteClient.connect(conf.antidote[i].port, conf.antidote[i].host));
}

for (var i in atdClis){
    atdClis[i].requestTimeoutMs = 5000;
    userSets.push(atdClis[i].set("users")); // Set of available participants
    appMaps.push(atdClis[i].rrmap("appointments")); // AppMap, Map of Map of Appointmens
}
 

async function call_DisconnectNetwork() {
  const { stdout, stderr } = await exec('docker network disconnect application_interdc application_antidote1_1');
  console.log('stdout:', stdout);
  console.log('stderr:', stderr);
}


async function call_ConnectNetwork() {
  const { stdout, stderr } = await exec('docker network connect application_interdc application_antidote1_1');
  console.log('stdout:', stdout);
  console.log('stderr:', stderr);
}

exports.call_DisconnectNetwork = function(){
	return call_DisconnectNetwork();
}
//Connect the interdc network
exports.call_ConnectNetwork = function(){
	return call_ConnectNetwork();
}
function UserApps(calendarId, user,calendar) {      // Function returning the Set of aIds for the given view
    return atdClis[calendarId-1].rrmap(user+"_apps").set(calendar);
}
//===================================

for (var i in userSets){
    userSets[i].read().then(_=>console.log("Connection established to antidote with UserSet: " + _))
    .catch(err=>console.log("Connection to antidote failed", err)); // dummy read to check if connection is available
}
/* 
UserSet.read().then(_=>console.log("Connection established to antidote with UserSet: " + _))
    .catch(err=>console.log("Connection to antidote failed", err)); // dummy read to check if connection is available */

//====== get a unique server id
let date = new Date();
let ident = "server_" + date.getFullYear()+ "." + (date.getMonth()+1) + "." + date.getDate() + "T" + date.getHours() + ":" + date.getMinutes() +
    ":" + date.getSeconds() + ":" + date.getMilliseconds();
let count = 1;
//=================================

//================ performing elementary database operations
exports.readAllUserAppos = function(calendarId, user,calendar){ //all aIds of an user,calender tuple;
    return UserApps(calendarId, user, calendar).read();
};

exports.readAllAppointments = function(calendarId){ // all aId-Appointment tuples
    return appMaps[calendarId-1].read();
};
exports.readAllParticipants = function(calendarId){ // all participants
    return userSets[calendarId-1].read();
};
exports.addParticipant = function(calendarId, participant){
    return atdClis[calendarId-1].update(userSets[calendarId-1].add(participant));
};
exports.writeNewAppointment = function(calendarId, calendar, app){
    let id = getNewId();
    app.id = id;
    let userApps;
    let participants = app.participants;

    for(let p in participants){
        userApps = UserApps(calendarId, participants[p], calendar);
        atdClis[calendarId-1].update(userApps.add(id));
    }

    return atdClis[calendarId-1].update([
        appMaps[calendarId-1].rrmap(id).multiValueRegister("id").set(app.id),
        appMaps[calendarId-1].rrmap(id).multiValueRegister("title").set(app.title),
        appMaps[calendarId-1].rrmap(id).multiValueRegister("start").set(app.start),
        appMaps[calendarId-1].rrmap(id).multiValueRegister("end").set(app.end),
        appMaps[calendarId-1].rrmap(id).multiValueRegister("allDay").set(app.allDay),
        appMaps[calendarId-1].rrmap(id).multiValueRegister("description").set(app.description),
        appMaps[calendarId-1].rrmap(id).set("participants").addAll(app.participants),
        appMaps[calendarId-1].rrmap(id).multiValueRegister("priority").set(app.priority),
        appMaps[calendarId-1].rrmap(id).set("comments").addAll(app.comments),
    ]);
};
exports.updateAppointment = function(calendarId, aId, app,calendar,comment,res) {
    // more complex procedure, since the update influences more than only the AppMap (assigned Participants)
    
    let userSet;

    atdClis[calendarId-1].update(appMaps[calendarId-1].rrmap(aId).multiValueRegister("id").set(app.id));

    let updates = [];

    if(app.hasOwnProperty("title"))
        updates.push(appMaps[calendarId-1].rrmap(aId).multiValueRegister("title").set(app.title));
    if(app.hasOwnProperty("start"))
        updates.push(appMaps[calendarId-1].rrmap(aId).multiValueRegister("start").set(app.start));
    if(app.hasOwnProperty("end"))
        updates.push(appMaps[calendarId-1].rrmap(aId).multiValueRegister("end").set(app.end));
    if(app.hasOwnProperty("allDay"))
        updates.push(appMaps[calendarId-1].rrmap(aId).multiValueRegister("allDay").set(app.allDay));
    if(app.hasOwnProperty("description"))
        updates.push(appMaps[calendarId-1].rrmap(aId).multiValueRegister("description").set(app.description));
    if(app.hasOwnProperty("priority"))
        updates.push(appMaps[calendarId-1].rrmap(aId).multiValueRegister("priority").set(app.priority));

    atdClis[calendarId-1].update(updates);
    atdClis[calendarId-1].update(appMaps[calendarId-1].rrmap(aId).set("comments").add(comment));

    return userSets[calendarId-1].read()
        .then(_=>{
            userSet = _;
            // following is the correct version of assigned participants. (added/removed participants instead of assignedParticipants)
            if (!app.removedParticipants){
                app.removedParticipants = [];
            }
            let remove = atdClis[calendarId-1].update(appMaps[calendarId-1].rrmap(aId).set("participants").removeAll(app.removedParticipants));
            remove.then(_=>{
                 //console.log("remove " + app.removedParticipants.length + ": " + app.removedParticipants + " successfull");
                 if (!app.addedParticipants){
                    app.addedParticipants = [];
                }
                 let add = atdClis[calendarId-1].update(appMaps[calendarId-1].rrmap(aId).set("participants").addAll(app.addedParticipants));
                 add.then(_=>{
                     //console.log("adding " + app.addedParticipants.length + ": " + app.addedParticipants + " to app successfull");
                     for (let p in app.addedParticipants){
                         atdClis[calendarId-1].update(UserApps(calendarId, app.addedParticipants[p], calendar).add(aId));
                     }
                     for (let p in app.removedParticipants){
                         atdClis[calendarId-1].update(UserApps(calendarId, app.removedParticipants[p], calendar).removed(aId));
                     }
                     //return res.send({result:true});
                 })
                 .catch(err=>console.log("adding new values failed", err));
            })
                .catch(err=>console.log("remove failed", err));
        })
        .catch(err=>console.log("failed to read all names", err));
};
exports.writeComment = function(calendarId, aId,comment){
    return atdClis[calendarId-1].update(appMaps[calendarId-1].rrmap(aId).set("comments").add(comment));
};
exports.deleteAppointment = function(calendarId, aId){
    return atdClis[calendarId-1].update(appMaps[calendarId-1].remove(appMaps[calendarId-1].rrmap(aId)));
};
exports.deleteParticipant = function (calendarId, participant) {
    // more complex too, since the deleted participant has to be removed from all involved appointments
    // the following removes all aIds and the userapps for the given participant

    UserApps(calendarId, participant, "Business").read()
        .then(priv=>{
            atdClis[calendarId-1].update(UserApps(calendarId, participant, "Business").removeAll(priv));
        })
        .catch(err=>console.log("failed to read Business calendar of " + participant + ". Maybe it was empty", err));
    // remove participant from all appointments

    appMaps[calendarId-1].read()
        .then(_=>{
            let AllApps = _.toJsObject();
            for (let i in AllApps){
                if (contains(AllApps[i].participants, participant)){
                    atdClis[calendarId-1].update(appMaps[calendarId-1].rrmap(i).set("participants").remove(participant))
                        .then(res => console.log("removed " + participant + "from app.participants " + i))
                        .catch(err => console.log("failed remove " + participant + " from app.participants " + i, err));
                }
            }
        })
        .catch(err=>console.log("failed to read AppMap", err));
        return atdClis[calendarId-1].update(userSets[calendarId-1].remove(participant));
};

//=============== helper functions

function contains(arr, elem) { // check, if an element 'elem' is contained in the array 'arr'
    let i = arr.length;
    while (i--) {
        if (arr[i] === elem) {
            return true;
        }
    }
    return false;
}
function getNewId(){ // increment the aId counter and return the current one. (so aIds stay unique)
    count++;
    return ident + "_" + count;
}
