import * as sinon from 'sinon';
import Joyride from 'react-joyride';
import { shallow } from 'enzyme';
import MapCard from '../../components/common/MapCard';
import { ExportSummary } from '../../components/CreateDataPack/ExportSummary';
import CustomScrollbar from '../../components/common/CustomScrollbar';
import CustomTableRow from '../../components/common/CustomTableRow';

describe('Export Summary Component', () => {
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
            { name: 'one', uid: 1, display: true, slug: 'one', type: 'wmts', supported_formats: ['gpkg'] },
            { name: 'two', uid: 2, display: false, slug: 'two', type: 'wmts', supported_formats: ['gpkg'] },
            { name: 'three', uid: 3, display: false, slug: 'three', type: 'wmts', supported_formats: ['gpkg'] },
        ],
        areaStr: '12 sq km',
        exportOptions: {
            'one': { minZoom: 0, maxZoom: 2, formats: ['gpkg']},
            'two': {formats: ['shp']},
        },
        formats: [
            {
                uid: 'ed48a7c1-1fc3-463e-93b3-e93eb3861a5a',
                slug: 'shp',
                name: 'ESRI Shapefile Format',
                description: 'Esri Shapefile (OSM Schema)',
            },
            {
                uid: '978ab89c-caf7-4296-9a0c-836fc679ea07',
                slug: 'gpkg',
                name: 'Geopackage',
                description: 'GeoPackage',
            },
        ] as Eventkit.Format[],
        walkthroughClicked: false,
        onWalkthroughReset: sinon.spy(),
        projections: [{srid: 4326, name: 'EPSG:4326'}],
        selectedProjections: [4326],
        ...(global as any).eventkit_test_props,
        classes: {},
    });

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}) => {
        const config = { BASEMAP_URL: 'http://my-osm-tile-service/{z}/{x}/{y}.png' };
        props = { ...getProps(), ...overrides };
        wrapper = shallow(<ExportSummary {...props} />, {
            context: { config },
        });
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render the basic components', () => {
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
        expect(wrapper.find(CustomTableRow)).toHaveLength(6);
        expect(wrapper.find('#form')).toHaveLength(1);
        expect(wrapper.find('#mainHeading').text()).toEqual('Preview and Run Export');
        expect(wrapper.find('#subHeading').text()).toEqual('Please make sure all the information below is correct.');
        // expect(wrapper.find('#export-information-heading').text()).toEqual('Export Information');
        expect(wrapper.find('#aoi-heading').text()).toEqual('Area of Interest (AOI)');
        expect(wrapper.find('#aoi-map')).toHaveLength(1);
        expect(wrapper.find(MapCard)).toHaveLength(1);
        expect(wrapper.find('#summaryMap')).toHaveLength(0);

    });

    it('componentDidMount should setJoyRideSteps', () => {
        const joyrideSpy = sinon.stub(ExportSummary.prototype, 'joyrideAddSteps');
        setup();
        expect(joyrideSpy.calledOnce).toBe(true);
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
        const stateSpy = sinon.stub(instance, 'setState');
        wrapper.update();
        instance.joyrideAddSteps(steps);
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
        instance.joyride = { reset: sinon.spy() };
        const stateSpy = sinon.stub(instance, 'setState');
        instance.callback(callbackData);
        expect(stateSpy.calledWith({ isRunning: false }));
        stateSpy.restore();
    });
});
