/* * * * * * * * * * * * * *
*        STREET VIS        *
* * * * * * * * * * * * * */

class StreetVis {

    //constructor
    constructor(parentElement, streetData, projection) {
        this.parentElement = parentElement;
        this.streetData = streetData;
        this.projection = projection;


        //call initVis
        this.initVis();
    }

    initVis(){
        let vis = this;

        //set margin convention
        vis.margin = {top: 0, right: 0, bottom: 0, left: 0};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // svg drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        //append title
        vis.title = vis.svg.append("text")
            .attr("text-anchor", "middle")
            .attr("x", vis.width/2)
            .attr("y", vis.height/2)
            .attr("class", "intro-title")
            .text("Mapping Mobility in Washington, DC");

        //append instructions
        vis.title = vis.svg.append("text")
            .attr("text-anchor", "middle")
            .attr("x", vis.width/2)
            .attr("y", vis.height-50)
            .attr("class", "intro-instructions")
            .text("Scroll to explore the data ↓");

        // INIT MAP FEATURES

        // define path generator
        vis.path = d3.geoPath().projection(vis.projection);

        // init streets group
        vis.streetsGroup = vis.svg.append("g")
            .attr("class", "streets");

        vis.wrangleData();
    }

    wrangleData(){
        let vis = this;

        // filter streets only (no alleys or service roads)
        vis.streetDataFiltered = vis.streetData.features.filter(function(d){
            return d.properties.ROADTYPE === "Street";
        });

        console.log(vis.streetDataFiltered);

        vis.updateVis();
    }

    updateVis(){
        let vis = this;

        // reset projection scale
        vis.projection
            .scale(1)
            .translate([0, 0]);

        // calculate bounds, center, and scale of streets
        var b = vis.path.bounds(vis.streetData),
            s = 3 / Math.max((b[1][0] - b[0][0]) / vis.width, (b[1][1] - b[0][1]) / vis.height), //increase first number to increase scale (.95 to fit fully in frame)
            t = [(vis.width - s * (b[1][0] + b[0][0])) / 2, (vis.height - s * (b[1][1] + b[0][1])) / 2];

        // translate and scale projection to match bounding box of streets data
        vis.projection
            .scale(s)
            .translate(t);

        // draw streets
        vis.states = vis.svg.select(".streets")
            .append("g")
            .selectAll(".street")
            .data(vis.streetDataFiltered)
            .join("path")
            .attr("d", vis.path)
            .attr("class", "street")
            .attr("stroke", "#E0E0E0")
            .attr("fill", "none")
            .attr("stroke-width", "0.35px")

            // animate roads appearing
            .attr("opacity", 0)
            .transition()
            .duration(1000)
            .delay((d,i)=>i)
            .attr("opacity", 1);
    }
}