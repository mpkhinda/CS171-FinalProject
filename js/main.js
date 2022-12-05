/* * * * * * * * * * * * * *
*           MAIN           *
* * * * * * * * * * * * * */

// init global variables
let selectedNeighborhood = "NATIONAL MALL"; // set starting neighborhood here
let myStreetVis;
let myMapVis;
let myRadarChart;
let mySankeyVisOne;
let mySankeyVisTwo;
let mapboxToken = config.MapboxToken;

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
    d3.json("data/CommuteShare_by_Neighborhood.json"), // commute share started at [7]
];

Promise.all(promises)
    .then(function (data) {
        initMainPage(data)
    })
    .catch(function (err) {
        console.log(err)
    });

//create event handler -- map
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

//create event handler -- panel layout


// init main page
function initMainPage(dataArray){
    console.log(dataArray); // explore dataArray in console


    myStreetVis = new StreetVis("street-vis", dataArray[0], d3.geoMercator());
    myMapVis = new MapVis("map-vis", dataArray[1], dataArray[2], dataArray[3], dataArray[4], dataArray[5], dataArray[6], mapboxToken, eventHandler)
    //Call function to draw the Radar chart
    myRadarChart = new RadarChart("radar-chart", dataArray[8], dataArray[7]);
    mySankeyVisTwo = new SankeyVis2("sankey-vis2",dataArray[5],dataArray[6]);
    mySankeyVisOne = new SankeyVis("sankey-vis",dataArray[3],dataArray[4]);
    //use dataArray indexing to pass specific datasets from the promise to the visualization classes

}

//bind event handler
eventHandler.bind("selectionChanged", function(event){
    selectedNeighborhood = event.detail;
    //console.log(selectedNeighborhood);
    //update map vis
    myMapVis.wrangleData();
    myRadarChart.wrangleData();
    //update sankeys
    mySankeyVisTwo.wrangleData();
    mySankeyVisOne.wrangleData();


});

function updateMap(){
    myMapVis.wrangleData();
}

// Create bootstrap carousel, disabling rotating
let carousel = new bootstrap.Carousel(document.getElementById('stateCarousel'), {interval: false})
// on button click switch view
function switchView() {
    carousel.next();
}
