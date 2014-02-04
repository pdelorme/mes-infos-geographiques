(function(/*! Brunch !*/) {
  'use strict';

  var globals = typeof window !== 'undefined' ? window : global;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};

  var has = function(object, name) {
    return ({}).hasOwnProperty.call(object, name);
  };

  var expand = function(root, name) {
    var results = [], parts, part;
    if (/^\.\.?(\/|$)/.test(name)) {
      parts = [root, name].join('/').split('/');
    } else {
      parts = name.split('/');
    }
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function(name) {
      var dir = dirname(path);
      var absolute = expand(dir, name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var module = {id: name, exports: {}};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var require = function(name, loaderPath) {
    var path = expand(name, '.');
    if (loaderPath == null) loaderPath = '/';

    if (has(cache, path)) return cache[path].exports;
    if (has(modules, path)) return initModule(path, modules[path]);

    var dirIndex = expand(path, './index');
    if (has(cache, dirIndex)) return cache[dirIndex].exports;
    if (has(modules, dirIndex)) return initModule(dirIndex, modules[dirIndex]);

    throw new Error('Cannot find module "' + name + '" from '+ '"' + loaderPath + '"');
  };

  var define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has(bundle, key)) {
          modules[key] = bundle[key];
        }
      }
    } else {
      modules[bundle] = fn;
    }
  };

  var list = function() {
    var result = [];
    for (var item in modules) {
      if (has(modules, item)) {
        result.push(item);
      }
    }
    return result;
  };

  globals.require = require;
  globals.require.define = define;
  globals.require.register = define;
  globals.require.list = list;
  globals.require.brunch = true;
})();
require.register("application", function(exports, require, module) {
module.exports = {

    initialize: function() {
        var Router = require('router');
        this.router = new Router();
        Backbone.history.start();
    }
};
});

;require.register("collections/geolocations", function(exports, require, module) {
Geolocation = require('../models/geolocation');
module.exports = Geolocations = Backbone.Collection.extend({
    model: Geolocation,
    url: 'geolocations'
})

});

;require.register("initialize", function(exports, require, module) {
// The function called from index.html
$(document).ready(function() {
    var app = require('application');

    var locale = 'fr'; // default locale

    // we'll need to tweak the server to allow this
    $.ajax('cozy-locale.json', {
        success: function(data) {
            locale = data.locale
            initializeLocale(locale);
        },
        error: function() {
            initializeLocale(locale);
        }
    });

    // let's define a function to initialize Polyglot
    var initializeLocale = function(locale) {
        var locales = {};
        try {
            locales = require('locales/' + locale);
        }
        catch(err) {
            locales = require('locales/en');
        }

        var polyglot = new Polyglot();
        // we give polyglot the data
        polyglot.extend(locales);

        // handy shortcut
        window.t = polyglot.t.bind(polyglot);
        app.initialize();
    };
});

});

;require.register("locales/en", function(exports, require, module) {
module.exports = {
    "main title": "Welcome to My Moves",
    "main description": "This application will help you visualise your prefered places!",
}
});

;require.register("locales/fr", function(exports, require, module) {
module.exports = {
    "main title": "Bienvenue sur Mes Déplacement",
    "main description": "Cette application vous permet de visualiser les lieux ou vous etes passés. !",
}
});

;require.register("models/geolocation", function(exports, require, module) {
module.exports = Geolocation = Backbone.Model.extend({

})

});

;require.register("models/main", function(exports, require, module) {
var heatmap;

$(function(){
    var myLatlng = new google.maps.LatLng(43.293466, 5.364575);

    var myOptions = {
      zoom: 8,
      center: myLatlng,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      disableDefaultUI: false,
      scrollwheel: true,
      draggable: true,
      navigationControl: true,
      mapTypeControl: false,
      scaleControl: true,
      disableDoubleClickZoom: false
    };
    var map = new google.maps.Map($("#heatmapArea")[0], myOptions);
    
    heatmap = new HeatmapOverlay(map, {
        "radius":20,
        "visible":true, 
        "opacity":60
    });
  
    

    
    
    // this is important, because if you set the data set too early, the latlng/pixel projection doesn't work
    google.maps.event.addListenerOnce(map, "idle", function(){
    	updateMap(map);
    });
    google.maps.event.addListener(map, 'click', function(e) {
    	listFiles(e.latLng, map);
    });
    google.maps.event.addListener(map, 'bounds_changed', function(e) {
        // updateMap(map);
    });
});
        
function updateMap(map){
	var bound = map.getBounds();
	var queryObject = {
			north: bound.getNorthEast().lat(),
			south: bound.getSouthWest().lat(),
			east : bound.getNorthEast().lng(),
			west : bound.getSouthWest().lng(),
	};
	$.getJSON('/api/area-geodata', queryObject, function(data) {
		var geoData = new Array();
		var googleLatLng = new Array(); 
		$.each(data, function(key, val) {
			geoData.push({lng:val.longitude, lat:val.latitude, count:1});
			googleLatLng.push(latLng = new google.maps.LatLng(val.latitude, val.longitude));
		});
		console.log("nb points:",geoData.length);
		// ajax implementation
		
		// heatmap.setDataSet({max: 2, data: geoData});
		heatmap.setDataSet(testData);

		// google implementation
		//		var gHeatmap = new google.maps.visualization.HeatmapLayer({
		//			  data: googleLatLng
		//			});
		//			gHeatmap.setMap(map);
	});
};
            
function placeMarker(position, map) {
  var marker = new google.maps.Marker({
    position: position,
    map: map
  });
  map.panTo(position);
}

var clickMarker = null;
function listFiles(position, map) {
	if(clickMarker){
		clickMarker.setVisible(false);
	};
	var span = map.getBounds().toSpan();
	var radius = span.lat()<span.lng()?span.lng():span.lat();
	// radius = radius;
	console.log("radius",radius);
	clickMarker = new google.maps.Marker({
	    position: position,
	    map: map
	  });
	  map.panTo(position);
	var latLng = {
			latitude:position.lat(),
			longitude:position.lng(),
			radius:radius * 4
	};
	console.log(latLng);
	$.getJSON('api/geo-datasets', latLng, function(data) {
		$("#datasets").html("");
		$.each(data, function(key, val) {
			console.log(val);
			$("#datasets").append("<tr><td>"+val.name+"</td></tr>")
		});
	});
}

});

