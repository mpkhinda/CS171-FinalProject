/* * * * * * * * * * * * * *
*        STREET VIS        *
* * * * * * * * * * * * * */

class StreetVis {

    //constructor
    constructor(parentElement, data, projection) {
        this.parentElement = parentElement;
        this.data = data;
        this.projection = projection;
        this.displayData = [];

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

        // init title group
        vis.titleGroup = vis.svg.append("g")
            .attr("class", "intro-title")
            .attr("transform", "translate("+vis.width/2+","+vis.height/2+")");


        // TODO: Init title group, init map group, set projections for map

        vis.wrangleData();
    }

    wrangleData(){
        let vis = this;

        // TODO: Filter streets (streets only, no alleys or service roads)


        vis.updateVis();
    }

    updateVis(){
        let vis = this;

        //append title
        vis.title = vis.titleGroup.append("h1")
            .style("text-align", "center")
            .text("Mapping Mobility in Washtington, DC");

        // TODO: append title, draw streets, add animation

    }
}