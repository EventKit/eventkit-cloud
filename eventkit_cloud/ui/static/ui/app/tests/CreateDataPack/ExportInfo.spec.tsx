import {screen, fireEvent, waitFor} from "@testing-library/react";

import '@testing-library/jest-dom/extend-expect';
import sinon from "sinon";
import axios from "axios";
import * as TestUtils from '../test-utils';
import MockAdapter from 'axios-mock-adapter';


jest.doMock("../../components/common/CustomTableRow", () => {
    return (props) => (<div className="row">{props.children}</div>);
});

jest.doMock("../../components/common/MapCard", () => {
    return (props) => (<div className="mapcard">{props.children}</div>);
});

jest.doMock("../../components/common/CustomTextField", () => {
    return (props) => (<div className="textField">{props.children}</div>);
});

jest.doMock("../../components/CreateDataPack/DataProvider", () => {
    return (children) => (<div className="provider" data-testid="DataProvider">{children.provider.name}</div>);
});

jest.doMock("../../components/CreateDataPack/RequestDataSource", () => {
    return (props) => (<div id="dataSource-dialog">{props.open.toString()}</div>);
});

import ExportInfo from '../../components/CreateDataPack/ExportInfo';

const formats = [
    {
        uid: 'ed48a7c1-1fc3-463e-93b3-e93eb3861a5a',
        url: 'http://host.docker.internal/api/formats/shp',
        slug: 'shp',
        name: 'ESRI Shapefile Format',
        description: 'Esri Shapefile (OSM Schema)',
        supported_projections: [
            {
                uid: "350fede7-4912-47b0-9164-d2c5e56723ed",
                name: "World Geodetic System 1984 (WGS84)",
                srid: 4326,
                description: null
            },
            {
                uid: "2202a4c5-df9b-49a2-ad43-970bea209f03",
                name: "WGS 84 / Pseudo-Mercator",
                srid: 3857,
                description: null
            }
        ]
    },
    {
        uid: '978ab89c-caf7-4296-9a0c-836fc679ea07',
        url: 'http://host.docker.internal/api/formats/gpkg',
        slug: 'gpkg',
        name: 'Geopackage',
        description: 'GeoPackage',
        supported_projections: [
            {
                uid: "350fede7-4912-47b0-9164-d2c5e56723ed",
                name: "World Geodetic System 1984 (WGS84)",
                srid: 4326,
                description: null
            },
            {
                uid: "2202a4c5-df9b-49a2-ad43-970bea209f03",
                name: "WGS 84 / Pseudo-Mercator",
                srid: 3857,
                description: null
            }
        ]
    }];
const projections = [
    {
        srid: 4326,
        name: 'EPSG:4326',
        description: null,
    },
    {
        srid: 3857,
        name: 'EPSG:3857',
        description: null,
    }
];
const providerList = [
    {
        display: true,
        id: 1,
        model_url: 'http://host.docker.internal/api/providers/1',
        data_type: 'osm-generic',
        created_at: '2017-03-24T17:44:22.940611Z',
        updated_at: '2017-03-24T17:44:22.940629Z',
        uid: 'be401b02-63d3-4080-943a-0093c1b5a914',
        name: 'OpenStreetMap Data (Generic)',
        slug: 'osm-generic',
        preview_url: '',
        service_copyright: '',
        service_description: '',
        layer: null,
        hidden: false,
        latest_download: 2,
        download_count: 2,
        level_from: 0,
        level_to: 10,
        export_provider_type: 1,
    },
    {
        display: true,
        id: 2,
        model_url: 'http://host.docker.internal/api/providers/2',
        data_type: 'raster',
        created_at: '2021-03-24T17:44:22.940611Z',
        updated_at: '2021-03-24T17:44:22.940629Z',
        uid: 'be401b02-63d3-4080-943a-0093c1b5a914',
        name: 'USGS',
        slug: 'usgs',
        latest_download: 3,
        download_count: 1,
        preview_url: '',
        service_copyright: '',
        service_description: '',
        layer: null,
        hidden: false,
        level_from: 0,
        level_to: 10,
        export_provider_type: 1,
    },
    {
        display: true,
        id: 3,
        model_url: 'http://host.docker.internal/api/providers/3',
        data_type: 'vector',
        created_at: '2021-03-24T17:44:22.940611Z',
        updated_at: '2021-03-24T17:44:22.940629Z',
        uid: 'ce401b02-63d3-4080-943a-0093c1b5a915',
        name: 'Ports',
        slug: 'ports',
        latest_download: 1,
        download_count: 3,
        preview_url: '',
        service_copyright: '',
        service_description: '',
        layer: null,
        hidden: false,
        level_from: 0,
        level_to: 10,
        export_provider_type: 1,
    }
]

