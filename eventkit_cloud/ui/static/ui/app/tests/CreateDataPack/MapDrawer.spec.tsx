import {act} from "react-test-renderer"
import {createStore} from 'redux'
import {Provider} from 'react-redux'
import {fireEvent, render, screen} from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect'
import rootReducer from "../../reducers/rootReducer";

jest.doMock("../../components/CreateDataPack/RequestDataSource", () => {
    return (props) => (<div id="dataSource-dialog">{props.open.toString()}</div>);
});

jest.doMock("../../components/CreateDataPack/MapDrawerOptions", () => {
    return (props) => {
        props.setProviders(props.providers);
        return (
            <div id="mapdraweroptions">options</div>
        );
    }
});

jest.doMock('../../styles/eventkit_theme.js', () => ({
        eventkit: {
            images: {},
            colors: {}
        }
    })
);

const {MapDrawer} = require("../../components/CreateDataPack/MapDrawer");

describe('FilterDrawer component', () => {


    const providers = {
        objects: [
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
        ],
        fetching: false,
    };

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


    const getInitialState = () => ({providers,});

    const renderWithRedux = (
        component,
        {initialState, store = createStore(rootReducer, initialState)}: any = {}
    ) => {
        return {
            ...render(<Provider store={store}>{component}</Provider>),
            store,
        }
    };

    const renderComponent = () => {
        const props = getProps();
        return renderWithRedux(<MapDrawer {...props} />, {initialState: getInitialState()});
    };

    // TESTS FOR OVERALL COMPONENT FUNCTIONALITY

    it('should render without error', () => {
        renderComponent();
    });

    it('should start with the basemap drawer closed', () => {
        const component = renderComponent();

        // The drawer opens and closes based on the selected tab value, these need to stay in sync.
        expect(component.queryByText('Basemaps')).toBeNull();
    });


    // TESTS FOR BASEMAP TAB FUNCTIONALITY

    it('should render all the basic components', () => {
        const component = renderComponent();

        // open/render the basemap tab first
        const basemapTab = component.getByTitle('Basemap') as HTMLInputElement;
        fireEvent.click(basemapTab)

        expect(component.getAllByTestId('map-drawer')).toHaveLength(1);
        expect(component.getAllByTestId('vertical-tab')).toHaveLength(1);
        expect(component.getAllByRole('tab')).toHaveLength(2);
        // Of the 3 providers, only one should be displayed
        // BaseMaps are only added when a preview_url exists AND the provider should be displayed.
        expect(component.getAllByRole('listitem')).toHaveLength(1);
    });


    it('should start with the data product dialog closed', () => {
        const component = renderComponent();
        // open/render the basemap tab first
        const basemapTab = component.getByTitle('Basemap')
        fireEvent.click(basemapTab)
        expect(screen.queryByTitle('Request New Data Product')).not.toBeInTheDocument();
    });

    it('should call updateBaseMap function when source checkbox is clicked', () => {
        // open/render the basemap tab first
        const component = renderComponent();
        // open/render the basemap tab first
        const basemapTab = component.getByTitle('Basemap')
        fireEvent.click(basemapTab)
        const radioBtn = component.getByRole('radio')
        expect(radioBtn).not.toBeChecked();
        fireEvent.click(radioBtn)
        expect(radioBtn).toBeChecked();
        expect(updateBaseMapSpy).toHaveBeenCalledTimes(1);
    });

    // TESTS FOR COVERAGE TAB FUNCTIONALITY

    it('should render all the basic components', () => {
        const component = renderComponent();

        // open/render the coverage tab first
        const coverageTab = component.getByTitle('Coverage') as HTMLInputElement;
        fireEvent.click(coverageTab)

        expect(component.getAllByTestId('custom-scrollbar')).toHaveLength(1);
        expect(component.getAllByTestId('vertical-tab')).toHaveLength(1);
        expect(component.getAllByRole('tab')).toHaveLength(2);
        expect(component.getAllByTestId('map-drawer')).toHaveLength(1);
        // Of the 3 providers, 2 should be displayed
        // Coverages are only added when 'the_geom' exists AND the provider should be displayed.
        expect(component.getAllByRole('listitem')).toHaveLength(2);
    });

    it('should start with the data product dialog closed', () => {
        const component = renderComponent();
        // open/render the coverage tab first
        const coverageTab = component.getByTitle('Coverage')
        fireEvent.click(coverageTab)
        expect(screen.queryByTitle('Request New Data Product')).not.toBeInTheDocument();
    });

    it('should call addCoverageGeos when coverage checked', async () => {
        const component = renderComponent();
        // open/render the coverage tab first
        const coverageTab = component.getByTitle('Coverage')
        fireEvent.click(coverageTab)

        const coverageCheckbox = component.getAllByRole('checkbox')[0] as HTMLInputElement
        await act(async () => {
            fireEvent.click(coverageCheckbox)
            await wait()
        })

        expect(coverageCheckbox).toBeChecked();
        expect(addCoverageGeosSpy).toHaveBeenCalledTimes(1);
    });

    it('should call addCoverageGeos when coverage checked', async () => {
        const component = renderComponent();
        // open/render the coverage tab first
        const coverageTab = component.getByTitle('Coverage')
        fireEvent.click(coverageTab)

        const coverageCheckbox = component.getAllByRole('checkbox')[0] as HTMLInputElement
        await act(async () => {
            fireEvent.click(coverageCheckbox)
            await wait()
            fireEvent.click(coverageCheckbox)
            await wait()
        })

        expect(coverageCheckbox.value).toBe(coverages[0].provider.slug);
        expect(coverageCheckbox).not.toBeChecked();
        expect(removeCoverageGeosSpy).toHaveBeenCalledTimes(1);
    });
});
