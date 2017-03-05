/*
Storage redesign:

blockedSiteList : urls(array)        where array[0] == expiryTime

blockedSites : urls(array)           array[i] = expiry time : url

timer : value
/*






/*************
    GETTERS
 *************/

//get the full block list and expiry time
chrome.storage.local.get("blockedSiteList", function (list) {
  listExpiry = list.blockedSiteList.shift(); //returns item removed (expiry time)
  blockedSiteList = list.blockedSiteList
});

//get just the block list expiry time
chrome.storage.local.get("blockedSiteList", function (list) {
  listExpiry = list.blockedSiteList[0];
});



//get the currently blocked single sites
chrome.storage.local.get("blockedSites", function (list) {
  blockedSite = list.urls[i];
  blockedSiteUrl = blockedSite.url;
  blockedSiteExpiryTime = blockedSite.expiryTime;
});



/*************
    SETTERS
 *************/

 //Save url to blockedSites
chrome.storage.local.get(["blockedSites"], function(items) {
    var array = items[storagekey]?items[storagekey]:[];

    var newArrEntry = {expireTime:expireTime, url:url};
    array.unshift(newArrEntry);

    var jsonObj = {};
    jsonObj[storagekey] = array;
    chrome.storage.local.set(jsonObj, function() {
        console.log("Saved a new array item");
    });
});


//Save url to blockedSitesList
chrome.storage.local.get(["blockedSitesList"], function(items) {
   var array = items[storagekey]?items[storagekey]:[];

   var newArrEntry = {url:url};
   array.unshift(newArrEntry);

   var jsonObj = {};
   jsonObj[storagekey] = array;
   chrome.storage.local.set(jsonObj, function() {
       console.log("Saved a new array item");
   });
});
