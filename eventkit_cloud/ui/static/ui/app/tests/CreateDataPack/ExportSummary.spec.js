import React from 'react';
import sinon from 'sinon';
import PropTypes from 'prop-types';
import raf from 'raf';
import Joyride from 'react-joyride';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MapCard from '../../components/common/MapCard';
import { ExportSummary } from '../../components/CreateDataPack/ExportSummary';
import CustomScrollbar from '../../components/CustomScrollbar';
import CustomTableRow from '../../components/CustomTableRow';


// this polyfills requestAnimationFrame in the test browser, required for ol3
raf.polyfill();

describe('Export Summary Component', () => {
    const muiTheme = getMuiTheme();

    const getProps = () => ({
        geojson: {
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0],
                            [100.0, 1.0], [100.0, 0.0]],
                    ],
                },
            }],
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
                uid: 'ed48a7c1-1fc3-463e-93b3-e93eb3861a5a',
                url: 'http://cloud.eventkit.test/api/formats/shp',
                slug: 'shp',
                name: 'ESRI Shapefile Format',
                description: 'Esri Shapefile (OSM Schema)',
            },
            {
                uid: '978ab89c-caf7-4296-9a0c-836fc679ea07',
                url: 'http://cloud.eventkit.test/api/formats/gpkg',
                slug: 'gpkg',
                name: 'Geopackage',
                description: 'GeoPackage',
            },
        ],
        walkthroughClicked: false,
        onWalkthroughReset: () => {},
    });

    const getWrapper = (props) => {
        const config = { BASEMAP_URL: 'http://my-osm-tile-service/{z}/{x}/{y}.png' };
        return mount(<ExportSummary {...props} />, {
            context: { muiTheme, config },
            childContextTypes: {
                muiTheme: PropTypes.object,
                config: PropTypes.object,
            },
        });
    };

    it('should render the basic components', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
        expect(wrapper.find(CustomTableRow)).toHaveLength(5);
        expect(wrapper.find('#form')).toHaveLength(1);
        expect(wrapper.find('#mainHeading').text()).toEqual('Preview and Run Export');
        expect(wrapper.find('#subHeading').text()).toEqual('Please make sure all the information below is correct.');
        expect(wrapper.find('#export-information-heading').text()).toEqual('Export Information');
        expect(wrapper.find('#aoi-heading').text()).toEqual('Area of Interest (AOI)');
        expect(wrapper.find('#aoi-map')).toHaveLength(1);
        expect(wrapper.find(MapCard)).toHaveLength(1);
        expect(wrapper.find('#summaryMap')).toHaveLength(0);
        expect(wrapper.find(Joyride)).toHaveLength(1);
    });

    it('componentDidMount should setJoyRideSteps', () => {
        const props = getProps();
        const mountSpy = sinon.spy(ExportSummary.prototype, 'componentDidMount');
        const joyrideSpy = sinon.stub(ExportSummary.prototype, 'joyrideAddSteps');
        getWrapper(props);
        expect(mountSpy.calledOnce).toBe(true);
        expect(joyrideSpy.calledOnce).toBe(true);
        mountSpy.restore();
        joyrideSpy.restore();
    });

    it('joyrideAddSteps should set state for steps in tour', () => {
        const steps = [{
            title: 'Verify Information',
            text: 'Verify the information entered is correct before proceeding.',
            selector: '.qa-ExportSummary-div',
            position: 'bottom',
            style: {},
        }];
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateSpy = sinon.stub(ExportSummary.prototype, 'setState');
        wrapper.update();
        wrapper.instance().joyrideAddSteps(steps);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ steps }));
        stateSpy.restore();
    });

    it('callback function should stop tour if close is clicked', () => {
        const callbackData = {
            action: 'close',
            index: 2,
            step: {
                position: 'bottom',
                selector: '.qa-DataPackLinkButton-Button',
                style: {},
                text: 'Click here to Navigate to Create a DataPack.',
                title: 'Create DataPack',
            },
            type: 'step:before',
        };
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateSpy = sinon.stub(ExportSummary.prototype, 'setState');
        wrapper.instance().callback(callbackData);
        expect(stateSpy.calledWith({ isRunning: false }));
        stateSpy.restore();
    });
});
