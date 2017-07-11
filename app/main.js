/***********
Name: Main.js
Component Details: Handles the logic for:
                  - Registering the client with FCM
                  - Listening for messages from Salesforce
                  - Sending the push notifications to the client

Version History: 

***********/

/***class variable to check if paused or not***/
//var paused = '';
/***class variable queue to handle staggering of saves to local storage***/
var notificationQueue = [];
//below variable is the same as the queue above but used to store links to be clicked in the push notifications
var linkQueue = [];
//same as above, this is a counter for unread messages
//var counterQueue = [];

/***LISTENER FOR NOTIFICATIONS***/
chrome.gcm.onMessage.addListener(function(message) {
  console.log("Message Received!");
  console.log(message);

  //create the notification
  //set some variables based on the message data
  var theTitle = message.data.title;
  var theMessage = message.data.message;
  var theLink = message.data.link;
  var theImage = message.data.imageLink;
  var theProgram = message.data.program;
  var notificationId = theTitle+theLink;
  var theType = message.data.type;

  //build the notification object
  var notification = {
    type: "basic",
    title: theTitle,//needs to come from the message
    message: theMessage+"\n"+theProgram,
    iconUrl: chrome.extension.getURL(theImage),
    isClickable: true
  };

  //this is the object we store locally to be displayed in app
  var notificationForArray = {
    type: "basic",
    title: theTitle,//needs to come from the message
    message: theMessage+"\n"+theProgram,
    link: theLink,
    program: theProgram,
    notificationID: notificationId,
    notificationType: theType
  };

  //this object is the notificationID:record link stored locally for access on link click
  var idToLink = {id: notificationId, link: theLink};

  //send the notification
  //but first check to make sure notifications are not paused
  //if(!paused) {
    chrome.notifications.create(notificationId, notification, function(message) {
      setTimeout(function() {
        chrome.notifications.clear(message);
      },1800000);
    });
    //push the notification array to the queue
    notificationQueue.push(notificationForArray);
    //push to the link queue
    linkQueue.push(idToLink);
    //counterQueue.push(notificationForArray);
    pushLinkToArray();
    pushNotificationToArray();
  //}
  /*else {
    console.dir("Notifications are paused!");
  }*/

  //updateCounter();
  //this.getRecentNotifications(notificationForArray, idToLink);
});

//allow users to click on the notification and be directd to the salesforce record
chrome.notifications.onClicked.addListener(function(notificationId) {
  chrome.storage.local.get('linkList', function(result) {
    var theLink = result.linkList[notificationId];
    chrome.tabs.create({url: theLink});
  });
});

//listen for errors
chrome.gcm.onSendError.addListener(function (error) {
  console.log("We have an error on send: "+error);
  chrome.storage.local.set({theError:error});
});

/***CODE BELOW UPDATES RECENT NOTIFICATIONS ARRAY ON PAGE***/
function pushNotificationToArray() {
  if (!notificationQueue.length) {
    return;
  }
  //get the stored notifications if we have any
  chrome.storage.local.get('notifications', function(result) {
    notificationArray = [].concat(notificationQueue, result.notifications || []);
    notificationQueue = [];
    //check if its larger then 10 elements long, if so, slice it down to 10
    if(notificationArray.length >= 10) {
      notificationArray = notificationArray.slice(0,10);
    }
    //notificationArray.unshift({notification});
    chrome.storage.local.set({notifications:notificationArray});
  });
  //location.reload();
  chrome.browserAction.setBadgeText({text:"NEW"});
}

/***Code below handles link array (for clicking links in push notifications)**/
function pushLinkToArray() {
  if (!linkQueue.length) {
    return;
  }
  //get the stored notifications if we have any
  chrome.storage.local.get('linkList', function(result) {
    var idlinklist = {};
    if(result.linkList != null) {
      idlinklist = result.linkList;
    }
    idlinklist[linkQueue[0].id] = linkQueue[0].link;
    linkQueue = [];
    console.dir("Id Link List in Method? "+Object.keys(idlinklist));
    chrome.storage.local.set({linkList:idlinklist});
  });
}

