import * as React from 'react';
import {mount} from 'enzyme';
import Drawer from '@material-ui/core/Drawer';
import {MapDrawer, VerticalTabs} from "../../components/CreateDataPack/MapDrawer";
import CustomScrollbar from "../../components/common/CustomScrollbar";
import Tab from "@material-ui/core/Tab";
import ListItem from '@material-ui/core/ListItem';
import Radio from "@material-ui/core/Radio";
import Checkbox from '@material-ui/core/Checkbox';
import axios from "axios"
import MockAdapter from "axios-mock-adapter";
import { act } from "react-test-renderer"

jest.mock("../../components/CreateDataPack/RequestDataSource", () => {
    const React = require('react');
    return (props) => (<div id="dataSource-dialog">{props.open.toString()}</div>);
});

jest.mock("../../components/CreateDataPack/MapDrawerOptions", () => {
    const React = require('react');
    return (props) => {
        props.setProviders(props.providers);
        return (
            <div id="mapdraweroptions">options</div>
        );
    }
});
jest.mock('../../styles/eventkit_theme.js', () => ({
        eventkit: {
            images: {},
            colors: {}
        }
    })
);

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
            preview_url: 'url/path/1',
            the_geom: {
                type: "MultiPolygon",
                coordinates: [
                    [
                        [
                            [-111, 45], [-103, 45], [-104, 41], [-111, 41], [-111, 45]
                        ]
                    ]
                ]
            }
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
            preview_url: 'url/path/2',
            the_geom: null
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
            the_geom: {
                type: "MultiPolygon",
                coordinates: [
                    [
                        [
                            [20, 35], [45, 20], [30, 5], [10, 10], [10, 30], [20, 35]
                        ],
                        [
                            [30, 20], [20, 25], [20, 15], [30, 20]
                        ]
                    ]
                ]
            }
        },
    ];

    const sources = [
        {
            url: '/url/path/1',
            name: 'source a',
            type: 'type a',
            thumbnail_url: '/thumbnail/url/path/1',
            footprint_url: '/thumbnail/url/path/1'
        },
        {
            url: '/url/path/2',
            name: 'source b',
            type: 'type b',
            thumbnail_url: '/thumbnail/url/path/2',
            footprint_url: '/thumbnail/url/path/2'
        }
    ];

    const coverages = [
        {
            features: [],
            provider: {
                slug: 'osm',
            }
        },
        {
            features: [],
            provider: {
                slug: 'osm5',
            }
        },
    ]

    const wait = async () => new Promise((resolve) => setTimeout(resolve, 0))
    const addCoverageGeosSpy = jest.fn()
    const removeCoverageGeosSpy = jest.fn()
    const updateBaseMapSpy = jest.fn()
    const getProps = () => ({
        providers,
        updateBaseMap: updateBaseMapSpy,
        addCoverageGeos: addCoverageGeosSpy,
        removeCoverageGeos: removeCoverageGeosSpy,
        classes: {},
        ...(global as any).eventkit_test_props
    });

    let props;
    let wrapper;
    let instance;
    let axiosMock;
    const setup = (overrides = {}) => {
        props = {...getProps(), ...overrides};
        wrapper = mount(<MapDrawer {...props} />);
        instance = wrapper.instance();
    };

    beforeAll(() => {
        axiosMock = new MockAdapter(axios)
    })

    afterEach(() => {
        axiosMock.reset();
    });

    beforeEach(setup);

    // TESTS FOR OVERALL COMPONENT FUNCTIONALITY

    it('tab should have appropriate values', () => {
        // The drawer opens and closes based on the selected tab value, these need to stay in sync.
        expect(wrapper.find(Tab).at(0).props().value).toBe('basemap');
        expect(wrapper.find(Tab).at(1).props().value).toBe('coverage');
    });

    it('should start with the basemap drawer closed', () => {
        // The drawer opens and closes based on the selected tab value, these need to stay in sync.
        expect(wrapper.find(Drawer).get(0).props.open).toBe(false);
    });

    // TESTS FOR BASEMAP TAB FUNCTIONALITY

    it('should render all the basic components', () => {
        // open/render the basemap tab first
        wrapper.find(Tab).at(0).simulate('click');
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
        expect(wrapper.find(VerticalTabs)).toHaveLength(1);
        expect(wrapper.find(Tab)).toHaveLength(2);
        expect(wrapper.find(Drawer)).toHaveLength(1);
        // Of the 3 providers, only one should be displayed
        // BaseMaps are only added when a preview_url exists AND the provider should be displayed.
        expect(wrapper.find(ListItem)).toHaveLength(1);
        expect(wrapper.find('#dataSource-dialog')).toHaveLength(1);
    });

    it('should start with the data source dialog closed', () => {
        act(() => wrapper.update());
        // open/render the basemap tab first
        wrapper.find(Tab).at(0).simulate('click');
        expect(wrapper.find('#dataSource-dialog').html()).toContain('false');
    });

    it('should call updateBaseMap function when source checkbox is clicked', () => {
        // open/render the basemap tab first
        wrapper.find(Tab).at(0).simulate('click');
        wrapper.find(Radio).at(0).simulate('click', { target: {checked: true}});
        expect(wrapper.find(Radio).at(0).props().checked).toBe(true);
        expect(updateBaseMapSpy).toHaveBeenCalledTimes(1);
    });
    // TESTS FOR COVERAGE TAB FUNCTIONALITY

    it('should render all the basic components', () => {
        // open/render the coverage tab first
        wrapper.find(Tab).at(1).simulate('click');
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
        expect(wrapper.find(VerticalTabs)).toHaveLength(1);
        expect(wrapper.find(Tab)).toHaveLength(2);
        expect(wrapper.find(Drawer)).toHaveLength(1);
        // Of the 3 providers, 2 should be displayed
        // Coverages are only added when 'the_geom' exists AND the provider should be displayed.
        expect(wrapper.find(ListItem)).toHaveLength(2);
        expect(wrapper.find('#dataSource-dialog')).toHaveLength(1);
    });

    it('should start with the data source dialog closed', () => {
        act(() => wrapper.update());
        // open/render the coverage tab first
        wrapper.find(Tab).at(1).simulate('click');
        expect(wrapper.find('#dataSource-dialog').html()).toContain('false');
    });

    it('should call addCoverageGeos when coverage checked', async () => {
        // open/render the coverage tab first
        wrapper.find(Tab).at(1).simulate('click');
        await act(async () => {
            wrapper.find(Checkbox).at(0).simulate('click', {target: {checked: true}});
            await wait()
        })

        expect(addCoverageGeosSpy).toHaveBeenCalledTimes(1);
    });

    it('should call removeCoverageGeos when coverage unchecked', () => {
        // open/render the coverage tab first
        wrapper.find(Tab).at(1).simulate('click');
        wrapper.find(Checkbox).at(0).simulate('click', { target: {checked: true}});
        wrapper.find(Checkbox).at(0).simulate('click', { target: {checked: false}});
        expect(wrapper.find(Checkbox).at(0).props().value).toBe(coverages[0].provider.slug);
        expect(wrapper.find(Checkbox).at(0).props().checked).toBe(false);
        expect(removeCoverageGeosSpy).toHaveBeenCalledTimes(1);
    });

});