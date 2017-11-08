import React from 'react';
import sinon from 'sinon';
import raf from 'raf';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import injectTapEventPlugin from 'react-tap-event-plugin';
import { Card, CardHeader, CardText } from 'material-ui/Card';

import Map from 'ol/map';
import View from 'ol/view';
import interaction from 'ol/interaction';
import VectorSource from 'ol/source/vector';
import XYZ from 'ol/source/xyz';
import GeoJSON from 'ol/format/geojson';
import VectorLayer from 'ol/layer/vector';
import Tile from 'ol/layer/tile';
import ScaleLine from 'ol/control/scaleline';
import Attribution from 'ol/control/attribution';
import Zoom from 'ol/control/zoom';

import { ExportSummary } from '../../components/CreateDataPack/ExportSummary';
import CustomScrollbar from '../../components/CustomScrollbar';


// this polyfills requestAnimationFrame in the test browser, required for ol3
raf.polyfill();

describe('Export Summary Component', () => {
    const muiTheme = getMuiTheme();
    injectTapEventPlugin();
    const getProps = () => {
        return {
            geojson: { 
                "type": "FeatureCollection",
                "features": [{ "type": "Feature",
                    "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0],
                        [100.0, 1.0], [100.0, 0.0] ]
                        ]
                    },}]
            },
            exportName: 'name',
            datapackDescription: 'description',
            projectName: 'project',
            makePublic: true,
            providers: [
                { name: 'one', uid: 1, display: true }, 
                { name: 'two', uid: 2, display: false }, 
                { name: 'three', uid: 3, display: false },
            ],
            areaStr: '12 sq km',
            formats: 'gpkg',
            allFormats: [
                {
                    "uid": "ed48a7c1-1fc3-463e-93b3-e93eb3861a5a",
                    "url": "http://cloud.eventkit.dev/api/formats/shp",
                    "slug": "shp",
                    "name": "ESRI Shapefile Format",
                    "description": "Esri Shapefile (OSM Schema)"
                },
                {
                    "uid": "978ab89c-caf7-4296-9a0c-836fc679ea07",
                    "url": "http://cloud.eventkit.dev/api/formats/gpkg",
                    "slug": "gpkg",
                    "name": "Geopackage",
                    "description": "GeoPackage"
                },
            ],
        }
    }

    const getWrapper = (props) => {
        const config = { BASEMAP_URL: 'http://my-osm-tile-service/{z}/{x}/{y}.png' };        
        return mount(<ExportSummary {...props} />, {
            context: { muiTheme, config },
            childContextTypes: {
                muiTheme: React.PropTypes.object,
                config: React.PropTypes.object,
            },
        });
    }

    it('should render the basic components', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
        expect(wrapper.find('#form')).toHaveLength(1);
        expect(wrapper.find('#mainHeading').text()).toEqual('Preview and Run Export');
        expect(wrapper.find('#subHeading').text()).toEqual('Please make sure all the information below is correct.');
        expect(wrapper.find('#export-information-heading').text()).toEqual('Export Information');
        expect(wrapper.find('#name').find('td').first().text()).toEqual('Name');
        expect(wrapper.find('#name').find('td').last().text()).toEqual('name');
        expect(wrapper.find('#description').find('td').first().text()).toEqual('Description');
        expect(wrapper.find('#description').find('td').last().text()).toEqual('description');
        expect(wrapper.find('#project').find('td').first().text()).toEqual('Project / Category');
        expect(wrapper.find('#project').find('td').last().text()).toEqual('project');
        expect(wrapper.find('#published').find('td').first().text()).toEqual('Published');
        expect(wrapper.find('#published').find('td').last().text()).toEqual('true');
        expect(wrapper.find('#formats').find('td').first().text()).toEqual('File Formats');
        expect(wrapper.find('#formats').find('td').last().text()).toEqual('Geopackage');
        expect(wrapper.find('#layers').find('td').first().text()).toEqual('Layer Data');
        expect(wrapper.find('#layers').find('td').last().text()).toEqual('one');
        expect(wrapper.find('#aoi-heading').text()).toEqual('Area of Interest (AOI)');
        expect(wrapper.find('#aoi-area').find('td').first().text()).toEqual('Area');
        expect(wrapper.find('#aoi-area').find('td').last().text()).toEqual('12 sq km');
        expect(wrapper.find('#aoi-map')).toHaveLength(1);
        expect(wrapper.find(Card)).toHaveLength(1);
        expect(wrapper.find(CardHeader)).toHaveLength(1);
        expect(wrapper.find(CardHeader).text()).toEqual('Selected Area of Interest');
        expect(wrapper.find(CardText)).toHaveLength(0);
        expect(wrapper.find('#summaryMap')).toHaveLength(0);
    });

    it('should call initializeOpenLayers  when card is expanded', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        wrapper.instance().initializeOpenLayers = sinon.spy();
        expect(wrapper.instance().initializeOpenLayers.called).toBe(false);
        wrapper.setState({ expanded: true });
        expect(wrapper.instance().initializeOpenLayers.calledOnce).toBe(true);
        wrapper.setState({ expanded: false });
        expect(wrapper.instance().initializeOpenLayers.calledOnce).toBe(true);
    });

    it('expandedChange should call setState', () => {
        const props = getProps();
        const stateSpy = sinon.spy(ExportSummary.prototype, 'setState');
        const wrapper = getWrapper(props);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().expandedChange(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ expanded: true })).toBe(true);
        stateSpy.restore();
    });

    it('initializeOpenLayers should read a geojson and display it on the map', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const readerSpy = sinon.spy(GeoJSON.prototype, 'readFeatures');
        const addFeatSpy = sinon.spy(VectorSource.prototype, 'addFeatures');
        const addLayerSpy = sinon.spy(Map.prototype, 'addLayer');
        const getViewSpy = sinon.spy(Map.prototype, 'getView');
        const getExtentSpy = sinon.spy(VectorSource.prototype, 'getExtent');
        const getSizeSpy = sinon.spy(Map.prototype, 'getSize');
        wrapper.instance().initializeOpenLayers();
        expect(readerSpy.calledOnce).toBe(true);
        expect(addFeatSpy.calledOnce).toBe(true);
        expect(addLayerSpy.calledOnce).toBe(true);
        expect(getViewSpy.calledTwice).toBe(true);
        expect(getExtentSpy.calledOnce).toBe(true);
        expect(getSizeSpy.calledOnce).toBe(true);
    });
});
