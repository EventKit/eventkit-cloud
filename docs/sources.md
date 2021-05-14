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
- Vector File
- Raster File

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

Everything else uses GDAL/OGR, or basic REST requests.


##### MapProxy Configuration

MapProxy configuration can be fairly complicated.  The `Configuration` section is used for adding the MapProxy configuration. 

In general you need a Layers, Sources, and Grids section. 

Each section that will be used for collecting the data needs to be labeled default.  Additionally it is required
that the final output layer is 4326.  If the input layer is something else it needs to be configured to be reprojected.

Whatever is the Service Layer needs to be listed as a Source in the Sources section.
You need to also list that Layer in the layers section. The source for that layer MUST be `default`. 
EventKit will configure the cache for you, or you can override the cache with your own cache section.
The cache type *MUST* be geopackage and the filename *must* be 'geopackage'.  EventKit relies on having geopackages in 4326, 
to convert to other formats and projections.    

Additionally if the service supports featureinfo queries or has a footprint layer this can be configured as additional 
sources in the mapproxy configuration the keys must be `info` and `footprint`. 

For best results use this (WMTS/TMS) template, updating the sources and grids section to fit your data source. 
EventKit will use MapProxy to help validate your entry to help find errors.

In addition there are two keys you can add to the examples to adjust how many times a request is attempted and how many concurrent workers mapproxy will use.
Those options are `concurrency` and `max_repeat`.

WMTS/TMS Full Example: 
<pre>
concurrency: 12
max_repeat: 5

layers:
 - name: default
   title: imagery
   sources: [default]

sources:
  default:
    type: tile
    grid: default
    url: "https://tileserver.com/tiles/default/%(z)s/%(x)s/%(y)s.png"
  info:
    type: wms
    grid: default
    req:
      layers: 'infoLayer'
      url: "https://test.test/wmsserver"
    wms_opts:
      map: false
      featureinfo: true
    on_error:
      500:
        response: transparent  
  footprint:
    type: wms
    req:
      url: "http://test.test/wmsserver"
      layers: 'footprintLayer'

grids:
  default:
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
  default:
    type: wms
    grid: geodetic
    req:
      url: https://server.com/WmsServer
      layers: 0
</pre>       

ARCGIS Source example:
<pre>
sources:
  default:
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

##### Overpass Configuration

You can configure the OSM schema by adding a yaml file. A default one should be loaded with Eventkit. 
Should you want to customize it or create your own the schema is in a yaml format:
```yaml
<table_name>:
  types:
    -<geometries>
  select:
    -<column names from attributes tags>
  where: <sql query>
```
For example the following configuration:
```yaml
amenities:
  types:
    - points
    - polygons
  select:
    - amenity
    - name
  where: amenity IS NOT NULL
```
Would create tables called amenities_points and amenities_polygons.
Each table would select all geometries where amenity is not null and it would include the columns
amenity and name. 

You can change the default overpass query in the configuration section by adding: 
```yaml
overpass_query: <Some overpass query>
```

Additionally if wishing NOT to use overpass a PBF file can be used, however there are many known limitations.
The user will have no idea of the bounds of the PBF file, so they will likely extract areas outside of a PBF, unless a planet size PBF is used.
Because of the way PBF is read from GDAL processing PBF data will take a significant amount of time regardless of selection area. 
Small PBF files will take a small amount of time but that time gets worse as the PBF file grows.
It could take 8 hours to do a 1000 km area from a planet sized PBF, however it may only take 8 hours to also do the whole planet.  
Therefore PBF is a reasonable option if wishing create OSM extracts that are continent or planet scale.
Lastly it can take a significant amount of storage space to process the data and there should be 3 times the size of the PBF file per worker on the system.
If using a 10GB PBF file, with one worker processing an OSM job there should be more than 30 GB of storage available to that worker for both the 
exported geopackage as well as for the geometry index used by GDAL.
https://gdal.org/drivers/vector/osm.html#internal-working-and-performance-tweaking
To set add in the OSM config block:
```yaml
pbf_file: <path to pbf file accessible by celery worker>
```

#### Data Authentication
If the data source is secure then some additional information will need to be provided, please see the Data Authentication section in the [settings readme](./settings.md)

#### Specifying Layers
The desired layers for **WFS** and **ArcGIS Feature** service providers can be specified through the configuration. All specified layers will be present and individually addressable in the exported datapack.

In order to specify the desired layers, a YAML configuration must be supplied. The configuration must include a `vector_layers` key, whose value is a list of objects, with each object containing the properties `name` and `url`.
Additionally (currently for ArcgGIS FeatureServices) specify a "distinct_field" to ensure group features on that field.

##### Example ArcGIS Configuration
```yaml
vector_layers:
  - name: 'WBDLine'
    url: 'https://hydrowfs.nationalmap.gov/arcgis/rest/services/wbd/MapServer/0'
  - name: 'Basin'
    url: 'https://hydrowfs.nationalmap.gov/arcgis/rest/services/wbd/MapServer/3' 
  - name: 'Subbasin'
    url: 'https://hydrowfs.nationalmap.gov/arcgis/rest/services/wbd/MapServer/4'
    distinct_field: 'OBJECTID'
```
For ArcGIS providers, the specific URL for each layer must be provided.

##### Example WFS Configuration
```yaml
vector_layers:
  - name: 'foo'
    url: 'https://abc.gov/wfs/services/x'
  - name: 'bar'
    url: 'https://abc.gov/wfs/services/x' 
```

#### File Data Providers
EventKit allows users to setup geospatial files as the source for data providers.

To set up a vector or raster file provider:
1) `Service URL` must be a URL to a geospatial file.
2) `Service Type` must be set to match the type of geospatial file. The two available options are `raster-file` and `vector-file`.
3) `Data Type` must also match the type of data being provided.

##### OGC Process Configuration

An OGC API process provider can be configured through the use of YAML syntax. 
Below is a sample configuration.

```yaml
ogcapi_process:
  process: some-ogc-process
  inputs: 
    product: elevation
    file_format: gpkg
  outputs:
    archive_format: "application/zip"
  download_credentials:
    cert_info:
      cert_path: path/to/cert.p12
      cert_pass_var: CERT_PASS
```

Alternative configuration.

```yaml
ogcapi_process:
  process: another-ogc-process
  inputs: 
    product: hydro
    file_format: gpkg
  outputs:
    archive_format: "application/zip"
  download_credentials:
    user_var: SOURCE_USER
    pass_var: SOURCE_PASS
```

The *source* in `source_config` refers to the provider the bundler will fetch data from.

`GPKG` and `zip` are the only file and archive formats currently supported by the EventKit OGC provider.