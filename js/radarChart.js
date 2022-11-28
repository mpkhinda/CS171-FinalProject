/////////////////////////////////////////////////////////
/////////////// The Radar Chart Function ////////////////
/////////////// Written by Nadieh Bremer ////////////////
////////////////// VisualCinnamon.com ///////////////////
/////////// Inspired by the code of alangrafu ///////////
/////////////////////////////////////////////////////////

/* Radar chart design created by Nadieh Bremer - VisualCinnamon.com */

class RadarChart {


    //constructor
    constructor(parentElement, currentData, testData) {
        this.parentElement = parentElement;
        this.data = currentData;
        this.testData = testData;



//////////////////////////////////////////////////////////////
////////////////////////// Data //////////////////////////////
//////////////////////////////////////////////////////////////
//Superceded by moving it to main.js

//////////////////////////////////////////////////////////////
//////////////////// Draw the Chart //////////////////////////
//////////////////////////////////////////////////////////////





        //call initVis
        this.initVis();
    }

    initVis() {

        let vis = this;

        vis.margin = {top: 100, right: 100, bottom: 100, left: 100};
        //vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        //vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;
        vis.width = 400;
        vis.height = 400;


        vis.color = d3.scaleOrdinal()
            .range(["#E0F2F1",
                "#B2DFDB",
                "#80CBC4",
                "#4DB6AC",
                "#26A69A",
                "#009688",
                "#00897B",
                "#00796B",
                "#00695C",
                "#004D40"]);

        vis.options = {
            w: vis.width,
            h: vis.height,
            margin: vis.margin,
            maxValue: 0.5,
            levels: 5,
            roundStrokes: true,
            color: vis.color
        };

        vis.cfg = {
            width: vis.width,
            height: vis.height,
            levels: 4,				//How many levels or inner circles should there be drawn
            maxValue: 0, 			//What is the value that the biggest circle will represent
            labelFactor: 1.25, 	//How much farther than the radius of the outer circle should the labels be placed
            wrapWidth: 60, 		//The number of pixels after which a label needs to be given a new line
            opacityArea: 0.35, 	//The opacity of the area of the blob
            dotRadius: 3, 			//The size of the colored circles of each blog
            opacityCircles: 0.1, 	//The opacity of the circles of each blob
            strokeWidth: 2, 		//The width of the stroke around each blob
            roundStrokes: false,	//If true the area and stroke will follow a round path (cardinal-closed)
            color: d3.scaleOrdinal(d3.schemeCategory10)	//Color function
        };

        //Put all of the options into a variable called vis.cfg
        if ('undefined' !== typeof vis.options) {
            for (var i in vis.options) {
                if ('undefined' !== typeof vis.options[i]) {
                    vis.cfg[i] = vis.options[i];
                }
            }//for i
        }//if

        /////////////////////////////////////////////////////////
        //////////// Create the container SVG and g /////////////
        /////////////////////////////////////////////////////////

        //Initiate the radar chart SVG
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            //.attr("width",  vis.width + vis.margin.left + vis.margin.right)
            .attr("width",  vis.width)
            //.attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .attr("height", vis.height)
            .attr("class", "radar");
        //Append a g element
        vis.g = vis.svg.append("g")
            .attr("transform", "translate("+ vis.width/2 +","+ vis.height/2 +")");

        /////////////////////////////////////////////////////////
        ////////// Glow filter for some extra pizzazz ///////////
        /////////////////////////////////////////////////////////

        //Filter for the outside glow
        var filter = vis.g.append('defs').append('filter').attr('id','glow'),
            feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation','2.5').attr('result','coloredBlur'),
            feMerge = filter.append('feMerge'),
            feMergeNode_1 = feMerge.append('feMergeNode').attr('in','coloredBlur'),
            feMergeNode_2 = feMerge.append('feMergeNode').attr('in','SourceGraphic');

        //Wrapper for the grid & axes
        vis.axisGrid = vis.g.append("g").attr("class", "axisWrapper");

        //call wrangleData
        this.wrangleData();
    }

