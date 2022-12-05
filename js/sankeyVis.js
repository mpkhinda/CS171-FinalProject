class SankeyVis
{
    // constructor to initialize SankeyChart object
    constructor(parentElement,EndData, StartData)
    {
        this.parentElement = parentElement;
        this.data = EndData; // categorized based on destination station neighbourhood
        this.data2 = StartData; // categorized based on source station neighbourhood
        this.initVis();
    }

    initVis()
    {
        let vis = this;

        // set the dimensions and margins of the graph
        vis.margin = {top: 60, right: 1, bottom: 1, left: 1};
        vis.width = 400 + vis.margin.left + vis.margin.right;
        vis.height = 450 + vis.margin.top + vis.margin.bottom;

        vis.padding= 20;

        // format variables
        vis.formatNumber = d3.format(",.0f"); // zero decimal places
        vis.format = function(d) { return vis.formatNumber(d); };
        vis.color = d3.scaleOrdinal(d3.schemeCategory10);
        //can pass on this ---keeping all source stations one color and all destination stations one color --match it with Matt's but with shade difference

        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement)
            .append("svg")
            .attr("width", vis.width - vis.margin.left - vis.margin.right)
            .attr("height", (vis.height)/2 - vis.margin.top - vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Set the sankey diagram properties
        vis.sankey = d3.sankey()
            .nodeWidth(10)
            .nodePadding(10)
            .size([vis.width- (vis.margin.left + vis.margin.right +vis.padding)*2, (vis.height/2)- (vis.margin.top + vis.margin.bottom+ vis.padding)*2])

        vis.path = vis.sankey.links();

        //sankey title
        vis.heading= vis.svg.append("text")
            //.text("BIKE MOVEMENT FROM " + selectedNeighborhood+" TO OTHER STATIONS: " )
            .text("BIKE MOVEMENT" )
            .attr("dominant-baseline", "middle")
            .attr("font-size", "16")
            .attr("dy", "-2.45em")
            .attr("font-weight", "600")
            .style("fill", "WHITE");

        vis.linkcontainer = vis.svg.append("g")
        vis.nodecontainer = vis.svg.append("g")

        // (Filter, aggregate, modify data)
        vis.wrangleData();
    }

    wrangleData()
    {
        let vis = this;
        //console.log(selectedNeighborhood);
        //console.log(vis.data);

        //destination stations need to be grouped on the basis of their neighbourhoods, all trip values or array lengths add up
        //source is selected neighbourhood ---> target is destination neighbourhood
        vis.source=[];
        vis.destination=[];
        vis.values=[];
        vis.filteredData = [];
        vis.newishdata=[];
        vis.extract=[];
        vis.n=0;
        vis.i=0;

        // filter based on selected start neighbourhood
        vis.filteredData= vis.data2.features.filter(d=> d.properties.DC_HPN_NAME === selectedNeighborhood);
        //console.log(vis.filteredData); // all trips from neighbourhood

        // CREATE ORIGIN STATIONS LIST
        vis.filteredData = d3.groups(vis.filteredData, d=>d.properties.start_station_name);
        vis.filteredData.forEach(function (d,i) {
            vis.source[i] = (d[0]); //names of each source stations in every loop
            console.log(vis.source[i]); })
        //console.log(vis.source);
        //console.log(vis.data)

        //FILTER ALL TRIPS FROM OTHER DATASET BASED ON ORIGIN STATION NAME
        vis.dataanew = Object.entries(vis.data);
        console.log(vis.data);
        vis.dataanew =vis.dataanew[3][1];
        vis.filteredData= d3.groups(vis.dataanew, d=>d.properties.start_station_name);
        //console.log(vis.filteredData);

        vis.filteredData.forEach(function (d,j) {
            //console.log(d[0]);
            for (vis.i = 0; vis.i < vis.source.length; vis.i++) {
                if (d[0] === vis.source[vis.i]){
                    vis.extract.push(d[1]);
                }
                else{}
            }
        })
        //console.log(vis.destination);
        vis.extract = vis.extract.flat();

        // GROUP ALL TRIPS BASED ON DESTINATION NEIGHBOURHOODS
        vis.extract= d3.groups(vis.extract, d=>d.properties.DC_HPN_NAME);
        //console.log(vis.extract);


        // GET THE DESTINATION NEIGHBOURHOOD AND TRIP FREQUENCY FROM ARRAY NAME AND LENGTH
        vis.extract.forEach(function (d,i) {
            if (d[0] !== selectedNeighborhood){        //remove any possibility of circular links
                vis.destination[i] = d[0];
                vis.values[i] = d[1].length;
                //console.log(vis.destination[i],vis.values[i]);
                vis.newishdata[i]= [selectedNeighborhood,"bike",vis.destination[i], vis.values[i]];
            }
            else{
                vis.i--;
            }
        })
        //console.log(vis.newishdata);

        //source will be a property of unique start stations of object trip
        //target will be a property of unique end stations of object trip
        //value will be a property made of count of trips between any start station and end station
        vis.newdata= vis.newishdata.map(function(d){
            return {
                "source": d[0] ,
                "target": d[2],
                "value": d[3]
            }
        });
        //console.log(vis.newdata);
        vis.newdata.sort((a,b) => (a.value < b.value) ? 1 : ((b.value < a.value) ? -1 : 0 ))
        vis.newdata= vis.newdata.slice(0,5);


        // prepare data in form of nodes and links which are arrays of objects
        //set up graph
        vis.sankeyData = { nodes: [], links: [] };

        //sankey Arguments
        vis.newdata.forEach((d) => {
            vis.nodesList = vis.sankeyData.nodes.map((n) => n.name);
            if (!vis.nodesList.includes(d.source)) {
                vis.sankeyData.nodes.push({ name: d.source });
            }
            if (!vis.nodesList.includes(d.target)) {
                vis.sankeyData.nodes.push({ name: d.target });
            }
            vis.sankeyData.links.push({
                source: d.source,
                target: d.target,
                value: d.value
            });
        });
        //console.log(vis.nodesList);
        //this part is for indexing all the nodes to create links
        vis.sankeyData.links.forEach((l, lNdx) => {
            vis.sankeyData.links[lNdx].source = vis.sankeyData.nodes.indexOf(
                vis.sankeyData.nodes.find((n) => n.name === l.source)
            );
            vis.sankeyData.links[lNdx].target = vis.sankeyData.nodes.indexOf(
                vis.sankeyData.nodes.find((n) => n.name === l.target)
            );
        });

        vis.updateVis();
    }


    updateVis()
    {

        let vis = this;

        vis.svg.selectAll(".link").remove();
        vis.svg.selectAll(".node").remove();
        vis.svg.selectAll(".link-tooltip").remove();

        vis.graph = vis.sankey(vis.sankeyData)

        //links
        vis.links = vis.linkcontainer.selectAll(".link")
            .data(vis.graph.links)

       vis.links.exit().remove();

        vis.links.attr("class", "link")
            .enter()
            .append("path")
            .merge(vis.links)
            .attr("d", d3.sankeyLinkHorizontal())
            .attr("class","link")
            .style('fill', 'none')
            .style('opacity', '0.2')
            .attr("stroke", "white" )
            .attr("stroke-width", function(d) { return d.width;})  //function(d) { return d.width;}
            .append("title")
            .text(function(d) {
                return d.source.name + " → " +
                    d.target.name + "\n" + vis.format(d.value); })
            //.append("g")

        // add in the nodes
        vis.node = vis.nodecontainer.selectAll(".node")
            .data(vis.graph.nodes)
            .attr("class", "node")


       vis.node.exit().remove();

        // add the rectangles for the nodes
        vis.node.enter()
            .append("rect")
            .merge(vis.node)
            .attr("x", function(d) { return d.x0; })
            .attr("y", function(d) { return d.y0; })
            .attr("height", function(d) { return d.y1- d.y0; })
            .attr("width", vis.sankey.nodeWidth())
            .attr("class", "node")
            .style("fill",function(d) {
                return d.color = vis.color(d.name.replace(/ .*/, "")); })
            .style("stroke", function(d) {
                return d3.rgb(d.color).darker(2); })
            .append("title")
            .text(function(d) {
                return d.name + "\n" + vis.format(d.value); })
            .append("g");


        // add in the title for the nodes
        vis.node.enter()
            .append("text")
            .attr("x", function(d) { return d.x0; })
            .attr("y", function(d) { return (d.y1 + d.y0) / 2; })
            .attr("dy", "0.35em")
            .attr("text-anchor", "end")
            .attr("class", "link-tooltip")
            .text(function(d) { return d.name + " (" + d.value + ")" ; })
            .style("font-size", "10px")
            .style('fill', 'white')
            .filter(function(d) { return d.x0 < vis.width / 2; })
            .attr("x", function(d) { return d.x1 + 6; })
            .attr("text-anchor", "start")
            .append("g");


    }
}


