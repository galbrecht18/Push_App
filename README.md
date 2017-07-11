# Push_App
Salesforce Push Notification Project.

#Version 1
- UI Updated
- Nearly there with storing notifications in cache
- Need to explore passing back registration token

---
#### 8-23-2016
- Moved logic out of trigger and trigger handler and instead will be handling through process builder
- New Process: Lead Notifications Process
- Updated Lead Radar Process
- Updated Opp Radar Process 

---
### 8-29-2016
- Added pause/resume button and functionality

---
### 9-1-2016
- Stable version. Can click links directly from push notification.
- Timeout on push notifications to prevent receiving bulk amount of them on initial login.

---
### 10-24-2016
- Removed pause/resume functionality and moved this logic into the server side (sfdc)
