class SankeyVis2
{
    // constructor to initialize SankeyChart object
    constructor(parentElement,EndData, StartData) //, taxiEndData, taxiStartData
    {
        this.parentElement = parentElement;
        this.data = EndData; // categorized based on destination station neighbourhood
        this.data2 = StartData; // categorized based on source station neighbourhood
        //this.data3 = taxiEndData;
        //this.data4=  taxiStartData;
        this.initVis();
    }

    initVis()
    {
        let vis = this;

        // set the dimensions and margins of the graph
        vis.margin = {top: 50, right: 1, bottom: 50, left: 1};
        //vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width + vis.margin.left + vis.margin.right-100;
        vis.width = 400 + vis.margin.left + vis.margin.right;
        vis.height = 400 + vis.margin.top + vis.margin.bottom;

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
            .attr("height", (vis.height) - vis.margin.top - vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Set the sankey diagram properties
        vis.sankey = d3.sankey()
            // .nodeId(function(d) { console.log(d.name); return d.name; })
            .nodeWidth(10)
            .nodePadding(10)
            .size([vis.width- (vis.margin.left + vis.margin.right +vis.padding)*2, (vis.height/1.1)- (vis.margin.top + vis.margin.bottom+ vis.padding)*2])

        vis.path = vis.sankey.links();

        //sankey title
        vis.heading= vis.svg.append("text")
            //.text("BIKE MOVEMENT FROM " + selectedNeighborhood+" TO OTHER STATIONS: " )
            .text("TAXI MOVEMENT" )
            .attr("dominant-baseline", "middle")
            .attr("font-size", "16")
            .attr("dy", "-2.45em")
            .attr("font-weight", "600")
            .style("fill", "WHITE");

        // (Filter, aggregate, modify data)
        vis.wrangleData();
    }

    wrangleData()
    {
        let vis = this;

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

        // CREATE ORIGIN block name LIST
        vis.filteredData = d3.groups(vis.filteredData, d=>d.properties.ORIGIN_BLOCKNAME);
        vis.filteredData.forEach(function (d,i) {
            vis.source[i] = (d[0]); //names of each source stations in every loop
            //console.log(vis.source[i]);
        })
        //console.log(vis.source);

        //FILTER ALL TRIPS FROM OTHER DATASET BASED ON ORIGIN BLOCK NAME
        vis.datab = Object.entries(vis.data);
        vis.datab =vis.datab[3][1];
        vis.filteredData= d3.groups(vis.datab, d=>d.properties.ORIGIN_BLOCKNAME);

        vis.filteredData.forEach(function (d,j) {
            //console.log(d[0]);
            for (vis.i = 0; vis.i < vis.source.length; vis.i++) {
                if (d[0] === vis.source[vis.i]){
                    vis.extract.push(d[1]);
                }
                else{}
            }
        })
        vis.extract = vis.extract.flat();
        //console.log(vis.extract);

        // GROUP ALL TRIPS BASED ON DESTINATION NEIGHBOURHOODS
        vis.extract= d3.groups(vis.extract, d=>d.properties.DC_HPN_NAME);
        //console.log(vis.extract);

        // GET THE DESTINATION NEIGHBOURHOOD AND TRIP FREQUENCY FROM ARRAY NAME AND LENGTH
        vis.extract.forEach(function (d,i) {
            if (d[0] !== selectedNeighborhood){        //remove any possibility of circular links
                vis.destination[i] = d[0];
                vis.values[i] = d[1].length;
                //console.log(vis.destination[i],vis.values[i]);
                vis.newishdata[i]= [selectedNeighborhood,"taxi", vis.destination[i], vis.values[i]];
            }
            else{}
        })

        vis.newdata= vis.newishdata.map(function(d){
            return {
                "source": d[0] ,
                "target": d[2],
                "value": d[3]
            }
        });
        vis.newdata.sort((a,b) => (a.value < b.value) ? 1 : ((b.value < a.value) ? -1 : 0 ))
        vis.newdata= vis.newdata.slice(0,10);


        // prepare data in form of nodes and links which are arrays of objects
        //set up graph--- empty
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
        console.log(vis.sankeyData);

        vis.svg.selectAll(".link").remove();
        vis.svg.selectAll(".node").remove();
        vis.svg.selectAll(".link-tooltip").remove();

        vis.graph = vis.sankey(vis.sankeyData)

        // add in the links
        vis.links = vis.svg.selectAll(".link")
                .data(vis.graph.links)

            vis.links.exit().remove();

            vis.links.attr("class", "link")
                .enter()
                .append("path")
                .merge(vis.links)
                .attr("d", d3.sankeyLinkHorizontal())
                .attr("class", "link")
                .style('fill', 'none')
                .style('opacity', '0.2')
                .attr("stroke", "white" )
                .attr("stroke-width", function(d) { return d.width;})
                .append("title")
                .text(function(d) {
                    return d.source.name + " → " +
                        d.target.name + "\n" + vis.format(d.value); }) //only correct values when it is attached to the main method chain

            // add in the nodes
            vis.node = vis.svg.selectAll(".node")
                .data(vis.graph.nodes)
                .attr("class", "node")

            // .join("rect");
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
                .attr("dy", "0.35em") // vertically centre text regardless of font size
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