    wrangleData() {

        let vis = this;

        console.log("vis.data", vis.data);

        //Data playground
        vis.data2 = vis.testData.filter(d=>d.DC_HPN_NAME === selectedNeighborhood);
        console.log("vis.data2", vis.data2);


        //Creates an array that collects filtered delivery-data's delivery IDs
        vis.dataFilteredforDisplay = [];
        vis.dataTractsforDisplay = [];
        vis.data2.forEach((element) => {
            vis.dataFilteredforDisplay.push([
                //test
                {axis:"Drive Alone", value: element["Drive Alone"]},
                {axis:"Public Transit", value: element["Public Transit"]},
                {axis:"Walked", value: element["Walked"]},
                {axis:"Bicycle", value: element["Bicycle"]},
                {axis:"Taxicab", value: element["Taxicab"]},
                {axis:"Worked from Home", value: element["Worked from Home"]},
            ]);
            vis.dataTractsforDisplay.push(" " + element["NAME"])

        });
        console.log("vis.data3", vis.dataFilteredforDisplay);

        // UPDATE DETAIL PANEL
        //display neighborhood name
        d3.select("#census-tract-names")
            .select("p")
            .text(vis.dataTractsforDisplay);

        //Remove whatever chart with the same id/class was present before
       // d3.select("#" + vis.parentElement).select("svg").remove();

        //If the supplied maxValue is smaller than the actual one, replace by the max in the data
    //var maxValue = Math.max(vis.cfg.maxValue, d3.max(vis.dataFilteredforDisplay, function(i){return d3.max(i.map(function(o){return o.value;}))}));
    var maxValue = 1;

    var allAxis = (vis.dataFilteredforDisplay[0].map(function(i, j){return i.axis})),	//Names of each axis
        total = allAxis.length, //The number of different axes
        radius = Math.min(vis.cfg.width/2.75, vis.cfg.height/2.75), 	//Radius of the outermost circle
        Format = d3.format('.0%'),			 	//Percentage formatting
        angleSlice = Math.PI * 2 / total;		//The width in radians of each "slice"

    //Scale for the radius
    var rScale = d3.scaleLinear()
        .range([0, radius])
        .domain([0, maxValue]);

    //if update and remove fail; but back the svg killer here

    /////////////////////////////////////////////////////////
    /////////////// Draw the Circular grid //////////////////
    /////////////////////////////////////////////////////////



    //Draw the background circles
    vis.axisGrid.selectAll(".gridCircle")
        .data(d3.range(1,(vis.cfg.levels+1)).reverse())
        .join("circle")
        .attr("class", "gridCircle")
        .attr("r", function(d, i){
            return radius/vis.cfg.levels*(d);})
        .style("fill", "none")
        .style("stroke", "#454545")
        .style("filter" , "url(#glow)");

    //Text indicating at what % each level is
    vis.axisGrid.selectAll(".axisLabel")
        .data(d3.range(1,(vis.cfg.levels+1)).reverse())
        .join("text")
        .attr("class", "axisLabel")
        .attr("x", 4)
        .attr("y", function(d){return -d*radius/vis.cfg.levels;})
        .attr("dy", "0.4em")
        .style("font-size", "10px")
        .attr("fill", "white")
        .text(function(d,i) { return Format(maxValue * d/vis.cfg.levels) });

    /////////////////////////////////////////////////////////
    //////////////////// Draw the axes //////////////////////
    /////////////////////////////////////////////////////////

    //Create the straight lines radiating outward from the center
    vis.axis = vis.axisGrid.selectAll(".axis")
        .data(allAxis)
        .join("g")
        .attr("class", "axis");
    //Append the lines
    vis.axis.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", function(d, i){ return rScale(maxValue*1.1) * Math.cos(angleSlice*i - Math.PI/2); })
        .attr("y2", function(d, i){ return rScale(maxValue*1.1) * Math.sin(angleSlice*i - Math.PI/2); })
        .attr("class", "line")
        .style("stroke", "#454545")
        .style("stroke-width", "2px");

    //Append the labels at each axis
    vis.axis.append("text")
        .attr("class", "legend")
        .style("font-size", "11px")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("x", function(d, i){ return rScale(maxValue * vis.cfg.labelFactor) * Math.cos(angleSlice*i - Math.PI/2); })
        .attr("y", function(d, i){ return rScale(maxValue * vis.cfg.labelFactor) * Math.sin(angleSlice*i - Math.PI/2); })
        .text(function(d){return d})
        .call(wrap, vis.cfg.wrapWidth);

    /////////////////////////////////////////////////////////
    ///////////// Draw the radar chart blobs ////////////////
    /////////////////////////////////////////////////////////

    //The radial line function
    vis.radarLine = d3.lineRadial()
        .curve(d3.curveBasisClosed)
        .radius(function(d) { return rScale(d.value); })
        .angle(function(d,i) {	return i*angleSlice; });

    if(vis.cfg.roundStrokes) {
        vis.radarLine.curve(d3.curveLinearClosed);
    }

    //Create a wrapper for the blobs
    vis.blobWrapper = vis.g.selectAll(".radarWrapper")
        .data(vis.dataFilteredforDisplay)
        .join("g")
        .attr("class", "radarWrapper");

    //Append the backgrounds
    vis.blobWrapper.selectAll(".radarArea")
        .data(vis.dataFilteredforDisplay)
        .join("path")
        .attr("class", "radarArea")
        .attr("d", function(d,i) { return vis.radarLine(d); })
        .style("fill", function(d,i) { return vis.cfg.color(i); })
        .style("fill-opacity", vis.cfg.opacityArea)
        .on('mouseover', function (d,i){
            //Dim all blobs
            d3.selectAll(".radarArea")
                .transition().duration(200)
                .style("fill-opacity", 0.1);
            //Bring back the hovered over blob
            d3.select(this)
                .transition().duration(200)
                .style("fill-opacity", 0.7);
        })
        .on('mouseout', function(){
            //Bring back all blobs
            d3.selectAll(".radarArea")
                .transition().duration(200)
                .style("fill-opacity", vis.cfg.opacityArea);
        });

    //Create the outlines
    vis.blobWrapper.selectAll(".radarStroke")
        .data(vis.dataFilteredforDisplay)
        .join("path")
        .attr("class", "radarStroke")
        .attr("d", function(d,i) { return vis.radarLine(d); })
        .style("stroke-width", vis.cfg.strokeWidth + "px")
        .style("stroke", function(d,i) { return vis.cfg.color(i); })
        .style("fill", "none")

    //Append the circles
    vis.blobWrapper.selectAll(".radarCircle")
        .data(function(d,i) { return d; })
        .join("circle")
        .attr("class", "radarCircle")
        .attr("r", vis.cfg.dotRadius)
        .attr("cx", function(d,i){ return rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2); })
        .attr("cy", function(d,i){ return rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2); })
        .style("fill", function(d,i,j) { return vis.cfg.color(j); })
        .style("fill-opacity", 0.8);

    /////////////////////////////////////////////////////////
    //////// Append invisible circles for tooltip ///////////
    /////////////////////////////////////////////////////////

    //Wrapper for the invisible circles on top
    vis.blobCircleWrapper = vis.g.selectAll(".radarCircleWrapper")
        .data(vis.dataFilteredforDisplay)
        .join("g")
        .attr("class", "radarCircleWrapper");

    //Append a set of invisible circles on top for the mouseover pop-up
    vis.blobCircleWrapper.selectAll(".radarInvisibleCircle")
        .data(function(d,i) {return d; })
        .join("circle")
        .attr("class", "radarInvisibleCircle")
        .attr("r", vis.cfg.dotRadius*1.5)
        .attr("cx", function(d,i){ return rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2); })
        .attr("cy", function(d,i){ return rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2); })
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mouseover", function(event,d) {
             vis.newX =  parseFloat(d3.select(this).attr('cx')) - 10;
             vis.newY =  parseFloat(d3.select(this).attr('cy')) - 10;
            console.log(d);
            vis.tooltip
                .attr('x', vis.newX)
                .attr('y', vis.newY)
                .text(
                    d.axis + " : " + Format(d.value) +
                    "cheese"
                )
                .transition().duration(200)
                .style('opacity', 1)
                .style("fill",'white');
        })
        .on("mouseout", function(){
            vis.tooltip.transition().duration(200)
                .style("opacity", 0);
        });

    //Set up the small tooltip for when you hover over a circle
    vis.tooltip = vis.g.append("text")
        .attr("class", "tooltip")
        .style("opacity", 0);

    /////////////////////////////////////////////////////////
    /////////////////// Helper Function /////////////////////
    /////////////////////////////////////////////////////////

    //Taken from http://bl.ocks.org/mbostock/7555321
    //Wraps SVG text
    function wrap(text, width) {
        text.each(function() {
            var text = d3.select(this),
                words = text.text().split(/\s+/).reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = 1.4, // ems
                y = text.attr("y"),
                x = text.attr("x"),
                dy = parseFloat(text.attr("dy")),
                tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                }
            }
        });
    }//wrap

}}//RadarChart