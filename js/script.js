// Static variables
var DBHOST = "192.168.178.2";
var DBPORT = "5984";
var DBNAME = "weerdb"
var DBCONFIG = "weerdbconfig"
var DBURL = "https://" + DBHOST + ":" + DBPORT + "/weerdb/_design/measurements/_view/";
var DBURLSimple = "https://" + DBHOST + ":" + DBPORT + "/" + DBNAME + "/";
var DBURLConfig = "https://" + DBHOST + ":" + DBPORT + "/" + DBCONFIG + "/";


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
  xhttp.timeout = 2000; // time in milliseconds
  xhttp.ontimeout = function(e) {
    console.error("Timeout, cannot contact ", url);
    res("");
  };
  xhttp.onerror = function () {
    console.log("** An error occurred during the transaction");
    res("");
};
  xhttp.send();
}


// HOME NOW READINGS
// Example: nowReading("currentTemp", "station1", "temp" );
function nowReading(elid, station, unitName) {
  var startparams=[unitName, station];
	var endparams=[unitName,{}];
	var fullURL= DBURLSimple + "_all_docs?limit=1&include_docs=true&descending=true";
	
  if (unitName == "temp") {var unit = " Celsius";} else { unit = " %";}1;
  console.log("nowReading - unit=", unit, "startparams=", startparams, "FullURL: ", fullURL);
  
  // Get request
  getData(fullURL, function (res){

      // loading dummy data in case of no response
      if (!res ){
        console.log("loading temp dummy data..");
        
        res = JSON.stringify(dummyNow);
      }
      
      
      var a = JSON.parse(res);
      var row = a.rows[0];
      if (unitName == "temp") {var measurement = row.doc.temp;} else {measurement = row.doc.humid;}
      var epoch = (row.doc.timestamp)*1000;
      var d = new Date(epoch);
      var back = (d.getTimezoneOffset())*60*1000;
      var t = d.getTime() + back;
      var timestamp = new Date(t).toLocaleString();
      
      setOutput(elid, measurement + unit);
      setOutput("nowDate", "");
      setOutput("nowDate", timestamp);
  });
}


// CREATE HOME CHART
// Example: setHomeChart("6", "temp", "station1", "homeChartTemp", "lastday");
function setHomeChart(level, unitName, station, chartID, view){
  var startparams=[unitName, station];
	var endparams=[unitName,{}];
	var fullURL=DBURL+ view +'?group_level=' + level + '&startkey='+ JSON.stringify(startparams)+'&endkey='+JSON.stringify(endparams);
  if (unitName == "temp") {var unit = " ℃";} else { unit = " %";}1;
  console.log("setHomeChart - unit=", unit, "startparams=", startparams, "FullURL: ", fullURL);
  
  // Get request
  getData(fullURL, function (res){

      // loading dummy data in case of no response
      if (!res && JSON.stringify(fullURL).indexOf('temp') >= 0){
        console.log("loading temp dummy data..");
        
        res = JSON.stringify(dummyDayTemp);
      }
      
     if (!res && JSON.stringify(fullURL).indexOf('humid') >= 0){
        console.log("loading humid dummy data..");
        
        res = JSON.stringify(dummyDayHumid);
      }
      
      // push data to chart array
      var a = JSON.parse(res);
      var data = [];
      for (var i = 0; i < a.rows.length; i++) {
          var row = a.rows[i];
          if (row.key[3] < 10 ) {row.key[3] = "0" + row.key[3]}; // add extra 0 before the month for creating a proper timestring
          if (row.key[5] < 10 ) {row.key[5] = "0" + row.key[5]} // add extra 0 before the hour for creating a proper timestring
              var timestring = row.key[2] + "-" + row.key[3] + "-" + row.key[4] + "T" + row.key[5] + ":" + "00" + ":" + "00";
              var timestamp = (new Date(timestring)).toLocaleString();
          data.push({ time: timestamp, unitName: row.value.max});
      }
      
      // set color lines
      if (unitName == "temp"){
        var lineColor = "red";
      } else {
        lineColor = "#42a4f4";
      }
      
      // empty current element
      setOutput(chartID, "");
      
      // homeChart settings
      var chart = new Morris.Line({
          element: chartID,
          data: data,
          xkey: 'time',
          ykeys: ['unitName'],
          postUnits: unit,
          lineColors: [lineColor],
          labels: [unitName],
          grid: true,
          parseTime: false,
          resize: true,
      });
  });
}

