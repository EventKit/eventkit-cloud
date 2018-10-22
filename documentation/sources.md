## Configuring Data Sources

EventKit can request data from a variety of data sources including:

- WMS
- WMTS
- TMS
- WCS
- Overpass (OSM)
- WFS
- ArcGIS Raster (MapServer/ImageryServer)
- ArcGIS Feature (MapServer/FeatureServer)

The support varies a little by services.  For example all data will be loaded by default in the style sheets however WCS is expected to be elevation, so it may not appear correctly in the styles.
Additionally WFS and ArcGIS Feature currently have no way to implement custom styles.

### Configuration

The tooling for configuring getting the data varies slightly but it is generally using GDAL/OGR and [MapProxy](https://mapproxy.org/docs/nightly/configuration.html).

To configure a new data source navigate to the data providers section in the admin page (i.e. /admin/jobs/dataprovider/) 
and select "Add Data Provider".

#### General Settings

| Variable Name | Description | 
|---------------|-------------|
| Service Name | The way the name should appear in the UI and in the metadata | 
| slug | A short version of the name with no spaces or special characters (except -) | 
| Service URL | The location of the service being used, this field is used by the data availability checker to determine if the source is valid. |
| Preview URL | UNUSED | 
| Copyright | This information is used to display relevant copyright information. |
| Description | This information is used to provide information about the service. |
| Service Type | This determines how the system uses the settings to get the data. |
| Service Layer | The specific layer for the provided Service URL |
| Max Selection Area | This is the maximum area in square kilometers that can be exported from this provider in a single DataPack. | 
| Seed from level | This determines the starting zoom level the tile export will seed from. | 
| Seed to Level |  This determines the highest zoom level the tile export will seed to. | 
| User | UNUSED | 
| License | This adds specific licensing for the data source.  Users MUST agree before creating or downloading ANY data in the application. | 
| Zip | Add all data from the source to a zip file. |
| Display | Checking this will allow users to see the data source as an option in the UI. |


#### Service Types

If the Service Type is WMS, WMTS, TMS, or ArcGIS Raster, then EventKit will use MapProxy. 

Everything else uses GDAL/OGR.


##### MapProxy Configuration

MapProxy configuration can be fairly complicated.  The `Configuration` section is used for adding the MapProxy configuration. 

In general you need a Layers, Sources, and Grids section. 

Whatever you have as the Service Layer needs to be listed as a Source in the Sources section.
You need to also list that Layer in the layers section. The source for that layer MUST be `cache`. 
This is because EventKit will configure the cache for you.

For best results use this (WMTS/TMS) template, updating the sources and grids section to fit your data source. 
EventKit will use MapProxy to help validate your entry to help find errors.

In addition there are two keys you can add to the examples to adjust how many times a request is attempted and how many concurrent workers mapproxy will use.
Those options are `concurrency` and `max_repeat`.



WMTS/TMS Full Example: 
<pre>
concurrency: 12
max_repeat: 5

layers:
 - name: imagery
   title: imagery
   sources: [cache]

sources:
  imagery:
    type: tile
    grid: geodetic
    url: "https://tileserver.com/tiles/default/%(z)s/%(x)s/%(y)s.png"

grids:
  geodetic:
    srs: EPSG:4326
    tile_size: [256, 256]
    origin: nw
    res: [0.7031249999999999, 0.35156249999999994, 0.17578124999999997, 0.08789062499999999,
      0.04394531249999999, 0.021972656249999997, 0.010986328124999998, 0.005493164062499999,
      0.0027465820312499996, 0.0013732910156249998, 0.0006866455078124999, 0.00034332275390624995,
      0.00017166137695312497, 8.583068847656249e-05, 4.291534423828124e-05, 2.145767211914062e-05,
      1.072883605957031e-05, 5.364418029785155e-06, 2.6822090148925777e-06, 1.3411045074462889e-06,
      6.705522537231444e-07]
</pre>

WMS source example:
<pre>
sources:
  imagery:
    type: wms
    grid: geodetic
    req:
      url: https://server.com/WmsServer
      layers: 0
</pre>       

ARCGIS Source example:
<pre>
sources:
  imagery:
    type: arcgis
    grid: geodetic
    req:
      url: http://example.org/ArcGIS/rest/services/Imagery/MapService
      layers: 0
</pre>       

##### WCS Configuration

In many cases no additional configuration needs to be provided and GDAL can handle the request.  If using a certificate to access the service then EventKit will make the request directly and a YAML configuration must be provided. 
Example:
<pre>
service:
  scale: "30"
  coverages: "2,3,4,5"
params:
  TRANSPARENT: true
  FORMAT: geotiff
  VERSION: '1.0.0'
  REQUEST: GetCoverage
  CRS: "EPSG:4326"
</pre>
Params are just the WCS params passed directly to the request. 

Scale is in meters and adjusts the amount of pixels requested.

Coverages will request one layer or many. If many are added then they will just append and overwrite the previous request. 

#### Data Authentication
If the data source is secure then some additional information will need to be provided, please see the Data Authentication section in the [settings readme](./settings.md)