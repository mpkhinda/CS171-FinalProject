class SankeyVis
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
        vis.margin = {top: 50, right: 10, bottom: 10, left: 80};
        //vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width + vis.margin.left + vis.margin.right-100;
        vis.width = 300 + vis.margin.left + vis.margin.right;
        vis.height = 100 + vis.margin.top + vis.margin.bottom;

        vis.padding= 10;

        // format variables
        vis.formatNumber = d3.format(",.0f"); // zero decimal places
        vis.format = function(d) { return vis.formatNumber(d); };
        vis.color = d3.scaleOrdinal(d3.schemeCategory10);
        //can pass on this ---keeping all source stations one color and all destination stations one color --match it with Matt's but with shade difference

        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Set the sankey diagram properties
        vis.sankey = d3.sankey()
            .nodeWidth(10)
            .nodePadding(10)
            .size([vis.width, vis.height]) //trigger event on click and pass selected neighborhood

        vis.path = vis.sankey.links();

        //sankey title
        vis.heading= vis.svg.append("text")
            //.text("BIKE MOVEMENT FROM " + selectedNeighborhood+" TO OTHER STATIONS: " )
            .text("BIKE MOVEMENT FROM SELECTED NEIGHBORHOOD" )
            .attr("dominant-baseline", "middle")
            .attr("font-size", "16")
            .attr("dy", "-2.45em")
            .attr("font-weight", "600")
            .style("fill", "WHITE");

        /*     //sankey origin and destination label
             vis.svg.append("text")
                 .text("ORIGIN STATIONS ----> " )
                 .attr("dominant-baseline", "middle")
                 .attr("font-size", "15")
                 .attr("dy", "-1.45em")
                 .attr("font-weight", "200")
                 .style("fill", "WHITE");

             //sankey origins nad destination label
             vis.svg.append("text")
                 .text("DESTINATION STATIONS " )
                 .attr("dominant-baseline", "middle")
                 .attr("x", 1530)           // set x position of left side of text
                 //.attr("y", 150)
                 .attr("text-anchor", "end")
                 .attr("font-size", "15")
                 .attr("dy", "-1.45em")
                 .attr("font-weight", "200")
                 .style("fill", "WHITE");*/

        /*


         /*      vis.groupheading= vis.svg.append("g")
                   .attr("class","text");

               vis.grouplink= vis.svg.append("g")
                   .attr("class", "link");

               vis.groupnode = vis.svg.append("g")
                   .attr("class", "node");*/


        // (Filter, aggregate, modify data)
        vis.wrangleData();
    }

    wrangleData()
    {
        let vis = this;

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

        //FILTER ALL TRIPS FROM OTHER DATASET BASED ON ORIGIN STATION NAME
        vis.data = Object.entries(vis.data);
        vis.data =vis.data[3][1];
        vis.filteredData= d3.groups(vis.data, d=>d.properties.start_station_name);
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
        console.log(vis.newdata);
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
        vis.graph = vis.sankey(vis.sankeyData);

        //Remove whatever chart with the same id/class was present before
        //d3.select(".text-sankey").select("svg").remove();

        // add in the links
        vis.link = vis.svg.append("g").selectAll(".link")
            .data(vis.graph.links)
            .enter().append("path")
            .attr("d", d3.sankeyLinkHorizontal())
            .style('fill', 'none')
            .style('opacity', '0.2')
            .attr("stroke", "white" )
            .attr("stroke-width", function(d) { return d.width;} );   //function(d) { return d.width;}


        // add the link titles
        vis.link.append("title")
            .text(function(d) {
                return d.source.name + " → " +
                    d.target.name + "\n" + vis.format(d.value); });


        // add in the nodes
        vis.node = vis.svg.append("g")
            .selectAll(".node")
            .data(vis.graph.nodes)
            .enter().append("g")
            .attr("class", "node");

        // .join("rect");


        // add the rectangles for the nodes
        vis.node.append("rect")
            .attr("x", function(d) { return d.x0; })
            .attr("y", function(d) { return d.y0; })
            .attr("height", function(d) { return d.y1- d.y0; })
            .attr("width", vis.sankey.nodeWidth())
            .style("fill",function(d) {
                return d.color = vis.color(d.name.replace(/ .*/, "")); })
            .style("stroke", function(d) {
                return d3.rgb(d.color).darker(2); })
            .append("title")
            .text(function(d) {
                return d.name + "\n" + vis.format(d.value); });


        // add in the title for the nodes
        vis.node.append("text")
            .attr("x", function(d) { return d.x0; })
            .attr("y", function(d) { return (d.y1 + d.y0) / 2; })
            .attr("dy", "0.35em") // vertically centre text regardless of font size
            .attr("text-anchor", "end")
            .text(function(d) { return d.name; })
            .style("font-size", "10px")
            .style('fill', 'white')
            .filter(function(d) { return d.x0 < vis.width / 2; })
            .attr("x", function(d) { return d.x1 + 6; })
            .attr("text-anchor", "start");

        /*    //sankey title
            vis.heading= vis.svg.append("text")
                .text("BIKE MOVEMENT FROM " + selectedNeighborhood+" TO OTHER STATIONS: " )
                .attr("dominant-baseline", "middle")
                .attr("font-size", "24")
                .attr("dy", "-2.45em")
                .attr("font-weight", "600")
                .style("fill", "WHITE");
    */

        /*
                // add in the links
                vis.grouplink.selectAll(".link")
                    .data(vis.graph.links)
                    .enter().append("path")
                    .style('fill', 'lightgray')
                    .style('opacity', '0.04')
                    .attr("d", d3.sankeyLinkHorizontal())
                    .attr("stroke-width", function(d) { return d.width; });


                // add the link titles
                vis.grouplink.append("title")
                    .text(function(d) {
                        return d.source.name + " → " +
                            d.target.name + "\n" + vis.format(d.value); });


                // add in the nodes
                    vis.groupnode
                    .selectAll(".node")
                    .data(vis.graph.nodes)
                        .join("rect");


                // add the rectangles for the nodes
                vis.groupnode.attr("x", function(d) { return d.x0; })
                      .attr("y", function(d) { return d.y0; })
                      .attr("height", function(d) { return d.y1- d.y0; })
                      .attr("width", vis.sankey.nodeWidth())
                      .style("fill",function(d) {
                          return d.color = vis.color(d.name.replace(/ .*!/, "")); })
                      .style("stroke", function(d) {
                          return d3.rgb(d.color).darker(2); })
                      .append("title")
                      .text(function(d) {
                          return d.name + "\n" + vis.format(d.value); });


                // add in the title for the nodes
                vis.groupnode.append("text")
                        .attr("x", function(d) { return d.x0; })
                        .attr("y", function(d) { return (d.y1 + d.y0) / 2; })
                        .attr("dy", "0.35em") // vertically centre text regardless of font size
                        .attr("text-anchor", "end")
                        .text(function(d) { return d.name; })
                        .style("font-size", "10px")
                        .style('fill', 'white')
                        .filter(function(d) { return d.x0 < vis.width / 2; })
                        .attr("x", function(d) { return d.x1 + 6; })
                        .attr("text-anchor", "start");

                //sankey title
                vis.groupheading.append("text")
                    .text("BIKE MOVEMENT FROM " + selectedNeighborhood+" TO OTHER STATIONS: " )
                    .attr("dominant-baseline", "middle")
                    .attr("font-size", "24")
                    .attr("dy", "-2.45em")
                    .attr("font-weight", "600")
                    .style("fill", "WHITE");
        */


        //vis.svg.exit().remove();

    }
}