// CREATE CHART OVERVIEW
 // example: setChartOverview("weekChartTemp", "station1", "6", "lastweek", "temp");
 
function setChartOverview(chartId, station, level, view, unitName) {
  
  var startparams=[unitName, station];
	var endparams=[unitName,{}];
	var fullURL=DBURL+ view +'?group_level=' + level + '&startkey='+ JSON.stringify(startparams)+'&endkey='+JSON.stringify(endparams);

  console.log("setChartOverview - startparams=", startparams, "FullURL: ", fullURL);
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
  // alias document: c121653f72ed3f9adf6b7e079ef746fb
function getAlias(obj, elid) {
  var aliasDoc = "c121653f72ed3f9adf6b7e079ef746fb";
  var fullURL = DBURLConfig + aliasDoc;
  getData(fullURL, function(res){
    var table = "<tr> <th>Station</th> <th>Huidge alias</th> </tr>";
    var select;
    
    // load dummy data if res is empty
    if (!res){
      
      console.log("could not load alias data, loading dummy data");
      
      if (obj == 'table') {
      
        // create dummy table
        table = table + "<tr id=" + "aliasRow" + ">" + "<td>" + "station1" + "</td>" + "<td>" + "</td>" + "</tr>";
        table = table + "<tr id=" + "aliasRow" + ">" + "<td>" + "station2" + "</td>" + "<td>" + "</td>" + "</tr>";
        table = table + "<tr id=" + "aliasRow" + ">" + "<td>" + "station3" + "</td>" + "<td>" + "</td>" + "</tr>";
      
      } else {
        // create dummy list
        select = select + "<option value=" + "station1" + ">" + "Zolder" + "</option>";
        select = select + "<option value=" + "station2" + ">" + "Buiten" + "</option>";
        select = select + "<option value=" + "station3" + ">" + "Kapsalon" + "</option>";
        }
      
    } else {
      
      // parse response
      var a = JSON.parse(res);
      
      
      
      // iterate to response and contruct table or list
      for (var key in a) {
        if (JSON.stringify(key).lastIndexOf('station') >= 0 ) {
          
          if (obj == 'table') {
            table = table + "<tr id=" + "aliasRow" + ">" + "<td>" + key + "</td>" + "<td>" + a[key] +  "</td>" + "</tr>"; // if table
          } else {
            select = select + "<option value=" + key + ">" + a[key] + "</option>"; // if list
          }
        }
      }
    }
    
    // output table to element
    if (obj == 'table') {
      setOutput(elid, table);
    } else { setOutput(elid, select); } 
    
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
  }
}

// Load charts when document is ready
  $(document).ready(function() {
    
    // load home page initially
    $(".page").hide();
    $(".home").show();
    setHomeChart("6", "temp", "station1", "homeChartTemp", "lastday");
    setHomeChart("6", "humid", "station1", "homeChartHumid", "lastday");
    nowReading("currentTemp", "station1", "temp" );
    nowReading("currentHumid", "station1", "humid" );
    
    
    // load home page after click
    $("#hrefHome").click(function(){
      $(".page").hide();
      $(".home").show();
      setHomeChart("6", "temp", "station1", "homeChartTemp", "lastday");
      setHomeChart("6", "humid", "station1", "homeChartHumid", "lastday");
      nowReading("currentTemp", "station1", "temp" );
      nowReading("currentHumid", "station1", "humid" );
      toggled();
    });
    
    // load maintenance page after click
    $("#hrefMaintenance").click(function(){
      $(".page").hide();
      $(".maint").show();
      toggled();
      getAlias("table", "aliasTable");
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
      getAlias('list', 'weekList');
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

