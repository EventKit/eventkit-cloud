import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import PropTypes from 'prop-types';
import raf from 'raf';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import View from 'ol/view';
import GeoJSON from 'ol/format/geojson';
import Feature from 'ol/feature';
import DataPackAoiInfo from '../../components/StatusDownloadPage/DataPackAoiInfo';

// this polyfills requestAnimationFrame in the test browser, required for ol3
raf.polyfill();

describe('DataPackAoiInfo component', () => {
    const muiTheme = getMuiTheme();

    const didMount = DataPackAoiInfo.prototype.componentDidMount;

    beforeAll(() => {
        DataPackAoiInfo.prototype.componentDidMount = sinon.spy();
    });

    afterAll(() => {
        DataPackAoiInfo.prototype.componentDidMount = didMount;
    });

    const getProps = () => (
        {
            extent: { type: 'FeatureCollection', features: [] },
        }
    );

    const getWrapper = props => (
        mount(<DataPackAoiInfo {...props} />, {
            context: {
                muiTheme,
                config: {
                    BASEMAP_URL: 'http://my-osm-tile-service/{z}/{x}/{y}.png',
                    BASEMAP_COPYRIGHT: 'my copyright',
                },
            },
            childContextTypes: {
                muiTheme: PropTypes.object,
            },
        })
    );

    it('should render elements', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-DataPackAoiInfo-div-map')).toHaveLength(1);
    });

    it('should call initializeOpenLayers set on mount', () => {
        const props = getProps();
        const initStub = sinon.stub(DataPackAoiInfo.prototype, 'initializeOpenLayers');
        DataPackAoiInfo.prototype.componentDidMount = didMount;
        getWrapper(props);
        expect(initStub.calledOnce).toBe(true);
        initStub.restore();
        DataPackAoiInfo.prototype.componentDidMount = sinon.spy();
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
