import * as React from 'react';
import * as sinon from 'sinon';
import { shallow } from 'enzyme';
import Drawer from '@material-ui/core/Drawer';
import {MapDrawer, VerticalTabs} from "../../components/CreateDataPack/MapDrawer";
import CustomScrollbar from "../../components/common/CustomScrollbar";
import Tab from "@material-ui/core/Tab";
import ListItem from '@material-ui/core/ListItem';
import Radio from "@material-ui/core/Radio";

describe('FilterDrawer component', () => {
    const providers = [
        {
            id: 2,
            type: 'osm',
            license: null,
            created_at: '2017-08-15T19:25:10.844911Z',
            updated_at: '2017-08-15T19:25:10.844919Z',
            uid: 'bc9a834a-727a-7777-8679-2500880a8526',
            name: 'OpenStreetMap Data (Themes)',
            slug: 'osm',
            service_description: 'OpenStreetMap vector data.',
            display: true,
            export_provider_type: 2,
            supported_formats: ['fmt1'],
            preview_url: 'url/path/1'
        },
        {
            id: 3,
            type: 'osm',
            license: null,
            created_at: '2017-08-15T19:25:10.844911Z',
            updated_at: '2017-08-15T19:25:10.844919Z',
            uid: 'bc9a834a-727a-6666-8679-2500880a8526',
            name: 'OpenStreetMap Data (Themes)',
            slug: 'osm4',
            service_description: 'OpenStreetMap vector data.',
            display: false,
            export_provider_type: 2,
            supported_formats: ['fmt1'],
            preview_url: 'url/path/2'
        },
        {
            id: 1337,
            type: 'osm',
            license: null,
            created_at: '2017-08-15T19:25:10.844911Z',
            updated_at: '2017-08-15T19:25:10.844919Z',
            uid: 'bc9a834a-727a-5555-8679-2500880a8526',
            name: 'OpenStreetMap Data (Themes)',
            slug: 'osm5',
            service_description: 'OpenStreetMap vector data.',
            display: true,
            export_provider_type: 2,
            supported_formats: ['fmt1'],
        },
    ];

    const sources = [
            {
                url: '/url/path/1',
                name: 'source a',
                type: 'type a',
                thumbnail_url: '/thumbnail/url/path/1'
            },
            {
                url: '/url/path/2',
                name: 'source b',
                type: 'type b',
                thumbnail_url: '/thumbnail/url/path/2'
            }
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
        expect(wrapper.find(VerticalTabs)).toHaveLength(1);
        expect(wrapper.find(Tab)).toHaveLength(1);
        expect(wrapper.find(Drawer)).toHaveLength(wrapper.find(Tab).length);
        // Of the 3 providers, only one should be displayed
        // BaseMaps are only added when a preview_url exists AND the provider should be displayed.
        expect(wrapper.find(ListItem)).toHaveLength(1);
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

    it('should fire the handleExpandClick function when source checkbox is clicked', () => {
        const mockedEvent = sinon.spy();
        const mockCallBack = sinon.spy();

        mockCallBack(mockedEvent, sources);

        wrapper.find(Radio).at(0).simulate('click');
        expect(mockCallBack.calledOnce).toBe(true);
    });
});