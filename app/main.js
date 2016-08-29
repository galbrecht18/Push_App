/***********
Name: Main.js
Component Details: Handles the logic for:
                  - Registering the client with FCM
                  - Listening for messages from Salesforce
                  - Sending the push notifications to the client

Version History: 

TO DO:
 - Ability to pick which notifications they receive
  ++ Where should this live? In the app preferences or in Salesforce?
   -- If salesforce where? On the user?
 - Need to figure out how to handle bulk notifications (10+?)
 - Update remote site settings - DONE
 - Unregister method - DONE
 - If user is already registered, display a different UI - DONE
 - Need to make the links clickable in the notifications

***********/

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

  //build the notification object
  var notification = {
    type: "basic",
    title: theTitle,//needs to come from the message
    message: theMessage+"\n"+theLink,//will be url from message
    iconUrl: chrome.extension.getURL(theImage),
    isClickable: true
  };
  var notificationForArray = {
    type: "basic",
    title: theTitle,//needs to come from the message
    message: theMessage+"\n"+theLink,//will be url from message
    link: theLink,
    program: theProgram
  };

  //update the page with the new notification, may just scrap and window.reload page forcing this method to call
  //this.getRecentNotifications(notificationForArray);

  //send the notification
  //but first check to make sure notifications are not paused
  chrome.storage.local.get("paused", function(result) {
    if(result["paused"] == false) {
      chrome.notifications.create(notification);
    }
    else {
      console.dir("Notifications are paused");
    }
  })

  this.getRecentNotifications(notificationForArray)
});

//listen for errors
chrome.gcm.onSendError.addListener(function (error) {
  console.log("We have an error on send: "+error);
  chrome.storage.local.set({theError:error});
});

/***CODE BELOW UPDATES RECENT NOTIFICATIONS ARRAY ON PAGE***/
function getRecentNotifications(notification) {
  //array to hold the notifications
  var notificationArray = [];
  //array to hold result (used in method when page loads)
  var results = [];
  chrome.storage.local.get('notifications', function(result) {
    if(result.notifications != null) {
      console.log("We have results "+result.notifications.length);
      notificationArray = result.notifications;
      //determine how many items we currently have and add 1
      //this will be how we keep track and accurate keys
      //var itemNumber = notificationArray.length + 1;
      notificationArray.unshift({notification});
    }
    else {
      console.log("No results");
      notificationArray = [{notification}];
    }
    chrome.storage.local.set({notifications:notificationArray});
  });
  //removed the dom update, the end of this method should instead force a window refresh and then the dom
  //update is kicked off on window load
  location.reload();
  chrome.browserAction.setBadgeText({text:"NEW"});
  //this.updateRecentNotifications(results);
}

/***FUNCTION TO PHYSICALLY POPULATE RECENT NOTIFICATIONS HTML PAGE***/
function updateRecentNotifications(results) {
  var notifications = results.notifications;
  if(notifications != null) {
    console.log("Length of Notifications "+notifications);
    for(x=0; x<notifications.length; x++) {
      if(x >= 10) {
        break;
      }
      $("#recentNotifications").append("<li><a href=\""+notifications[x].notification.link
        +"\">"+notifications[x].notification.title+" - "+notifications[x].notification.program+"</a></li>");
      console.log("Is this happening? "+x+" "+notifications[x].notification.title+" "+notifications[x].notification.link);
    }
    console.dir(notifications);
  }
}
/***END OF CODE TO UPDATE RECENT NOTIFICATIONS***/

/***ALL OF CODE FOR WHEN PAGE LOADS***/
/***JQUERY TO HIDE REGISTRATION SECTION IF ALREADY REGISTERED***/
/***SETUP BUTTONS TO REGISTER, UNREGISTER AND CLEAR NOTIFICATIONS***/
$(document).ready(function() {

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
  chrome.storage.local.get("paused", function(result) {
    console.dir(result["paused"]);
    if(result["paused"]) {
      $("#pauseNotifications").toggleClass("hidden");
      $("#resumeNotifications").toggleClass("hidden");
    }
  })

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
    location.reload();
  });

  //button and logic for pause and resume buttons
  $("#pauseNotifications").click(function() {
    chrome.storage.local.set({paused:true});
    $("#pauseNotifications").toggleClass("hidden");
    $("#resumeNotifications").toggleClass("hidden");
  });
  $("#resumeNotifications").click(function() {
    chrome.storage.local.get("paused", function(result) {
      if(result["paused"]) {
        chrome.storage.local.set({paused:false});
        $("#pauseNotifications").toggleClass("hidden");
        $("#resumeNotifications").toggleClass("hidden");
      }
    });
  });

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
