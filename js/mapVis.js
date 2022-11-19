/* * * * * * * * * * * * * *
*          MAP VIS         *
* * * * * * * * * * * * * */

class MapVis {

    // constructor
    constructor(parentElement, neighborhoodData, bikeStationData, bikeEndData, bikeStartData, taxiEndData, taxiStartData, token, eventHandler) {
        this.parentElement = parentElement;
        this.neighborhoodData = neighborhoodData;
        this.bikeStationData = bikeStationData;
        this.bikeStartData = bikeStartData;
        this.bikeEndData = bikeEndData;
        this.taxiStartData = taxiStartData;
        this.taxiEndData = taxiEndData;
        this.eventHandler = eventHandler;
        this.token = token;

        // call initVis
        this.initVis();
    }

    initVis(){
        let vis = this;

        // connect access token
        mapboxgl.accessToken = vis.token;

        // create new mapbox map
        vis.map = new mapboxgl.Map({
            container: vis.parentElement, // container ID
            style: 'mapbox://styles/mapbox/dark-v9', // use dark mode map style
            center: [-77.05, 38.9], // starting position [lng, lat]
            zoom: 11, // starting zoom
            projection: 'mercator'
        });

        // disable map zoom if needed
        vis.map.scrollZoom.disable();

        // Add zoom and rotation controls to the map.
        vis.map.addControl(new mapboxgl.NavigationControl());

        // set width & height based on parentElement
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height;

        // get parent container of map
        vis.container = vis.map.getCanvasContainer();
        // add svg drawing area in container
        vis.svg = d3.select(vis.container)
            .append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .style("position", "absolute")
            .style("z-index", 2);

        // define projection function based on mapbox projection
        vis.projection = function(lon, lat) {
            let point = vis.map.project(new mapboxgl.LngLat(lon, lat));
            this.stream.point(point.x, point.y);
        }

        // update projection method for points
        vis.pointProject = function (d) {
            return vis.map.project(new mapboxgl.LngLat(d[0], d[1]));
        }

        // create path generator
        vis.transform = d3.geoTransform({ point: vis.projection });
        vis.path = d3.geoPath().projection(vis.transform);

        // update vis when map moves
        vis.map.on("viewreset", ()=>{vis.moveVis();});
        vis.map.on("move", ()=>{vis.moveVis();});
        vis.map.on("moveend", ()=>{vis.moveVis();});

        //init census tracts group
        vis.tractGroup = vis.svg.append("g")
            .attr("class", "tracts");

        //init bike stations group
        vis.stationGroup = vis.svg.append("g")
            .attr("class", "stations");

        //init bike trip group
        vis.bikeTripGroup = vis.svg.append("g")
            .attr("class", "bike-trips");

        //init taxi trip group
        vis.taxiTripGroup = vis.svg.append("g")
            .attr("class", "taxi-trips");

        //draw neighborhoods
        vis.tracts = vis.svg.select(".tracts")
            .append("g")
            .selectAll(".tract")
            .data(vis.neighborhoodData.features)
            .join("path")
            .attr("d", vis.path)
            .attr("class", "tract")
            .attr("name", d=>d.properties.DC_HPN_NAME)
            .attr("stroke", "white")
            .attr("fill", "gray")
            .attr("stroke-width", "0.5px")
            .attr("opacity", .65)

                //change properties on hover
                .on("mouseenter", function(){
                    d3.select(this).attr("stroke-width", "2px").attr("opacity", .9);
                })
                //reset properties on hover end
                .on("mouseout", function(){
                    d3.select(this).attr("stroke-width", "0.5px").attr("opacity", .65);
                })
                //trigger event on click and pass selected neighborhood
                .on("click", function(){
                    vis.eventHandler.trigger("selectionChanged", this.getAttribute("name"));
                });

        //draw stations
        vis.stations = vis.svg.select(".stations")
            .append("g")
            .selectAll(".station")
            .data(vis.bikeStationData.features)
            .join("circle")
            .attr("r", 2.5)
            .attr("cx", d=>vis.pointProject(d.geometry.coordinates).x)
            .attr("cy", d=>vis.pointProject(d.geometry.coordinates).y)
            .attr("neighborhood", d=>d.properties.DC_HPN_NAME)
            .attr("fill", "white")
            .attr("stroke-width", "0.5px");

        //call wrangle data
        vis.wrangleData();
    }

