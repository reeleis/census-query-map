var tractdata = 0;

const starturl='https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Tracts_Blocks/MapServer/7/query?text=&geometry={x:-122.259233,y:37.849112,spatialReference:{wkid:4326}}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&returnGeometry=true&geometryPrecision=7&outFields=STATE,COUNTY,TRACT,GEOID&outSR=4269&f=geojson';
//     fetch(starturl)
//       .then((resp) => resp.json()) // Transform the data into json
//       .then(function(data) {
//         console.log(data);
//         tractdata = data
//         })

function createGISquery (extent) {
  return 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Tracts_Blocks/MapServer/7/query?text=&geometry={%22xmin%22:'+ extent["_southWest"]["lng"]+',%22ymin%22:'+extent["_southWest"]["lat"]+',%22xmax%22:'+extent["_northEast"]["lng"]+',%22ymax%22:'+extent["_northEast"]["lat"]+',spatialReference:{wkid:4326}}'+'&geometryType=esriGeometryEnvelope&spatialRel=esriSpatialRelIntersects&returnGeometry=true&geometryPrecision=5&outFields=STATE,COUNTY,TRACT,GEOID&outSR=4269&f=geojson'

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

function deleteFeature(deletedGeoJsonData) {
    var deletedFeature = myFeaturesMap[deletedGeoJsonData.properties.objectID];
    overlay.removeLayer(deletedFeature);
}


function updateTracts (newData) {
  var keepList = [];
  // var newItems = [];
  var arrayLength = newData["features"].length;
  for (var i = 0; i < arrayLength; i++) {
    if (myFeaturesMap.hasOwnProperty(newData["features"][i]["properties"]["GEOID"])) {
      keepList.push(newData["features"][i]["properties"]["GEOID"]);
      newData["features"].splice(i,1);
      i--;
      arrayLength--;
    } else {
      addNewFeatureToGeoJsonLayerGroup(newData["features"][i]);
    }
  }
}

function loadBlockGroups (url) {
  var request = new XMLHttpRequest();

  request.open('GET', url, true);
  request.onload = function () {

    // Begin accessing JSON data here
    var data = JSON.parse(this.response);

    if (request.status >= 200 && request.status < 400) {
      tractdata = data
      console.log('loaded '+data["features"].length+' tracts');
      if (typeof overlay !== 'undefined') {
          console.log('already defined');
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
    } else {
      console.log('error');
    }
  }

  request.send();
}

function mapInit () {
  loadBlockGroups(starturl);
}