// Static variables
var DBHOST = "10.0.75.1";
var DBPORT = "5984";
var DBURL = "https://" + DBHOST + ":" + DBPORT + "/data/_design/measurements/_view/byhour";


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
  xhttp.timeout = 500; // time in milliseconds
  xhttp.ontimeout = function(e) {
    console.error("Timeout, cannot contact ", DBURL)
    res("");
  }
  xhttp.send();
}

// Create specific table and size
function createCustomTable(elid, level, sensortype, station, timeunit, chartID){
  var d=new Date();
  var startparams;
  if (arguments[4] == "hour") {startparams=[sensortype, d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),d.getUTCHours()-1, d.getUTCMinutes(), station];}
  if (arguments[4] == "day") {startparams=[sensortype, d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()-1,d.getUTCHours(), d.getUTCMinutes(), station];}
  if (arguments[4] == "week") {startparams=[sensortype, d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),d.getUTCHours(), d.getUTCMinutes(), station];}
  if (arguments[4] == "month") {startparams=[sensortype, d.getUTCFullYear(),d.getUTCMonth()-1,d.getUTCDate(),d.getUTCHours(), d.getUTCMinutes(), station];}
  if (arguments[4] == "year") {startparams=[sensortype, d.getUTCFullYear()-1,d.getUTCMonth(),d.getUTCDate(),d.getUTCHours(), d.getUTCMinutes(), station];}
  if (arguments[4] == "all") {startparams=[sensortype, d.getUTCFullYear()-10,d.getUTCMonth(),d.getUTCDate(),d.getUTCHours(), d.getUTCMinutes(), station];}

	var endparams=[sensortype,{}];
  var unit = "";
  var unitName = arguments[2];
	var fullURL=DBURL+'?group_level=' + level + '&startkey='+ JSON.stringify(startparams)+'&endkey='+JSON.stringify(endparams);
  if (arguments[2] == "temp") {unit = " ℃";} else {unit = " %";}
  console.log("argument[2]=", unit, "startparams=", startparams);
  getData(fullURL, function (res){

      // loading dummy data
      if (!res && JSON.stringify(fullURL).indexOf('temp') >= 0){
        console.log("loading temp dummy data..");
        
        res = JSON.stringify({"rows":[
            {"key":["temp",2016,3,19,20,42,"station1"],"value":{"sum":99,"count":1,"min":99,"max":20,"sumsqr":9801}},
            {"key":["temp",2016,7,13,14,29,"station2"],"value":{"sum":27,"count":1,"min":27,"max":27,"sumsqr":729}},
            {"key":["temp",2016,7,13,15,16,"station1"],"value":{"sum":30,"count":1,"min":30,"max":30,"sumsqr":900}},
            {"key":["temp",2016,7,13,17,15,"station2"],"value":{"sum":25,"count":1,"min":25,"max":25,"sumsqr":625}},
            {"key":["temp",2016,9,14,10,31,"station3"],"value":{"sum":98,"count":1,"min":98,"max":26,"sumsqr":9604}}
            ]});
      }
      
     if (!res && JSON.stringify(fullURL).indexOf('humid') >= 0){
        console.log("loading humid dummy data..");
        
        res = JSON.stringify({"rows":[
            {"key":["humid",2016,3,19,20,42,"station1"],"value":{"sum":99,"count":1,"min":99,"max":60,"sumsqr":9801}},
            {"key":["humid",2016,7,13,14,29,"station2"],"value":{"sum":68,"count":1,"min":68,"max":68,"sumsqr":4624}},
            {"key":["humid",2016,7,13,15,16,"station1"],"value":{"sum":70,"count":1,"min":70,"max":70,"sumsqr":4900}},
            {"key":["humid",2016,7,13,17,15,"station2"],"value":{"sum":65,"count":1,"min":65,"max":65,"sumsqr":4225}},
            {"key":["humid",2016,9,14,10,31,"station3"],"value":{"sum":98,"count":1,"min":98,"max":75,"sumsqr":9604}}
            ]});
      }
      
      // create table
      var actualtable = "";
      var a = JSON.parse(res);
      var c = [];
      for (var i = 0; i < a.rows.length; i++) {
          var row = a.rows[i];
          var timestamp = row.key[3] + "-" + row.key[2] + "-" + row.key[1] + " " + row.key[4] + ":" + row.key[5];
          actualtable = actualtable + "<tr>" + "<td>" + timestamp + "</td>" + "<td>" + row.value.max + unit + "</td>" + "<td>" + row.key[6] + "</td>" + "</tr>";
          c.push({ time: timestamp, unitName: row.value.max});
      }
      
      // set output to HTML DOM
      setChart(chartID, c, unitName);
      setOutput(elid,actualtable);
      console.log("Output van actualtable:", elid, level, sensortype, station, timeunit);
      console.log("Full URL:", fullURL);
  });
}

// create chart
function setChart(id, data, unitName) {
  
    // set color lines
    if (unitName == "temp"){
      var lineColor = "red";
    } else {
      lineColor = "#42a4f4";
    }
    
    // empty current element
    setOutput(id, "");
    
    // homeChart settings
    var chart = new Morris.Line({
        element: id,
        data: [],
        xkey: 'time',
        ykeys: ['unitName'],
        lineColors: [lineColor],
        labels: [unitName],
        gridEnabled: false,
        parseTime: false,
        resize: true
    });
    
    chart.setData(data);
}

// Set innerHTMl value of elementByID
function setOutput(id,value){
  var el = document.getElementById(id);
  el.innerHTML = value;
}

// toggle navbar when collapsed
function toggled() {
  var expanded = $("#myNavbar").attr('aria-expanded')
  if (expanded == "true") {
    $('.navbar-toggle').click();
    console.log("toggled, aria-expanded was: ", expanded);
  }
}

// Load charts when document is ready
  $(document).ready(function() {
    
    // load home page initially
    $(".page").hide();
    $(".home").show();
    createCustomTable("currenttemp", "9", "temp", "station", "all", "homeChartTemp");
    createCustomTable("currenthumid", "9", "humid", "station", "all", "homeChartHumid");
    
    // load home page after click
    $("#hrefHome").click(function(){
      $(".page").hide();
      $(".home").show();
      createCustomTable("currenttemp", "9", "temp", "station", "all", "homeChartTemp");
      createCustomTable("currenthumid", "9", "humid", "station", "all", "homeChartHumid");
    });
    
    // load maintenance page after click
    $("#hrefMaintenance").click(function(){
      $(".page").hide();
      $(".maint").show();
      toggled();
    });
    
    // load about page after click
    $("#hrefAbout").click(function(){
      $(".page").hide();
      $(".about").show();
      toggled();
    });
});

