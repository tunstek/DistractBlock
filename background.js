
/*
 * This file is subject to the terms and conditions defined in
 * file 'LICENSE', which is part of this source code package.
 */



var redirectURL = chrome.extension.getURL("blocked.html");
var parsedRedirect = parseURL(redirectURL);
var defaultTimerValue = 20; //minutes
var blockedCount = 0; //initalise the blocked count to 0
intervalCheck();



// **************************************
// **** LISTEN TO CHANGES IN TAB URL ****
// **************************************
chrome.webNavigation.onTabReplaced.addListener(function (details) {
  chrome.tabs.get(details.tabId, function(tab) {
    //console.log("chrome.webNavigation.onTabReplaced");
    checkUrl(tab.url);
  });
});
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
    //Check that onUpdated was fired for the current tab
    var currentTab = tabs[0];
    //console.log("currentTabID=" + currentTab.id)
    if(currentTab!=undefined && tabId == currentTab.id) {
      checkUrl(tab.url);
    }
  });
});
chrome.tabs.onActivated.addListener(function(activeInfo) {
  //Listener for tab change
  chrome.tabs.get(activeInfo.tabId, function (tab) {
    checkUrl(tab.url);
    });
});


// *****************************************
// **** LISTEN TO CHANGES IN POPUP.HTML ****
// *****************************************
chrome.runtime.onMessage.addListener( function(message, sender, sendResponse) {
  if(message.from && message.from === "popup"){
    switch(message.action){



      case "blockPageClick":
        //console.log("Adding current page to blacklist..");
        chrome.storage.local.get("timer", function (items) {
          var currentTimerValue = 0;
          if(Object.values(items)[0] == undefined) {
            //Default
            currentTimerValue = defaultTimerValue;
          }
          else{
            currentTimerValue = parseInt(Object.values(items)[0]);
          }
          // Get the current tabs url
          chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
            var url = tabs[0].url;
            //console.log(url)
            blockURL = parseURL(url);
            if(blockURL != parsedRedirect && blockURL != "*://newtab/*") {
              //var currentTimeStamp = new Date();
              var save = {};
              var dt = new Date();
              //Add the current timer value
              var expireTime = dt.getTime() + (currentTimerValue*1000*60)
              save[blockURL] = expireTime;

              if(!checkUrl(blockURL)) {
                //The site is not currently blocked

                //Save url to blockedSites
               chrome.storage.local.get(["blockedSites"], function(items) {
                   var array = items["blockedSites"]?items["blockedSites"]:[];

                   var newArrEntry = {expireTime:expireTime, url:blockURL};
                   array.unshift(newArrEntry);

                   var jsonObj = {};
                   jsonObj["blockedSites"] = array;
                   chrome.storage.local.set(jsonObj, function() {
                       console.log("Blocked: " + blockURL);
                       blockedCount++;
                       updateIcon();
                       //Reload the current page
                       chrome.tabs.update({url: url});

                       //Tell popup.js to reload the current blocked list
                       chrome.runtime.sendMessage({from: "background", action: "blockPageClick"}, function(response) {
                       });
                   });
               });
              }
              else {
                //The site is already blocked
                console.log(blockURL + " is already blocked");
              }

            }
          });
        });
        break;










      case "blockListClick":
        //Block the block list and check if currently open tabs are blocked

        var save = {};
        var dt = new Date();
        chrome.storage.local.get("timer", function (items) {
          var currentTimerValue = 0;
          if(Object.values(items)[0] == undefined) {
            //Default
            currentTimerValue = defaultTimerValue;
          }
          else{
            currentTimerValue = parseInt(Object.values(items)[0]);
          }
          //Add the current timer value
          var expireTime = dt.getTime() + (currentTimerValue*1000*60)
          save["blockListExpiry"] = expireTime;

          chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
            //iterate through all tabs, if a tab url is found in listURLs then reload the tab
            chrome.storage.local.get("blockedSitesList", function (list) {
              // **** undefined check done in popup.js ****

              chrome.storage.local.set(save, function() {
                $('#redirectDiv').text("list blocked");
                var error = chrome.runtime.lastError;
                if (error) {
                  console.error(error);
                }
                else {
                  //console.log("List now blocked");
                  blockedCount = blockedCount + list.blockedSitesList.length;
                  updateIcon();

                  // Get the current tabs url
                  for(var i = 0; i < list.blockedSitesList.length; i++) {
                    //Iterate through the block list
                    //If the current tab is on a blocked url then reload
                    var listURL = parseUserURL(String(list.blockedSitesList[i].url));
                    var tabURL = parseUserURL(String(tabs[0].url));
                    if(listURL == tabURL) {
                      chrome.tabs.update(tabs[0].id, {url: tabs[0].url});
                    }
                  }

                  //Tell popup.js to reload the current blocked list
                  chrome.runtime.sendMessage({from: "background", action: "blockPageClick"}, function(response) {
                  });

                }
              });
            });
          });
        });
        break;

      case "timerChange":
        var save = {};
        save["timer"] = message.value;
        chrome.storage.local.set(save, function() {
          $('#redirectDiv').text("set time");
          var error = chrome.runtime.lastError;
          if (error) {
            console.error(error);
          }
          else {
            console.log("Set new timer value: " + message.value)
          }
        });
        break;

      case "unblockAllPagesClick":
        console.log("Clearing ALL storage (including timer)..");

        chrome.storage.local.clear(function() {
          $('#redirectDiv').text("Cleared");
          var error = chrome.runtime.lastError;
          if (error) {
            console.error(error);
          }
          else {
            console.log("CLEARED STORAGE")
          }
          //update();
        });
        break;

    } //end of switch

  }
  sendResponse({response: "Message received"});
  return true;
});



