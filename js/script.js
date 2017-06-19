// Static variables
var DBHOST = "192.168.178.2";
var DBPORT = "5984";
var DBURL = "http://" + DBHOST + ":" + DBPORT + "/weerdb/_design/measurements/_view/byhour";


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
  xhttp.send();
}

// Create specific table and size
function createCustomTable(elid, level, sensortype, station, timeunit, chartID){
  var d=new Date();
  var startparams;
  if (arguments[4] == "hour") {startparams=[sensortype, d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),d.getUTCHours()-1, d.getUTCMinutes(), station];}
  if (arguments[4] == "day") {startparams=[sensortype, d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()-1,d.getUTCHours(), d.getUTCMinutes(), station];}
  if (arguments[4] == "week") {startparams=[sensortype, d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()-7,d.getUTCHours(), d.getUTCMinutes(), station];}
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
            {"key":["temp",2016,3,19,20,1,"station1",1458420160000],"value":{"sum":99,"count":1,"min":99,"max":20,"sumsqr":9801}},
            {"key":["temp",2016,7,13,14,29,"station2",1468420180000],"value":{"sum":27,"count":1,"min":27,"max":27,"sumsqr":729}},
            {"key":["temp",2016,7,13,15,16,"station1",1468423000000],"value":{"sum":30,"count":1,"min":30,"max":30,"sumsqr":900}},
            {"key":["temp",2016,7,13,17,15,"station2",1468430140000],"value":{"sum":25,"count":1,"min":25,"max":25,"sumsqr":625}},
            {"key":["temp",2016,9,14,10,31,"station3",1473849100000],"value":{"sum":98,"count":1,"min":98,"max":26,"sumsqr":9604}},            
            ]});
      }
      
     if (!res && JSON.stringify(fullURL).indexOf('humid') >= 0){
        console.log("loading humid dummy data..");
        
        res = JSON.stringify({"rows":[
            {"key":["humid",2016,3,19,20,42,"station1",1458420160000],"value":{"sum":99,"count":1,"min":99,"max":60,"sumsqr":9801}},
            {"key":["humid",2016,7,13,14,29,"station2",1468420180000],"value":{"sum":68,"count":1,"min":68,"max":68,"sumsqr":4624}},
            {"key":["humid",2016,7,13,15,16,"station1",1468423000000],"value":{"sum":70,"count":1,"min":70,"max":70,"sumsqr":4900}},
            {"key":["humid",2016,7,13,17,15,"station2",1468430140000],"value":{"sum":65,"count":1,"min":65,"max":65,"sumsqr":4225}},
            {"key":["humid",2016,9,14,10,31,"station3",1473849100000],"value":{"sum":98,"count":1,"min":98,"max":75,"sumsqr":9604}}
            ]});
      }
      
      // create table
      var actualtable = "";
      var a = JSON.parse(res);
      var c = [];
      for (var i = 0; i < a.rows.length; i++) {
          var row = a.rows[i];
          var epoch = row.key[7] + 172800000;
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
function setChartOverview(chartId, station, level, timeunit) {
  var d=new Date();
  var startparams;
  if (arguments[4] == "hour") {startparams=[d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),d.getUTCHours()-1, d.getUTCMinutes(), station];}
  if (arguments[4] == "day") {startparams=[d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()-1,d.getUTCHours(), d.getUTCMinutes(), station];}
  if (arguments[4] == "week") {startparams=[d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()-7,d.getUTCHours(), d.getUTCMinutes(), station];}
  if (arguments[4] == "month") {startparams=[d.getUTCFullYear(),d.getUTCMonth()-1,d.getUTCDate(),d.getUTCHours(), d.getUTCMinutes(), station];}
  if (arguments[4] == "year") {startparams=[d.getUTCFullYear()-1,d.getUTCMonth(),d.getUTCDate(),d.getUTCHours(), d.getUTCMinutes(), station];}
  if (arguments[4] == "all") {startparams=[d.getUTCFullYear()-10,d.getUTCMonth(),d.getUTCDate(),d.getUTCHours(), d.getUTCMinutes(), station];}

	var endparams=[{}];
	var fullURL=DBURL+'?group_level=' + level + '&startkey='+ JSON.stringify(startparams)+'&endkey='+JSON.stringify(endparams);

  console.log("startparams=", startparams);
  getData(fullURL, function (res){

      // loading dummy data
      if (!res){
        console.log("loading dummy data..");
        
        
        //RESPSONSE AANPASSEN ZODAT HUMID EN TEMP IN ÉÉN RESPONSE ZITTEN, DAARNA IN DATA PUSH BEIDE VALUES OPNEMEN
        res = JSON.stringify({"rows":[
            {"key":["temp",2016,3,19,20,42,"station1",1458420160000],"value":{"sum":99,"count":1,"min":99,"max":20,"sumsqr":9801}},
            {"key":["temp",2016,7,13,14,29,"station2",1468420180000],"value":{"sum":27,"count":1,"min":27,"max":27,"sumsqr":729}},
            {"key":["temp",2016,7,13,15,16,"station1",1468423000000],"value":{"sum":30,"count":1,"min":30,"max":30,"sumsqr":900}},
            {"key":["temp",2016,7,13,17,15,"station2",1468430140000],"value":{"sum":25,"count":1,"min":25,"max":25,"sumsqr":625}},
            {"key":["temp",2016,9,14,10,31,"station3",1473849100000],"value":{"sum":98,"count":1,"min":98,"max":26,"sumsqr":9604}},
            {"key":["humid",2016,3,19,20,42,"station1",1458420160000],"value":{"sum":99,"count":1,"min":99,"max":60,"sumsqr":9801}},
            {"key":["humid",2016,7,13,14,29,"station2",1468420180000],"value":{"sum":68,"count":1,"min":68,"max":68,"sumsqr":4624}},
            {"key":["humid",2016,7,13,15,16,"station1",1468423000000],"value":{"sum":70,"count":1,"min":70,"max":70,"sumsqr":4900}},
            {"key":["humid",2016,7,13,17,15,"station2",1468430140000],"value":{"sum":65,"count":1,"min":65,"max":65,"sumsqr":4225}},
            {"key":["humid",2016,9,14,10,31,"station3",1473849100000],"value":{"sum":98,"count":1,"min":98,"max":75,"sumsqr":9604}}
            ]});
      }
      
      var a = JSON.parse(res);
      var data = [];
      for (var i = 0; i < a.rows.length; i++) {
          var row = a.rows[i];
          var unitName = row.key[0];
          var epoch = row.key[7] + 172800000;
          var timestamp = new Date(epoch).toLocaleString();
          data.push({ time: timestamp, temp: row.value.max, humid: 75});
          console.log("time: ", timestamp, " unitName: ", unitName, " value: ", row.value.max );
      }
      
      // create chart

      // empty current element
      setOutput(chartId, "");
      
      // homeChart settings
      var chart = new Morris.Line({
          element: chartId,
          data: data,
          xkey: 'time',
          ykeys: ['temp', 'humid'],
          //postUnits: ['C','%'],
          lineColors: ['red', '#42a4f4'],
          labels: ['temp', 'humid'],
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
      var d = "vanaf " + moment().subtract(7, 'days').calendar();
      console.log("vanaf tijd: ", d);
  }
  if (vanaf == "maand"){
      var d = moment().subtract(1, 'months').calendar();
  }
  if (vanaf == "jaar"){
      var d = moment().subtract(1, 'years').calendar();
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
    createCustomTable("currenttemp", "9", "temp", "station", "all", "homeChartTemp");
    createCustomTable("currenthumid", "9", "humid", "station", "all", "homeChartHumid");
    
    // load home page after click
    $("#hrefHome").click(function(){
      $(".page").hide();
      $(".home").show();
      createCustomTable("currenttemp", "9", "temp", "station", "all", "homeChartTemp");
      createCustomTable("currenthumid", "9", "humid", "station", "all", "homeChartHumid");
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
    
    // load about page after click
    $("#hrefWeek").click(function(){
      $(".page").hide();
      $(".weeksum").show();
      setVanaf("week", "vanafWeek");
      setChartOverview("weekChart", "station", "9", "all");
      toggled();
    });
    
    
    // Alias name pick
    $(document).on("click", "#aliasRow", function(){
      // get the text from the row data
      var aliasPick = ($(this).text());
      document.getElementById("aliasInput").value = aliasPick;
    });
});

