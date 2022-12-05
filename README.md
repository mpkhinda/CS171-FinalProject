# Mapping Mobility in Washington, DC
This interactive dashboard visualizes mobility data in Washington, DC. This project was created as the final deliverable for [CS171 Visualization](https://www.cs171.org/2022/index.html). 
For more information, watch a [video walkthrough](link here) of the dashboard or explore the [website](link here).


Project team:
- **Matt Khinda**, Master in Urban Planning 2023, Harvard Graduate School of Design
- **Alex Cardelle**, Master in Urban Planning 2023, Harvard Graduate School of Design
- **Harshika Bisht**, Master in Design Studies 2023, Harvard Graduate School of Design
_____

### Functionality
The main dashboard interface is found at the bottom of the webpage after the introductory section. The main features of this dashboard are as follows:
- The map displays bike trips (red) and taxi trips (blue) in the selected neighborhood.
- Select a new neighborhood by hovering over then clicking the desired area, the map will zoom to focus on that part of the map.
- Bike or taxi trips can be shown or hidden using the toggle next to the title on the left-hand side tooltip.
- Switch between the radar chart and the sankey diagrams using the button on the left-hand side tooltip.
- The radar chart will update based on the selected neighborhood, and the data for the census tracts contained in that neighborhood will be displayed as individual layers on the chart.
- The sankey diagrams display the top 5 destination neighborhoods for bike (top) and taxi (bottom) trips originating in the selected neighborhood.
_____

### Data Sources & Methods

Geographic Data:
- [DC Health Planning Neighborhoods](https://opendata.dc.gov/datasets/dc-health-planning-neighborhoods) — geographic boundaries of Washington, DC neighborhoods as defined by the DC Health Department.
- [DC Health Planning Neighborhoods to Census Tracts](https://opendata.dc.gov/datasets/1d586a67d5ce4eceb5d51bec653d6774) — a cross-reference table defining which census tracts are contained within each neighborhood.
- [DC Street Segments](https://opendata.dc.gov/datasets/DCGIS::street-segments-2005/about) — geographic centerlines of streets, alleys, and driveways in Washington, DC.

Mobility Data:
- [Capital Bikeshare Trip History](https://ride.capitalbikeshare.com/system-data) — anonymized trip-level data in the Capital Bikeshare network including date, time, duration, origin, destination, and bike type.  
- [DC Open Data 2021 Taxi Trips](https://opendata.dc.gov/documents/taxi-trips-in-2021) — anonymized trip-level taxi data for trips within Washington, DC including date, time, duration, pick up and drop off points. 
- American Community Survey (ACS) data for commute mode share was pulled using the `tidycensus` package in R and the Census Bureau API.

Methods:

Because millions of trips are generated each year, and this dashboard is intended as a scalable demonstration project, we used a subset of 10,000 bike and taxi trips from the month of September 2021. Each trip was assigned a start neighborhood and end neighborhood based on the location of origin and destination points. For the summary statistics and sankey diagram, trips were grouped and counted based on these start and end neighborhoods. For the radar chart, commute mode share was pulled by census tract then mapped to neighborhoods using the cross-reference table above.  
_____

### Libraries & Acknowledgements

- [d3.js](https://d3js.org/) — all of the visualizations in this project were created using the d3.js library.  
- [MabpoxGL.js](https://docs.mapbox.com/mapbox-gl-js/api/) — map base layers and basic functionality are provided through the Mapbox API and Mapbox GL js library.
- [Bootstrap](https://getbootstrap.com/) — the responsive html, and base css were provided through bootstrap.

 Additional Acknowledgements:
- Much of the d3 and Mapbox integration was gleaned from examples by [Frank Schlosser](https://franksh.com/posts/d3-mapboxgl/) and [John Alexis Guerra Gómez](https://observablehq.com/@john-guerra/mapbox-d3).
- The radar chart was based on code from [Nadieh Bremer](https://gist.github.com/nbremer/21746a9668ffdf6d8242).

