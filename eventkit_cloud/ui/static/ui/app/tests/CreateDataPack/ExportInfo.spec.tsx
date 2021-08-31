import * as React from 'react';
import {createStore} from 'redux'
import {Provider} from 'react-redux'
import {ExportInfo} from '../../components/CreateDataPack/ExportInfo';
import {fireEvent, render} from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect'
import sinon from "sinon";
import theme from "../../styles/eventkit_theme";
import rootReducer from "../../reducers/rootReducer";

jest.mock("../../components/common/CustomTableRow", () => {
    const React = require('react');
    return (props) => (<div className="row">{props.children}</div>);
});

jest.mock("../../components/common/MapCard", () => {
    const React = require('react');
    return (props) => (<div className="mapcard">{props.children}</div>);
});

jest.mock("../../components/common/CustomTextField", () => {
    const React = require('react');
    return (props) => (<div className="textField">{props.children}</div>);
});

jest.mock("../../components/CreateDataPack/DataProvider", () => {
    const React = require('react');
    return (children) => (<div className="provider" data-testid="DataProvider">{children.provider.name}</div>);
});

jest.mock("../../components/CreateDataPack/RequestDataSource", () => {
    const React = require('react');
    return (props) => (<div id="dataSource-dialog">{props.open.toString()}</div>);
});

const formats = [
    {
        uid: 'ed48a7c1-1fc3-463e-93b3-e93eb3861a5a',
        url: 'http://cloud.eventkit.test/api/formats/shp',
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
        url: 'http://cloud.eventkit.test/api/formats/gpkg',
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
const providers = [
    {
        display: true,
        id: 1,
        model_url: 'http://cloud.eventkit.test/api/providers/1',
        type: 'osm-generic',
        created_at: '2017-03-24T17:44:22.940611Z',
        updated_at: '2017-03-24T17:44:22.940629Z',
        uid: 'be401b02-63d3-4080-943a-0093c1b5a914',
        name: 'OpenStreetMap Data (Generic)',
        slug: 'osm-generic',
        preview_url: '',
        service_copyright: '',
        service_description: '',
        layer: null,
        level_from: 0,
        level_to: 10,
        export_provider_type: 1,
    },
    {
        display: true,
        id: 2,
        model_url: 'http://cloud.eventkit.test/api/providers/2',
        type: 'usgs',
        created_at: '2021-03-24T17:44:22.940611Z',
        updated_at: '2021-03-24T17:44:22.940629Z',
        uid: 'be401b02-63d3-4080-943a-0093c1b5a914',
        name: 'USGS',
        slug: 'usgs',
        preview_url: '',
        service_copyright: '',
        service_description: '',
        layer: null,
        level_from: 0,
        level_to: 10,
        export_provider_type: 1,
    }
];

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
                providers: [{slug: 'osm'}],
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
                providers: [{slug: 'osm'}],
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
        }
    );

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
        return renderWithRedux(<ExportInfo {...props} />, {initialState: getInitialState()});
    };

    it('should render without error', () => {
        renderComponent();
    });

    it('should render a form', () => {
        const component = renderComponent();

        expect(component.getByText('Enter General Information')).toBeInTheDocument();
        expect(component.getByText('Select Data Sources')).toBeInTheDocument();
        expect(component.getByText('Request New Data Source')).toBeInTheDocument();
        expect(component.getByText('Select Projection')).toBeInTheDocument();
        expect(component.getByText('Share this DataPack')).toBeInTheDocument();
        expect(component.getByText('Area of Interest (AOI)')).toBeInTheDocument();
        expect(component.getByText('Selected Area of Interest')).toBeInTheDocument();
    });

    it('should have a search button', () => {
        const component = renderComponent();

        expect(component.getByText('Search')).toBeInTheDocument();
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

        expect(component.queryByText('Filter By')).toBeNull();
        expect(component.queryByText('Raster')).toBeNull();
        expect(component.queryByText('Vector')).toBeNull();
        expect(component.queryByText('Elevation')).toBeNull();
        expect(component.queryByText('Sort By')).toBeNull();
        expect(component.queryByText('Alphabetical A-Z')).toBeNull();
        expect(component.queryByText('Alphabetical Z-A')).toBeNull();
        expect(component.queryByText('Clear All')).toBeNull();
        expect(component.queryByText('Apply')).toBeNull();
        expect(component.queryByText('Cancel')).toBeNull();
    });

    it('should provide filtering options when sort / filter is clicked', () => {
        const component = renderComponent();

        const sortFilter = component.getByText('Sort / Filter');
        fireEvent.click(sortFilter);
        expect(component.getByText('Filter By')).toBeInTheDocument();
        expect(component.getByText('Raster')).toBeInTheDocument();
        expect(component.getByText('Vector')).toBeInTheDocument();
        expect(component.getByText('Elevation')).toBeInTheDocument();
        expect(component.getByText('Sort By')).toBeInTheDocument();
        expect(component.getByText('Alphabetical A-Z')).toBeInTheDocument();
        expect(component.getByText('Alphabetical Z-A')).toBeInTheDocument();
        expect(component.queryByText('Clear All')).toBeInTheDocument();
        expect(component.queryByText('Apply')).toBeInTheDocument();
        expect(component.queryByText('Cancel')).toBeInTheDocument();
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
        expect(component.queryByText('Filter By')).toBeInTheDocument();

        const applyFilterButton = component.queryByText('Apply');
        fireEvent.click(applyFilterButton);

        expect(component.queryByText('Filter By')).toBeNull();
    });

    it('should close the filter section and clear filters when you click cancel', () => {
        const component = renderComponent();

        const sortFilter = component.getByText('Sort / Filter');
        fireEvent.click(sortFilter);
        expect(component.queryByText('Filter By')).toBeInTheDocument();

        const rasterFilter = component.getByText('Raster');
        fireEvent.click(rasterFilter);
        let providers = component.getAllByTestId('DataProvider');
        expect(providers.length).toBe(1);

        const applyFilterButton = component.queryByText('Cancel');
        fireEvent.click(applyFilterButton);

        expect(component.queryByText('Filter By')).toBeNull();
        providers = component.getAllByTestId('DataProvider');
        expect(providers.length).toBe(3);
    });

});

