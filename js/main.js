/* * * * * * * * * * * * * *
*           MAIN           *
* * * * * * * * * * * * * */

// init global variables
let myStreetVis;
let myMapVis;

// load data using promises
let promises = [
    d3.json("data/Street_Segments_2005.geojson"), // load street segments at [0]

    //add additional datasets below as items in this array and comment what they are
    d3.json("data/Census_Tracts_in_2020.geojson") // census tract data for DC [1]

];

Promise.all(promises)
    .then(function (data) {
        initMainPage(data)
    })
    .catch(function (err) {
        console.log(err)
    });

// init main page
function initMainPage(dataArray){
    console.log(dataArray); // explore dataArray in console

    myStreetVis = new StreetVis("street-vis", dataArray[0], d3.geoMercator());
    myMapVis = new MapVis("map-vis", dataArray[0], MapboxToken)

    //use dataArray indexing to pass specific datasets from the promise to the visualization classes

}
