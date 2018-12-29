import * as React from 'react';
import * as sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import View from 'ol/view';
import GeoJSON from 'ol/format/geojson';
import Feature from 'ol/feature';
import { DataPackAoiInfo } from '../../components/StatusDownloadPage/DataPackAoiInfo';

describe('DataPackAoiInfo component', () => {
    let shallow;

    let mount;
    beforeAll(() => {
        shallow = createShallow();
        mount = sinon.stub(DataPackAoiInfo.prototype, 'componentDidMount');
    });

    afterAll(() => {
        mount.restore();
    });

    const getProps = () => (
        {
            extent: { type: 'FeatureCollection', features: [] },
            ...(global as any).eventkit_test_props,
        }
    );

    const getWrapper = props => (
        shallow(<DataPackAoiInfo {...props} />, {
            context: {
                config: {
                    BASEMAP_URL: 'http://my-osm-tile-service/{z}/{x}/{y}.png',
                    BASEMAP_COPYRIGHT: 'my copyright',
                },
            },
        })
    );

    it('should render elements', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-DataPackAoiInfo-div-map')).toHaveLength(1);
    });

    it('should call initializeOpenLayers set on shallow', () => {
        const props = getProps();
        const initStub = sinon.stub(DataPackAoiInfo.prototype, 'initializeOpenLayers');
        mount.restore();
        getWrapper(props);
        expect(initStub.calledOnce).toBe(true);
        initStub.restore();
        mount = sinon.stub(DataPackAoiInfo.prototype, 'componentDidMount');
    });

    it('initializeOpenLayers should construct a map and add it to the DOM', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const fakeFeatures = [new Feature()];
        const readStub = sinon.stub(GeoJSON.prototype, 'readFeatures').returns(fakeFeatures);
        const fitStub = sinon.stub(View.prototype, 'fit').returns();
        wrapper.instance().initializeOpenLayers();
        readStub.restore();
        fitStub.restore();
    });
});
