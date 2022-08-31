import * as sinon from 'sinon';
import { Provider } from "react-redux";
import theme from "../../styles/eventkit_theme";
import rootReducer from "../../reducers/rootReducer";
import {createStore} from "redux";
import {render} from "@testing-library/react";

jest.doMock("../../components/CreateDataPack/ProviderStatusCheck", () => {
    return (props) => (<div className="qa-ProviderStatusIcon">{props.children}</div>);
});

jest.doMock("../../components/Dialog/BaseDialog", () => {
    return (props) => (<div className="dialog">{props.children}</div>);
});

jest.doMock("../../components/CreateDataPack/FormatSelector", () => {
    return (props) => (<div className="format-selector"/>);
});

jest.doMock( "../../components/CreateDataPack/context/JobValidation", () => ({
    useJobValidationContext: jest.fn().mockReturnValue({ providerLimits: [], dataSizeInfo: {}, aoiArea: 0, aoiBboxArea: 0 })
}));

jest.doMock("../../components/MapTools/ProviderPreviewMap", () => {
    return (props) => (<div className="preview-map"/>);
})

import { DataProvider } from '../../components/CreateDataPack/DataProvider';

const formats = [
    {
        uid: 'ed48a7c1-1fc3-463e-93b3-e93eb3861a5a',
        url: 'http://host.docker.internal/api/formats/shp',
        slug: 'shp',
        name: 'ESRI Shapefile Format',
        description: 'Esri Shapefile (OSM Schema)',
    },
    {
        uid: '978ab89c-caf7-4296-9a0c-836fc679ea07',
        url: 'http://host.docker.internal/api/formats/gpkg',
        slug: 'gpkg',
        name: 'Geopackage',
        description: 'GeoPackage',
    },
    {
        uid: '',
        url: 'http://host.docker.internal/api/formats/no3857',
        slug: 'no3857',
        name: 'No 3857',
        description: 'Format not supporting 3857',
    }];

describe('DataProvider component', () => {
    let wrapper;

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
            providers: [],
            projections: [],
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

    const renderComponent = (propsOverride = {}) => {
        const props = {
        ...defaultProps(),
        ...propsOverride
        };
        wrapper = renderWithRedux(<DataProvider {...props} />, {initialState: getInitialState()});
    };

    const defaultProps = () => ({
        provider: {
            uid: '123',
            slug: 'slug',
            name: 'test provider',
            max_selection: '10000',
            type: 'wmts',
            service_description: 'test description',
            license: {
                text: 'test license text',
                name: 'test license',
            },
            supported_formats: formats,
            favorite: false,
        },
        exportInfo: {
            exportOptions: {123: {minZoom: 0, maxZoom: 1, formats: ['gpkg']}}
        },
        providerInfo: {
            availability: {},
            estimates: {}
        },
        providerOptions: {minZoom: 0, maxZoom: 1, formats: ['gpkg']},
        selectedProjections: [4326],
        incompatibilityInfo: {
            formats: {
                gpkg: {
                    projections: [],
                },
                shp: {
                    projections: [],
                },
                no3857: {
                    projections: [3857],
                }
            }
        },
        checked: false,
        onChange: sinon.spy(),
        alt: false,
        classes: {},
        setRef: sinon.spy(),
        theme: theme,
        ...(global as any).eventkit_test_props,
    });

    beforeEach(renderComponent);

    describe('it handles providers correctly', () => {

        it('it renders ZoomLevelSlider when type is valid', () => {
            const {container} = wrapper;
            expect(container.getElementsByClassName('qa-DataProvider-ListItem-zoomSelection')).toHaveLength(1);
            expect(container.getElementsByClassName('qa-DataProvider-ListItem-zoomMap')).toHaveLength(1);
        });

        it('it renders zoom not supported message when type invalid', () => {
            const provider = {
                uid: '123',
                name: 'test provider',
                max_selection: '10000',
                type: 'osm',
                service_description: 'test description',
                license: {
                    text: 'test license text',
                    name: 'test license',
                },
                supported_formats: formats,
            };
            renderComponent({provider});
            const {container} = wrapper;
            expect(container.getElementsByClassName('qa-DataProvider-ListItem-zoomSelection')).toHaveLength(0);
        });

        it( 'renders provider with favorite icon', () => {
            expect(wrapper.getAllByTestId('NotFavorite')).toHaveLength(1)
        })

        it( 'renders provider with filled favorite icon', () => {
            const provider = {
                uid: '123',
                name: 'test provider',
                max_selection: '10000',
                type: 'osm',
                service_description: 'test description',
                license: {
                    text: 'test license text',
                    name: 'test license',
                },
                supported_formats: formats,
                favorite: true,
            };
            renderComponent({provider});
            expect(wrapper.getAllByTestId('Favorite')).toHaveLength(1)
        })
    });
});