;require.register("models/testdata", function(exports, require, module) {
var testData={
        max: 2,
        data: [
//monuments et sites culturels
{lng: 5.0078451	,lat: 43.7100748 ,count: 1},
{lng: 5.025986	,lat: 43.69043   ,count: 1},
{lng: 5.189124	,lat: 43.684265  ,count: 1},
{lng: 5.0078451	,lat: 43.7100748 ,count: 1},
{lng: 5.025293	,lat: 43.691824  ,count: 1},
{lng: 4.944688	,lat: 43.755712  ,count: 1},
{lng: 5.035118	,lat: 43.70217   ,count: 1},
{lng: 5.035118	,lat: 43.70217   ,count: 1},
{lng: 5.189124	,lat: 43.684265  ,count: 1},
{lng: 5.169454	,lat: 43.687751  ,count: 1},
{lng: 5.189124	,lat: 43.684265  ,count: 1},
{lng: 5.189124	,lat: 43.684265  ,count: 1},
{lng: 5.0078451	,lat: 43.7100748 ,count: 1},
{lng: 5.030631	,lat: 43.695106  ,count: 1},
{lng: 5.0078451	,lat: 43.7100748 ,count: 1},
{lng: 5.079327	,lat: 43.75166   ,count: 1},
{lng: 5.747153	,lat: 43.360967  ,count: 1},
{lng: 5.747153	,lat: 43.360967  ,count: 1},
{lng: 5.747153	,lat: 43.360967  ,count: 1},
{lng: 5.747153	,lat: 43.360967  ,count: 1},
{lng: 5.707414	,lat: 43.384539  ,count: 1},
{lng: 5.0130453	,lat: 43.5806186 ,count: 1},
{lng: 5.0245158	,lat: 43.5633083 ,count: 1},
{lng: 5.316086	,lat: 43.362834  ,count: 1},
{lng: 5.316086	,lat: 43.362834  ,count: 1},
{lng: 4.8058176	,lat: 43.7209858 ,count: 1},
{lng: 4.812272	,lat: 43.724232  ,count: 1},
{lng: 4.800726	,lat: 43.722731  ,count: 1},
{lng: 4.8065409	,lat: 43.7221774 ,count: 1},
{lng: 4.806541	,lat: 43.722177  ,count: 1},
{lng: 4.807234	,lat: 43.720853  ,count: 1},
{lng: 4.805034	,lat: 43.715021  ,count: 1},
{lng: 5.052102	,lat: 43.333254  ,count: 1},
{lng: 5.0702794	,lat: 43.3812134 ,count: 1},
{lng: 5.052694	,lat: 43.338117  ,count: 1},
{lng: 5.070856	,lat: 43.562503  ,count: 1},
{lng: 5.149453	,lat: 43.672184  ,count: 1},
{lng: 5.070856	,lat: 43.5625026 ,count: 1},
{lng: 5.155915	,lat: 43.709955  ,count: 1},
{lng: 4.782098	,lat: 43.832349  ,count: 1},
{lng: 5.039007	,lat: 43.550739  ,count: 1},
{lng: 4.853854	,lat: 43.880232  ,count: 1},
{lng: 5.035208	,lat: 43.546297  ,count: 1},
{lng: 5.070856	,lat: 43.562503  ,count: 1},
{lng: 5.3674144	,lat: 43.2705866 ,count: 1},
{lng: 5.545979	,lat: 43.220422  ,count: 1},
{lng: 5.155915	,lat: 43.709955  ,count: 1},
{lng: 5.0368005	,lat: 43.7917436 ,count: 1},
{lng: 5.149453	,lat: 43.672184  ,count: 1},
{lng: 5.155915	,lat: 43.709955  ,count: 1},
{lng: 4.841977	,lat: 43.841579  ,count: 1},
{lng: 5.2432250	,lat: 43.40853939,count: 1},
{lng: 5.604256	,lat: 43.350183  ,count: 1},
{lng: 5.070856	,lat: 43.562503  ,count: 1},
{lng: 4.793686	,lat: 43.837853  ,count: 1},
{lng: 5.070856	,lat: 43.562503  ,count: 1},
{lng: 5.193726	,lat: 43.625407  ,count: 1},
{lng: 5.090185	,lat: 43.707188  ,count: 1},
{lng: 5.155915	,lat: 43.709955  ,count: 1},
{lng: 5.619656	,lat: 43.200985  ,count: 1},
{lng: 5.592942	,lat: 43.395354  ,count: 1},
{lng: 5.569213	,lat: 43.292386  ,count: 1},
{lng: 5.149453	,lat: 43.672184  ,count: 1},
{lng: 5.149714	,lat: 43.630243  ,count: 1},
{lng: 4.794614	,lat: 43.743139  ,count: 1},
{lng: 5.606815	,lat: 43.374906  ,count: 1},
{lng: 5.150567	,lat: 43.631049  ,count: 1},
{lng: 5.070856	,lat: 43.562503  ,count: 1},
{lng: 4.7952205	,lat: 43.7440454 ,count: 1},
{lng: 5.514531	,lat: 43.276288  ,count: 1},
{lng: 5.3759936	,lat: 43.3150787 ,count: 1},
{lng: 5.373771	,lat: 43.304997  ,count: 1},
{lng: 5.549764	,lat: 43.218326  ,count: 1},
{lng: 5.162212	,lat: 43.704371  ,count: 1},
{lng: 5.038872	,lat: 43.5507116 ,count: 1},
{lng: 5.0368005	,lat: 43.7917436 ,count: 1},
{lng: 5.385018	,lat: 43.274301  ,count: 1},
{lng: 5.0368005	,lat: 43.7917436 ,count: 1},
{lng: 4.91724	,lat: 43.640058  ,count: 1},
{lng: 5.070856	,lat: 43.562503  ,count: 1},
{lng: 5.316086	,lat: 43.362834  ,count: 1},
{lng: 5.159646	,lat: 43.495338  ,count: 1},
{lng: 5.04946	,lat: 43.612554  ,count: 1},
{lng: 4.7952205	,lat: 43.7440454 ,count: 1},
{lng: 4.902241	,lat: 43.861639  ,count: 1},
{lng: 4.795495	,lat: 43.743887  ,count: 1},
{lng: 5.385112	,lat: 43.299462  ,count: 1},
{lng: 4.855685	,lat: 43.8820059 ,count: 1},
{lng: 5.368368	,lat: 43.300486  ,count: 1},
{lng: 4.798794	,lat: 43.823348  ,count: 1},
{lng: 5.538008	,lat: 43.215475  ,count: 1},
{lng: 5.042942	,lat: 43.616877  ,count: 1},
{lng: 5.155915	,lat: 43.709955  ,count: 1},
{lng: 5.057085	,lat: 43.405714  ,count: 1},
{lng: 5.602709	,lat: 43.175348  ,count: 1},
{lng: 4.769404	,lat: 43.826638  ,count: 1},
{lng: 5.155915	,lat: 43.709955  ,count: 1},
{lng: 5.604011	,lat: 43.34875   ,count: 1},
{lng: 4.778707	,lat: 43.830543  ,count: 1},
{lng: 5.3658683	,lat: 43.2974026 ,count: 1},
{lng: 5.3607806	,lat: 43.3266776 ,count: 1},
{lng: 5.587664	,lat: 43.426993  ,count: 1},
{lng: 5.071672	,lat: 43.555806  ,count: 1},
{lng: 5.038872	,lat: 43.550712  ,count: 1},
{lng: 5.381126	,lat: 43.286337  ,count: 1},
{lng: 5.193726	,lat: 43.625407  ,count: 1},
{lng: 4.855685	,lat: 43.8820059 ,count: 1},
{lng: 5.155915	,lat: 43.709955  ,count: 1},
{lng: 5.04946	,lat: 43.612554  ,count: 1},
{lng: 4.782098	,lat: 43.832349  ,count: 1},
{lng: 4.782098	,lat: 43.832349  ,count: 1},
{lng: 5.0368005	,lat: 43.7917436 ,count: 1},
{lng: 5.150567	,lat: 43.631049  ,count: 1},
{lng: 5.3952356	,lat: 43.2655875 ,count: 1},
{lng: 5.369427	,lat: 43.297598  ,count: 1},
{lng: 5.048243	,lat: 43.546458  ,count: 1},
{lng: 5.549764	,lat: 43.218326  ,count: 1},
{lng: 5.064385	,lat: 43.609895  ,count: 1},
{lng: 5.365323	,lat: 43.298455  ,count: 1},
{lng: 5.0368005	,lat: 43.7917436 ,count: 1},
{lng: 5.0368005	,lat: 43.7917436 ,count: 1},
{lng: 5.159646	,lat: 43.495338  ,count: 1},
{lng: 5.374958	,lat: 43.301511  ,count: 1},
{lng: 5.30866	,lat: 43.364283  ,count: 1},
{lng: 5.149453	,lat: 43.672184  ,count: 1},
{lng: 5.193726	,lat: 43.625407  ,count: 1},
{lng: 5.369195	,lat: 43.296005  ,count: 1},
{lng: 5.316086	,lat: 43.362834  ,count: 1},
{lng: 5.386122	,lat: 43.26939   ,count: 1},
{lng: 5.6042904	,lat: 43.1740354 ,count: 1},
{lng: 4.855685	,lat: 43.8820059 ,count: 1},
{lng: 5.070856	,lat: 43.562503  ,count: 1},
{lng: 5.570111	,lat: 43.291521  ,count: 1},
{lng: 5.202194	,lat: 43.416745  ,count: 1},
{lng: 5.376455	,lat: 43.298843  ,count: 1},
{lng: 5.549764	,lat: 43.218326  ,count: 1},
{lng: 4.798794	,lat: 43.823348  ,count: 1},
{lng: 5.0368005	,lat: 43.7917436 ,count: 1},
{lng: 5.545145	,lat: 43.396208  ,count: 1},
{lng: 4.8455372	,lat: 43.8398561 ,count: 1},
{lng: 5.3801633	,lat: 43.2951808 ,count: 1},
{lng: 5.569317	,lat: 43.294231  ,count: 1},
{lng: 5.159646	,lat: 43.495338  ,count: 1},
{lng: 5.154376	,lat: 43.64194   ,count: 1},
{lng: 5.052591	,lat: 43.3689    ,count: 1},
{lng: 5.61837	,lat: 43.187076  ,count: 1},
{lng: 5.375296	,lat: 43.291774  ,count: 1},
{lng: 4.9454803	,lat: 43.5212157 ,count: 1},
{lng: 5.4113627	,lat: 43.3191772 ,count: 1},
{lng: 5.0368005	,lat: 43.7917436 ,count: 1},
{lng: 4.7972488	,lat: 43.83920105,count: 1},
{lng: 5.039007	,lat: 43.550739  ,count: 1},
{lng: 5.155915	,lat: 43.709955  ,count: 1},
{lng: 4.781454	,lat: 43.832612  ,count: 1},
{lng: 4.806736	,lat: 43.637112  ,count: 1},
{lng: 4.794614	,lat: 43.7431394 ,count: 1},
{lng: 4.855685	,lat: 43.8820059 ,count: 1},
{lng: 5.453154	,lat: 43.311653  ,count: 1},
{lng: 5.515523	,lat: 43.28251   ,count: 1},
{lng: 5.367363	,lat: 43.297696  ,count: 1},
{lng: 4.798794	,lat: 43.823348  ,count: 1},
{lng: 5.193726	,lat: 43.625407  ,count: 1},
{lng: 4.855685	,lat: 43.8820059 ,count: 1},
{lng: 5.3684711	,lat: 43.2984824 ,count: 1},
{lng: 4.782098	,lat: 43.832349  ,count: 1},
{lng: 4.782098	,lat: 43.832349  ,count: 1},
{lng: 5.149453	,lat: 43.672184  ,count: 1},
{lng: 5.535895	,lat: 43.213122  ,count: 1},
{lng: 5.0368005	,lat: 43.7917436 ,count: 1},
{lng: 5.149453	,lat: 43.672184  ,count: 1},
{lng: 5.577664	,lat: 43.384419  ,count: 1},
{lng: 5.577675	,lat: 43.384486  ,count: 1},
{lng: 5.193726	,lat: 43.625407  ,count: 1},
{lng: 4.8535862	,lat: 43.8803699 ,count: 1},
{lng: 4.7736883	,lat: 43.83122980,count: 1},
{lng: 5.070856	,lat: 43.562503  ,count: 1},
{lng: 5.53712	,lat: 43.215134  ,count: 1},
{lng: 5.149453	,lat: 43.672184  ,count: 1},
{lng: 5.155915	,lat: 43.709955  ,count: 1},
{lng: 4.903657	,lat: 43.880789  ,count: 1},
{lng: 5.375296	,lat: 43.291774  ,count: 1},
{lng: 5.371592	,lat: 43.297751  ,count: 1},
{lng: 5.568751	,lat: 43.292867  ,count: 1},
{lng: 5.0647985	,lat: 43.6087611 ,count: 1},
{lng: 5.193726	,lat: 43.625407  ,count: 1},
{lng: 5.367414	,lat: 43.270587  ,count: 1},
{lng: 4.899817	,lat: 43.874912  ,count: 1},
{lng: 5.213843	,lat: 43.422983  ,count: 1},
{lng: 5.155915	,lat: 43.709955  ,count: 1},
{lng: 5.070856	,lat: 43.562503  ,count: 1},
{lng: 4.855685	,lat: 43.8820059 ,count: 1},
{lng: 4.903228	,lat: 43.878763  ,count: 1},
{lng: 4.7822242	,lat: 43.837734  ,count: 1},
{lng: 4.79608	,lat: 43.745451  ,count: 1},
{lng: 5.3717395	,lat: 43.2928663 ,count: 1},
{lng: 5.155915	,lat: 43.709955  ,count: 1},
{lng: 5.384433	,lat: 43.286603  ,count: 1},
{lng: 5.149281	,lat: 43.631124  ,count: 1},
{lng: 4.795495	,lat: 43.743887  ,count: 1},
{lng: 4.945827	,lat: 43.526782  ,count: 1},
{lng: 5.604011	,lat: 43.34875   ,count: 1},
{lng: 4.7863483	,lat: 43.83031652,count: 1},
{lng: 5.149706	,lat: 43.630229  ,count: 1},
{lng: 5.155957	,lat: 43.66455   ,count: 1},
{lng: 5.369427	,lat: 43.297598  ,count: 1},
{lng: 5.053091	,lat: 43.32555   ,count: 1},
{lng: 5.070856	,lat: 43.562503  ,count: 1},
{lng: 5.568906	,lat: 43.293177  ,count: 1},
{lng: 5.04946	,lat: 43.612554  ,count: 1},
{lng: 5.149714	,lat: 43.630243  ,count: 1},
{lng: 5.070856	,lat: 43.5625026 ,count: 1},
{lng: 4.777384	,lat: 43.830681  ,count: 1},
{lng: 4.781454	,lat: 43.832612  ,count: 1},
{lng: 5.5934494	,lat: 43.1692446 ,count: 1},
{lng: 5.150567	,lat: 43.631049  ,count: 1},
{lng: 5.537733	,lat: 43.217312  ,count: 1},
{lng: 4.7730875	,lat: 43.85091609,count: 1},
{lng: 4.782098	,lat: 43.832349  ,count: 1},
{lng: 5.155915	,lat: 43.709955  ,count: 1},
{lng: 5.316086	,lat: 43.362834  ,count: 1},
{lng: 5.4076857	,lat: 43.277672  ,count: 1},
{lng: 5.316086	,lat: 43.362834  ,count: 1},
{lng: 5.250172	,lat: 43.361893  ,count: 1},
{lng: 4.662387	,lat: 43.802323  ,count: 1},
{lng: 4.660349	,lat: 43.806319  ,count: 1},
{lng: 4.658761	,lat: 43.80556   ,count: 1},
{lng: 4.669597	,lat: 43.766321  ,count: 1},
{lng: 4.655929	,lat: 43.804925  ,count: 1},
{lng: 4.657238	,lat: 43.805142  ,count: 1},
{lng: 4.680111	,lat: 43.841569  ,count: 1},
{lng: 4.655693	,lat: 43.806288  ,count: 1},
{lng: 4.657559	,lat: 43.805699  ,count: 1},
{lng: 4.659555	,lat: 43.804878  ,count: 1},
{lng: 4.657409	,lat: 43.806411  ,count: 1},
{lng: 4.657516	,lat: 43.807976  ,count: 1},
{lng: 4.660091	,lat: 43.803407  ,count: 1},
{lng: 4.65771	,lat: 43.805668  ,count: 1},
{lng: 4.655135	,lat: 43.802679  ,count: 1},
{lng: 4.825556	,lat: 43.78641   ,count: 1},
{lng: 4.849961	,lat: 43.80882   ,count: 1},
{lng: 4.831024	,lat: 43.789153  ,count: 1},
{lng: 4.850157	,lat: 43.808667  ,count: 1},
{lng: 4.897991	,lat: 43.775863  ,count: 1},
{lng: 4.880927	,lat: 43.740292  ,count: 1},
{lng: 4.828952	,lat: 43.77932   ,count: 1},
{lng: 5.5246	,lat: 43.412358  ,count: 1},
{lng: 5.5246	,lat: 43.412358  ,count: 1},
{lng: 4.773774	,lat: 43.85087   ,count: 1},
{lng: 5.146185	,lat: 43.390426  ,count: 1},
{lng: 4.773195	,lat: 43.85087   ,count: 1},
{lng: 4.656601	,lat: 43.807319  ,count: 1},
{lng: 5.146185	,lat: 43.390426  ,count: 1},
{lng: 5.146185	,lat: 43.390426  ,count: 1},
{lng: 4.6563637	,lat: 43.8063826 ,count: 1},
{lng: 4.6563712	,lat: 43.80621   ,count: 1},
{lng: 5.146185	,lat: 43.390426  ,count: 1},
{lng: 4.774396	,lat: 43.851814  ,count: 1},
{lng: 5.146185	,lat: 43.390426  ,count: 1},
{lng: 5.7010284	,lat: 43.2772249 ,count: 1},
{lng: 4.656626	,lat: 43.80585   ,count: 1},
{lng: 4.660486	,lat: 43.804937  ,count: 1},
{lng: 5.146185	,lat: 43.390426  ,count: 1},
{lng: 4.656986	,lat: 43.805397  ,count: 1},
{lng: 4.831081	,lat: 43.788704  ,count: 1},
{lng: 4.70941	,lat: 43.725522  ,count: 1},
{lng: 5.628435	,lat: 43.29771   ,count: 1},
{lng: 4.779911	,lat: 43.862876  ,count: 1},
{lng: 4.82243	,lat: 43.810398  ,count: 1},
{lng: 5.164636	,lat: 43.38296   ,count: 1},
{lng: 4.661211	,lat: 43.803088  ,count: 1},
{lng: 5.193726	,lat: 43.625407  ,count: 1},
{lng: 5.007845	,lat: 43.710075  ,count: 1},
{lng: 5.034639	,lat: 43.549673  ,count: 1},
{lng: 4.705174	,lat: 43.723708  ,count: 1},
{lng: 4.700464	,lat: 43.726791  ,count: 1},
{lng: 4.736695	,lat: 43.729259  ,count: 1},
{lng: 4.71277	,lat: 43.720978  ,count: 1},
{lng: 5.155915	,lat: 43.709955  ,count: 1},
{lng: 5.63326	,lat: 43.37025   ,count: 1},
{lng: 5.651229	,lat: 43.28813   ,count: 1},
{lng: 5.190138	,lat: 43.687608  ,count: 1},
{lng: 5.571447	,lat: 43.293232  ,count: 1},
{lng: 5.549764	,lat: 43.218326  ,count: 1},
{lng: 5.014791	,lat: 43.456615  ,count: 1},
{lng: 5.569489	,lat: 43.293114  ,count: 1},
{lng: 5.706936	,lat: 43.385254  ,count: 1},
{lng: 5.604011	,lat: 43.34875   ,count: 1},
{lng: 4.845673	,lat: 43.781562  ,count: 1},
{lng: 5.570111	,lat: 43.29345   ,count: 1},
{lng: 5.28891	,lat: 43.605053  ,count: 1},
{lng: 5.189124	,lat: 43.684265  ,count: 1},
{lng: 5.700821	,lat: 43.276948  ,count: 1},
{lng: 4.945827	,lat: 43.526782  ,count: 1},
{lng: 5.155915	,lat: 43.709955  ,count: 1},
{lng: 5.184793	,lat: 43.555959  ,count: 1},
{lng: 5.193726	,lat: 43.625407  ,count: 1},
{lng: 5.549764	,lat: 43.218326  ,count: 1},
{lng: 5.216361	,lat: 43.416444  ,count: 1},
{lng: 5.700241	,lat: 43.275143  ,count: 1},
{lng: 5.63575	,lat: 43.376403  ,count: 1},
{lng: 5.63244	,lat: 43.370188  ,count: 1},
{lng: 5.569307	,lat: 43.292857  ,count: 1},
{lng: 5.703862	,lat: 43.277127  ,count: 1},
{lng: 5.246017	,lat: 43.521413  ,count: 1},
{lng: 5.189124	,lat: 43.684265  ,count: 1},
{lng: 4.987461	,lat: 43.514538  ,count: 1},
{lng: 5.189152	,lat: 43.678736  ,count: 1},
{lng: 5.155915	,lat: 43.709955  ,count: 1},
{lng: 5.633465	,lat: 43.370359  ,count: 1},
{lng: 5.155915	,lat: 43.709955  ,count: 1},
{lng: 5.514472	,lat: 43.281283  ,count: 1},
{lng: 5.370089	,lat: 43.286511  ,count: 1},
{lng: 5.215345	,lat: 43.415731  ,count: 1},
{lng: 5.172402	,lat: 43.572702  ,count: 1},
{lng: 5.651219	,lat: 43.288231  ,count: 1},
{lng: 5.539695	,lat: 43.214618  ,count: 1},
{lng: 5.3821768	,lat: 43.300771  ,count: 1},
{lng: 4.803178	,lat: 43.721557  ,count: 1},
{lng: 4.898865	,lat: 43.454616  ,count: 1},
{lng: 4.946436	,lat: 43.438154  ,count: 1},
{lng: 5.567322	,lat: 43.293665  ,count: 1},
{lng: 5.146185	,lat: 43.390426  ,count: 1},
{lng: 5.013045	,lat: 43.378922  ,count: 1},
{lng: 5.053728	,lat: 43.404811  ,count: 1},
{lng: 4.955474	,lat: 43.763806  ,count: 1},
{lng: 4.87813	,lat: 43.705143  ,count: 1},
{lng: 5.619656	,lat: 43.200985  ,count: 1},
{lng: 4.629436	,lat: 43.679093  ,count: 1},
{lng: 4.945385	,lat: 43.836088  ,count: 1},
{lng: 4.812272	,lat: 43.724232  ,count: 1},
{lng: 5.369414	,lat: 43.292965  ,count: 1},
{lng: 5.672045	,lat: 43.519272  ,count: 1},
{lng: 5.450896	,lat: 43.529908  ,count: 1},
{lng: 5.346838	,lat: 43.452953  ,count: 1},
{lng: 5.494881	,lat: 43.485435  ,count: 1},
{lng: 5.45121	,lat: 43.5291    ,count: 1},
{lng: 5.4475021	,lat: 43.52950905,count: 1},
{lng: 5.26174	,lat: 43.653784  ,count: 1},
{lng: 5.451807	,lat: 43.527823  ,count: 1},
{lng: 5.450898	,lat: 43.529843  ,count: 1},
{lng: 5.672943	,lat: 43.5252229 ,count: 1},
{lng: 5.4535174	,lat: 43.5278887 ,count: 1},
{lng: 5.265538	,lat: 43.450861  ,count: 1},
{lng: 5.451909	,lat: 43.527025  ,count: 1},
{lng: 5.568998	,lat: 43.48905   ,count: 1},
{lng: 5.49898	,lat: 43.59508   ,count: 1},
{lng: 5.417762	,lat: 43.666211  ,count: 1},
{lng: 5.311174	,lat: 43.615793  ,count: 1},
{lng: 5.6216441	,lat: 43.4820943 ,count: 1},
{lng: 5.419285	,lat: 43.587774  ,count: 1},
{lng: 5.453596	,lat: 43.526656  ,count: 1},
{lng: 5.460455	,lat: 43.523885  ,count: 1},
{lng: 5.3416255	,lat: 43.6567227 ,count: 1},
{lng: 5.495122	,lat: 43.486821  ,count: 1},
{lng: 5.447751	,lat: 43.530025  ,count: 1},
{lng: 5.54699	,lat: 43.424807  ,count: 1},
{lng: 5.45121	,lat: 43.5291    ,count: 1},
{lng: 5.447268	,lat: 43.527112  ,count: 1},
{lng: 5.672045	,lat: 43.519272  ,count: 1},
{lng: 5.447761	,lat: 43.529462  ,count: 1},
{lng: 5.48555	,lat: 43.458541  ,count: 1},
{lng: 5.249703	,lat: 43.458598  ,count: 1},
{lng: 5.45186	,lat: 43.528749  ,count: 1},
{lng: 5.672045	,lat: 43.519272  ,count: 1},
{lng: 5.451276	,lat: 43.525435  ,count: 1},
{lng: 5.441687	,lat: 43.547988  ,count: 1},
{lng: 5.602142	,lat: 43.555284  ,count: 1},
{lng: 5.54699	,lat: 43.424807  ,count: 1},
{lng: 5.467951	,lat: 43.638997  ,count: 1},
{lng: 5.444031	,lat: 43.529314  ,count: 1},
{lng: 5.451335	,lat: 43.528271  ,count: 1},
{lng: 5.595496	,lat: 43.457304  ,count: 1},
{lng: 5.4412472	,lat: 43.5269449 ,count: 1},
{lng: 5.304035	,lat: 43.544411  ,count: 1},
{lng: 5.500137	,lat: 43.412274  ,count: 1},
{lng: 5.509247	,lat: 43.5338335 ,count: 1},
{lng: 5.45079	,lat: 43.5322712 ,count: 1},
{lng: 5.4489363	,lat: 43.5267568 ,count: 1},
{lng: 5.672045	,lat: 43.519272  ,count: 1},
{lng: 5.451089	,lat: 43.529231  ,count: 1},
{lng: 5.445712	,lat: 43.531008  ,count: 1},
{lng: 5.346838	,lat: 43.452953  ,count: 1},
{lng: 5.4364929	,lat: 43.5289308 ,count: 1},
{lng: 5.453202	,lat: 43.527221  ,count: 1},
{lng: 5.450819	,lat: 43.530588  ,count: 1},
{lng: 5.304035	,lat: 43.544411  ,count: 1},
{lng: 5.532196	,lat: 43.540352  ,count: 1},
{lng: 5.478144	,lat: 43.565591  ,count: 1},
{lng: 5.410526	,lat: 43.502926  ,count: 1},
{lng: 5.446178	,lat: 43.532877  ,count: 1},
{lng: 5.449834	,lat: 43.525283  ,count: 1},
{lng: 5.304035	,lat: 43.544411  ,count: 1},
{lng: 5.595496	,lat: 43.457304  ,count: 1},
{lng: 5.4499064	,lat: 43.5286622 ,count: 1},
{lng: 5.67622	,lat: 43.5246295 ,count: 1},
{lng: 5.4464979	,lat: 43.5298469 ,count: 1},
{lng: 5.453129	,lat: 43.529171  ,count: 1},
{lng: 5.444779	,lat: 43.531904  ,count: 1},
{lng: 5.560654	,lat: 43.454987  ,count: 1},
{lng: 5.595496	,lat: 43.457304  ,count: 1},
{lng: 5.448281	,lat: 43.529064  ,count: 1},
{lng: 5.450733	,lat: 43.526998  ,count: 1},
{lng: 5.454107	,lat: 43.527338  ,count: 1},
{lng: 5.450132	,lat: 43.525692  ,count: 1},
{lng: 5.442846	,lat: 43.526366  ,count: 1},
{lng: 5.49898	,lat: 43.59508   ,count: 1},
{lng: 5.451909	,lat: 43.527025  ,count: 1},
{lng: 5.47177	,lat: 43.45899   ,count: 1},
{lng: 5.66052	,lat: 43.629047  ,count: 1},
{lng: 5.322238	,lat: 43.400623  ,count: 1},
{lng: 5.447268	,lat: 43.527112  ,count: 1},
{lng: 5.435143	,lat: 43.663029  ,count: 1},
{lng: 5.447751	,lat: 43.530025  ,count: 1},
{lng: 5.452618	,lat: 43.528092  ,count: 1},
{lng: 5.307072	,lat: 43.721047  ,count: 1},
{lng: 5.304035	,lat: 43.544411  ,count: 1},
{lng: 5.454228	,lat: 43.527353  ,count: 1},
{lng: 5.44883	,lat: 43.525648  ,count: 1},
{lng: 5.554128	,lat: 43.457583  ,count: 1},
{lng: 5.316497	,lat: 43.717548  ,count: 1},
{lng: 5.45118	,lat: 43.526874  ,count: 1},
{lng: 5.656312	,lat: 43.641592  ,count: 1},
{lng: 5.48555	,lat: 43.458541  ,count: 1},
{lng: 5.560413	,lat: 43.4558469 ,count: 1},
{lng: 5.62141	,lat: 43.561905  ,count: 1},
{lng: 5.447298	,lat: 43.527397  ,count: 1},
{lng: 5.308922	,lat: 43.410272  ,count: 1},
{lng: 5.509247	,lat: 43.5338335 ,count: 1},
{lng: 5.249273	,lat: 43.66359   ,count: 1},
{lng: 5.436459	,lat: 43.571014  ,count: 1},
{lng: 5.261412	,lat: 43.654789  ,count: 1},
{lng: 5.402365	,lat: 43.544817  ,count: 1},
{lng: 5.310731	,lat: 43.715225  ,count: 1},
{lng: 5.251238	,lat: 43.558086  ,count: 1},
{lng: 5.354611	,lat: 43.667227  ,count: 1},
{lng: 5.455242	,lat: 43.545744  ,count: 1},
{lng: 5.4473367	,lat: 43.5274331 ,count: 1},
{lng: 5.312093	,lat: 43.714849  ,count: 1},
{lng: 5.450733	,lat: 43.526998  ,count: 1},
{lng: 5.45121	,lat: 43.5291    ,count: 1},
{lng: 5.346838	,lat: 43.452953  ,count: 1},
{lng: 5.45121	,lat: 43.5291    ,count: 1},
{lng: 5.595496	,lat: 43.457304  ,count: 1},
{lng: 5.4453191	,lat: 43.5300296 ,count: 1},
{lng: 5.265538	,lat: 43.450861  ,count: 1},
{lng: 5.447298	,lat: 43.527397  ,count: 1},
{lng: 5.595496	,lat: 43.457304  ,count: 1},
{lng: 5.355491	,lat: 43.460894  ,count: 1},
{lng: 5.4489363	,lat: 43.5267568 ,count: 1},
{lng: 5.622019	,lat: 43.480621  ,count: 1},
{lng: 5.4489363	,lat: 43.5267568 ,count: 1},
{lng: 5.561705	,lat: 43.454986  ,count: 1},
{lng: 5.595496	,lat: 43.457304  ,count: 1},
{lng: 5.4440307	,lat: 43.5293136 ,count: 1},
{lng: 5.502949	,lat: 43.522663  ,count: 1},
{lng: 5.509247	,lat: 43.5338335 ,count: 1},
{lng: 5.317794	,lat: 43.566255  ,count: 1},
{lng: 5.452939	,lat: 43.528019  ,count: 1},
{lng: 5.4456539	,lat: 43.5281757 ,count: 1},
{lng: 5.444006	,lat: 43.529247  ,count: 1},
{lng: 5.4500679	,lat: 43.5299958 ,count: 1},
{lng: 5.448743	,lat: 43.527771  ,count: 1},
{lng: 5.66052	,lat: 43.629047  ,count: 1},
{lng: 5.354611	,lat: 43.667227  ,count: 1},
{lng: 5.449338	,lat: 43.52853   ,count: 1},
{lng: 5.35429	,lat: 43.569322  ,count: 1},
{lng: 5.4472087	,lat: 43.53122   ,count: 1},
{lng: 5.450179	,lat: 43.525479  ,count: 1},
{lng: 5.500274	,lat: 43.487933  ,count: 1},
{lng: 5.404574	,lat: 43.437176  ,count: 1},
{lng: 5.595496	,lat: 43.457304  ,count: 1},
{lng: 5.2934682	,lat: 43.53913822,count: 1},
{lng: 5.442865	,lat: 43.524585  ,count: 1},
{lng: 5.411824	,lat: 43.444001  ,count: 1},
{lng: 5.451366	,lat: 43.527292  ,count: 1},
{lng: 5.62141	,lat: 43.561905  ,count: 1},
{lng: 5.595496	,lat: 43.457304  ,count: 1},
{lng: 5.448539	,lat: 43.52653   ,count: 1},
{lng: 5.664687	,lat: 43.486644  ,count: 1},
{lng: 5.447048	,lat: 43.525465  ,count: 1},
{lng: 5.551228	,lat: 43.4550301 ,count: 1},
{lng: 5.4500921	,lat: 43.52531   ,count: 1},
{lng: 5.445308	,lat: 43.528961  ,count: 1},
{lng: 5.4443585	,lat: 43.5304052 ,count: 1},
{lng: 5.411824	,lat: 43.444001  ,count: 1},
{lng: 5.502612	,lat: 43.52334   ,count: 1},
{lng: 5.450814	,lat: 43.530695  ,count: 1},
{lng: 5.528175	,lat: 43.635993  ,count: 1},
{lng: 5.3541703	,lat: 43.5683133 ,count: 1},
{lng: 5.316497	,lat: 43.717548  ,count: 1},
{lng: 5.304035	,lat: 43.544411  ,count: 1},
{lng: 4.943612	,lat: 43.837204  ,count: 1},
{lng: 5.3730647	,lat: 43.2925191 ,count: 1},
{lng: 4.944566	,lat: 43.835465  ,count: 1},
{lng: 5.605639	,lat: 43.175654  ,count: 1},
{lng: 5.619656	,lat: 43.200985  ,count: 1},
{lng: 4.709932	,lat: 43.724537  ,count: 1},
{lng: 4.720087	,lat: 43.741522  ,count: 1},
{lng: 4.627613	,lat: 43.676371  ,count: 1},
{lng: 4.641638	,lat: 43.671798  ,count: 1},
{lng: 4.621038	,lat: 43.65699   ,count: 1},
{lng: 4.631677	,lat: 43.676434  ,count: 1},
{lng: 4.709959	,lat: 43.72653   ,count: 1},
{lng: 4.831343	,lat: 43.788652  ,count: 1},
{lng: 4.631338	,lat: 43.675135  ,count: 1},
{lng: 4.80323	,lat: 43.389119  ,count: 1},
{lng: 5.101866	,lat: 43.362147  ,count: 1},
{lng: 5.150491	,lat: 43.631167  ,count: 1},
{lng: 5.160416	,lat: 43.703348  ,count: 1},
{lng: 5.030631	,lat: 43.695106  ,count: 1},
{lng: 5.435946	,lat: 43.552436  ,count: 1},
{lng: 5.369056	,lat: 43.300212  ,count: 1},
{lng: 5.200312	,lat: 43.549571  ,count: 1},
{lng: 5.447027	,lat: 43.5314433 ,count: 1},
{lng: 5.447719	,lat: 43.529831  ,count: 1},
{lng: 5.447923	,lat: 43.528416  ,count: 1},
{lng: 5.374074	,lat: 43.290686  ,count: 1},
{lng: 4.98631	,lat: 43.393538  ,count: 1},
{lng: 5.377256	,lat: 43.292284  ,count: 1},
{lng: 4.943858	,lat: 43.836784  ,count: 1},
{lng: 5.445473	,lat: 43.52655   ,count: 1},
{lng: 5.378321	,lat: 43.295848  ,count: 1},
{lng: 5.376305	,lat: 43.299204  ,count: 1},
{lng: 5.383712	,lat: 43.285905  ,count: 1},
{lng: 5.447751	,lat: 43.530025  ,count: 1},
{lng: 5.576243	,lat: 43.625964  ,count: 1},
{lng: 5.380593	,lat: 43.299011  ,count: 1},
{lng: 4.990401	,lat: 43.516512  ,count: 1},
{lng: 5.146185	,lat: 43.390426  ,count: 1},
{lng: 5.576243	,lat: 43.625964  ,count: 1},
{lng: 5.450195	,lat: 43.525324  ,count: 1},
{lng: 5.316086	,lat: 43.362834  ,count: 1},
{lng: 5.377253	,lat: 43.263244  ,count: 1},
{lng: 5.379087	,lat: 43.297953  ,count: 1},
{lng: 5.028908	,lat: 43.784111  ,count: 1},
{lng: 5.403653	,lat: 43.250514  ,count: 1},
{lng: 5.378341	,lat: 43.298404  ,count: 1},
{lng: 5.4486333	,lat: 43.5266968 ,count: 1},
{lng: 5.340769	,lat: 43.664172  ,count: 1},
{lng: 5.450313	,lat: 43.525402  ,count: 1},
{lng: 4.702599	,lat: 43.725754  ,count: 1},
{lng: 5.316086	,lat: 43.362834  ,count: 1},
{lng: 5.193726	,lat: 43.625407  ,count: 1},
{lng: 5.450063	,lat: 43.52673   ,count: 1},
{lng: 5.444175	,lat: 43.5262    ,count: 1},
{lng: 5.304199	,lat: 43.620671  ,count: 1},
{lng: 4.855685	,lat: 43.8820059 ,count: 1},
{lng: 4.79522	,lat: 43.744045  ,count: 1},
{lng: 4.79522	,lat: 43.744045  ,count: 1},
{lng: 4.794479	,lat: 43.743684  ,count: 1},
{lng: 5.190138	,lat: 43.687608  ,count: 1},
{lng: 5.3808683	,lat: 43.2875818 ,count: 1},
{lng: 5.604084	,lat: 43.349587  ,count: 1},
{lng: 5.193726	,lat: 43.625407  ,count: 1},
{lng: 4.728134	,lat: 43.85825   ,count: 1},
{lng: 5.193726	,lat: 43.625407  ,count: 1},
{lng: 4.9845969	,lat: 43.5162171 ,count: 1},
{lng: 5.570111	,lat: 43.29345   ,count: 1},
{lng: 4.841977	,lat: 43.841579  ,count: 1},
{lng: 5.150491	,lat: 43.631167  ,count: 1},
{lng: 5.055124	,lat: 43.404723  ,count: 1},
{lng: 5.0368005	,lat: 43.7917436 ,count: 1},
{lng: 5.3599355	,lat: 43.3174701 ,count: 1},
{lng: 5.4662346	,lat: 43.3011865 ,count: 1},
{lng: 5.409579	,lat: 43.292596  ,count: 1},
{lng: 5.090185	,lat: 43.707188  ,count: 1},
{lng: 5.420108	,lat: 43.529896  ,count: 1},
{lng: 5.097258	,lat: 43.641176  ,count: 1},
{lng: 5.431546	,lat: 43.2826197 ,count: 1},
{lng: 5.3821768	,lat: 43.300771  ,count: 1},
{lng: 4.660486	,lat: 43.806206  ,count: 1},
{lng: 4.900653	,lat: 43.875205  ,count: 1},
{lng: 5.071672	,lat: 43.555806  ,count: 1},
{lng: 5.0482	,lat: 43.407655  ,count: 1},
{lng: 4.941872	,lat: 43.698312  ,count: 1},
{lng: 5.079327	,lat: 43.75166   ,count: 1},
{lng: 4.902263	,lat: 43.875685  ,count: 1},
{lng: 4.817418	,lat: 43.723826  ,count: 1},
{lng: 4.782087	,lat: 43.783486  ,count: 1},
{lng: 4.684924	,lat: 43.813731  ,count: 1},
{lng: 4.9454803	,lat: 43.7701135 ,count: 1},
{lng: 4.684924	,lat: 43.813731  ,count: 1},
{lng: 4.87813	,lat: 43.705143  ,count: 1},
{lng: 4.684393	,lat: 43.798169  ,count: 1},
{lng: 4.79522	,lat: 43.744045  ,count: 1},
{lng: 4.87813	,lat: 43.705143  ,count: 1},
{lng: 4.955474	,lat: 43.763806  ,count: 1},
{lng: 4.817418	,lat: 43.723826  ,count: 1},
{lng: 5.149453	,lat: 43.672184  ,count: 1},
{lng: 4.830218	,lat: 43.788698  ,count: 1},
{lng: 4.955474	,lat: 43.763806  ,count: 1},
{lng: 5.149453	,lat: 43.672184  ,count: 1},
{lng: 4.743712	,lat: 43.726778  ,count: 1},
{lng: 4.684924	,lat: 43.813731  ,count: 1},
{lng: 4.8300367	,lat: 43.7885909 ,count: 1},
{lng: 4.845673	,lat: 43.781562  ,count: 1},
{lng: 4.902306	,lat: 43.878098  ,count: 1},
{lng: 5.031359	,lat: 43.549508  ,count: 1},
{lng: 5.170198	,lat: 43.685526  ,count: 1},
{lng: 5.05929	,lat: 43.406871  ,count: 1},
{lng: 5.386122	,lat: 43.26939   ,count: 1},
{lng: 5.053728	,lat: 43.404811  ,count: 1},
{lng: 5.053385	,lat: 43.404701  ,count: 1},
{lng: 5.055372	,lat: 43.402515  ,count: 1},
{lng: 5.146185	,lat: 43.390426  ,count: 1},
{lng: 5.057289	,lat: 43.402361  ,count: 1},
{lng: 5.360826	,lat: 43.292242  ,count: 1},
{lng: 5.097697	,lat: 43.642483  ,count: 1},
{lng: 5.097697	,lat: 43.642483  ,count: 1},
{lng: 4.66095	,lat: 43.706353  ,count: 1},
{lng: 5.379005	,lat: 43.28815   ,count: 1},
{lng: 5.510198	,lat: 43.352286  ,count: 1},
{lng: 5.509247	,lat: 43.360925  ,count: 1},
{lng: 5.365365	,lat: 43.290088  ,count: 1},
{lng: 5.377132	,lat: 43.287055  ,count: 1},
{lng: 5.402156	,lat: 43.310124  ,count: 1},
{lng: 5.449033	,lat: 43.527616  ,count: 1},
{lng: 4.806604	,lat: 43.637085  ,count: 1},
{lng: 5.0297913	,lat: 43.6943816 ,count: 1},
{lng: 5.257398	,lat: 43.406267  ,count: 1},
{lng: 5.358175	,lat: 43.276531  ,count: 1},
{lng: 4.817418	,lat: 43.723826  ,count: 1},
{lng: 5.369195	,lat: 43.296005  ,count: 1},
{lng: 5.369195	,lat: 43.296005  ,count: 1},
{lng: 5.484719	,lat: 43.335364  ,count: 1},
{lng: 5.37382	,lat: 43.298063  ,count: 1},
{lng: 5.095822	,lat: 43.642111  ,count: 1},
{lng: 4.985897	,lat: 43.51611   ,count: 1},
{lng: 4.721439	,lat: 43.704336  ,count: 1},
{lng: 5.510198	,lat: 43.352286  ,count: 1},
{lng: 5.381126	,lat: 43.286337  ,count: 1},
{lng: 5.0078451	,lat: 43.7100748 ,count: 1},
{lng: 5.032302	,lat: 43.694784  ,count: 1},
{lng: 5.447656	,lat: 43.531401  ,count: 1},
{lng: 4.712791	,lat: 43.721056  ,count: 1},
{lng: 5.369903	,lat: 43.286456  ,count: 1},
{lng: 5.0301612	,lat: 43.6945661 ,count: 1},
{lng: 5.381479	,lat: 43.296078  ,count: 1},
{lng: 5.099439	,lat: 43.640665  ,count: 1},
{lng: 4.824309	,lat: 43.406997  ,count: 1},
{lng: 5.030631	,lat: 43.695106  ,count: 1},
{lng: 4.817418	,lat: 43.723826  ,count: 1},
{lng: 5.3116536	,lat: 43.28115760,count: 1},
{lng: 5.57223	,lat: 43.300106  ,count: 1},
{lng: 5.034238	,lat: 43.69836   ,count: 1},
{lng: 5.030631	,lat: 43.695106  ,count: 1},
{lng: 5.47996	,lat: 43.335952  ,count: 1},
{lng: 5.4500703	,lat: 43.5256996 ,count: 1},
{lng: 5.532196	,lat: 43.540352  ,count: 1},
{lng: 5.3705795	,lat: 43.3005937 ,count: 1},
{lng: 5.635228	,lat: 43.296591  ,count: 1},
{lng: 4.712549	,lat: 43.726464  ,count: 1},
{lng: 4.817418	,lat: 43.723826  ,count: 1},
{lng: 5.38817	,lat: 43.270239  ,count: 1},
{lng: 5.035118	,lat: 43.70217   ,count: 1},
{lng: 5.379777	,lat: 43.293768  ,count: 1},
{lng: 5.356601	,lat: 43.315283  ,count: 1},
{lng: 5.379005	,lat: 43.28815   ,count: 1},
{lng: 5.365381	,lat: 43.298866  ,count: 1},
{lng: 5.261829	,lat: 43.651131  ,count: 1},
{lng: 5.576243	,lat: 43.625964  ,count: 1},
{lng: 5.386638	,lat: 43.299011  ,count: 1},
{lng: 5.385027	,lat: 43.291768  ,count: 1},
{lng: 5.0078451	,lat: 43.7100748 ,count: 1},
{lng: 5.383707	,lat: 43.300829  ,count: 1},
{lng: 5.626563	,lat: 43.198733  ,count: 1},
{lng: 4.679425	,lat: 43.707547  ,count: 1},
{lng: 4.624515	,lat: 43.678503  ,count: 1},
{lng: 4.622133	,lat: 43.67588   ,count: 1},
{lng: 4.631853	,lat: 43.675865  ,count: 1},
{lng: 4.726031	,lat: 43.745894  ,count: 1},
{lng: 4.725344	,lat: 43.744375  ,count: 1},
{lng: 4.699531	,lat: 43.72684   ,count: 1},
{lng: 4.707749	,lat: 43.726514  ,count: 1},
{lng: 4.721267	,lat: 43.703018  ,count: 1},
{lng: 4.67612	,lat: 43.709889  ,count: 1},
{lng: 4.742897	,lat: 43.728359  ,count: 1},
{lng: 4.676099	,lat: 43.709439  ,count: 1},
{lng: 4.741373	,lat: 43.733972  ,count: 1},
{lng: 4.629106	,lat: 43.675329  ,count: 1},
{lng: 4.6323944	,lat: 43.6777822 ,count: 1},
{lng: 5.713544	,lat: 43.44531   ,count: 1},
{lng: 5.607085	,lat: 43.175848  ,count: 1},
{lng: 4.9610649	,lat: 43.8600677 ,count: 1},
{lng: 4.9497	,lat: 43.861102  ,count: 1},
{lng: 4.9497	,lat: 43.861102  ,count: 1},
{lng: 4.9517036	,lat: 43.8607768 ,count: 1},
{lng: 4.949205	,lat: 43.857451  ,count: 1},
{lng: 4.9170684	,lat: 43.88454727,count: 1},
{lng: 4.9473023	,lat: 43.86114359,count: 1},
{lng: 4.95178	,lat: 43.860029  ,count: 1},
{lng: 4.9546894	,lat: 43.8545144 ,count: 1},
{lng: 4.842396	,lat: 43.8414    ,count: 1},
{lng: 5.532084	,lat: 43.624008  ,count: 1},
{lng: 5.576243	,lat: 43.625964  ,count: 1},
{lng: 5.276497	,lat: 43.696048  ,count: 1},
{lng: 5.159182	,lat: 43.346074  ,count: 1},
{lng: 4.948606	,lat: 43.832489  ,count: 1},
{lng: 5.159182	,lat: 43.346074  ,count: 1},
{lng: 5.055299	,lat: 43.406048  ,count: 1},
{lng: 5.053378	,lat: 43.406105  ,count: 1},
{lng: 5.66052	,lat: 43.629047  ,count: 1},
{lng: 5.761583	,lat: 43.6937032 ,count: 1},
{lng: 5.434175	,lat: 43.662194  ,count: 1},
{lng: 4.9445246	,lat: 43.8292892 ,count: 1},
{lng: 5.66052	,lat: 43.629047  ,count: 1},
{lng: 4.780063	,lat: 43.832875  ,count: 1},
{lng: 5.426929	,lat: 43.661382  ,count: 1},
{lng: 5.761583	,lat: 43.6937032 ,count: 1},
{lng: 5.316497	,lat: 43.717548  ,count: 1},
{lng: 5.054774	,lat: 43.404785  ,count: 1},
{lng: 5.071849	,lat: 43.330748  ,count: 1},
{lng: 5.053047	,lat: 43.405149  ,count: 1},
{lng: 5.532084	,lat: 43.624008  ,count: 1},
{lng: 5.045061	,lat: 43.329176  ,count: 1},
{lng: 4.946541	,lat: 43.803875  ,count: 1},
{lng: 4.845673	,lat: 43.781562  ,count: 1},
{lng: 4.817418	,lat: 43.723826  ,count: 1},
{lng: 4.831603	,lat: 43.785134  ,count: 1},
{lng: 4.832046	,lat: 43.780341  ,count: 1},
{lng: 4.782705	,lat: 43.822914  ,count: 1},
{lng: 6.6302386	,lat: 45.9364322 ,count: 1},
{lng: 5.049773	,lat: 43.404151  ,count: 1},
{lng: 5.3782513	,lat: 43.2370789 ,count: 1},
{lng: 5.572246	,lat: 43.292841  ,count: 1},
{lng: 4.804252	,lat: 43.387459  ,count: 1},
{lng: 5.119247	,lat: 43.623529  ,count: 1},
{lng: 5.046226	,lat: 43.643819  ,count: 1},
{lng: 5.0702794	,lat: 43.6499323 ,count: 1},
{lng: 5.097011	,lat: 43.641685  ,count: 1},
{lng: 5.2614	,lat: 43.654808  ,count: 1},
{lng: 5.358175	,lat: 43.2765314 ,count: 1},
{lng: 5.09803	,lat: 43.640422  ,count: 1},
{lng: 5.354234	,lat: 43.350644  ,count: 1},
{lng: 5.364294	,lat: 43.297672  ,count: 1},
{lng: 5.409613	,lat: 43.265485  ,count: 1},
{lng: 5.3764358	,lat: 43.2925062 ,count: 1},
{lng: 5.3763268	,lat: 43.2551975 ,count: 1},
{lng: 5.549764	,lat: 43.218326  ,count: 1},
{lng: 4.782482	,lat: 43.830922  ,count: 1},
{lng: 5.402133	,lat: 43.310062  ,count: 1},
{lng: 5.3859417	,lat: 43.2711288 ,count: 1},
{lng: 5.3821768	,lat: 43.300771  ,count: 1},
{lng: 5.374426	,lat: 43.295281  ,count: 1},
{lng: 5.492101	,lat: 43.32484   ,count: 1},
{lng: 5.070279	,lat: 43.649932  ,count: 1},
{lng: 4.914324	,lat: 43.474548  ,count: 1},
{lng: 5.046226	,lat: 43.643819  ,count: 1},
{lng: 5.10269	,lat: 43.629437  ,count: 1},
{lng: 5.369181	,lat: 43.297528  ,count: 1},
{lng: 5.39751	,lat: 43.261989  ,count: 1},
{lng: 5.098591	,lat: 43.640786  ,count: 1},
{lng: 5.373057	,lat: 43.298388  ,count: 1},
{lng: 5.364294	,lat: 43.297672  ,count: 1},
{lng: 5.0368005	,lat: 43.7917436 ,count: 1},
{lng: 5.379156	,lat: 43.298648  ,count: 1},
{lng: 5.365674	,lat: 43.238259  ,count: 1},
{lng: 5.3802108	,lat: 43.28720268,count: 1},
{lng: 5.3599355	,lat: 43.3174701 ,count: 1},
{lng: 5.372118	,lat: 43.300356  ,count: 1},
{lng: 5.509247	,lat: 43.3609248 ,count: 1},
{lng: 5.3808683	,lat: 43.2875818 ,count: 1},
{lng: 5.357959	,lat: 43.289162  ,count: 1},
{lng: 5.380238	,lat: 43.288406  ,count: 1},
{lng: 5.4395455	,lat: 43.3521569 ,count: 1},
{lng: 5.0368005	,lat: 43.7917436 ,count: 1},
{lng: 4.773098	,lat: 43.85087   ,count: 1},
{lng: 5.358175	,lat: 43.276531  ,count: 1},
{lng: 5.386122	,lat: 43.26939   ,count: 1},
{lng: 5.380121	,lat: 43.297272  ,count: 1},
{lng: 4.817418	,lat: 43.723826  ,count: 1},
{lng: 5.483645	,lat: 43.529812  ,count: 1},
{lng: 5.378732	,lat: 43.292585  ,count: 1},
{lng: 5.383051	,lat: 43.294326  ,count: 1},
{lng: 4.629062	,lat: 43.679183  ,count: 1},
{lng: 5.36705	,lat: 43.240149  ,count: 1},
{lng: 4.629438	,lat: 43.677636  ,count: 1},
{lng: 5.358944	,lat: 43.29204   ,count: 1},
{lng: 4.629254	,lat: 43.676968  ,count: 1},
{lng: 4.633657	,lat: 43.67815   ,count: 1},
{lng: 5.393698	,lat: 43.296652  ,count: 1},
{lng: 4.632313	,lat: 43.673847  ,count: 1},
{lng: 4.62306	,lat: 43.676497  ,count: 1},
{lng: 5.378732	,lat: 43.292585  ,count: 1},
{lng: 5.054671	,lat: 43.40375   ,count: 1},
{lng: 4.625817	,lat: 43.676546  ,count: 1},
{lng: 4.631402	,lat: 43.681327  ,count: 1},
{lng: 4.627613	,lat: 43.676371  ,count: 1},
{lng: 4.61679	,lat: 43.672714  ,count: 1},
{lng: 4.659834	,lat: 43.804011  ,count: 1},
{lng: 4.627669	,lat: 43.676377  ,count: 1},
{lng: 4.627175	,lat: 43.677029  ,count: 1},
{lng: 4.621425	,lat: 43.674018  ,count: 1},
{lng: 4.627368	,lat: 43.676811  ,count: 1},
{lng: 5.610952	,lat: 43.178565  ,count: 1},
{lng: 4.627441	,lat: 43.676346  ,count: 1},
{lng: 4.62239	,lat: 43.675539  ,count: 1},
{lng: 4.632282	,lat: 43.675213  ,count: 1},
{lng: 4.631059	,lat: 43.679591  ,count: 1},
{lng: 4.628998	,lat: 43.677743  ,count: 1},
{lng: 5.369195	,lat: 43.296005  ,count: 1},
{lng: 4.631677	,lat: 43.676434  ,count: 1},
{lng: 4.627595	,lat: 43.678717  ,count: 1},
{lng: 5.448917	,lat: 43.527972  ,count: 1},
{lng: 5.447391	,lat: 43.531205  ,count: 1},
{lng: 5.362146	,lat: 43.292251  ,count: 1},
{lng: 5.32596	,lat: 43.2799    ,count: 1},
{lng: 5.329099	,lat: 43.716049  ,count: 1},
{lng: 5.382602	,lat: 43.3002    ,count: 1},
{lng: 5.6042904	,lat: 43.1740354 ,count: 1},
{lng: 4.805679	,lat: 43.384298  ,count: 1},
{lng: 4.435891	,lat: 43.496124  ,count: 1},
{lng: 5.365381	,lat: 43.298866  ,count: 1},
{lng: 5.367363	,lat: 43.297696  ,count: 1},
{lng: 4.899817	,lat: 43.88297   ,count: 1},
{lng: 5.713544	,lat: 43.44531   ,count: 1},
{lng: 5.054921	,lat: 43.407008  ,count: 1},
{lng: 5.053728	,lat: 43.404811  ,count: 1},
{lng: 5.3853916	,lat: 43.2991124 ,count: 1},
{lng: 5.609674	,lat: 43.173941  ,count: 1},
{lng: 5.380554	,lat: 43.301915  ,count: 1},
{lng: 5.609964	,lat: 43.177177  ,count: 1},
{lng: 5.3696376	,lat: 43.2996323 ,count: 1},
{lng: 5.378667	,lat: 43.296724  ,count: 1},
{lng: 5.3727494	,lat: 43.2937435 ,count: 1},
{lng: 5.054795	,lat: 43.407674  ,count: 1},
{lng: 5.053728	,lat: 43.404811  ,count: 1},
{lng: 5.365839	,lat: 43.305206  ,count: 1},
{lng: 5.098425	,lat: 43.638462  ,count: 1},
{lng: 5.395069	,lat: 43.265414  ,count: 1},
{lng: 5.265538	,lat: 43.450861  ,count: 1},
{lng: 5.055456	,lat: 43.405141  ,count: 1},
{lng: 5.024861	,lat: 43.401618  ,count: 1},
{lng: 5.048639	,lat: 43.402754  ,count: 1},
{lng: 5.051501	,lat: 43.407173  ,count: 1},
{lng: 5.054327	,lat: 43.40359   ,count: 1},
{lng: 5.056822	,lat: 43.404527  ,count: 1},
{lng: 5.159646	,lat: 43.495338  ,count: 1},
{lng: 5.048223	,lat: 43.405737  ,count: 1},
{lng: 5.055548	,lat: 43.405473  ,count: 1},
{lng: 5.3599355	,lat: 43.3174701 ,count: 1},
{lng: 5.215176	,lat: 43.415595  ,count: 1},
{lng: 5.2110093	,lat: 43.4181781 ,count: 1},
{lng: 5.042156	,lat: 43.402608  ,count: 1},
{lng: 5.071672	,lat: 43.555806  ,count: 1},
{lng: 5.054867	,lat: 43.405369  ,count: 1},
{lng: 4.981313	,lat: 43.464149  ,count: 1},
{lng: 5.047247	,lat: 43.405387  ,count: 1},
{lng: 5.014791	,lat: 43.456615  ,count: 1},
{lng: 5.014758	,lat: 43.584217  ,count: 1},
{lng: 5.054761	,lat: 43.408021  ,count: 1},
{lng: 5.5017474	,lat: 43.6946599 ,count: 1},
{lng: 5.5017474	,lat: 43.6946599 ,count: 1},
{lng: 5.501843	,lat: 43.694275  ,count: 1},
{lng: 5.135696	,lat: 43.659142  ,count: 1},
{lng: 5.153997	,lat: 43.629572  ,count: 1},
{lng: 5.189124	,lat: 43.684265  ,count: 1},
{lng: 5.44883	,lat: 43.525648  ,count: 1},
{lng: 5.501843	,lat: 43.694275  ,count: 1},
{lng: 4.90129	,lat: 43.875405  ,count: 1},
{lng: 5.500274	,lat: 43.487933  ,count: 1},
{lng: 5.501843	,lat: 43.694275  ,count: 1},
{lng: 5.4836413	,lat: 43.3380244 ,count: 1},
{lng: 5.3695611	,lat: 43.2968009 ,count: 1},
{lng: 4.902434	,lat: 43.834279  ,count: 1},
{lng: 4.635648	,lat: 43.674843  ,count: 1},
{lng: 5.685663	,lat: 43.44568   ,count: 1},
{lng: 5.046185	,lat: 43.415653  ,count: 1},
{lng: 5.051521	,lat: 43.404195  ,count: 1},
{lng: 5.054867	,lat: 43.405369  ,count: 1},
{lng: 5.609035	,lat: 43.173905  ,count: 1},
{lng: 5.510198	,lat: 43.352286  ,count: 1},
{lng: 5.496108	,lat: 43.36358   ,count: 1},
{lng: 5.510198	,lat: 43.352286  ,count: 1},
{lng: 4.684924	,lat: 43.813731  ,count: 1},
{lng: 4.745487	,lat: 43.891198  ,count: 1},
{lng: 4.748585	,lat: 43.900033  ,count: 1},
{lng: 4.745487	,lat: 43.891198  ,count: 1},
{lng: 5.365365	,lat: 43.290088  ,count: 1},
{lng: 4.657946	,lat: 43.804724  ,count: 1},
{lng: 5.382602	,lat: 43.3002    ,count: 1},
{lng: 4.627613	,lat: 43.676371  ,count: 1},
{lng: 5.713544	,lat: 43.44531   ,count: 1},
{lng: 4.695003	,lat: 43.766523  ,count: 1},
{lng: 4.627441	,lat: 43.676346  ,count: 1},
{lng: 4.747712	,lat: 43.898505  ,count: 1},
{lng: 4.747085	,lat: 43.899381  ,count: 1},
{lng: 4.658096	,lat: 43.804816  ,count: 1},
{lng: 4.415633	,lat: 43.450386  ,count: 1},
{lng: 4.627562	,lat: 43.676454  ,count: 1},
{lng: 4.655581	,lat: 43.805316  ,count: 1},
{lng: 4.42792	,lat: 43.451726  ,count: 1},
{lng: 5.3821768	,lat: 43.300771  ,count: 1},
{lng: 5.373816	,lat: 43.294918  ,count: 1},
{lng: 4.631612	,lat: 43.677953  ,count: 1},
{lng: 4.655607	,lat: 43.805436  ,count: 1},
{lng: 4.747712	,lat: 43.898505  ,count: 1},
{lng: 4.748076	,lat: 43.899343  ,count: 1},
{lng: 4.657495	,lat: 43.806055  ,count: 1},
{lng: 4.728005	,lat: 43.858204  ,count: 1},
{lng: 5.3821768	,lat: 43.300771  ,count: 1},
{lng: 5.3681992	,lat: 43.2959245 ,count: 1},
{lng: 5.3821768	,lat: 43.300771  ,count: 1},
{lng: 4.655156	,lat: 43.806473  ,count: 1},
{lng: 4.745487	,lat: 43.891198  ,count: 1},
{lng: 4.662366	,lat: 43.80796   ,count: 1},
//parc et jardins
{lng: 5.705467,	lat:43.378951, count:1},
{lng: 5.363897,	lat:43.360469, count:1},
{lng: 5.563594,	lat:43.2904, count:1},
{lng: 4.8207485,	lat:43.8465322, count:1},
{lng: 5.155622,	lat:43.664925, count:1},
{lng: 5.1777219,	lat:43.4820495, count:1},
{lng: 5.2171811,	lat:43.4172279, count:1},
{lng: 5.193726,	lat:43.625407, count:1},
{lng: 5.574687,	lat:43.289151, count:1},
{lng: 5.549764,	lat:43.218326, count:1},
{lng: 5.4882679,	lat:43.2848916, count:1},
{lng: 5.612432,	lat:43.180452, count:1},
{lng: 5.439324,	lat:43.339163, count:1},
{lng: 5.051538,	lat:43.427726, count:1},
{lng: 5.2055475,	lat:43.4157053, count:1},
{lng: 5.438165,	lat:43.281329, count:1},
{lng: 5.561574,	lat:43.287177, count:1},
{lng: 5.535913,	lat:43.219443, count:1},
{lng: 5.576463,	lat:43.273081, count:1},
{lng: 5.395858,	lat:43.246588, count:1},
{lng: 5.154376,	lat:43.64194, count:1},
{lng: 5.552677,	lat:43.286246, count:1},
{lng: 5.551228,	lat:43.2239964, count:1},
{lng: 5.57223,	lat:43.300106, count:1},
{lng: 5.070856,	lat:43.562503, count:1},
{lng: 5.4039247,	lat:43.3394725, count:1},
{lng: 5.355235,	lat:43.278005, count:1},
{lng: 5.565442,	lat:43.286451, count:1},
{lng: 5.576463,	lat:43.273081, count:1},
{lng: 5.150244,	lat:43.631313, count:1},
{lng: 5.547924,	lat:43.311955, count:1},
{lng: 5.206747,	lat:43.418032, count:1},
{lng: 4.684393,	lat:43.798169, count:1},
{lng: 5.159212,	lat:43.630368, count:1},
{lng: 4.945827,	lat:43.526782, count:1},
{lng: 4.945827,	lat:43.526782, count:1},
{lng: 4.945827,	lat:43.526782, count:1},
{lng: 4.782482,	lat:43.830922, count:1},
{lng: 4.945827,	lat:43.526782, count:1},
{lng: 5.569682,	lat:43.293997, count:1},
{lng: 5.056656,	lat:43.413407, count:1},
{lng: 4.7708,	lat:43.85399, count:1},
{lng: 5.421905,	lat:43.525321, count:1},
{lng: 5.461453,	lat:43.5152, count:1},
{lng: 5.439084,	lat:43.526405, count:1},
{lng: 4.6554905,	lat:43.806177, count:1},
{lng: 5.510541,	lat:43.488489, count:1},
{lng: 5.456401,	lat:43.531052, count:1},
{lng: 5.45851,	lat:43.511942, count:1},
{lng: 5.442915,	lat:43.530084, count:1},
{lng: 5.470483,	lat:43.519926, count:1},
{lng: 5.448566,	lat:43.523197, count:1},
{lng: 5.4221552,	lat:43.5319903, count:1},
{lng: 5.49898,	lat:43.59508, count:1},
{lng: 4.61679,	lat:43.672947, count:1},
{lng: 4.629457,	lat:43.675467, count:1},
{lng: 4.945827,	lat:43.526782, count:1},
{lng: 5.453262,	lat:43.54954, count:1},
{lng: 4.781647,	lat:43.838387, count:1},
{lng: 5.40599,	lat:43.4533, count:1},
{lng: 5.353184,	lat:43.570563, count:1},
{lng: 4.955474,	lat:43.763806, count:1},
{lng: 5.340769,	lat:43.664172, count:1},
{lng: 4.739384,	lat:43.780133, count:1},
{lng: 4.694201,	lat:43.760032, count:1},
{lng: 5.445947,	lat:43.295595, count:1},
{lng: 5.395069,	lat:43.265414, count:1},
{lng: 5.042376,	lat:43.43547, count:1},
{lng: 5.095822,	lat:43.642111, count:1},
{lng: 5.095586,	lat:43.641723, count:1},
{lng: 5.510198,	lat:43.352286, count:1},
{lng: 5.60483,	lat:43.1629, count:1},
{lng: 5.60929,	lat:43.17745, count:1},
{lng: 5.048715,	lat:43.433236, count:1},
{lng: 5.05665,	lat:43.40784, count:1},
{lng: 5.093215,	lat:43.640583, count:1},
{lng: 5.4306141,	lat:43.2731832, count:1},
{lng: 5.37407,	lat:43.29786, count:1},
{lng: 5.614482,	lat:43.203997, count:1},
{lng: 5.383074,	lat:43.266032, count:1},
{lng: 5.3576017,	lat:43.3600653, count:1},
{lng: 5.416975,	lat:43.268076, count:1},
{lng: 5.293515,	lat:43.359711, count:1},
{lng: 5.379172,	lat:43.270364, count:1},
{lng: 5.4018087,	lat:43.305868, count:1},
{lng: 5.370115,	lat:43.289144, count:1},
{lng: 5.378119,	lat:43.346997, count:1},
{lng: 5.467296,	lat:43.459072, count:1},
{lng: 5.093951,	lat:43.645647, count:1},
{lng: 5.424588,	lat:43.25051, count:1},
{lng: 5.395069,	lat:43.265414, count:1},
{lng: 4.807527,	lat:43.632239, count:1},
{lng: 5.373231,	lat:43.265029, count:1},
{lng: 5.436316,	lat:43.277261, count:1},
{lng: 5.39751,	lat:43.261989, count:1},
{lng: 5.38875,	lat:43.25038, count:1},
{lng: 5.400839,	lat:43.329154, count:1},
{lng: 4.43879,	lat:43.5131812, count:1},
{lng: 5.571275,	lat:43.301497, count:1},
{lng: 4.791592,	lat:43.399362, count:1},
{lng: 4.791592,	lat:43.399362, count:1},
{lng: 4.799895,	lat:43.395718, count:1},
{lng: 4.801542,	lat:43.388277, count:1},
{lng: 5.091342,	lat:43.650141, count:1},
{lng: 5.106142,	lat:43.641444, count:1},
{lng: 5.059719,	lat:43.641541, count:1},
{lng: 5.070279,	lat:43.649932, count:1},
{lng: 4.845673,	lat:43.781562, count:1},
{lng: 5.342359,	lat:43.356886, count:1},
{lng: 5.37077,	lat:43.282368, count:1},
{lng: 5.337647,	lat:43.364535, count:1},
{lng: 5.365105,	lat:43.330607, count:1},
{lng: 5.384095,	lat:43.258647, count:1},
{lng: 5.167847,	lat:43.488612, count:1},
{lng: 5.378591,	lat:43.26273, count:1},
{lng: 5.360826,	lat:43.292242, count:1},
{lng: 4.796938,	lat:43.783339, count:1},
{lng: 5.36705,	lat:43.240149, count:1},
{lng: 5.058061,	lat:43.413596, count:1},
{lng: 5.682334899902344,	lat:43.44706166645264, count:1},
//plages
{lng: 2.213749,	lat:46.227638, count:1},
{lng: 5.222368,	lat:43.483753, count:1},
{lng: 5.198121,	lat:43.33395, count:1},
{lng: 5.37153,	lat:43.2631, count:1},
{lng: 5.109758,	lat:43.329767, count:1},
{lng: 5.29625,	lat:43.2799, count:1},
{lng: 5.054913,	lat:43.328331, count:1},
{lng: 5.37278,	lat:43.2611, count:1},
{lng: 5.667787,	lat:43.182023, count:1},
{lng: 5.03079,	lat:43.3337, count:1},
{lng: 4.96901,	lat:43.4257, count:1},
{lng: 5.029507,	lat:43.548175, count:1},
{lng: 5.15017,	lat:43.4059, count:1},
{lng: 4.974489,	lat:43.403177, count:1},
{lng: 5.649161,	lat:43.188469, count:1},
{lng: 5.345407,	lat:43.215373, count:1},
{lng: 5.636458,	lat:43.189126, count:1},
{lng: 5.024958,	lat:43.346091, count:1},
{lng: 4.54918,	lat:43.4498, count:1},
{lng: 4.974833,	lat:43.411626, count:1},
{lng: 5.624657,	lat:43.187061, count:1},
{lng: 5.197134,	lat:43.33356, count:1},
{lng: 5.362425,	lat:43.239867, count:1},
{lng: 5.184624,	lat:43.482212, count:1},
{lng: 5.183101,	lat:43.332451, count:1},
{lng: 5.000367,	lat:43.474224, count:1},
{lng: 4.92343,	lat:43.4324, count:1},
{lng: 5.450324,	lat:43.2104, count:1},
{lng: 5.03264,	lat:43.545282, count:1},
{lng: 5.361623,	lat:43.237997, count:1},
{lng: 5.210395,	lat:43.330516, count:1},
{lng: 5.048175,	lat:43.524157, count:1},
{lng: 4.54406,	lat:43.4516, count:1},
{lng: 4.976377,	lat:43.404393, count:1},
{lng: 5.351146,	lat:43.232291, count:1},
{lng: 5.15196,	lat:43.3264, count:1},
{lng: 5.15196,	lat:43.3264, count:1},
{lng: 5.15196,	lat:43.3264, count:1},
{lng: 5.545564,	lat:43.210306, count:1},
{lng: 5.37554,	lat:43.2512, count:1},
{lng: 4.54918,	lat:43.4498, count:1},
{lng: 4.981785,	lat:43.400246, count:1},
{lng: 5.198164,	lat:43.333887, count:1},
{lng: 5.4205,	lat:43.2103, count:1},
{lng: 5.5487823486328125,	lat:43.20852282297554, count:1},
{lng: 5.37437,	lat:43.2528, count:1},
{lng: 5.15196,	lat:43.3264, count:1},
{lng: 5.370297,	lat:43.264081, count:1},
{lng: 5.443425,	lat:43.212964, count:1},
{lng: 5.353732,	lat:43.278705, count:1},
{lng: 5.498185,	lat:43.20236, count:1},
{lng: 5.510792,	lat:43.203964, count:1},
{lng: 5.345986,	lat:43.215326, count:1},
{lng: 5.454379,	lat:43.212057, count:1},
{lng: 5.357895,	lat:43.234245, count:1},
{lng: 5.013928,	lat:43.452825, count:1},
{lng: 5.09769,	lat:43.3286, count:1},
{lng: 5.026245,	lat:43.469615, count:1},
{lng: 5.016632,	lat:43.450177, count:1},
{lng: 5.126495,	lat:43.329876, count:1},
{lng: 5.104609,	lat:43.329517, count:1},
{lng: 5.099673,	lat:43.329938, count:1},
{lng: 5.09624,	lat:43.32977, count:1},
{lng: 4.92343,	lat:43.4324, count:1},
{lng: 4.939728,	lat:43.431014, count:1},
{lng: 4.92343,	lat:43.4324, count:1},
{lng: 5.626931,	lat:43.187155, count:1},
{lng: 5.614185,	lat:43.18146, count:1},
{lng: 5.617533,	lat:43.183995, count:1},
{lng: 5.18574,	lat:43.4275, count:1},
{lng: 4.97421,	lat:43.41239, count:1},
{lng: 5.597126,	lat:43.166844, count:1},
{lng: 2.213749,	lat:46.227638, count:1},
{lng: 5.585175,	lat:43.652721, count:1},
{lng: 5.228548,	lat:43.468432, count:1},
{lng: 5.348829,	lat:43.228472, count:1},
{lng: 5.3622,	lat:43.2731, count:1},
{lng: 5.35542,	lat:43.2907, count:1},
{lng: 5.60586,	lat:43.166156, count:1},
{lng: 5.37497,	lat:43.2596, count:1},
{lng: 5.37615,	lat:43.2567, count:1},
{lng: 5.049891,	lat:43.332155, count:1},
{lng: 5.53822,	lat:43.2122, count:1},
{lng: 5.619121,	lat:43.184746, count:1},
{lng: 4.880118,	lat:43.351272, count:1},
{lng: 4.87278,	lat:43.346653, count:1},
{lng: 4.87276,	lat:43.3473, count:1},
{lng: 4.850121,	lat:43.378789, count:1},
{lng: 5.03928,	lat:43.3311, count:1},
{lng: 5.37111,	lat:43.2445, count:1},
{lng: 5.30314,	lat:43.3603, count:1},
{lng: 5.024786,	lat:43.352114, count:1},
{lng: 5.079589,	lat:43.330376, count:1},
{lng: 5.070727,	lat:43.331609, count:1},
{lng: 5.474453,	lat:43.287296, count:1},
{lng: 5.545349,	lat:43.210431, count:1},
{lng: 5.53106,	lat:43.2122, count:1},
{lng: 4.78139,	lat:43.3483, count:1},
//sites natures
{lng: 4.796906,	lat:43.675321, count:1},
{lng: 5.353539,	lat:43.212229, count:1},
{lng: 5.337574,	lat:43.214051, count:1},
{lng: 5.48838,	lat:43.2551, count:1},
{lng: 5.346909,	lat:43.215185, count:1},
{lng: 4.995832,	lat:43.555801, count:1},
{lng: 4.885483,	lat:43.881315, count:1},
{lng: 5.051601,	lat:43.587861, count:1},
{lng: 5.30093,	lat:43.5136, count:1},
{lng: 5.617704,	lat:43.161429, count:1},
{lng: 5.184517,	lat:43.562233, count:1},
{lng: 5.031481,	lat:43.453854, count:1},
{lng: 5.65407,	lat:43.2928, count:1},
{lng: 5.622489,	lat:43.184746, count:1},
{lng: 5.45346,	lat:43.3499, count:1},
{lng: 5.419843,	lat:43.21004, count:1},
{lng: 5.498185,	lat:43.202267, count:1},
{lng: 5.443726,	lat:43.213011, count:1},
{lng: 5.510786,	lat:43.203928, count:1},
{lng: 5.608649,	lat:43.164966, count:1},
{lng: 5.487499,	lat:43.479332, count:1},
{lng: 5.68061,	lat:43.5524, count:1},
{lng: 5.4998,	lat:43.5315, count:1},
{lng: 5.289917,	lat:43.568452, count:1},
{lng: 5.43652,	lat:43.6294, count:1},
{lng: 5.545092,	lat:43.531687, count:1},
{lng: 5.60483,	lat:43.160646, count:1},
{lng: 5.30262,	lat:43.451174, count:1},
{lng: 4.98281,	lat:43.4401, count:1},
{lng: 5.51151,	lat:43.532247, count:1},
{lng: 5.544491,	lat:43.546371, count:1},
{lng: 4.78451,	lat:43.5981, count:1},
{lng: 5.67612,	lat:43.3103, count:1},
{lng: 5.30496,	lat:43.2806, count:1},
{lng: 5.52137,	lat:43.211268, count:1},
{lng: 5.551958,	lat:43.198231, count:1},
{lng: 5.57783,	lat:43.6123, count:1},
{lng: 5.39894,	lat:43.6163, count:1},
{lng: 5.31225,	lat:43.6814, count:1},
{lng: 4.59436,	lat:43.606, count:1},
{lng: 4.71667,	lat:43.85, count:1},
{lng: 4.572716,	lat:43.454508, count:1},
{lng: 5.60586,	lat:43.166156, count:1},
{lng: 4.77182,	lat:43.5611, count:1},
{lng: 5.370255,	lat:43.215185, count:1},
{lng: 5.65234,	lat:43.4154, count:1},
{lng: 5.42451,	lat:43.2123, count:1},
{lng: 5.159783,	lat:43.5645, count:1},
{lng: 4.91858,	lat:43.7389, count:1},
{lng: 5.62448,	lat:43.2365, count:1},
{lng: 5.26665,	lat:43.684114, count:1},
{lng: 5.492992,	lat:43.3219, count:1},
{lng: 5.52603,	lat:43.3215, count:1},
{lng: 5.130787,	lat:43.328799, count:1},
{lng: 5.12074,	lat:43.3274, count:1},
{lng: 5.171127,	lat:43.463137, count:1},
{lng: 5.50637,	lat:43.3747, count:1}
		]
    };

});

