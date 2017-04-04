// Static variables
var DBHOST = "10.0.75.1";
var DBPORT = "5984";
var DBURL = "http://" + DBHOST + ":" + DBPORT + "/data/_design/measurements/_view/byhour";

// Get DB data from url and send back data
function getData(url,res){
   var xhttp = new XMLHttpRequest();
   xhttp.onreadystatechange = function() {
     if (xhttp.readyState == 4 && xhttp.status == 200) {
          console.log("data received (200) from: " + DBHOST + " on port: " + DBPORT);
          res(xhttp.responseText);
        }
        if (xhttp.readyState == 4 && xhttp.status == 404) {
          console.log("connection failed, no response from URL:", url);
        }
  };
  xhttp.open("GET", url, true);
  xhttp.send();
}

// Create specific table and size
function createCustomTable(elid, level, sensortype, station, timeunit){
  var d=new Date();
  if (arguments[4] == "hour") {startparams=[sensortype, d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),d.getUTCHours()-1, d.getUTCMinutes(), station];}
  if (arguments[4] == "day") {startparams=[sensortype, d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()-1,d.getUTCHours(), d.getUTCMinutes(), station];}
  if (arguments[4] == "week") {startparams=[sensortype, d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),d.getUTCHours(), d.getUTCMinutes(), station];}
  if (arguments[4] == "month") {startparams=[sensortype, d.getUTCFullYear(),d.getUTCMonth()-1,d.getUTCDate(),d.getUTCHours(), d.getUTCMinutes(), station];}
  if (arguments[4] == "year") {startparams=[sensortype, d.getUTCFullYear()-1,d.getUTCMonth(),d.getUTCDate(),d.getUTCHours(), d.getUTCMinutes(), station];}
  if (arguments[4] == "all") {startparams=[sensortype, d.getUTCFullYear()-10,d.getUTCMonth(),d.getUTCDate(),d.getUTCHours(), d.getUTCMinutes(), station];}

	var endparams=[sensortype,{}];
  var unit = "";
	var fullURL=DBURL+'?group_level=' + level + '&startkey='+ JSON.stringify(startparams)+'&endkey='+JSON.stringify(endparams);
  if (arguments[2] == "temp") {unit = " ℃";} else {unit = " %";}
  console.log("argument[2]=", unit, "startparams=", startparams);
  getData(fullURL, function (res){
      var actualtable = "";
      var a = JSON.parse(res);
      for (var i = 0; i < a.rows.length; i++) {
          var row = a.rows[i];
          var timestamp = row.key[3] + "-" + row.key[2] + "-" + row.key[1] + " " + row.key[4] + ":" + row.key[5];
          actualtable = actualtable + "<tr>" + "<td>" + timestamp + "</td>" + "<td>" + row.value.max + unit + "</td>" + "<td>" + row.key[6] + "</td>" + "</tr>";
      }
      setOutput(elid,actualtable);
      console.log("Output van actualtable:", elid, level, sensortype, station, timeunit);
      console.log("Full URL:", fullURL);
  });
}


// Set innerHTMl value of elementByID
function setOutput(id,value){
  var el = document.getElementById(id);
  el.innerHTML = value;
}

// Load charts when document is ready
  $(document).ready(function() {
    createCustomTable("currenttemp", "9", "temp", "station", "all");
    createCustomTable("currenthumid", "9", "humid", "station", "all");
});
