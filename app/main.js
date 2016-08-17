/***********
Name: Main.js
Component Details: Handles the logic for:
                  - Registering the client with FCM
                  - Listening for messages from Salesforce
                  - Sending the push notifications to the client

Version History: 


***********/

function registerCallback(registrationId) {
  if (chrome.runtime.lastError) {
    // When the registration fails, handle the error and retry the
    // registration later.
    console.log("There was some error here.");
    return;
  }

  // Send the registration token to your application server.
  sendRegistrationId(function(succeed) {
    // Once the registration token is received by your server,
    // set the flag such that register will not be invoked
    // next time when the app starts up.
    if (succeed) {
      chrome.storage.local.set({registered: true});
      console.log("You are now registered! Registration Id: "+registrationId);
    }
  });
}

//Don't know if we want to do this. This corresponds to the unique item for the user. Might just want to
//email this to sfdc?
function sendRegistrationId(callback) {
  // Send the registration token to your application server
  // in a secure way.
}

//Main branch of logic that actually runs on startup, registering the client with FCM (or attempting to)
chrome.runtime.onStartup.addListener(function() {
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