const providers = {
    objects: providerList,
    fetching: false,
};

const user = {
    data: 'admin',
        meta: {
        autoLogoutAt: null,
            autoLogoutWarningAt: null,
    },
    status: {
        patched: false,
        patching: false,
        error: null,
        isLoading: false,
    },
};

describe('ExportInfo screen', () => {
    const getProps = () => (
        {
            geojson: {
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
                }],
            },
            exportInfo: {
                exportName: '',
                datapackDescription: '',
                projectName: '',
                providers: [],
                providerInfo: {
                    'osm': {
                        availability: {
                            status: 'STAT'
                        },
                    }
                },
                exportOptions: {
                    '123': {
                        minZoom: 0,
                        maxZoom: 2,
                    }
                },
                projections: [],
            },
            providers,
            projections,
            formats,
            user,
            nextEnabled: true,
            walkthroughClicked: false,
            onWalkthroughReset: sinon.spy(),
            handlePrev: sinon.spy(),
            updateExportInfo: sinon.spy(),
            onUpdateEstimate: sinon.spy(),
            setNextDisabled: sinon.spy(),
            setNextEnabled: sinon.spy(),
            checkProvider: sinon.spy(),
            ...(global as any).eventkit_test_props,
            classes: {},
            topics: [],
        }
    );

    const getInitialState = (defaultState) => (
        {
            ...defaultState,
            aoiInfo: {
                geojson: {},
            },
            exportInfo: {
                exportName: '',
                datapackDescription: '',
                projectName: '',
                providers: [],
                providerInfo: {
                    'osm': {
                        availability: {
                            status: 'STAT'
                        },
                    }
                },
                exportOptions: {
                    '123': {
                        minZoom: 0,
                        maxZoom: 2,
                    }
                },
                projections: [],
            },
            user,
            providers,
            projections,
            formats,
            topics: [],
        }
    );

    let mockAxios;
    beforeAll(() => {
        mockAxios = new MockAdapter(axios);
    });
    beforeEach(() => {
        mockAxios.onGet('/api/providers').reply(200, providerList);
        mockAxios.onPost('/api/providers/filter').reply(200, providerList);
    });
    afterEach(() => {
        mockAxios.reset();
    });

    it('should render without error', () => {
        const defaultState = TestUtils.getDefaultTestState();
        const initialState = getInitialState(defaultState);
        TestUtils.renderComponent(<ExportInfo {...getProps()} />, {
            initialState
        });
    });

    it('should render and display toast when providers fail', async () => {
        mockAxios.reset();
        mockAxios.onGet('/api/providers').reply(500,null);
        const defaultState = TestUtils.getDefaultTestState();
        const initialState = getInitialState(defaultState);
        TestUtils.renderComponent(<ExportInfo {...getProps()} />, {
            initialState
        });
        jest.runOnlyPendingTimers();
        expect(await screen.findByText("Data Provider(s) failed to load")).toBeInTheDocument();
    });

    it('should render a form', () => {
        const defaultState = TestUtils.getDefaultTestState();
        const initialState = getInitialState(defaultState);
        TestUtils.renderComponent(<ExportInfo {...getProps()} />, {
            initialState
        });

        expect(screen.getByText('Enter General Information')).toBeInTheDocument();
        expect(screen.getByText('Select Data Products')).toBeInTheDocument();
        expect(screen.getByText('Request New Data Product')).toBeInTheDocument();
        expect(screen.getByText('Select Projection')).toBeInTheDocument();
        expect(screen.getByText('Share this DataPack')).toBeInTheDocument();
        expect(screen.getByText('Area of Interest (AOI)')).toBeInTheDocument();
        expect(screen.getByText('Selected Area of Interest')).toBeInTheDocument();
    });

    it('should have a sort / filter button', () => {
        const defaultState = TestUtils.getDefaultTestState();
        const initialState = getInitialState(defaultState);
        TestUtils.renderComponent(<ExportInfo {...getProps()} />, {
            initialState
        });

        expect(screen.getByText('Sort / Filter')).toBeInTheDocument();
    });

    it('should have a list of providers sorted A-Z by default', async () => {
        const defaultState = TestUtils.getDefaultTestState();
        const initialState = getInitialState(defaultState);
        TestUtils.renderComponent(<ExportInfo {...getProps()} />, {
            initialState
        });
        const providers = await screen.findAllByTestId("DataProvider");
        expect(providers.length).toBe(3);
        expect(providers[0]).toHaveTextContent('OpenStreetMap Data (Generic)');
    });

    it('should have filtering options hidden by default', () => {
        const defaultState = TestUtils.getDefaultTestState();
        const initialState = getInitialState(defaultState);
        TestUtils.renderComponent(<ExportInfo {...getProps()} />, {
            initialState
        });

        expect(screen.queryByText('Filter By:')).toBeNull();
        expect(screen.queryByText('Raster')).toBeNull();
        expect(screen.queryByText('Vector')).toBeNull();
        expect(screen.queryByText('Elevation')).toBeNull();
        expect(screen.queryByText('Sort By:')).toBeNull();
        expect(screen.queryByText('Alphabetical A-Z')).toBeNull();
        expect(screen.queryByText('Alphabetical Z-A')).toBeNull();
        expect(screen.queryByTestId('most-downloaded')).toBeNull();
        expect(screen.queryByTestId('most-recent')).toBeNull();
        expect(screen.queryByText('Clear All')).toBeNull();
        expect(screen.queryByText('Apply')).toBeNull();
        expect(screen.queryByText('Cancel')).toBeNull();
    });

    it('should provide filtering options when sort / filter is clicked', () => {
        const defaultState = TestUtils.getDefaultTestState();
        const initialState = getInitialState(defaultState);
        TestUtils.renderComponent(<ExportInfo {...getProps()} />, {
            initialState
        });

        const sortFilter = screen.getByText('Sort / Filter');
        fireEvent.click(sortFilter);
        expect(screen.getByText('Filter By:')).toBeInTheDocument();
        expect(screen.getByText('Raster')).toBeInTheDocument();
        expect(screen.getByText('Vector')).toBeInTheDocument();
        expect(screen.getByText('Elevation')).toBeInTheDocument();
        expect(screen.getByText('Sort By:')).toBeInTheDocument();
        expect(screen.getByText('Alphabetical A-Z')).toBeInTheDocument();
        expect(screen.getByText('Alphabetical Z-A')).toBeInTheDocument();
        expect(screen.getByTestId('most-downloaded')).toBeInTheDocument();
        expect(screen.getByTestId('most-recent')).toBeInTheDocument();
        expect(screen.queryByText('Clear All')).toBeInTheDocument();
        expect(screen.queryByText('Apply')).toBeInTheDocument();
        expect(screen.queryByText('Cancel')).toBeInTheDocument();
    });

    it('should show and hide type filter content when clicked', async () => {
        const defaultState = TestUtils.getDefaultTestState();
        const initialState = getInitialState(defaultState);
        TestUtils.renderComponent(<ExportInfo {...getProps()} />, {
            initialState
        });

        const sortFilter = screen.getByText('Sort / Filter');
        fireEvent.click(sortFilter);
        const typeFilterComponent = screen.getByText('Type(s)');
        expect(typeFilterComponent).toBeInTheDocument();

        fireEvent.click(typeFilterComponent);
        expect(screen.getByText('Vector')).toBeVisible();

        fireEvent.click(typeFilterComponent);
        await waitFor(() => {
            expect(screen.queryByText('Vector')).not.toBeVisible()
        })

    });

    it('should have a list of projections', () => {
        const defaultState = TestUtils.getDefaultTestState();
        const initialState = getInitialState(defaultState);
        TestUtils.renderComponent(<ExportInfo {...getProps()} />, {
            initialState
        });

        const projections = screen.getAllByText(/EPSG/);
        expect(projections.length).toBe(2);
    });

    it('should have a list of providers sorted Z-A after filter selected', async () => {
        const defaultState = TestUtils.getDefaultTestState();
        const initialState = getInitialState(defaultState);
        TestUtils.renderComponent(<ExportInfo {...getProps()} />, {
            initialState
        });

        const sortFilter = screen.getByText('Sort / Filter');
        fireEvent.click(sortFilter);
        const radioButton = screen.getByTestId('alphabetical-z-a');
        fireEvent.click(radioButton);
        const providers = await screen.findAllByTestId("DataProvider");
        expect(providers[0]).toHaveTextContent('USGS');
    });

    it('should have a list of providers sorted most downloaded', async () => {
        const defaultState = TestUtils.getDefaultTestState();
        const initialState = getInitialState(defaultState);
        TestUtils.renderComponent(<ExportInfo {...getProps()} />, {
            initialState
        });

        const sortFilter = screen.getByText('Sort / Filter');
        fireEvent.click(sortFilter);
        const radioButton = screen.getByTestId('most-downloaded');
        fireEvent.click(radioButton);

        const providers = await screen.findAllByTestId("DataProvider");
        expect(providers[0]).toHaveTextContent('Ports');
    });

    it('should have a list of providers sorted recently downloaded', async () => {
        const defaultState = TestUtils.getDefaultTestState();
        const initialState = getInitialState(defaultState);
        TestUtils.renderComponent(<ExportInfo {...getProps()} />, {
            initialState
        });

        const sortFilter = screen.getByText('Sort / Filter');
        fireEvent.click(sortFilter);
        const radioButton = screen.getByTestId('most-recent');
        fireEvent.click(radioButton);

        const providers = await screen.findAllByTestId("DataProvider");
        expect(providers[0]).toHaveTextContent('Ports');
    });

    it('should show only the providers that match the name filter', async () => {
        const defaultState = TestUtils.getDefaultTestState();
        const initialState = getInitialState(defaultState);
        TestUtils.renderComponent(<ExportInfo {...getProps()} />, {
            initialState
        });

        const sortFilter = screen.getByText('Sort / Filter');
        fireEvent.click(sortFilter);
        const textField = screen.getByTestId('filter-text-field') as HTMLInputElement;
        fireEvent.change(textField, {target: {value: 'Open'}})

        const providers = await screen.findAllByTestId("DataProvider");
        expect(providers).toHaveLength(1);
        expect(providers[0]).toHaveTextContent('OpenStreetMap Data (Generic)');
    });


    it('should display the correct checked value of a projection checkbox', () => {
        const defaultState = TestUtils.getDefaultTestState();
        const initialState = getInitialState(defaultState);
        TestUtils.renderComponent(<ExportInfo {...getProps()} />, {
            initialState
        });

        const projectionCheckbox = screen.getByRole('checkbox', {name: /EPSG:3857/});
        fireEvent.click(projectionCheckbox);
        expect(projectionCheckbox).toBeChecked();
        fireEvent.click(projectionCheckbox);
        expect(projectionCheckbox).not.toBeChecked();
    });

    it('should remove a filter when the user clicks the x on the filter chip', () => {
        const defaultState = TestUtils.getDefaultTestState();
        const initialState = getInitialState(defaultState);
        const component = TestUtils.renderComponent(<ExportInfo {...getProps()} />, {
            initialState
        });

        const sortFilter = screen.getByText('Sort / Filter');
        fireEvent.click(sortFilter);
        const rasterFilter = screen.getByText('Raster');

        // Select the raster filter and close the dialog so that the filter chips show up.
        fireEvent.click(rasterFilter);
        fireEvent.click(sortFilter);

        // Capitalization of (Type) is done via text-transform css, and doesn't appear applied in tests
        expect(screen.queryByText("type: Raster")).toBeInTheDocument();

        const rasterFilterChip = component.container.querySelector('.MuiChip-deleteIcon');
        fireEvent.click(rasterFilterChip);

        expect(screen.queryByText("type: Raster")).toBeNull();
    });

    it('should close the filter section when you click apply', () => {
        const defaultState = TestUtils.getDefaultTestState();
        const initialState = getInitialState(defaultState);
        TestUtils.renderComponent(<ExportInfo {...getProps()} />, {
            initialState
        });

        const sortFilter = screen.getByText('Sort / Filter');
        fireEvent.click(sortFilter);
        expect(screen.queryByText('Filter By:')).toBeInTheDocument();

        const applyFilterButton = screen.queryByText('Apply');
        fireEvent.click(applyFilterButton);

        expect(screen.queryByText('Filter By:')).toBeNull();
    });

    it('should close the filter section and clear filters when you click cancel', async () => {
        const defaultState = TestUtils.getDefaultTestState();
        const initialState = getInitialState(defaultState);
        TestUtils.renderComponent(<ExportInfo {...getProps()} />, {
            initialState
        });


        let providers = await screen.findAllByTestId("DataProvider");
        expect(providers.length).toBe(3);

        const sortFilter = screen.getByText('Sort / Filter');
        fireEvent.click(sortFilter);
        expect(screen.queryByText('Filter By:')).toBeInTheDocument();

        const checkBox = screen.getByLabelText('Raster');
        fireEvent.click(checkBox);
        expect(checkBox).toBeChecked();

        providers = await screen.findAllByTestId('DataProvider');
        expect(providers.length).toBe(1);

        const cancelFilterButton = screen.queryByText('Cancel');
        fireEvent.click(cancelFilterButton);

        expect(screen.queryByText('Filter By:')).toBeNull();
        providers = await screen.findAllByTestId('DataProvider');
        expect(providers.length).toBe(3);
    });
});
