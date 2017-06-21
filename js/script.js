// Static variables
var DBHOST = "192.168.178.2";
var DBPORT = "5984";
var DBURL = "https://" + DBHOST + ":" + DBPORT + "/weerdb/_design/measurements/_view/";


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
  xhttp.timeout = 100; // time in milliseconds
  xhttp.ontimeout = function(e) {
    console.error("Timeout, cannot contact ", DBURL);
    res("");
  };
  xhttp.onerror = function () {
    console.log("** An error occurred during the transaction");
    res("");
};
  xhttp.send();
}

// Create specific table and size
function createCustomTable(elid, level, sensortype, station, timeunit, chartID, view){
  var d=new Date();
  var startparams;
  if (arguments[4] == "10min") {startparams=[sensortype, station, "timestamphere", d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate(),d.getUTCHours()+2, d.getUTCMinutes()-10, station];}
  if (arguments[4] == "hour") {startparams=[sensortype, d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate(),d.getUTCHours()+1, d.getUTCMinutes(), station];}
  if (arguments[4] == "day") {startparams=[sensortype, d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate()-1,d.getUTCHours()+2, d.getUTCMinutes(), station];}
  if (arguments[4] == "week") {startparams=[sensortype, d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate(),d.getUTCHours()+2, d.getUTCMinutes(), station];}
  if (arguments[4] == "month") {startparams=[sensortype, d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),d.getUTCHours()+2, d.getUTCMinutes(), station];}
  if (arguments[4] == "year") {startparams=[sensortype, d.getUTCFullYear()-1,d.getUTCMonth()+1,d.getUTCDate(),d.getUTCHours()+2, d.getUTCMinutes(), station];}
  if (arguments[4] == "all") {startparams=[sensortype, d.getUTCFullYear()-10,d.getUTCMonth()+1,d.getUTCDate(),d.getUTCHours()+2, d.getUTCMinutes(), station];}

	var endparams=[sensortype,{}];
  var unit = "";
  var unitName = arguments[2];
	var fullURL=DBURL+ view +'?group_level=' + level + '&startkey='+ JSON.stringify(startparams)+'&endkey='+JSON.stringify(endparams);
  if (arguments[2] == "temp") {unit = " ℃";} else {unit = " %";}
  console.log("argument[2]=", unit, "startparams=", startparams);
  getData(fullURL, function (res){

      // loading dummy data
      if (!res && JSON.stringify(fullURL).indexOf('temp') >= 0){
        console.log("loading temp dummy data..");
        
        res = JSON.stringify(dummy10minTemp);
      }
      
     if (!res && JSON.stringify(fullURL).indexOf('humid') >= 0){
        console.log("loading humid dummy data..");
        
        res = JSON.stringify(dummy10minHumid);
      }
      
      // create table
      var actualtable = "";
      var a = JSON.parse(res);
      var c = [];
      for (var i = 0; i < a.rows.length; i++) {
          var row = a.rows[i];
          var epoch = row.key[2] + 172800000;
          var timestamp = new Date(epoch).toLocaleString();
          actualtable = actualtable + "<tr>" + "<td>" + timestamp + "</td>" + "<td>" + row.value.max + unit + "</td>" + "<td>" + row.key[6] + "</td>" + "</tr>";
          c.push({ time: timestamp, unitName: row.value.max});
      }
      
      // set output to HTML DOM
      if (chartID) {
        setChart(chartID, c, unitName, unit);
      }
      setOutput(elid,actualtable);
      console.log("Output van actualtable:", elid, level, sensortype, station, timeunit);
      console.log("Full URL:", fullURL);
  });
}

// create chart
function setChart(id, data, unitName, unit) {
  
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
        postUnits: unit,
        lineColors: [lineColor],
        labels: [unitName],
        grid: true,
        parseTime: false,
        resize: true,
    });
    
    chart.setData(data);
}

// create overview chart
 // example: setChartOverview("weekChart", "station1", "6", "lastweek");
 
