// GET ALIAS object from station name
function getStationAlias(station) {
  var fullURL = DBURLConfig + aliasDoc;

  // get data
  var res = httpData(fullURL, "GET", "");
  if (!res) {
    res = {"_id":"c121653f72ed3f9adf6b7e079ef746fb","_rev":"34-6558c26b400072528b2e41ac1e06cfae","station1":"Zolder","station2":"Huiskamer"};
        }
  // get value from key
  var value = res.station;
  return value;
}



// CREATE MULTI LINE CHART IN ELEMENT FOR TEMP & HUMID
function createMultiLineGraph(element, data){

      // empty current element
      setOutput(element, "");

      console.log("createMultiLineGraph - ",data);

      // homeChart settings
      var chart = new Morris.Line({
          element: element,
          data: data,
          xkey: 'time',
          ykeys: ['temp', 'humid'],
          //postUnits: ['C', '%'],
          lineColors: ["red", "#42a4f4"],
          labels: ['Temp ℃"','Humid %'],
          grid: true,
          parseTime: false,
          resize: true,
      });
}

function resVarA(res){
  var a = res;
}

function resVarA(res){
  var a = res;
}

// GRAPH MONTH OVERVIEW MULTILINE
function setChartTH(element, station, level, view) {

  var startparamsT=['temp', station];
  var startparamsH=['humid', station];
	var endparamsT=['temp', station,{}];
	var endparamsH=['humid', station,{}];

	var fullURLT=DBURL+ view +'?group_level=' + level + '&startkey='+ JSON.stringify(startparamsT)+'&endkey='+JSON.stringify(endparamsT);
	var fullURLH=DBURL+ view +'?group_level=' + level + '&startkey='+ JSON.stringify(startparamsH)+'&endkey='+JSON.stringify(endparamsH);
	console.log("setChartTH - temp URL", fullURLT);
	console.log("setChartTH - humid URL", fullURLH);

  httpData(fullURLT, "GET", "", "resVarA");
  httpData(fullURLH, "GET", "", "resVarB");


    var data = [];

    // load dummy data when there is no response
    if (!a) {
        console.log("setChartTH - connectin error, loading dummy temp data");
        if (fullURLT.includes("week")) {
            a = dummyWeekTemp;
        }
        if (fullURLT.includes("month")) {
            a = dummyMonthTemp;
        }
    }

    if (!b) {
        console.log("setChartTH - connectin error, loading dummy humid data");
        if (fullURLH.includes("week")) {
            b = dummyWeekHumid;
        }
        if (fullURLH.includes("month")) {
            b = dummyMonthHumid;
        }
    }

    // iteration
    var iteration;
    if (fullURLT.includes("week")) {
            iteration = 3; // output every 3 times
        } else { iteration = 0;} // ouptut every time



    // format all temp readings
    var timestring;
    var timestringb;
    for (var i = 0; i < a.rows.length; i++) {
        var row = a.rows[i];
        if (row.key[3] < 10 ) {row.key[3] = "0" + row.key[3];}
        if (row.key[4] < 10 ) {row.key[4] = "0" + row.key[4];}

        if (fullURLT.includes("month")) {
          timestring = row.key[2] + "-" + row.key[3] + "-" + row.key[4];
        } else {timestring = row.key[2] + "-" + row.key[3] + "-" + row.key[4] + "T" + row.key[5] + ":" + "00" + ":" + "00";}

        var timestamp = (new Date(timestring)).toLocaleDateString();

        // per humid reading - go through all readings and reformat
        for (var j = 0; j < b.rows.length; j++) {
            var rowb = b.rows[j];
            if (rowb.key[3] < 10 ) {rowb.key[3] = "0" + rowb.key[3];}
            if (rowb.key[4] < 10 ) {rowb.key[4] = "0" + rowb.key[4];}
            if (fullURLT.includes("month")) {
              timestringb = rowb.key[2] + "-" + rowb.key[3] + "-" + rowb.key[4];
            } else {timestringb = rowb.key[2] + "-" + rowb.key[3] + "-" + rowb.key[4] + "T" + rowb.key[5] + ":" + "00" + ":" + "00";}
            var timestampb = (new Date(timestringb)).toLocaleDateString();

            // fill the data array when equal timestamp is found
            if (timestampb == timestamp) {
                data.push({time: timestamp, temp: row.value.max, humid: rowb.value.max});
            }

        }
    }
    console.log("setChartTH - ", data);
    // create multiline chart
    createMultiLineGraph(element, data);

}
