import * as React from 'react';
import * as sinon from 'sinon';
import {shallow} from 'enzyme';
import Drawer from '@material-ui/core/Drawer';
import {BaseMapSource, MapDrawer} from "../../components/CreateDataPack/MapDrawer";
import CustomScrollbar from "../../components/CustomScrollbar";
import {Tabs} from "@material-ui/core";
import Tab from "@material-ui/core/Tab";
import Checkbox from "@material-ui/core/Checkbox";

describe('FilterDrawer component', () => {
    const providers = [
        {
            id: 2,
            type: 'osm',
            license: null,
            created_at: '2017-08-15T19:25:10.844911Z',
            updated_at: '2017-08-15T19:25:10.844919Z',
            uid: 'bc9a834a-727a-4779-8679-2500880a8526',
            name: 'OpenStreetMap Data (Themes)',
            slug: 'osm',
            service_description: 'OpenStreetMap vector data.',
            display: true,
            export_provider_type: 2,
            supported_formats: ['fmt1'],
        },
    ];
    const getProps = () => ({
        providers,
        updateBaseMap: (mapUrl: string) => {
        },
        classes: {},
        ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}) => {
        props = {...getProps(), ...overrides};
        wrapper = shallow(<MapDrawer {...props} />);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render all the basic components', () => {
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
        expect(wrapper.find(Tabs)).toHaveLength(1);
        expect(wrapper.find(Tab)).toHaveLength(1);
        expect(wrapper.find(Drawer)).toHaveLength(wrapper.find(Tab).length);
    });

    it('tab should have appropriate values', () => {
        // The drawer opens and closes based on the selected tab value, these need to stay in sync.
        wrapper.find(Tab).forEach(node => {
            expect(node.props().value).toBe("basemap");
        });
    });

    it('Basemap drawer should start closed', () => {
        // The drawer opens and closes based on the selected tab value, these need to stay in sync.
        expect(wrapper.find(Drawer).get(0).props.open).toBe(false);
    });
});
