/* * * * * * * * * * * * * *
*          MAP VIS         *
* * * * * * * * * * * * * */

class MapVis {

    // constructor
    constructor(parentElement, data, token) {
        this.parentElement = parentElement;
        this.data = data;
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

    }



}