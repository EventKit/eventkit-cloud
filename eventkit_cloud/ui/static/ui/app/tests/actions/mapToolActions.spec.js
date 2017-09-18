import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import * as actions from '../../actions/mapToolActions';
import { convertGeoJSONtoJSTS } from '../../utils/mapUtils'
import types from '../../actions/mapToolActionTypes'

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('mapTool actions', () => {
    it('resetGeoJSONFile should return type FILE_RESET', () => {
        expect(actions.resetGeoJSONFile()).toEqual({
            type: 'FILE_RESET'
        });
    });

    it('processGeoJSONFile should create error if extension is not geojson ', () => {
        // Initialize mockstore with empty state
        const initialState = {}
        const store = mockStore(initialState)
        const file = new File(["<!doctype html><div>file</div>"],
            "test.shp",
            {"type": "text/html"}
        )
        // Test if your store dispatched the expected actions
        const expectedPayload = [{type: types.FILE_PROCESSING},
            {type: types.FILE_ERROR, error: 'File must be .geojson NOT .shp'}]
        store.dispatch(actions.processGeoJSONFile(file))
            .catch(() => {
                expect(store.getActions()).toEqual(expectedPayload)
            })
    });

    it('processGeoJSONFile should raise error if not a json', () => {
        // Initialize mockstore with empty state
        const initialState = {}
        const store = mockStore(initialState)
        const file = new File(["Data"],
            "test.geojson",
            {"type": "application/json"}
        )

        // Test if your store dispatched the expected actions
        const expectedPayload = [{type: types.FILE_PROCESSING},
            {type: types.FILE_ERROR, error: 'Could not parse GeoJSON'}]
        store.dispatch(actions.processGeoJSONFile(file))
            .catch(() => {
                expect(store.getActions()).toEqual(expectedPayload)
            })
    });

    it('processGeoJSONFile should add AOI to state if valid geojson', () => {
        // Initialize mockstore with empty state
        const initialState = {}
        const store = mockStore(initialState)
        const point = {"type": "Point", "coordinates": [100.0, 0.0]};
        const returnedGeom = convertGeoJSONtoJSTS(point)
        const file = new File([point],
            "test.geojson",
            {"type": "application/json"}
        )

        // Test if your store dispatched the expected actions
        const expectedPayload = [{type: types.FILE_PROCESSING},
            {type: types.FILE_PROCESSED, geom: returnedGeom}]
        store.dispatch(actions.processGeoJSONFile(file))
            .catch(() => {
                expect(store.getActions()).toEqual(expectedPayload)
            })
    });

    it('processGeoJSONFile should not add AOI to state if invalid geojson', () => {
        // Initialize mockstore with empty state
        const initialState = {}
        const store = mockStore(initialState)
        const point = {"type": "point", "coordinates": [100.0, 0.0]};
        const file = new File([point],
            "test.geojson",
            {"type": "application/json"}
        )

        // Test if your store dispatched the expected actions
        const expectedPayload = [{type: types.FILE_PROCESSING},
            {type: types.FILE_ERROR, error: 'There was an error processing the geojson file.'}]
        store.dispatch(actions.processGeoJSONFile(file))
            .catch(() => {
                expect(store.getActions()).toEqual(expectedPayload)
            })
    });

    it('processGeoJSONFile should dispatch error onerror', () => {
        // Initialize mockstore with empty state
        const initialState = {}
        const store = mockStore(initialState)
        const file = new File(['not a file'],
            "test.geojson",
            {"type": "application/json"}
        )

        // Test if your store dispatched the expected actions
        const expectedPayload = [{type: types.FILE_PROCESSING},
            {type: types.FILE_ERROR, error: 'There was an error processing the geojson file.'}]
        store.dispatch(actions.processGeoJSONFile(file))
            .catch(() => {
                expect(store.getActions()).toEqual(expectedPayload)
            })
    });
});
