/* * * * * * * * * * * * * *
*           MAIN           *
* * * * * * * * * * * * * */

// init global variables
let selectedNeighborhood = "NATIONAL MALL"; // set starting neighborhood here
let myStreetVis;
let myMapVis;

let radarData = [
    [//Census Tract 70
        {axis:"Drive Alone",value:0.28},
        {axis:"Public Transit",value:0.24},
        {axis:"Walked",value:0.25},
        {axis:"Bicycle",value:0.07},
        {axis:"Taxicab",value:0.01},
        {axis:"Worked from Home",value:0.14},
    ],[//Census Tract 1
        {axis:"Drive Alone",value:0.40},
        {axis:"Public Transit",value:0.13},
        {axis:"Walked",value:0.21},
        {axis:"Bicycle",value:0.08},
        {axis:"Taxicab",value:0.04},
        {axis:"Worked from Home",value:0.15},
    ],[//Census Tract
        {axis:"Drive Alone",value:0.22},
        {axis:"Public Transit",value:0.26},
        {axis:"Walked",value:0.29},
        {axis:"Bicycle",value:0.10},
        {axis:"Taxicab",value:0.02},
        {axis:"Worked from Home",value:0.11},
    ]
];


// load data using promises
let promises = [
    d3.json("data/Street_Segments_2005.geojson"), // load street segments at [0]

    //add additional datasets below as items in this array and comment what they are
    d3.json("data/DC_Health_Planning_Neighborhoods.geojson"), // neighborhood data for DC [1]
    d3.json("data/BikeStations_by_Neighborhood.geojson"), // bike stations at [2]
    d3.json("data/BikeTripsEnded_by_Neighborhood.geojson"), // bike trips ended at [3]
    d3.json("data/BikeTripsStarted_by_Neighborhood.geojson"), // bike trips started at [4]
    d3.json("data/TaxiTripsEnded_by_Neighborhood.geojson"), // bike trips ended at [5]
    d3.json("data/TaxiTripsStarted_by_Neighborhood.geojson"), // bike trips started at [6]
    radarData //radarData started at [7]




];

Promise.all(promises)
    .then(function (data) {
        initMainPage(data)
    })
    .catch(function (err) {
        console.log(err)
    });

//create event handler
let eventHandler = {
    bind: (eventName, handler) => {
        document.body.addEventListener(eventName, handler);
    },
    trigger: (eventName, extraParameters) => {
        document.body.dispatchEvent(new CustomEvent(eventName, {
            detail: extraParameters
        }));
    }
}

// init main page
function initMainPage(dataArray){
    console.log(dataArray); // explore dataArray in console


    myStreetVis = new StreetVis("street-vis", dataArray[0], d3.geoMercator());
    myMapVis = new MapVis("map-vis", dataArray[1], dataArray[2], dataArray[3], dataArray[4], dataArray[5], dataArray[6], MapboxToken, eventHandler)
    //Call function to draw the Radar chart
    myRadarChart = new RadarChart("radar-chart", dataArray[7]);
    //use dataArray indexing to pass specific datasets from the promise to the visualization classes

}

//bind event handler
eventHandler.bind("selectionChanged", function(event){
    selectedNeighborhood = event.detail;
    //console.log(selectedNeighborhood);
    //update map vis
    myMapVis.wrangleData();


});
