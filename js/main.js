/* * * * * * * * * * * * * *
*           MAIN           *
* * * * * * * * * * * * * */

// init global variables

// load data using promises
let promises = [
    d3.json("data/Street_Segments_2005.geojson") // load street segments at [0]
    //add additional datasets below as items in this array and comment what they are
];

Promise.all(promises)
    .then(function (data) {
        initMainPage(data)
    })
    .catch(function (err) {
        console.log(err)
    });

// init main page
function initMainPage(dataArray){
    console.log(dataArray); // explore dataArray in console

    //use dataArray indexing to pass specific datasets from the promise to the visualization classes

}
