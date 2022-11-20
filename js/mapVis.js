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

        this.dateFormatter = d3.timeFormat("%B %d, %Y");
        this.bikeDateParser = d3.timeParse("%Y-%m-%d");
        this.taxiDateParser = d3.timeParse("%d/%m/%Y");

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
            center: [-77.05, 38.895], // starting position [lng, lat]
            zoom: 11.2, // starting zoom
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

        //init tooltip
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "map-tooltip");

        //init neighborhood group
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
                .on("mouseover", function(event){
                    d3.select(this).attr("stroke-width", "2px").attr("opacity", .9)

                    //display tooltip
                    vis.tooltip
                        .style("opacity", 1)
                        .style("left", event.pageX + 10 + "px")
                        .style("top", event.pageY - 50 + "px")
                        .html(`<div style="background: none; padding: 10px;">  
                                 <p>${this.getAttribute("name")}</p>                         
                             </div>`);
                })

                //reset properties on hover end
                .on("mouseout", function(){
                    d3.select(this).attr("stroke-width", "0.5px").attr("opacity", .65)

                    //hide tooltip
                    vis.tooltip
                        .style("opacity", 0)
                        .style("left", 0)
                        .style("top", 0)
                        .html(``);
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

        //get full date range (can change to filtered range if needed by changing xStartData to xStartFiltered
        vis.dateRange = [
             d3.min([
                d3.min(vis.bikeStartData.features, d=>vis.bikeDateParser(d.properties.started_at.substring(0,10))),
                d3.min(vis.bikeEndData.features, d=>vis.bikeDateParser(d.properties.started_at.substring(0,10))),
                d3.min(vis.taxiStartData.features, d=>vis.taxiDateParser(d.properties.ORIGINDATETIME_TR.substring(0,10))),
                d3.min(vis.taxiEndData.features, d=>vis.taxiDateParser(d.properties.ORIGINDATETIME_TR.substring(0,10)))
            ]),
            d3.max([
                d3.max(vis.bikeStartData.features, d=>vis.bikeDateParser(d.properties.ended_at.substring(0,10))),
                d3.max(vis.bikeEndData.features, d=>vis.bikeDateParser(d.properties.ended_at.substring(0,10))),
                d3.max(vis.taxiStartData.features, d=>vis.taxiDateParser(d.properties.DESTINATIONDATETIME_TR.substring(0,10))),
                d3.max(vis.taxiEndData.features, d=>vis.taxiDateParser(d.properties.DESTINATIONDATETIME_TR.substring(0,10)))
            ])];

        vis.updateVis();
    }

    updateVis(){
        let vis = this;

        //draw trip lines
        vis.bikeIncomingTrips = vis.svg.select(".bike-trips")
            .selectAll(".incoming-trip")
            .data(vis.bikeEndFiltered, d=>d.properties.ride_id)
            .join("line")
            .attr("class", "incoming-trip")
            .attr("x1", d=>vis.pointProject(d.geometry.coordinates).x)
            .attr("y1", d=>vis.pointProject(d.geometry.coordinates).y)
            .attr("x2", d=>vis.pointProject([d.properties.start_lng,d.properties.start_lat]).x)
            .attr("y2", d=>vis.pointProject([d.properties.start_lng,d.properties.start_lat]).y)
            .attr("stroke-width", "0.5px")
            .attr("stroke", "darkred")
            .attr("opacity", .6);

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
            .attr("opacity", .6);

        vis.taxiIncomingTrips = vis.svg.select(".taxi-trips")
            .selectAll(".incoming-taxi-trip")
            .data(vis.taxiEndFiltered)
            .join("line")
            .attr("class", "incoming-taxi-trip")
            .attr("x1", d=>vis.pointProject(d.geometry.coordinates).x)
            .attr("y1", d=>vis.pointProject(d.geometry.coordinates).y)
            .attr("x2", d=>vis.pointProject([d.properties.ORIGIN_BLOCK_LONGITUDE,d.properties.ORIGIN_BLOCK_LATITUDE]).x)
            .attr("y2", d=>vis.pointProject([d.properties.ORIGIN_BLOCK_LONGITUDE,d.properties.ORIGIN_BLOCK_LATITUDE]).y)
            .attr("stroke-width", "0.5px")
            .attr("stroke", "blue")
            .attr("opacity", .3);

        vis.taxiOutgoingTrips = vis.svg.select(".taxi-trips")
            .selectAll(".outgoing-taxi-trip")
            .data(vis.taxiStartFiltered)
            .join("line")
            .attr("class", "outgoing-taxi-trip")
            .attr("x1", d=>vis.pointProject(d.geometry.coordinates).x)
            .attr("y1", d=>vis.pointProject(d.geometry.coordinates).y)
            .attr("x2", d=>vis.pointProject([d.properties.DESTINATION_BLOCK_LONG,d.properties.DESTINATION_BLOCK_LAT]).x)
            .attr("y2", d=>vis.pointProject([d.properties.DESTINATION_BLOCK_LONG,d.properties.DESTINATION_BLOCK_LAT]).y)
            .attr("stroke-width", "0.5px")
            .attr("stroke", "lightblue")
            .attr("opacity", .3);


        // UPDATE DETAIL PANEL
        //display neighborhood name
        d3.select("#detail-panel")
            .select("h1")
            .text(selectedNeighborhood);

        //display date range
        d3.select("#date-range-start")
            .text(vis.dateFormatter(vis.dateRange[0]));

        d3.select("#date-range-end")
            .text(vis.dateFormatter(vis.dateRange[1]));

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

        vis.bikeIncomingTrips
            .attr("x1", d=>vis.pointProject(d.geometry.coordinates).x)
            .attr("y1", d=>vis.pointProject(d.geometry.coordinates).y)
            .attr("x2", d=>vis.pointProject([d.properties.start_lng,d.properties.start_lat]).x)
            .attr("y2", d=>vis.pointProject([d.properties.start_lng,d.properties.start_lat]).y)

        vis.taxiOutgoingTrips
            .attr("x1", d=>vis.pointProject(d.geometry.coordinates).x)
            .attr("y1", d=>vis.pointProject(d.geometry.coordinates).y)
            .attr("x2", d=>vis.pointProject([d.properties.DESTINATION_BLOCK_LONG,d.properties.DESTINATION_BLOCK_LAT]).x)
            .attr("y2", d=>vis.pointProject([d.properties.DESTINATION_BLOCK_LONG,d.properties.DESTINATION_BLOCK_LAT]).y)

        vis.taxiIncomingTrips
            .attr("x1", d=>vis.pointProject(d.geometry.coordinates).x)
            .attr("y1", d=>vis.pointProject(d.geometry.coordinates).y)
            .attr("x2", d=>vis.pointProject([d.properties.ORIGIN_BLOCK_LONGITUDE,d.properties.ORIGIN_BLOCK_LATITUDE]).x)
            .attr("y2", d=>vis.pointProject([d.properties.ORIGIN_BLOCK_LONGITUDE,d.properties.ORIGIN_BLOCK_LATITUDE]).y)
    }
}