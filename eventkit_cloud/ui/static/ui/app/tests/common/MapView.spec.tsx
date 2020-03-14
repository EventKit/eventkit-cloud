import * as React from 'react';
import * as sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import Map from 'ol/map';
import View from 'ol/view';
import interaction from 'ol/interaction';
import VectorSource from 'ol/source/vector';
import GeoJSON from 'ol/format/geojson';
import { MapView } from '../../components/common/MapView';
import OlMapComponent from "../../components/MapTools/OpenLayers/OlMapComponent";

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
            selectedBaseMap: '',
            children: <span>Hello</span>,
            ...(global as any).eventkit_test_props,
        }
    );

    const setup = (propsOverride = {}) => {
        const props = {
            ...defaultProps(),
            ...propsOverride,
        };
        wrapper = mount(<MapView {...props} />, {
            context: { config: { BASEMAP_URL: '', BASEMAP_COPYRIGHT: '' } },
        });
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should clear map when unmounted', () => {
        expect(wrapper.find(OlMapComponent)).toHaveLength(1);
    });
});
