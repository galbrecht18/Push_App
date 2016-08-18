/***********
Name: Main.js
Component Details: Handles the logic for:
                  - Registering the client with FCM
                  - Listening for messages from Salesforce
                  - Sending the push notifications to the client

Version History: 

TO DO:
 - Get an image for each notification type
 - Handle errors on send and on signup
 - Send registration id back to sfdc team or directly update user in sfdc
  ++ This will require some updates to the sign up gui asking for the user to input their sfdc username
 - Ability to pick which notifications they receive
  ++ Where should this live? In the app preferences or in Salesforce?
   -- If salesforce where? On the user?
 - Need to figure out how to handle bulk notifications (10+?)
 - Update remote site settings - DONE
 - Unregister method - DONE
 - Cache and display recent messages
 - If user is already registered, display a different UI

***********/

/***LISTENER FOR NOTIFICATIONS***/
chrome.gcm.onMessage.addListener(function(message) {
  console.log("Message Received!");
  console.log(message);
  //create the notification
  //this is just a test for now, needs to be dynamic based on the message so we need to parse the message

  var theTitle = message.data.title;
  var theMessage = message.data.message;
  var theLink = message.data.link;
  //we can conditionally set the image based on the message

  var notification = {
    type: "basic",
    title: theTitle,//needs to come from the message
    message: theMessage+"\n"+theLink,//will be url from message
    iconUrl: chrome.extension.getURL('/new.png')
  }

  chrome.notifications.create(notification);
});

/***PROJECT ID FOR FIREBASE***/
var sendId = "760575387233";

/***JQUERY TO HIDE REGISTRATION SECTION IF ALREADY REGISTERED***/
$(document).ready(function() {
  chrome.storage.local.get("registered", function(result) {
      console.log(result);
      // If already registered, bail out.
      if (result["registered"]) {
        //add the hidden class to the button
        $("#menuOptions").toggleClass("hidden");
        return;
      }
      else {
        $("#unregisterbutton").toggleClass("hidden");
        return;
      }
  });
});

/***SETUP BUTTON TO REGISTER APP***/
document.addEventListener('DOMContentLoaded', function() {
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
  var unregisterButton = document.getElementById('unregister');
  unregisterButton.addEventListener('click', function() {
    console.log("This is working for unreg!");
    chrome.gcm.unregister(unregisterCallback);
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
      $("#menuOptions").toggleClass("hidden");
      $("#unregisterbutton").toggleClass("hidden");
  }
}

/***UNREGISTER FUNCTION***/
function unregisterCallback() {
  if(chrome.runtime.lastError) {
    console.log("Oops, unregistration not successul!");
    console.log(chrome.runtime.lastError.message);
    return;
  }
  else {
    chrome.storage.local.remove("registered", function() {
      $("#unregisterbutton").toggleClass("hidden");
      $("#menuOptions").toggleClass("hidden");
      console.log("Success - Unregistered");
    });
  }
}

//Don't know if we want to do this. This corresponds to the unique item for the user. Might just want to
//email this to sfdc?
/*function sendRegistrationId(callback) {

}*/
