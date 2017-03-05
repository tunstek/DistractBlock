console = chrome.extension.getBackgroundPage().console;
var listBlocked = false;
//Initially hide the block list
$('#listDiv').hide();
$('#blockedList').hide();

$( document ).ready(function() {
  //Check if there is currently a block in place
  chrome.storage.local.get('blockListExpiry', function (expiry) {
    if(expiry.blockListExpiry != undefined) {
      var dt = new Date();
      var cTime = dt.getTime();
      if(expiry.blockListExpiry-cTime > 0) {
        $('#blockList').attr("disabled", true);
        listBlocked = true;
        display = $('#blockListTimeRemainingDiv');
        startListTimer(((expiry.blockListExpiry-cTime) / 1000), display);
      }
      else {
        $('#blockList').attr("disabled", false);
        listBlocked = false;
      }
    }
    else {
      $('#blockList').attr("disabled", false);
    }
  });


  //Set the drop down to the correct value
  chrome.storage.local.get("timer", function (items) {
    var currentTimerValue = Object.values(items)[0];
    var options= document.getElementById('selectTime').options;
    for (var i= 0; i < options.length; i++) {
      if (options[i].value==currentTimerValue) {
          options[i].selected= true;
          break;
        }
      }
    });

    //On select change, save timer value to storage
    $('select').on('change', function() {
      var newVal = this.value;
      chrome.runtime.sendMessage({from: "popup", action: "timerChange", value: newVal}, function(response) {
        //$('#redirectDiv').text("Updated:" + newVal);
      });
    })

    //Check for button clicks
    document.getElementById('blockSite').addEventListener('click', function(){
      chrome.runtime.sendMessage({from: "popup", action: "blockPageClick"}, function(response) {
        //$('#redirectDiv').text("Blocked");
      });
    });
    document.getElementById('blockList').addEventListener('click', function(){
      chrome.storage.local.get("blockedSitesList", function (list) {
        if(list.blockedSitesList != undefined && list.blockedSitesList.length > 0) {
          chrome.runtime.sendMessage({from: "popup", action: "blockListClick"}, function(response) {
            //$('#redirectDiv').text("Blocked List");
            listBlocked = true;
            chrome.storage.local.get("timer", function (items) {
              var currentTimerValue = 0;
              if(Object.values(items)[0] == undefined) {
                currentTimerValue = 20;
              }
              else {
                currentTimerValue = Object.values(items)[0];
              }
              display = $('#blockListTimeRemainingDiv');
              startListTimer((currentTimerValue * 60), display);
              $('#blockList').attr("disabled", true);
            });
          });
        }
        else {
          //Message that the list is empty
          $("#blockListTimeRemainingDiv").text("Block list is empty!");
          //Open the edit panel
          $('#listDiv').show();
        }
      });
    });
    document.getElementById('editBlockList').addEventListener('click', function(){
      chrome.storage.local.get('blockedSitesList', function (result) {
        if(result.blockedSitesList != undefined) {
          console.log(result.blockedSitesList)
          if(result.blockedSitesList.length != 0) {
            var temp = "";
            for(var i = 0; i < result.blockedSitesList.length; i++) {
              temp = temp + '<li>' + result.blockedSitesList[i].url + '</li>';
            }
            $("#list").html(temp);
          }

          var display = $('#blockListTimeRemainingDiv');
          chrome.storage.local.get('blockListExpiry', function (expiry) {
            if(expiry.blockListExpiry != undefined) {
              var dt = new Date();
              var cTime = dt.getTime();
              if(expiry.blockListExpiry-cTime > 0) {
                listBlocked = true;
                startListTimer(((expiry.blockListExpiry-cTime) / 1000), display);
              }
            }
            else {
              listBlocked = false;
            }
          });
        }
        else {
          console.log("blockedSitesList is UNDEFINED");
        }

        $('#listDiv').toggle();
        $("#userEnteredURL").focus();
      });
    });
    document.getElementById('showBlocked').addEventListener('click', function(){

      var listTemp = "";
      var tempUrl = "";



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
              //console.log(items.blockedSites[i].url);
              //Remove start and end of parsedURL
              tempUrl = items.blockedSites[i].url;
              listTemp = listTemp + "<li>" + tempUrl + "</li>";
            }
          }
          //Append list
          //$("#currentBlockedList").html(listTemp);
        }

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
                  //console.log(items.blockedSitesList[i].url);
                  tempUrl = items.blockedSitesList[i].url
                  listTemp = listTemp + "<li>" + tempUrl + "</li>";
                }
                //Append list
                if(listTemp != "") {
                  $("#currentBlockedList").html(listTemp);
                }
                else {
                  $("#currentBlockedList").html("No sites blocked");
                }
              }
            });
          }
          else {
            //Append list
            if(listTemp != "") {
              $("#currentBlockedList").html(listTemp);
            }
            else {
              $("#currentBlockedList").html("No sites blocked");
            }
          }
        });
      });

      $('#blockedList').toggle();
  });