// **************************************
// **** LISTEN TO CHANGES IN STORAGE ****
// **************************************
/*
chrome.storage.onChanged.addListener(function(changes, namespace) {
  for (key in changes) {
    var storageChange = changes[key];
    console.log('Storage key "%s" in namespace "%s" changed. ' +
                'Old value was "%s", new value is "%s".', key, namespace,
                storageChange.oldValue, storageChange.newValue);
  }
});
*/




// *********************************
// **** CHECK IF URL IS BLOCKED ****
// *********************************








// *********************************
// **** CHECK IF URL IS BLOCKED ****
// *********************************
function checkUrl(pageURL) {
  //Returns true if the site is blocked

  var parsedURL = parseURL(pageURL);

  //Get expiry for block list
  chrome.storage.local.get("blockListExpiry", function (expiry) {

    var dt = new Date();
    var cTime = dt.getTime();
    //console.log(cTime);
    if(cTime < expiry.blockListExpiry) {
      listBlocked = true;
      //List expiry in date
      //console.log("LIST IS CURRENTLY BLOCKED");
      //Check if url exists in list
      chrome.storage.local.get("blockedSitesList", function (list) {
        //console.log(list.listURLs[0].url);
        var parsedListURL = parseUserURL(pageURL);
        console.log("check:" + parsedListURL);
        for(var i = 0; i < list.blockedSitesList.length; i++) {
          var tempURL = list.blockedSitesList[i].url;
          //Need to parse the url
          var check = parseUserURL(tempURL);
          if(check == parsedListURL) {
            var timeRemaining = Math.ceil((expiry.blockListExpiry-cTime) / 1000);
            var fullRedirectURL = redirectURL + "?timeRemaining=" + timeRemaining + "&blockedURL=" + parsedListURL;
            console.log("Blocked! (list) Redirecting..");
            chrome.tabs.update({url: fullRedirectURL});
            return true;
          }
        }
      });
    }
    else {
      listBlocked = false;
    }


    //get the currently blocked single sites
    chrome.storage.local.get("blockedSites", function (items) {
      if(items.blockedSites != undefined) {
        found = false;

        //Search blockedList for current URL
        var tempBlockedUrl = "";
        var blockedExpiryTime = 0;

        console.log(items.blockedSites.length);
        for(var i = 0; i < items.blockedSites.length; i++) {
          tempBlockedUrl = items.blockedSites[i].url;

          if(tempBlockedUrl == parsedURL) {
            //Current URL found

            //get expiry time for url
            blockedExpiryTime = items.blockedSites[i].expireTime;

            //calculate time remaining
            var timeRemaining = Math.ceil((blockedExpiryTime-cTime) / 1000);
            //console.log("Minutes Remaining:" + timeRemaining);

            if(timeRemaining >= 0) {
              var fullRedirectURL = redirectURL + "?timeRemaining=" + timeRemaining + "&blockedURL=" + parsedURL;
              console.log("Blocked! Redirecting..");
              chrome.tabs.update({url: fullRedirectURL});
              return true;
            }
            else {
              //console.log("Not blocked - block expired");
            }
          }
        }
        //If we make it here then the site is not blocked
        return false;
      }
      else {
        //console.log("No single sites are blocked");
      }

    });
  });
}


