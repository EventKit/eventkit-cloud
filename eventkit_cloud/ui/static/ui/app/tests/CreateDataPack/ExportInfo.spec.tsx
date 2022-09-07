import {createStore} from 'redux'
import {Provider} from 'react-redux'

import {fireEvent, render, waitFor} from "@testing-library/react";

import '@testing-library/jest-dom/extend-expect'
import sinon from "sinon";
import theme from "../../styles/eventkit_theme";
import rootReducer from "../../reducers/rootReducer";


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

jest.doMock('../../actions/providerActions.js', () => ({
    getProviders: jest.fn().mockReturnValue({ type: 'getProviders' })
}));

const {ExportInfo} = require('../../components/CreateDataPack/ExportInfo');

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
        download_date_rank: 2,
        download_count_rank: 2,
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
        download_date_rank: 3,
        download_count_rank: 3,
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
        download_date_rank: 1,
        download_count_rank: 1,
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


describe('ExportInfo component', () => {

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
            theme: theme,
            topics: [],
        }
    );

    const getInitialState = () => (
        {
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
            providers,
            projections,
            formats,
            topics: [],
        }
    );

    const renderWithRedux = (
        component,
        {initialState, store = createStore(rootReducer,initialState)}: any = {}
    ) => {
        return {
            ...render(<Provider store={store}>{component}</Provider>),
            store,
        }
    };

    const renderComponent = () => {
        const props = getProps();
        return renderWithRedux(<ExportInfo {...props} />, {initialState: getInitialState()});
    };

    it('should render without error', () => {
        renderComponent();
    });

    it('should render a form', () => {
        const component = renderComponent();

        expect(component.getByText('Enter General Information')).toBeInTheDocument();
        expect(component.getByText('Select Data Products')).toBeInTheDocument();
        expect(component.getByText('Request New Data Product')).toBeInTheDocument();
        expect(component.getByText('Select Projection')).toBeInTheDocument();
        expect(component.getByText('Share this DataPack')).toBeInTheDocument();
        expect(component.getByText('Area of Interest (AOI)')).toBeInTheDocument();
        expect(component.getByText('Selected Area of Interest')).toBeInTheDocument();
    });

    it('should have a sort / filter button', () => {
        const component = renderComponent();

        expect(component.getByText('Sort / Filter')).toBeInTheDocument();
    });

    it('should have a list of providers sorted A-Z by default', () => {
        const component = renderComponent();
        const providers = component.getAllByTestId("DataProvider");
        expect(providers.length).toBe(3);
        expect(providers[0]).toHaveTextContent('OpenStreetMap Data (Generic)');
    });

    it('should have filtering options hidden by default', () => {
        const component = renderComponent();

        expect(component.queryByText('Filter By:')).toBeNull();
        expect(component.queryByText('Raster')).toBeNull();
        expect(component.queryByText('Vector')).toBeNull();
        expect(component.queryByText('Elevation')).toBeNull();
        expect(component.queryByText('Sort By')).toBeNull();
        expect(component.queryByText('Alphabetical A-Z')).toBeNull();
        expect(component.queryByText('Alphabetical Z-A')).toBeNull();
        expect(component.queryByText('Most Downloaded')).toBeNull();
        expect(component.queryByText('Recently Downloaded')).toBeNull();
        expect(component.queryByText('Clear All')).toBeNull();
        expect(component.queryByText('Apply')).toBeNull();
        expect(component.queryByText('Cancel')).toBeNull();
    });

    it('should provide filtering options when sort / filter is clicked', () => {
        const component = renderComponent();

        const sortFilter = component.getByText('Sort / Filter');
        fireEvent.click(sortFilter);
        expect(component.getByText('Filter By:')).toBeInTheDocument();
        expect(component.getByText('Raster')).toBeInTheDocument();
        expect(component.getByText('Vector')).toBeInTheDocument();
        expect(component.getByText('Elevation')).toBeInTheDocument();
        expect(component.getByText('Sort By')).toBeInTheDocument();
        expect(component.getByText('Alphabetical A-Z')).toBeInTheDocument();
        expect(component.getByText('Alphabetical Z-A')).toBeInTheDocument();
        expect(component.getByText('Most Downloaded')).toBeInTheDocument();
        expect(component.getByText('Recently Downloaded')).toBeInTheDocument();
        expect(component.queryByText('Clear All')).toBeInTheDocument();
        expect(component.queryByText('Apply')).toBeInTheDocument();
        expect(component.queryByText('Cancel')).toBeInTheDocument();
    });

    it('should show and hide type filter content when clicked', async () => {
        const component = renderComponent();

        const sortFilter = component.getByText('Sort / Filter');
        fireEvent.click(sortFilter);
        const typeFilterComponent = component.getByText('Type(s)');
        expect(typeFilterComponent).toBeInTheDocument();

        fireEvent.click(typeFilterComponent);
        expect(component.getByText('Vector')).toBeVisible();

        fireEvent.click(typeFilterComponent);
        await waitFor(() => {
            expect(component.queryByText('Vector')).not.toBeVisible()
        })

    });

    it('should have a list of projections', () => {
        const component = renderComponent();

        const projections = component.getAllByText(/EPSG/);
        expect(projections.length).toBe(2);
    });

    it('should have a list of providers sorted Z-A after filter selected', () => {
        const component = renderComponent();

        const sortFilter = component.getByText('Sort / Filter');
        fireEvent.click(sortFilter);
        const radioButton = component.getByTestId('alphabetical-z-a');
        fireEvent.click(radioButton);
        const providers = component.getAllByTestId('DataProvider');
        expect(providers[0]).toHaveTextContent('USGS');
    });

    it('should have a list of providers sorted most downloaded', () => {
        const component = renderComponent();

        const sortFilter = component.getByText('Sort / Filter');
        fireEvent.click(sortFilter);
        const radioButton = component.getByTestId('most-downloaded');
        fireEvent.click(radioButton);
        const providers = component.getAllByTestId('DataProvider');
        expect(providers[0]).toHaveTextContent('Ports');
    });

    it('should have a list of providers sorted recently downloaded', () => {
        const component = renderComponent();

        const sortFilter = component.getByText('Sort / Filter');
        fireEvent.click(sortFilter);
        const radioButton = component.getByTestId('most-recent');
        fireEvent.click(radioButton);
        const providers = component.getAllByTestId('DataProvider');
        expect(providers[0]).toHaveTextContent('Ports');
    });

    it('should show only the providers that match the name filter', () => {
        const component = renderComponent();

        const sortFilter = component.getByText('Sort / Filter');
        fireEvent.click(sortFilter);
        const textField = component.getByTestId('filter-text-field') as HTMLInputElement;
        fireEvent.change(textField, {target: {value: 'Open'}})
        const providers = component.getAllByTestId('DataProvider');
        expect(providers).toHaveLength(1);
        expect(providers[0]).toHaveTextContent('OpenStreetMap Data (Generic)');
    });


    it('should display the correct checked value of a projection checkbox', () => {
        const component = renderComponent();

        const projectionCheckbox = component.getByRole('checkbox', {name: /EPSG:3857/});
        fireEvent.click(projectionCheckbox);
        expect(projectionCheckbox).toBeChecked();
        fireEvent.click(projectionCheckbox);
        expect(projectionCheckbox).not.toBeChecked();
    });

    it('should remove a filter when the user clicks the x on the filter chip', () => {
        const component = renderComponent();

        const sortFilter = component.getByText('Sort / Filter');
        fireEvent.click(sortFilter);
        const rasterFilter = component.getByText('Raster');

        // Select the raster filter and close the dialog so that the filter chips show up.
        fireEvent.click(rasterFilter);
        fireEvent.click(sortFilter);

        expect(component.queryByText("Raster")).toBeInTheDocument();

        const rasterFilterChip = component.container.querySelector('.MuiChip-deleteIcon');
        fireEvent.click(rasterFilterChip);

        expect(component.queryByText("Raster")).toBeNull();
    });

    it('should close the filter section when you click apply', () => {
        const component = renderComponent();

        const sortFilter = component.getByText('Sort / Filter');
        fireEvent.click(sortFilter);
        expect(component.queryByText('Filter By:')).toBeInTheDocument();

        const applyFilterButton = component.queryByText('Apply');
        fireEvent.click(applyFilterButton);

        expect(component.queryByText('Filter By:')).toBeNull();
    });

    it('should close the filter section and clear filters when you click cancel', async () => {
        const component = renderComponent();

        let providers = component.queryAllByTestId('DataProvider');
        expect(providers.length).toBe(3);

        const sortFilter = component.getByText('Sort / Filter');
        fireEvent.click(sortFilter);
        expect(component.queryByText('Filter By:')).toBeInTheDocument();

        const checkBox = component.getByLabelText('Raster');
        fireEvent.click(checkBox);
        expect(checkBox).toBeChecked();

        providers = component.queryAllByTestId('DataProvider');
        expect(providers.length).toBe(1);

        const cancelFilterButton = component.queryByText('Cancel');
        fireEvent.click(cancelFilterButton);

        expect(component.queryByText('Filter By:')).toBeNull();
        providers = component.getAllByTestId('DataProvider');
        expect(providers.length).toBe(3);
    });
});
