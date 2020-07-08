import * as React from 'react';
import * as sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import {MapView} from "../../components/common/MapView";
import { DataPackAoiInfo } from '../../components/StatusDownloadPage/DataPackAoiInfo';

describe('DataPackAoiInfo component', () => {
    let shallow;

    let mount;
    beforeAll(() => {
        shallow = createShallow();
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
        expect(wrapper.find(MapView)).toHaveLength(1);
    });
});
