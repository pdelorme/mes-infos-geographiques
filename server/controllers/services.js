var Request = require('request-json');
var Batch = require('batch');
var GeolocationLog = require('../models/geolocationlog');

module.exports.all = function(req, res) {
  GeolocationLog.all(function(err, geolocationLogData) {
    if(err != null) {
      res.send(500, "An error has occurred -- " + err);
    }
    else {
      
      PhoneCommunicationLog.all(function(err, phoneCommunicationLogData) {
  	    if(err != null) {
  	      res.send(500, "An error has occurred -- " + err);
  	    }
  	    else {
  	      data = {"geolocationLogs": geolocationLogData,
  	              "phoneCommunicationLog": phoneCommunicationLogData};
  	      res.send(200, data);
  	    }
  	  });
    }
  });
};
	
module.exports.bygeotile = function(req, res) {
	var latitude = req.body.latitude;
	var longitude = req.body.longitude;
	
	var geotile = ""+new Number(latitude).toFixed(2)+"-"+new Number(longitude).toFixed(2);
	GeolocationLog.byGeoTile(geotile, function(err, instances) {
	    if(err != null) {
	      res.send(500, "An error has occurred -- " + err);
	    }
	    else {
	    	PhoneCommunicationLog.byGeoTile(function(err, phoneCommunicationLogData) {
		  	    if(err != null) {
		  	      res.send(500, "An error has occurred -- " + err);
		  	    }
		  	    else {
		  	      data = {"geolocationLogs": geolocationLogData,
		  	              "phoneCommunicationLog": phoneCommunicationLogData};
		  	      res.send(200, data);
		  	    }
		  	  });
	    }
	  });
};

module.exports.byDateRange = function(req, res) {
	var fromDate = req.query.fromDate;
	var toDate = req.query.toDate;
	
	GeolocationLog.byDateRange(fromDate, toDate, function(err, instances) {
	    if(err != null) {
	      res.send(500, "An error has occurred -- " + err);
	    }
	    else {
	    	PhoneCommunicationLog.byDateRange(fromDate, toDate, function(err, phoneCommunicationLogData) {
		  	    if(err != null) {
		  	      res.send(500, "An error has occurred -- " + err);
		  	    }
		  	    else {
		  	      data = {"geolocationLogs": geolocationLogData,
		  	              "phoneCommunicationLog": phoneCommunicationLogData};
		  	      res.send(200, data);
		  	    }
		  	  });
	    }
	  });
};

module.exports.byArea = function(req, res) {
	var north = req.query.north;
	var south = req.query.south;
	var east = req.query.east;
	var west = req.query.west;
	console.log("geolocationlog : north,south,east,west :",north,south,east,west);
	GeolocationLog.byLatitudeRange(north, south, function(err, geolocationLogData) {
	    if(err != null) {
	      res.send(500, "An error has occurred -- " + err);
	    }
	    else {
	    	var filteredGeolocationLogData = new Array();
	    	for(var i=0;i<geolocationLogData.length;i++){
//              console.log(geolocationLogData[i]);
	    		longitude = geolocationLogData[i].longitude;
	    		latitude = geolocationLogData[i].latitude;
	    		if((!west || west < longitude) && (!east || longitude < east) && (!north || north > latitude) && (!south || latitude > south)){
//	    			console.log("ok : lat:",latitude,"lon:",longitude);
                    timestamp = geolocationLogData[i].timestamp;
                    day = ""+timestamp.getFullYear()+"-"+timestamp.getMonth()+"-"+timestamp.getDate();
//                  console.log(timestamp,":::",day);
                    filteredGeolocationLogData.push({lat:latitude, lng:longitude, d:day});
	    		} else {
//	    			console.log("rejected : lat:",latitude,"lon:",longitude);
	    		}
	    	};
	    	PhoneCommunicationLog.byLatitudeRange(north, south, function(err, phoneCommunicationLogData) {
	    	    if(err != null) {
	    	      res.send(500, "An error has occurred -- " + err);
	    	    }
	    	    else {
	    	    	var filteredPhoneCommunicationLogData = new Array();
	    	    	for(var i=0;i<phoneCommunicationLogData.length;i++){
	    	    		longitude = phoneCommunicationLogData[i].longitude;
	    	    		latitude = phoneCommunicationLogData[i].latitude;
	                    if((!west || west < longitude) && (!east || longitude < east) && (!north || north > latitude) && (!south || latitude > south)){
//	    	    			console.log("ok :lat :",latitude,"lon:",longitude);
	    	    		    timestamp = phoneCommunicationLogData[i].timestamp;
	    	    		    day = ""+timestamp.getFullYear()+"-"+timestamp.getMonth()+"-"+timestamp.getDate();
//	    	    		    console.log(timestamp,":::",day);
	    	    			filteredPhoneCommunicationLogData.push({lat:latitude, lng:longitude, d:day});
	    	    		} else {
//	    	    			console.log("rejected :lat :",latitude,"lon:",longitude);
	    	    		}
	    	    	}
	    	    	
	    	    	data = {"geolocationLogs": filteredGeolocationLogData,
			  	            "phoneCommunicationLog": filteredPhoneCommunicationLogData};
	    	    	res.send(200, data);
	    	    }
	    	  });
	    }
	  });
};