;require.register("router", function(exports, require, module) {
var AppView = require('views/app_view');
var GeolocationCollection = require('collections/geolocations');

var geolocations = new GeolocationCollection();

module.exports = Router = Backbone.Router.extend({

    routes: {
        '': 'main'
    },

    main: function() {
        var mainView = new AppView({
            collection: geolocations
        });
        mainView.render();
    }
});
});

;require.register("templates/home", function(exports, require, module) {
module.exports = function anonymous(locals, attrs, escape, rethrow, merge) {
attrs = attrs || jade.attrs; escape = escape || jade.escape; rethrow = rethrow || jade.rethrow; merge = merge || jade.merge;
var buf = [];
with (locals || {}) {
var interp;
buf.push('<div class="navbar navbar-inverse navbar-fixed-top"><div class="navbar-inner"><div class="container"><a data-toggle="collapse" data-target=".nav-collapse" class="btn btn-navbar"><span class="icon-bar"></span><span class="icon-bar"></span><span class="icon-bar"></span></a><a href="#" class="brand"> MesInfos Géographiques</a><div class="nav-collapse collapse"><ul class="nav"><li><a href="#dataviz"> Cartes</a></li><li><a href="#about"> A Propos</a></li><li><a href="#contact"> Contact</a></li></ul></div></div></div></div><div class="container"><div class="hero-unit"><h2> MesInfos Géographiques</h2><p>Carte des lieux les plus fréquentés <br/>\nPermet de voir les lieux les plus fréquentés ainsi que de retrouver quand un lieux à été visité</p></div><div id="dataviz" class="row"><div class="span7"><h2> MesInfos Géographiques</h2><p class="text-info"> Carte des lieux fréquentés</p><div id="googleHeatmapArea" style="padding:0;height:400px;cursor:pointer;position:relative;" class="well"></div></div><div class="span5"><h2> Historique de visites</h2><p class="text-info"> Graphe de fréquentation du lieu visible sur la carte.</p><div id="chartArea" style="padding:0;height:400px;cursor:pointer;position:relative;" class="well"></div></div></div><div id="dataviz" class="row"><div class="span7"><h2> MesInfos Géographiques (Leaflet)</h2><p class="text-info"> Carte des lieux fréquentés</p><div id="map" style="padding:0;height:400px;cursor:pointer;position:relative;" class="well"></div></div></div><div id="about" class="row"><div class="span9"><h2> A Propos</h2><p> \nL\'appli MesInfos Géographique à été imaginée dans le cadre du concours mes infos organisé par la Fing.<br/>\nIl à pour objectif de permettre aux utilisateurs de visualiser la carte de ses déplacement.</p><p> \nLes données utilisées ici sont fournies par orange et sont basé sur la triangulation de votre téléphone <br/>\nLa précision des coordonnées est variable et la carte est uniquement indicative, et le fait d\'etre "vu" en un lieu ne signifie pas nécéssairement que vous y étiez. \nCependant il indique que vous étiez pas loin. <br/></p></div></div><div id="contact" class="row"><div class="span3"><h2> Contacts</h2><p> Patrice Delorme <br/>\n@pdelorme<br/>\npdelorme@lookal.fr</p></div></div><!-- footer      --><footer><p> &copy; Patrice Delorme 2013</p></footer></div>');
}
return buf.join("");
};
});

