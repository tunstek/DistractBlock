
$(document).ready(function() {
  //Retrive the GET data (minutesRemaining and the blockedURL)
  var minArr = window.location.search.substr(1).split("=");
  var secondsRemainingArr = minArr[1].split("&");
  var secondsRemaining = secondsRemainingArr[0];
  var minutes = secondsRemaining/60;

  //$("#timeRemainingDiv").text(minutes + " Minutes Remaining");
  display = $('#timeRemainingDiv');
  startTimer(secondsRemaining, display);

  var blockedURL = window.location.search.substr(1).split("=")[2];
  $("#header").prepend(blockedURL);

  $.getJSON("quotes.json", function(json) {
    console.log(json); // this will show the info it in firebug console
    var index = Math.floor(Math.random() * (json.length - 1));
    $("#quote").append("\"" + json[index].text + "\"<br> - " + json[index].from);
  });
});




function startTimer(duration, display) {
    var timer = duration, minutes, seconds;
    var count = true;
    setInterval(function () {
        minutes = parseInt(timer / 60, 10)
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        if(count) {
          display.text("Time Remaining: " + minutes + ":" + seconds);
        }
        else {
          display.text("Time Remaining: " + '00' + ":" + '00');
        }

        if (--timer < 0) {
            count = false;
            //Redirect to previously blocked page
            window.history.back();
        }
    }, 1000);
}