function updateCounter() {
  if(!counterQueue.length) {
    return;
  }
  chrome.storage.local.get('counter', function(result) {
    var newCounter = 0;
    if(result.counter != null) {
      newCounter = result.counter + 1;
    }
    else {
      newCounter = 1;
    }
    counterQueue = [];
    chrome.storage.local.set({counter:newCounter});
    newCounter = newCounter.toString();
    chrome.browserAction.setBadgeText({text:newCounter});
  });
}

/*function getRecentNotifications(notification, idToLink) {
  //array to hold the notifications
  var notificationArray = [];
  //array to hold result (used in method when page loads)
  var results = [];
  //get the stored notifications if we have any
  chrome.storage.local.get('notifications', function(result) {
    if(result.notifications != null) {
      console.log("We have results "+result.notifications.length);
      notificationArray = result.notifications;
      notificationArray.unshift({notification});
    }
    else {
      console.log("No results");
      notificationArray = [{notification}];
    }
    //GA 9-2-2016...starting some experimental stuff here..
    chrome.storage.local.set({notifications:notificationArray});
  });

  //get and store the idToLink objects for link click
  chrome.storage.local.get('linkList', function(result) {
    var idlinklist = {};
    if(result.linkList != null) {
      idlinklist = result.linkList;
      idlinklist[idToLink.id] = idToLink.link;
    }
    else {
      console.log("No results");
      idlinklist[idToLink.id] = idToLink.link;
    }
    console.dir("Id Link List in Method? "+Object.keys(idlinklist));
    chrome.storage.local.set({linkList:idlinklist});
  });
  
  //update is kicked off on window load
  //location.reload();
  //set the text on the app icon to indicate a new lead has been received
  chrome.browserAction.setBadgeText({text:"NEW"});
}*/

/***FUNCTION TO PHYSICALLY POPULATE RECENT NOTIFICATIONS HTML PAGE***/
function updateRecentNotifications(results) {
  var notifications = results.notifications;
  if(notifications != null) {
    console.log("Length of Notifications "+notifications);
    for(x=0; x<notifications.length; x++) {
      if(x >= 10) {
        break;
      }
      $("#recentNotifications").append("<li class=\""+notifications[x].notificationType+"\">"
        +"<a href=\""+notifications[x].link
        +"\">"+notifications[x].title+" - "+notifications[x].program+"</a></li>");
      console.log("Is this happening? "+x+" "+notifications[x].title+" "+notifications[x].link+" "+notifications[x].notificationType);
    }
    console.dir("Show me the notifications: "+notifications);
  }
}
/***END OF CODE TO UPDATE RECENT NOTIFICATIONS***/