function setChartOverview(chartId, station, level, view, unitName) {
  
  var startparams;
  if (view == "10min") {startparams=[unitName, station]; view = "last10min";}
  if (view == "lasthour") {startparams=[unitName,station]; view = "lasthour";}
  if (view == "lastday") {startparams=[unitName,station]; view = "lastday";}
  if (view == "lastweek") {startparams=[unitName,station]; view = "lastweek";}
  if (view == "lastmonth") {startparams=[unitName,station]; view = "lastmonth";}
  if (view == "lastyear") {startparams=[unitName,station]; view = "lastyear";}
  if (view == "all") {startparams=[unitName,station]; view = "all";}
  

	var endparams=[unitName,{}];
	var fullURL=DBURL+ view +'?group_level=' + level + '&startkey='+ JSON.stringify(startparams)+'&endkey='+JSON.stringify(endparams);

  console.log("startparams=", startparams);
  getData(fullURL, function (res){

      // loading dummy data
      if (!res){
        console.log("loading dummy data");
        
        if (fullURL.includes("temp")) { 
          var unit = " ℃";
          if (fullURL.includes("week")) {
              res = JSON.stringify(dummyWeekTemp);
          }
          if (fullURL.includes("month")) {
              res = JSON.stringify(dummyMonthTemp);
          }
        }
        
        if (fullURL.includes("humid")) { 
          var unit = " %";
          if (fullURL.includes("week")) {
              res = JSON.stringify(dummyWeekHumid);
          }
          if (fullURL.includes("month")) {
              res = JSON.stringify(dummyMonthHumid);
          }
        }
      }
      
      var a = JSON.parse(res);
      var data = [];
      for (var i = 0; i < a.rows.length; i++) {
          var row = a.rows[i];
          var unitName = row.key[0];
          
          // building the datetime string
          if (row.key[3] < 10 ) {row.key[3] = "0" + row.key[3]}; // add extra 0 before the month for creating a proper timestring
          if (fullURL.includes("month")) {
              var hours = "T00:00:00";
              var timestring = row.key[2] + "-" + row.key[3] + "-" + row.key[4];
              var timestamp = (new Date(timestring)).toLocaleDateString();
          }
          if (fullURL.includes("week")) {
              if (row.key[5] < 10 ) {row.key[5] = "0" + row.key[5]}; // add extra 0 before the hour for creating a proper timestring
              var timestring = row.key[2] + "-" + row.key[3] + "-" + row.key[4] + "T" + row.key[5] + ":" + "00" + ":" + "00";
              var timestamp = (new Date(timestring)).toLocaleString();
          }
          
          // push values to chart array
          if (unitName === "temp") {data.push({ time: timestamp, temp: row.value.max});};
          if (unitName === "humid") {data.push({ time: timestamp, humid: row.value.max});};
          console.log("time: ", timestamp, " unitName: ", unitName, " value: ", row.value.max );
      }
      
      // create chart

      // empty current element
      setOutput(chartId, "");
      
      // set color lines
      if (unitName == "temp"){
          var lineColor = "red";
      } else {
          lineColor = "#42a4f4";
      }
        
      // homeChart settings
      var chart = new Morris.Line({
          element: chartId,
          data: data,
          xkey: 'time',
          ykeys: [unitName],
          postUnits: unit,
          lineColors: [lineColor],
          labels: [unitName],
          grid: true,
          parseTime: false,
          resize: true,
      });
  });
}


// get station alias
function getAlias() {
  getData(DBURL, function(res){
    var table = "<tr> <th>Station</th> <th>Huidge alias</th> </tr>";
    
    // load dummy data if res is empty
    if (!res){
      
      console.log("could not load alias data, loading dummy data");
      
      // create dummy table
      table = table + "<tr id=" + "aliasRow" + ">" + "<td>" + "station1" + "</td>" + "<td>" + "</td>" + "</tr>";
      table = table + "<tr id=" + "aliasRow" + ">" + "<td>" + "station2" + "</td>" + "<td>" + "</td>" + "</tr>";
      table = table + "<tr id=" + "aliasRow" + ">" + "<td>" + "station3" + "</td>" + "<td>" + "</td>" + "</tr>";
      
    } else {
      
      // parse response
      var a = JSON.parse(res);
      
      // iterate to response and contruct table.
      for (var i=0; i<a.rows.length; i++) {
        var row = a.rows[i];
        table = table + "<tr>" + "<td>" + row.key + "</td>" + "<td>" + row.value.alias + "</td>" + "</tr>";
      }
    }
    
    // output table to element
    setOutput("aliasTable", table);
  });
}

// Create vanaf date
function setVanaf(vanaf, elid) {
  
  if (vanaf == "week"){
      var d = "vanaf " + moment().subtract(7, 'days').calendar() + ", max waarde per uur";
  }
  if (vanaf == "maand"){
      var d = "vanaf " + moment().subtract(1, 'months').calendar() + ", max waarde per dag";
  }
  if (vanaf == "jaar"){
      var d = "vanaf " + moment().subtract(1, 'years').calendar() + ", max waarde per maand";
  }
  
  setOutput(elid,d);
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
    createCustomTable("currenttemp", "9", "temp", "station1", "10min", "homeChartTemp", "last10min");
    createCustomTable("currenthumid", "9", "humid", "station1", "10min", "homeChartHumid", "last10min");
    
    // load home page after click
    $("#hrefHome").click(function(){
      $(".page").hide();
      $(".home").show();
      createCustomTable("currenttemp", "9", "temp", "station1", "10min", "homeChartTemp", "last10min");
      createCustomTable("currenthumid", "9", "humid", "station1", "10min", "homeChartHumid", "last10min");
      toggled();
    });
    
    // load maintenance page after click
    $("#hrefMaintenance").click(function(){
      $(".page").hide();
      $(".maint").show();
      toggled();
      getAlias();
    });
    
    // load about page after click
    $("#hrefAbout").click(function(){
      $(".page").hide();
      $(".about").show();
      toggled();
    });
    
    // load week page after click
    $("#hrefWeek").click(function(){
      $(".page").hide();
      $(".weeksum").show();
      setVanaf("week", "vanafWeek");
      setChartOverview("weekChartTemp", "station1", "6", "lastweek", "temp");
      setChartOverview("weekChartHumid", "station1", "6", "lastweek", "humid");
      toggled();
    });
    
    // load maand page after click
    $("#hrefMonth").click(function(){
      $(".page").hide();
      $(".maandsum").show();
      setVanaf("maand", "vanafMaand");
      setChartOverview("maandChartTemp", "station1", "5", "lastmonth", "temp");
      setChartOverview("maandChartHumid", "station1", "5", "lastmonth", "humid");
      toggled();
    });
    
    
    // Alias name pick
    $(document).on("click", "#aliasRow", function(){
      // get the text from the row data
      var aliasPick = ($(this).text());
      document.getElementById("aliasInput").value = aliasPick;
    });
});

