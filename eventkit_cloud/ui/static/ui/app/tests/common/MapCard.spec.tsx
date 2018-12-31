import * as React from 'react';
import * as sinon from 'sinon';
import { shallow } from 'enzyme';
import Map from 'ol/map';
import View from 'ol/view';
import interaction from 'ol/interaction';
import VectorSource from 'ol/source/vector';
import GeoJSON from 'ol/format/geojson';
import { MapCard } from '../../components/common/MapCard';

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
        wrapper = shallow(<MapCard {...props} />, {
            context: { config: { BASEMAP_URL: '', BASEMAP_COPYRIGHT: '' } },
        });
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should init map when update to open:true', () => {
        const updateSpy = sinon.spy(instance, 'componentDidUpdate');
        const initStub = sinon.stub(instance, 'initializeOpenLayers');

        wrapper.setState({ open: true });
        wrapper.update();

        expect(updateSpy.calledOnce).toBe(true);
        expect(initStub.calledOnce).toBe(true);

        updateSpy.restore();
        initStub.restore();
    });

    it('should clear map when update to open:false', () => {
        wrapper.setState({ open: true });
        const updateSpy = sinon.spy(instance, 'componentDidUpdate');
        const stub = sinon.stub();
        const mapStub = { setTarget: stub };

        instance.map = mapStub;
        wrapper.setState({ open: false });
        wrapper.update();

        expect(updateSpy.calledOnce).toBe(true);
        expect(stub.calledOnce).toBe(true);
        expect(instance.map).toBe(null);

        updateSpy.restore();
    });

    it('handleExpand should negate the open state', () => {
        const expected = !instance.state.open;
        const stateSpy = sinon.spy(instance, 'setState');
        instance.handleExpand();
        expect(stateSpy.calledOnce).toBe(true);
        expect(instance.state.open).toBe(expected);
        stateSpy.restore();
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