/***ALL OF CODE FOR WHEN PAGE LOADS***/
/***JQUERY TO HIDE REGISTRATION SECTION IF ALREADY REGISTERED***/
/***SETUP BUTTONS TO REGISTER, UNREGISTER AND CLEAR NOTIFICATIONS***/
$(document).ready(function() {

  chrome.storage.local.get('linkList', function(result) {
    if(result.linkList != null) {
      Object.getOwnPropertyNames(result.linkList).forEach(function(val, idx, array) {
        console.log(val + ' -> ' + result.linkList[val]);
      });
    }
    else {
      console.dir("Link List is Null");
    }
  });

  chrome.storage.local.set({counter:0});
  chrome.browserAction.setBadgeText({text:""});

  //setup so we can click links from the side bar
  $('body').on('click', 'a', function(){
     chrome.tabs.create({url: $(this).attr('href')});
     return false;
   });

  //conditionally render based on if we are registered or not
  chrome.storage.local.get("registered", function(result) {
      console.log(result);
      // If already registered, bail out.
      if (result["registered"]) {
        //add the hidden class to the button
        $("#menuOptions").toggleClass("hidden");
        return;
      }
      else {
        $("#unregister").toggleClass("hidden");
        $("#notificationsPanel").toggleClass("hidden");
        return;
      }
  });
  //display the notifications on screen
  chrome.storage.local.get('notifications', updateRecentNotifications);

  //conditionally render the paused/resume buttons
  /*chrome.storage.local.get("paused", function(result) {
    console.dir(result["paused"]);
    if(result["paused"]) {
      $("#pauseNotifications").toggleClass("hidden");
      $("#resumeNotifications").toggleClass("hidden");
      paused = true;
      console.dir("Paused variable is: "+paused);
    }
  })*/

  //add listener to button
  var registerButton = document.getElementById('register');
  registerButton.addEventListener('click', function() {
    console.log("This is working!");

    chrome.storage.local.get("registered", function(result) {
      // If already registered, bail out.
      if (result["registered"]) {
        console.log("Already registered!");
        return;
      }

      // Up to 100 senders are allowed.
      //right now this sender ID is hardcoded
      var senderIds = ["760575387233"];
      chrome.gcm.register(senderIds, registerCallback);
    });

  });
  var unregisterButton = document.getElementById('unregisterbutton');
  unregisterButton.addEventListener('click', function() {
    console.log("This is working for unreg!");
    chrome.gcm.unregister(unregisterCallback);
  });

  //used jquery for last button, can conceivable change the 
  $("#clearNotifications").click(function() {
    chrome.storage.local.remove("notifications", function() {
      console.log("Notifications removed via button");
    });
    chrome.storage.local.remove("linkList", function() {
    });
    location.reload();
  });

  //button and logic for pause and resume buttons
  /*$("#pauseNotifications").click(function() {
    chrome.storage.local.set({paused:true});
    $("#pauseNotifications").toggleClass("hidden");
    $("#resumeNotifications").toggleClass("hidden");
    paused = true;
  });
  $("#resumeNotifications").click(function() {
    chrome.storage.local.get("paused", function(result) {
      if(result["paused"]) {
        chrome.storage.local.set({paused:false});
        $("#pauseNotifications").toggleClass("hidden");
        $("#resumeNotifications").toggleClass("hidden");
        paused = false;
      }
    });
  });*/

  chrome.storage.local.get("theError", function(result) {
    console.dir("The Error if it exists: "+result["theError"]);
  });

});

/***REGISTRATION CALLBACK THAT EITHER STATES ERROR OR LOGS SUCCESSFUL REGISTRATION***/
function registerCallback(registrationId) {
  if (chrome.runtime.lastError) {
    // When the registration fails, handle the error and retry the
    // registration later.
    console.log("There was some error here.");
    return;
  }

  else {
      chrome.storage.local.set({registered: true});
      console.log("You are now registered! Registration Id: "+registrationId);
      displayKey(registrationId);
      $("#menuOptions").toggleClass("hidden");
      $("#unregister").toggleClass("hidden");
      $("#notificationsPanel").toggleClass("hidden");
  }
}

/***Toggle alert on popup.html displaying the reg key and instructions to user***/
function displayKey(registrationId) {
  $("#regalert").append("Please email this key to sfdc_support@ga.co:\n\n"+
    registrationId);
  $("#regSuccess").toggleClass("hidden");
}

/***UNREGISTER FUNCTION***/
function unregisterCallback() {
  if(chrome.runtime.lastError) {
    console.log("Oops, unregistration not successul!");
    console.dir(chrome.runtime.lastError.message);
    return;
  }
  else {
    chrome.storage.local.remove("registered", function() {
      $("#unregister").toggleClass("hidden");
      $("#menuOptions").toggleClass("hidden");
      $("#notificationsPanel").toggleClass("hidden");
      console.log("Success - Unregistered");
    });
    chrome.storage.local.remove("notifications", function() {
      console.log("Removed");
    });
  }
}
