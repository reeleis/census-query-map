var tractdata = 0;

const starturl='https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Tracts_Blocks/MapServer/7/query?text=&geometry={x:-122.259233,y:37.849112,spatialReference:{wkid:4326}}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&returnGeometry=true&geometryPrecision=7&outFields=STATE,COUNTY,TRACT,GEOID&outSR=4269&f=geojson';
//     fetch(starturl)
//       .then((resp) => resp.json()) // Transform the data into json
//       .then(function(data) {
//         console.log(data);
//         tractdata = data
//         })

function createGISquery (extent, count='false') {
  return 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Tracts_Blocks/MapServer/7/query?text=&geometry={%22xmin%22:'+ extent["_southWest"]["lng"]+',%22ymin%22:'+extent["_southWest"]["lat"]+',%22xmax%22:'+extent["_northEast"]["lng"]+',%22ymax%22:'+extent["_northEast"]["lat"]+',spatialReference:{wkid:4326}}'+'&geometryType=esriGeometryEnvelope&spatialRel=esriSpatialRelIntersects&returnGeometry=true&geometryPrecision=5&outFields=STATE,COUNTY,TRACT,GEOID&outSR=4269&f=geojson&returnCountOnly='+count;

}

var myFeaturesMap = {};

// var myGeoJsonLayerGroup = L.geoJson({
//     onEachFeature: function (feature, layer) {
//         myFeaturesMap[feature.properties.GEOID] = layer;
//     }
// }).addTo(map);

function addNewFeatureToGeoJsonLayerGroup(newGeoJsonData) {
    overlay.addData(newGeoJsonData);
}

// function updateFeature(updatedGeoJsonData) {
//     deleteFeature(updatedGeoJsonData); // Remove the previously created layer.
//     addNewFeatureToGeoJsonLayerGroup(updatedGeoJsonData); // Replace it by the new data.
// }

function deleteFeature(keyToDelete) {
    var deletedFeature = myFeaturesMap[keyToDelete];
    overlay.removeLayer(deletedFeature);
    delete myFeaturesMap[keyToDelete];
}


function updateTracts (newData) {
  var keepList = [];
  // var newItems = [];
  var arrayLength = newData["features"].length;
  console.log("Starting update");
  for (var i = 0; i < arrayLength; i++) {
    if (myFeaturesMap.hasOwnProperty(newData["features"][i]["properties"]["GEOID"])) {
      keepList.push(newData["features"][i]["properties"]["GEOID"]);
      newData["features"].splice(i,1);
      i--;
      arrayLength--;
    } else {
      keepList.push(newData["features"][i]["properties"]["GEOID"]);
      addNewFeatureToGeoJsonLayerGroup(newData["features"][i]);
    }
  }
  for (var key in myFeaturesMap) {
    if (!keepList.includes(key)){
      //console.log(key);
      deleteFeature(key)
    }
  }
  //console.log(keepList);
  console.log("Finished update");
}

function processBlockGroups(data) {
    tractdata = data
    console.log('loaded '+data["features"].length+' tracts');
    if (typeof overlay !== 'undefined') {
        //console.log('already defined');
        updateTracts(data);
    } else {
      console.log('setup');
      overlay = L.geoJson(data, {
        onEachFeature: function (feature, layer) {
            myFeaturesMap[feature.properties.GEOID] = layer;
          }
        }); 
      map.addLayer(overlay);
    }
}

function loadJSON (url, action='download') {
  var request = new XMLHttpRequest();

  request.open('GET', url, true);
  request.onload = function () {

    // Begin accessing JSON data here
    var data = JSON.parse(this.response);
    
    //console.log(data)
    
    if (request.status >= 200 && request.status < 400) {
      switch (action) {
        case 'download':
          processBlockGroups(data);
          break;
        case 'count':
          if (data["count"] < 500) {
            loadJSON( url.replace('&returnCountOnly=true', '&returnCountOnly=false'), 'download');
          } else {
            console.log('Too many blockgroups!');
          }
          break;
      }
    } else {
      console.log('error');
    }
  }

  request.send();
}

function loadBlockGroups (bounds) {
  loadJSON( createGISquery(bounds, 'true'), 'count');
}

function mapInit () {
  loadJSON(starturl, 'download');
}