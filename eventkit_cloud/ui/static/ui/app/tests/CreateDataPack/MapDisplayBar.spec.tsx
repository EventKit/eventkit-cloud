import * as React from 'react';
import sinon from 'sinon';
import { shallow } from 'enzyme';

import Feature from 'ol/feature';
import Point from 'ol/geom/point';
import Polygon from 'ol/geom/polygon';

import { MapDisplayBar } from "../../components/CreateDataPack/MapDisplayBar";
import AoiInfobar from '../../components/CreateDataPack/AoiInfobar';
import MapQueryDisplay from "../../components/CreateDataPack/MapQueryDisplay";

describe('ExportAOI component', () => {
    const geojson = {
        type: 'FeatureCollection',
        features: [{
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [
                    [
                        [100.0, 0.0],
                        [101.0, 0.0],
                        [101.0, 1.0],
                        [100.0, 1.0],
                        [100.0, 0.0],
                    ],
                ],
            },
            bbox: [100.0, 0.0, 101.0, 1.0],
        }],
    };

    const getProps = () => ({
        aoiInfo: {
            geojson: {},
            originalGeojson: {},
            geomType: null,
            title: null,
            description: null,
            selectionType: null,
        },
        setRef: sinon.spy(),
        selectedBaseMap: {},
        aoiInfoBarProps: {},
        classes: [],
        ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}) => {
        const config = {
            BASEMAP_URL: 'http://my-osm-tile-service/{z}/{x}/{y}.png',
        };
        props = { ...getProps(), ...overrides };
        wrapper = shallow(<MapDisplayBar {...props} />, {
            context: { config },
        });
        instance = wrapper.instance();
    };

    beforeEach(setup);

    afterEach(() => {
        // Restore the default sandbox here
        sinon.restore();
    });

    it('should render the basic elements', () => {
        expect(wrapper.find(AoiInfobar)).toHaveLength(1);
        expect(wrapper.find(MapQueryDisplay)).toHaveLength(1);
    });
});
