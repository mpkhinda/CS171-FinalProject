class SankeyVis
{
    // constructor to initialize SankeyChart object
    constructor(parentElement,bikeEndData, bikeStartData)
    {
        this.parentElement = parentElement;
        this.data = bikeEndData;
        this.data2 = bikeStartData;
        this.initVis();
    }

    initVis()
    {
        let vis = this;

        // set the dimensions and margins of the graph
        vis.margin = {top: 150, right: 10, bottom: 10, left: 80};
        vis.width = 1400 - vis.margin.left - vis.margin.right;
        vis.height = 1200 - vis.margin.top - vis.margin.bottom;

        vis.padding= 50;

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


        // (Filter, aggregate, modify data)
        vis.wrangleData();
    }

    wrangleData()
    {
        let vis = this;

        //console.log(vis.data);
        //console.log(vis.data2);

        //destination stations need to be grouped on the basis of their neighbourhoods, all trip values or array lengths add up
        //source is selected station ---> target is destination station and/or neighbourhood
        //remove any possibility of circular links
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
        console.log(vis.filteredData); // all trips from neighbourhood

        //data grouped into trips
        vis.filteredData = d3.groups(vis.filteredData, d=>d.properties.start_station_name, d=>d.properties.end_station_name );
        console.log(vis.filteredData);

        //list of all start stations, end stations and number of unique trips
        vis.filteredData.forEach(function (d,i) {
            vis.source[i] = (d[0]); //names of each source stations in every loop
            //console.log(vis.source[i]);

            vis.extract[i]=(d[1]); // array of  destination station and its trips for each source stations in every loop
            //console.log(vis.extract[i]); // array of destination stations

            vis.extract[i].forEach(function (b, j) {
                if (b[0] !== vis.source[i] ){
                vis.destination[j]= (b[0]); // name of destination station
                vis.values[j]=b[1].length; // number of trips to destination station
                //console.log(vis.destination);
                //console.log(vis.values);
                vis.newishdata[vis.n]= [vis.source[i],vis.destination[j], vis.values[j]];
                j++;
                vis.n++;
                }
                else{}
            })
            vis.i++;
        })
        console.log(vis.newishdata);



        //source will be a property of unique start stations of object trip
        //target will be a property of unique end stations of object trip
        //value will be a property made of count of trips between any start station and end station
        vis.newdata= vis.newishdata.map(function(d){
            return {
                "source": d[0] ,
                "target": d[1],
                "value": d[2]
            }
        });
        console.log(vis.newdata);


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

        //sankey title
        vis.svg.append("text")
            .text("BIKE MOVEMENT FROM " + selectedNeighborhood+" TO OTHER NEIGHBORHOODS: " )
            .attr("dominant-baseline", "middle")
            .attr("font-size", "24")
            .attr("dy", "-2.45em")
            .attr("font-weight", "600")
            .style("fill", "WHITE");


        vis.graph = vis.sankey(vis.sankeyData);


        // add in the links
        vis.link= vis.svg.append("g")
            .selectAll(".link")
            .data(vis.graph.links);

        //vis.link.exit().remove();

        vis.link.enter().append("path")
            .attr("class", "link")
            .style('fill', 'lightgray')
            .style('opacity', '0.2')
            .attr("d", d3.sankeyLinkHorizontal())
            .attr("stroke-width", function(d) { return d.width; });
        //vis.link.merge(vis.link) ----- useless

        // add the link titles
        vis.link.append("title")
            .text(function(d) {
                return d.source.name + " → " +
                    d.target.name + "\n" + vis.format(d.value); });

        vis.link.exit().remove();

        //vis.link.exit().remove();


        // add in the nodes
        vis.node = vis.svg.append("g")
            .selectAll(".node")
            .data(vis.graph.nodes)
            .enter().append("g")
            .attr("class", "node");


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


        vis.svg.exit().remove();

    }
}



//----------------------------------------------------------------------------------------------------------------------
/*  // the function for moving the nodes
  function dragmove(d) {
      d3.select(this)
          .attr("transform",
              "translate("
              + d.x + ","
              + (d.y = Math.max(
                      0, Math.min(height - d.dy, d3.event.y))
              ) + ")");
      sankey.relayout();
      link.attr("d", sankey.link() );
  }*/


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


