/* * * * * * * * * * * * * *
*          MAP VIS         *
* * * * * * * * * * * * * */

class MapVis {

    // constructor
    constructor(parentElement, censusTractData, token) {
        this.parentElement = parentElement;
        this.censusTractData = censusTractData;
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
        //vis.map.scrollZoom.disable();

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

        //call wrangle data
        vis.wrangleData();
    }

    wrangleData(){
        let vis = this;


        vis.updateVis();
    }

    updateVis(){
        let vis = this;

        console.log(vis.censusTractData.features);

            vis.tracts = vis.svg.select(".tracts")
                .append("g")
                .selectAll(".tract")
                .data(vis.censusTractData.features)
                .join("path")
                .attr("d", vis.path)
                .attr("class", "tract")
                .attr("name", d=>d.properties.DC_HPN_NAME)
                .attr("stroke", "white")
                .attr("fill", "red")
                .attr("stroke-width", "0.5px")
                .attr("opacity", .65)
                    .on("click", function(event, d){
                        //remove previously selected element
                        d3.select(".selected-tract")
                            .classed("selected-tract", false);

                        //select and style new element
                        d3.select(this)
                            .classed("selected-tract", true);

                        d3.select("#detail-panel")
                            .select("h1")
                            .text(this.getAttribute("name")); //display name in panel
                    });


        //console.log("updated");

    }

    // use only for moving with panning + zooming on basemap (do not redraw features)
    moveVis(){
        let vis = this;

        //update tract location
        vis.tracts.attr("d", vis.path);

    }

}