// *********************
// **** URL PARSING ****
// *********************

function parseURL(url) {

  //Always allow internal chrome pages
  if(url.indexOf("chrome") != -1) {
    console.log("Internal pages cannot be blocked.");
    return "";
  }

  //Find index after http://
  var sPos = url.indexOf("://")+3;
  //Find index of first /
  var ePos = url.indexOf("/", sPos);
  //Get the baseUrl
  if(ePos != -1) {
    var baseURL = url.substring(sPos, ePos);
  }
  else {
    var baseURL = url.substring(sPos);
  }
  //Find index of www.
  var wwwPos = baseURL.indexOf("www.");
  if(wwwPos != -1) {
    //Remove www. if present
    baseURL = baseURL.substring(wwwPos+4);
  }
  return baseURL;
}
function parseUserURL(url) {

  //Always allow internal chrome pages
  if(url.indexOf("chrome") != -1) {
    console.log("Internal pages cannot be blocked.");
    return "";
  }

  var baseURL = "";

  //Find index after http://
  var sPos = url.indexOf("://");
  if(sPos != -1) {
    //Find index of first /
    var ePos = url.indexOf("/", sPos+3);
  }
  else {
    //Find index of first /
    var ePos = url.indexOf("/");
  }

  //Get the baseUrl
  if(ePos != -1) {
    baseURL = url.substring(sPos+3, ePos);
  }
  else {
    baseURL = url.substring(sPos);
  }
  //Find index of www.
  var wwwPos = baseURL.indexOf("www.");
  if(wwwPos != -1) {
    //Remove www. if present
    baseURL = baseURL.substring(wwwPos+4);
  }


  //Get the inner domain ie, if we have "ie.yahoo.com" we need to get "yahoo.com"
  var urlArr = baseURL.split('.');
  var domain = urlArr[ urlArr.length - 2 ] + "." + urlArr[ urlArr.length - 1 ];
  return domain;
}




// ********************************************
// **** CHANGE ICON BASED ON CURRENT STATE ****
// ********************************************
function changeIcon(active) {
  if(active) {
    chrome.browserAction.setIcon({
      path : {
        "32": "img/icons/active_32.png"
      }
    });
  }
  else {
    chrome.browserAction.setIcon({
      path : {
        "32": "img/icons/not_active_32.png"
      }
    });
  }
}
function changeIconText(numberOfBlockedUrls) {
  if(numberOfBlockedUrls != 0) {
    chrome.browserAction.setBadgeText({text:String(numberOfBlockedUrls)});
  }
  else {
    chrome.browserAction.setBadgeText({text:""});
  }
}
function updateIcon() {
  changeIconText(blockedCount);
  if(blockedCount == 0) {
    changeIcon(false);
  }
  else {
    changeIcon(true);
  }
}


