import * as React from 'react';
import * as sinon from 'sinon';
import { shallow } from 'enzyme';
import Map from 'ol/map';
import View from 'ol/view';
import interaction from 'ol/interaction';
import VectorSource from 'ol/source/vector';
import GeoJSON from 'ol/format/geojson';
import { MapView } from '../../components/common/MapView';

const geojson = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'Polygon',
                coordinates: [
                    [
                        [
                            74.5445966720581,
                            13.991124041151021,
                        ],
                        [
                            74.55532550811768,
                            13.991124041151021,
                        ],
                        [
                            74.55532550811768,
                            14.001575991473446,
                        ],
                        [
                            74.5445966720581,
                            14.001575991473446,
                        ],
                        [
                            74.5445966720581,
                            13.991124041151021,
                        ],
                    ],
                ],
            },
        },
    ],
};

describe('MapCard component', () => {
    let wrapper;
    let instance;

    const defaultProps = () => (
        {
            geojson,
            children: <span>Hello</span>,
            ...(global as any).eventkit_test_props,
        }
    );

    const setup = (propsOverride = {}) => {
        const props = {
            ...defaultProps(),
            ...propsOverride,
        };
        wrapper = shallow(<MapView {...props} />, {
            context: { config: { BASEMAP_URL: '', BASEMAP_COPYRIGHT: '' } },
        });
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should clear map when unmounted', () => {
        wrapper.setState({ open: true });
        const stub = sinon.stub();
        const mapStub = { setTarget: stub };

        instance.map = mapStub;
        wrapper.setState({ open: false });
        wrapper.unmount();

        expect(stub.calledOnce).toBe(true);
        expect(instance.map).toBe(null);
    });

    it('initializeOpenLayers should create a map and add layer', () => {
        const defaultSpy = sinon.spy(interaction, 'defaults');
        const readSpy = sinon.spy(GeoJSON.prototype, 'readFeatures');
        const addFeatureSpy = sinon.spy(VectorSource.prototype, 'addFeatures');
        const addLayerSpy = sinon.spy(Map.prototype, 'addLayer');
        const getViewSpy = sinon.spy(Map.prototype, 'getView');
        const getSizeSpy = sinon.spy(Map.prototype, 'getSize');
        const fitSpy = sinon.spy(View.prototype, 'fit');
        instance.initializeOpenLayers();
        expect(defaultSpy.calledOnce).toBe(true);
        expect(readSpy.calledOnce).toBe(true);
        expect(addFeatureSpy.calledOnce).toBe(true);
        expect(addLayerSpy.calledOnce).toBe(true);
        expect(getViewSpy.calledTwice).toBe(true);
        expect(fitSpy.calledOnce).toBe(true);
        expect(getSizeSpy.calledOnce).toBe(true);
    });
});