/*      *********** DEBUG *************
  document.getElementById('unblockAllPages').addEventListener('click', function(){
    chrome.runtime.sendMessage({from: "popup", action: "unblockAllPagesClick"}, function(response) {
      $('#redirectDiv').text("Cleared");
    });
  });
/*       ******************************/

  //Check for list element click (to remove element)
  $("#listDiv").on("click", "li", function() {
    if(!listBlocked) {
      var clickedURL = $(this).text();
      $(this).text("");
      //Remove the clicked entry
      chrome.storage.local.get("blockedSitesList", function (result) {
        var blockedSitesList = result.blockedSitesList;
        var newList = new Array();
        for(var i = 0; i < blockedSitesList.length; i++) {
          if (blockedSitesList[i].url != clickedURL) {
            newList.push({url: blockedSitesList[i].url})
          }
        }
        chrome.storage.local.set({blockedSitesList: newList}, function () {
          chrome.storage.local.get('blockedSitesList', function (result) {
              console.log("Removed list entry");
            });
          });
        });
      }
      else {
        console.log("List Blocked!");
      }
    });



    //Check if the user is adding a new url to the list
    document.getElementById('listAdd').addEventListener('click', function(){
      console.log("CLICK");
      if(!listBlocked) {
        var newURL = $('#userEnteredURL').val();
        console.log(newURL);

        // ******* COULD PARSE THE URL HERE INSTEAD ********
        if(newURL != "") {

          //Save url to blockedSitesList
          chrome.storage.local.get(["blockedSitesList"], function(items) {

            if(items.blockedSitesList == undefined) {
              console.log("HERE UNDEFINED");
            }
            else {
              console.log("LIST:");
              console.log(items);
            }

            var array = items["blockedSitesList"]?items["blockedSitesList"]:[];

            //Check if url is already present
            var found = false;
            for(var i = 0; i < array.length; i++) {
              if (array[i].url == newURL) {
                found = true;
                break;
              }
            }

            if(!found) {

              //Display the new url in the list
              $("#listDiv ul").append('<li>' + newURL + '</li>');

              //Enpty the text input
              $("#userEnteredURL").val("");

              // set the new array value to the same key
              var newArrEntry = {url:newURL};
              array.unshift(newArrEntry);

              var jsonObj = {};
              jsonObj["blockedSitesList"] = array;

              chrome.storage.local.set(jsonObj, function() {
                  console.log("Saved: " + newURL + " to list");
                });
              }
              else {
                console.log("URL already present in list");
              }


            });


          } //end blank entry check
        }
        else {
          console.log("List is currently blocked");
        }
      });
      //Check for enter key (instead of using save button)
      $('#userEnteredURL').keydown(function(event) {
        // enter has keyCode = 13, change it if you want to use another button
        if (event.keyCode == 13) {
          //click #listAdd
          $("#listAdd").trigger( "click" );
        }
      });



});






// ********************************************
// **** LISTEN TO CHANGES IN BACKGROUND.JS ****
// ********************************************
chrome.runtime.onMessage.addListener( function(message, sender, sendResponse) {
  if(message.from && message.from === "background"){
    console.log("message received");
    switch(message.action){

      case "blockPageClick":
        $("#showBlocked").trigger( "click" );
        $("#showBlocked").trigger( "click" );
        break;
    }
  }
});







function startListTimer(duration, display) {
  listBlocked = true;
  var timer = duration, minutes, seconds;
  var count = true;
  setInterval(function () {
    minutes = parseInt(timer / 60, 10)
    seconds = parseInt(timer % 60, 10);

    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    if(count) {
      display.text("List Blocked: " + minutes + ":" + seconds);
      listBlocked = true;
      $('#blockList').attr("disabled", true);
    }
    else {
      display.text("");
      listBlocked = false;
    }

    if (--timer < 0) {
        count = false;
        $('#blockList').attr("disabled", false);
        listBlocked = false;
      }
    }, 1000);
  }