// ***********************************
// **** INTERVAL URL EXPIRY CHECK ****
// ***********************************

function intervalCheck(){
    console.log("INTERVAL CHECK..");

    //Re-Count the number of blocked urls (for the icon text)
    blockedCount = 0;

    chrome.storage.local.get(null, function (items) {
      console.log("LOCAL:");
      console.log(items);
    });

    //Get all currently blocked sites
    console.log("CURRENTLY BLOCKED:");

    //Check if list is blocked
    chrome.storage.local.get("blockListExpiry", function (items) {
      //Get current time
      var dt = new Date();
      var cTime = dt.getTime();
      //Get expiry time
      t = parseInt(Object.values(items)[0]);

      if(cTime < t) {
        chrome.storage.local.get("blockedSitesList", function (items) {
          if(items.blockedSitesList != undefined) {
            for(var i = 0; i < items.blockedSitesList.length; i++) {
              console.log(items.blockedSitesList[i].url);
              blockedCount++;
            }
            updateIcon(blockedCount);
          }
        });
      }
    });

    //Check all single site blocks and remove any outdated blocks
    chrome.storage.local.get("blockedSites", function (items) {
      if(items.blockedSites != undefined) {
        //Get current time
        var dt = new Date();
        var cTime = dt.getTime();

        for(var i = 0; i < items.blockedSites.length; i++) {
          //Get expiry time or this url
          t = items.blockedSites[i].expireTime;

          if(cTime < t) {
            console.log(items.blockedSites[i].url);
            blockedCount++;
          }
          else {
            //Expired entry
            //Remove the entry
            var newList = new Array();
            for(var j = 0; j < items.blockedSites.length; j++) {
              if (j != i) {
                newList.push(items.blockedSites[j]);
              }
            }
            var jsonObj = {};
            jsonObj['blockedSites'] = newList;
            chrome.storage.local.set(jsonObj, function() {
              chrome.storage.local.get('blockedSites', function (result) {
                console.log("Removed expired block entry");
                console.log(result.blockedSites)
                updateIcon(blockedCount);
              });
            });
          }
        }
      }
      updateIcon(blockedCount);
    });


    setTimeout(intervalCheck, 10000);
};


/*
function intervalCheck(){
    chrome.storage.local.get(null, function (items) {
      console.log("INTERVAL CHECK..");
      console.log("LOCAL:");
      console.log(items);

      var toRemove = [];
      //Get current time
      var dt = new Date();
      var cTime = dt.getTime();

      //Re-Count the number of blocked urls (for the icon text)
      blockedCount = 0;

      //Get list of blocked urls
      var t;
      for (i in items) {

        if(String(i) != "timer" && String(i) != "listURLs" && String(i) != "blockListExpiry" ) {
          //Get the time the block was set
          t = parseInt(Object.values(items)[0]);

          if(cTime > t) {
            //console.log("Outdated Entry!   Removing..");
            chrome.storage.local.remove(String(i), function(Items) {
              blockedCount--;
              //chrome.storage.local.get(null, function (items) {
                //console.log("NEW LOCAL:");
                //console.log(items);
              //});
            });
          }
          else {
            //console.log("Entry in date");
            blockedCount++;
          }
        }
        else if(String(i) == "blockListExpiry") {
          //check if list is expired
          var dt = new Date();
          var cTime = dt.getTime();
          //console.log(cTime);
          t = parseInt(Object.values(items)[0]);
          if(cTime < t) {
            //List expiry in date
            chrome.storage.local.get("blockedSitesList", function (list) {
                blockedCount = blockedCount + list.blockedSitesList.length;
                updateIcon(blockedCount);
            });
          }
        }
      };

    updateIcon(blockedCount);
  });
    setTimeout(intervalCheck, 10000);
}
*/