;require.register("views/app_view", function(exports, require, module) {
var StatsView = require('./map_view');

module.exports = AppView = Backbone.View.extend({

    el: 'body',
    template: require('../templates/home'),
    events: {
        "click #refreshButton": "refreshMap"
    },

    // initialize is automatically called once after the view is constructed
    initialize: function() {
        // this.listenTo(this.collection, "add", this.onBookmarkAdded);
    },

    render: function() {

        // we render the template
        this.$el.html(this.template());
        this.refreshMap();
        // fetch the receipts from the database
        this.collection.fetch();
    },

    refreshMap: function(event) {
      // render the stats view
      mapView = new MapView({
          model: this.collection
      });
      mapView.render();
      // this.$el.find('#tab-content').html(statsView.$el);
    },
    
    coachView:function(event){
    	this.$el.find('#tab-content').html("");
    },
    
    controlView:function(event){
    	this.$el.find('#tab-content').html("");
    }
});
});

;require.register("views/map_view", function(exports, require, module) {
var myLatlng = new google.maps.LatLng(43.293466, 5.364575);


module.exports = MapView = Backbone.View.extend({

    el: '#dataviz',
    
    events: {
        "click #refreshButton": "refreshView"
    },
    
    // initialize is automatically called once after the view is constructed
    initialize: function() {
    	this.initGoogleMap();
		this.initLeafletMap();
		this.initChart();
		
		// centre la carte sur l'utilisateur.
    	var that = this;
    	navigator.geolocation.getCurrentPosition(
			function(location){
	    		that.latitude = location.coords.latitude;
	    		that.longitude = location.coords.longitude;
	    		that.gotoLocation(that.longitude,that.latitude);
	    	}
		);
		
	},

	gotoLocation: function (longitude, latitude){
		if(this.lmap){
			this.lmap.setView([latitude,longitude]);
			this.updateLMap();
		}
		if(this.gmap){
			this.gmap.center = new google.maps.LatLng(latitude, longitude);
		}
	},
	initGoogleMap: function(){
		this.options = {
		  zoom: 5,
		  center: myLatlng,
		  mapTypeId: google.maps.MapTypeId.ROADMAP,
		  disableDefaultUI: false,
		  scrollwheel: true,
		  draggable: true,
		  navigationControl: true,
		  mapTypeControl: false,
		  scaleControl: true,
		  disableDoubleClickZoom: false
		};
		this.gmap = new google.maps.Map(this.$el.find("#googleHeatmapArea")[0], this.options);
		
		this.gheatmap = new HeatmapOverlay(this.gmap, {
		    "radius":20,
		    "visible":true, 
		    "opacity":60
		});


		// this is important, because if you set the data set too early, the latlng/pixel projection doesn't work
		var that = this;
		google.maps.event.addListenerOnce(this.gmap, "idle", function(){
			that.updateGMap();
		});
		google.maps.event.addListener(this.gmap, 'click', function(e) {
			that.updateGMap();
			//alert(e.latLng);
		});
		google.maps.event.addListener(this.gmap, 'bounds_changed', function(e) {
			that.updateGMap(function(){
	    		that.updateChart(that.locationData);
	    	});
		});
	},
	
	initChart:function(){
		// init charts
		this.geolocationChartData = [];
		this.phoneCommunicationChartData = [];
		var chartContainer = this.$el.find("#chartArea")[0];
		var that = this;
		this.chart = new CanvasJS.Chart(chartContainer,{
			title:{
				text: "History",
				fontSize:15,
				fontFamily:"arial",
				fontWeight:"normal",
			},
			axisX:{
			   //labelAngle: 50,
			   valueFormatString: "D/M/Y",
			   labelFontFamily:"arial",
			   labelFontSize:12,
			   lineThickness:0,
			   gridThickness:0,
			   tickThickness:0,
			   interval:1,
			   intervalType:"week"
			},
			axisY:{
				//title:"Kilo Joules : Grammes",
				valueFormatString: "0.##",
				labelFontSize:1,
				//labelFontColor:000,
				lineThickness:0,
				gridThickness:0,
				tickThickness:0,
				minimum:0,
				interval:10
			},
			zoomEnabled:true,
			data : [
					  {
						  type: "line",
						  color: "rgba(54,158,173,.3)",
						  dataPoints: this.geolocationChartData,
						  mouseover: function(e){
							  console.log("geo");
					        that.showDayLocations(e.dataPoint.x);
					      },
					      mouseout: function(e){
						        that.updateMap();
						  },
					  },
					  {
						  type: "line",
						  color: "rgba(8,15,173,.7)",
						  dataPoints: this.phoneCommunicationChartData,
						  mouseover: function(e){
							  console.log("phone");
							  that.showDayLocations(e.dataPoint.x);
						  },
						  mouseout: function(e){
						      that.updateMap();
						  },
					  }
					]
		});
	},

	initLeafletMap: function(){
		this.lmap = L.map('map').setView([43.2957, 5.3738], 6);

		var tiles = L.tileLayer('http://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
		    attribution: '<a href="https://www.mapbox.com/about/maps/">Terms and Feedback</a>',
		    id: 'examples.map-20v6611k'
		}).addTo(this.lmap);

		var that = this;
		this.lmap.on("moveend", function(){
			that.updateLMap(function(){
	    		that.updateChart(that.locationData);
	    	})
		});
		
		this.lheatmap = L.heatLayer(addressPoints).addTo(this.lmap);
	},
	
    render: function() {
    	this.updateGMap(function(){
    		this.updateChart(this.locationData);
    	});
    },
    
    showDayLocations: function (day){
    	var dayLData = this.dayLLocations[day];
    	this.lheatmap.setLatLngs(dayLData);
    	var dayGData = this.dayGLocations[day];
    	this.gheatmap.setDataSet({max: 5, data: dayGData});
    },
    updateMap: function(callback){
    	this.lheatmap.setLatLngs(this.geoLData,{max: 5});
    	this.gheatmap.setDataSet({data: this.geoGData, max: 5});
    },
    
    updateLMap:function(callback){
    	var bound = this.lmap.getBounds();
    	if(!bound)
    		return;
    	var queryObject = {
			north: bound.getNorth(),
			south: bound.getSouth(),
			east : bound.getEast(),
			west : bound.getWest()
		};
    	//console.log("south,north,west,east:",queryObject.south,queryObject.north,queryObject.west,queryObject.east);
		var that = this;
		this.fetchData(queryObject,function(){
			that.lheatmap.setLatLngs(that.geoLData,{max: 5});
			if(callback)
				callback();
		});
    },
    
    updateGMap: function (callback){
    	var bound = this.gmap.getBounds();
    	if(!bound)
    		return;
		var queryObject = {
				north: bound.getNorthEast().lat(),
				south: bound.getSouthWest().lat(),
				east : bound.getNorthEast().lng(),
				west : bound.getSouthWest().lng(),
		};
//		console.log("south,north,west,east:",queryObject.south,queryObject.north,queryObject.west,queryObject.east);
		var that = this;
		this.fetchData(queryObject,function(){
			that.gheatmap.setDataSet({max: 5, data: that.geoGData});
			if(callback)
				callback();
		});
	},
	fetchData:function(bounds,callback){
		var that = this;
		$.getJSON('areaGeolocations', bounds, function(data) {
			that.locationData = data;
			that.geoGData = new Array();
			that.geoLData = new Array();
//			var north = -1000;
//			var south = 1000;
//			var east = -1000;
//			var west = 1000;
			$.each(data.geolocationLogs, function(key, val) {
				that.geoGData.push({lng:val.longitude, lat:val.latitude, count:1});
				that.geoLData.push([val.latitude, val.longitude, 1]);
//				if(val.longitude<west) west = val.longitude;
//				if(val.longitude>east) east = val.longitude;
//				if(val.latitude>north) north = val.latitude;
//				if(val.latitude<south) south = val.latitude;
			});
			$.each(data.phoneCommunicationLog, function(key, val) {
				that.geoGData.push({lng:val.longitude, lat:val.latitude, count:1});
				that.geoLData.push([val.latitude, val.longitude, 1]);
//				if(val.longitude<west) west = val.longitude;
//				if(val.longitude>east) east = val.longitude;
//				if(val.latitude>north) north = val.latitude;
//				if(val.latitude<south) south = val.latitude;
			});
			console.log("nb points:",that.geoGData.length);
//			console.log("result south,north,west,east:",south,north,west,east);
			if(callback)
				callback();
		});
	},
	
	updateChart: function(data){
		var that = this;
		var dayAccumulator = {};
		this.dayLLocations = {};
		this.dayGLocations = {};
		$.each(data.geolocationLogs, function(key, val) {
			var date = new Date(val.timestamp);
			var day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
			if(!dayAccumulator[day]){
				dayAccumulator[day] = 1;
				that.dayLLocations[day] = new Array();
				that.dayGLocations[day] = new Array();
			} else {
				dayAccumulator[day] = dayAccumulator[day] + 1;
			}
			that.dayLLocations[day].push([val.latitude,val.longitude]);
			that.dayGLocations[day].push({lat:val.latitude,lng:val.longitude, count:1});
		});
		this.geolocationChartData.length = 0;
		dayAccumulator = this.toChartData(dayAccumulator,this.geolocationChartData);
//		$.each(dayAccumulator, function(key, val){
//			that.geolocationChartData.push({x:new Date(key), y:val});
//		});
		
		var dayAccumulator = {};
		$.each(data.phoneCommunicationLog, function(key, val) {
			var date = new Date(val.timestamp);
			var day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
			if(!dayAccumulator[day]){
				dayAccumulator[day] = 1;
				that.dayLLocations[day] = new Array();
				that.dayGLocations[day] = new Array();
			} else {
				dayAccumulator[day] = dayAccumulator[day] + 1;
			}
			that.dayLLocations[day].push([val.latitude,val.longitude]);
			that.dayGLocations[day].push({lat:val.latitude,lng:val.longitude, count:1});
		});
		
		this.phoneCommunicationChartData.length = 0;
		dayAccumulator = this.toChartData(dayAccumulator,this.phoneCommunicationChartData);
//		$.each(dayAccumulator, function(key, val){
//			that.phoneCommunicationChartData.push({x:new Date(key), y:val});
//		});
		this.chart.render();
	},
        
	placeMarker: function (position, gmap) {
		var marker = new google.maps.Marker({
			position: position,
			map: gmap
		});
		gmap.panTo(position);
	},
	
	toChartData: function (inputmap, output) {
		output.length = 0;
	  var keys=[];
	  for(var k in inputmap) {
		  keys.push(k);
	  }
	  keys.sort(function(a, b) {
		    a = new Date(a);
		    b = new Date(b);
		    return a>b ? -1 : a<b ? 1 : 0;
		});

	  for(var i=0; i<keys.length; i++) {
		  output.push({x: new Date(keys[i]), y : inputmap[""+keys[i]]});
	  }
	  output.length = keys.length;
	  return output;
	}
});



});

;
//# sourceMappingURL=app.js.map