/*

            vis.data = [
               {"source": "Fairfax Dr & N Taylor St", "target": "Ballston Metro / Stuart St & 9th St N", "value": 16},
               {"source": "Fairfax Dr & N Taylor St", "target": "Virginia Square Metro / Monroe St & 9th St N", "value": 5},
               {"source": "Fairfax Dr & N Taylor St", "target": "Rhodes St & 16th St N",  "value": 2},
               {"source": "Fairfax Dr & N Taylor St", "target": "N Veitch St & 20th St N", "value": 1},
               {"source": "Fairfax Dr & N Taylor St", "target": "Fairfax Dr & N Randolph St", "value": 2},
               {"source": "Eads St & 12th St S", "target": "5th & K St NW", "value": 3},
               {"source": "Eads St & 12th St S", "target": "Long Bridge Park / Long Bridge Dr & 6th St S", "value": 7},
               {"source": "Eads St & 12th St S", "target": "Aurora Hills Cmty Ctr / 18th St & S Hayes St", "value": 13}
               ]
               //console.log(vis.data);*/



//----------------------------------------------------------------------------------------------------------------------

/*        vis.sankeyData = {"nodes":[
                {"node":0,"name":"Fairfax Dr & N Taylor St"},
                {"node":1,"name":"Eads St & 12th St S"},
                {"node":2,"name":"Ballston Metro / Stuart St & 9th St N"},
                {"node":3,"name":"Virginia Square Metro / Monroe St & 9th St N"},
                {"node":4,"name":"Rhodes St & 16th St N"},
                {"node":5,"name":"N Veitch St & 20th St N"},
                {"node":6,"name":"Fairfax Dr & N Randolph St"},
                {"node":7,"name":"5th & K St NW"},
                {"node":8,"name":"Long Bridge Park / Long Bridge Dr & 6th St S"},
                {"node":9,"name":"Aurora Hills Cmty Ctr / 18th St & S Hayes St"}
            ],
            "links":[
                {"source": 0, "target": 2, "value": 16},
                {"source": 0, "target": 3, "value": 5},
                {"source": 0, "target": 4,  "value": 2},
                {"source": 0, "target": 5, "value": 1},
                {"source": 0, "target": 6, "value": 2},
                {"source": 1, "target": 7, "value": 3},
                {"source": 1, "target": 8, "value": 7},
                {"source": 1, "target": 9, "value": 13}
            ]}*/


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

// this is a drop in replacement for d3.sankeyLinkHorizontal()
// well, without the accessors/options


/*     function sankeyLinkPath() {


         console.log(vis.sankeyData.links);
         for (vis.i = 0; vis.i < vis.sankeyData.links.length; vis.i++) {
             vis.sx = vis.sankeyData.links[vis.i].source.x1;
             console.log(vis.sx);
         }
         //vis.sx = vis.sankeyData.links[i].source.x1;

           vis.tx = vis.link.target.x0 + 1
           vis.sy0 = vis.link.y0 - vis.link.width/2
           vis.sy1 = vis.link.y0 + vis.link.width/2
           vis.ty0 = vis.link.y1 - vis.link.width/2
           vis.ty1 = vis.link.y1 + vis.link.width/2

           vis.halfx = (vis.tx - vis.sx)/2

           vis.path = d3.path()
           vis.path.moveTo(vis.sx, vis.sy0)

           vis.cpx1 = vis.sx + vis.halfx
           vis.cpy1 = vis.sy0 + vis.offset
           vis.cpx2 = vis.sx + vis.halfx
           vis.cpy2 = vis.ty0 - vis.offset
           vis.path.bezierCurveTo(vis.cpx1, vis.cpy1, vis.cpx2, vis.cpy2, vis.tx, vis.ty0)
           vis.path.lineTo(vis.tx, vis.ty1)

           vis.cpx1 = vis.sx + vis.halfx
           vis.cpy1 = vis.ty1 - vis.offset
           vis.cpx2 = vis.sx + vis.halfx
           vis.cpy2 = vis.sy1 + vis.offset
           vis.path.bezierCurveTo(vis.cpx1, vis.cpy1, vis.cpx2, vis.cpy2, vis.sx, vis.sy1)
           vis.path.lineTo(vis.sx, vis.sy0)
           return vis.path.toString()
       }*/

//----------------------------------------------------------------------------------------------------------------------

/*
          //     for (vis.i=0; vis.i<vis.sankeyData.nodes.length; vis.i++)
          for (vis.i=1; vis.i<10; vis.i++)
          {
              vis.graph = vis.sankey(vis.sankeyData[vis.i]);
          }

            vis.sankeyData.nodes.forEach(function (d,i){
            //vis.graph = vis.sankey(d[i]);
            console.log("5");
            } )*/


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