    wrangleData(){
        let vis = this;

        //set up initial filtered data
        vis.bikeStartFiltered = vis.bikeStartData.features.filter(d=>d.properties.DC_HPN_NAME === selectedNeighborhood);
        vis.bikeEndFiltered = vis.bikeEndData.features.filter(d=>d.properties.DC_HPN_NAME === selectedNeighborhood);
        vis.taxiStartFiltered = vis.taxiStartData.features.filter(d=>d.properties.DC_HPN_NAME === selectedNeighborhood);
        vis.taxiEndFiltered = vis.taxiEndData.features.filter(d=>d.properties.DC_HPN_NAME === selectedNeighborhood);

        vis.updateVis();
    }

    updateVis(){
        let vis = this;

        //draw trip lines
        vis.bikeOutgoingTrips = vis.svg.select(".bike-trips")
            .selectAll(".outgoing-trip")
            .data(vis.bikeStartFiltered, d=>d.properties.ride_id)
            .join("line")
            .attr("class", "outgoing-trip")
            .attr("x1", d=>vis.pointProject(d.geometry.coordinates).x)
            .attr("y1", d=>vis.pointProject(d.geometry.coordinates).y)
            .attr("x2", d=>vis.pointProject([d.properties.end_lng,d.properties.end_lat]).x)
            .attr("y2", d=>vis.pointProject([d.properties.end_lng,d.properties.end_lat]).y)
            .attr("stroke-width", "0.5px")
            .attr("stroke", "red")
            .attr("opacity", .5);

        // UPDATE DETAIL PANEL
        //display neighborhood name
        d3.select("#detail-panel")
            .select("h1")
            .text(selectedNeighborhood);

        //display bike trips
        d3.select("#incoming-bike-trips")
            .text(vis.bikeEndFiltered.length.toString());

        d3.select("#outgoing-bike-trips")
            .text(vis.bikeStartFiltered.length.toString());

        //display taxi trips
        d3.select("#incoming-taxi-trips")
            .text(vis.taxiEndFiltered.length.toString());

        d3.select("#outgoing-taxi-trips")
            .text(vis.taxiStartFiltered.length.toString());

        // STYLE SVG OBJECTS
        //add class to selected neighborhood
        vis.tracts
            .classed("selected-tract", function(d){
                return selectedNeighborhood === d.properties.DC_HPN_NAME;
            });

        //update station color
        vis.stations
            .attr("fill", function(d){
                if (selectedNeighborhood === d.properties.DC_HPN_NAME){
                    return "white";
                } else {
                    return "darkgray";
                }
            });
    }

    // use only for moving with panning + zooming on basemap (do not redraw features)
    moveVis(){
        let vis = this;

        //update tract location
        vis.tracts.attr("d", vis.path);

        //update station location
        vis.stations
            .attr("cx", d=>vis.pointProject(d.geometry.coordinates).x)
            .attr("cy", d=>vis.pointProject(d.geometry.coordinates).y);

        //update trip lines
        vis.bikeOutgoingTrips
            .attr("x1", d=>vis.pointProject(d.geometry.coordinates).x)
            .attr("y1", d=>vis.pointProject(d.geometry.coordinates).y)
            .attr("x2", d=>vis.pointProject([d.properties.end_lng,d.properties.end_lat]).x)
            .attr("y2", d=>vis.pointProject([d.properties.end_lng,d.properties.end_lat]).y);

    }
}