//----------------------------------------------------------------------------------------------------------------------
// add a dropdown menu with all start stations list
//Append the select element
//var dropDown = d3.select("HTML element").append("select")
//     .attr("name", "name-list");
//Append options to your select element based on data
//vis.selectedstation= ;
// filter based on selected bikestation
//vis.filteredData= vis.data.features.filter(d=> d.properties.DC_HPN_NAME === vis.selectedstation);


//----------------------------------------------------------------------------------------------------------------------



//vis.extract=[];
//vis.source=[];

//creates a map function
//vis.bigdata = d3.groups(vis.data, d=>d.start_station_name, d=>d.end_station_name);
//console.log(vis.bigdata); //array
//vis.values = [...vis.bigdata]; //map to array
//console.log(vis.values); //prints the entire grouped thing in array format
/*
       vis.bigdata.forEach(function(d,i) {
            vis.source[i] = (d[0]); //names of each source stations in every loop
            //console.log(vis.source[i]);

            vis.extract[i]=(d[1]); // array of  destination station and its trips for each source stations in every loop
            //console.log(vis.extract[i]); // array of destination stations

            vis.extract[i].forEach(function (b, j) {

                vis.destination= (b[0]); // name of destination station
                vis.values=b[1].length; // number of trips to destination station
                //console.log(vis.destination);
               //console.log(vis.values);
                vis.data[vis.n]= [vis.source[i],vis.destination, vis.values];
                vis.n++;
            })

        })
        console.log(vis.data);*/



//----------------------------------------------------------------------------------------------------------------------

//group trips by  end station
//vis.filteredsourceData = d3.groups(vis.filteredData, d=>d.properties.end_station_name);
//console.log(vis.filteredsourceData);

// iterate over entire vis.filteredData and create list of unique start station names--- by filter/grouping
/*vis.filteredData.forEach(function (d,j) {
    vis.stationsList[vis.j] = d.properties.start_station_name;
    console.log(vis.stationsList[vis.j]);
})*/



/*
        vis.bigdata = d3.groups(vis.filteredData, d=>d.end_station_name);
        //all other stations need to be destination stations
        console.log(vis.bigdata);
        vis.bigdata.forEach(function (b) {
            if (b[0] !== vis.selectedstation ){
                vis.destination= (b[0]); // name of destination station
                vis.values=b[1].length; // number of trips to destination station
                //console.log(vis.destination);
                // console.log(vis.values);
                vis.newishdata[vis.n]= ["Fairfax Dr & N Taylor St",vis.destination, vis.values];
                vis.n++;
            }
            else{}
        })
        console.log(vis.newishdata);
*/
