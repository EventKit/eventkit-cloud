import * as actions from '../actions/exportsActions'
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import nock from 'nock'
const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

describe('export actions', () => {
    let bbox = [-180, -90, 180, 90];

    let geojson = { "type": "FeatureCollection",
        "features": [
        { "type": "Feature",
            "geometry": {
            "type": "Polygon",
            "coordinates": [
                [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0],
                [100.0, 1.0], [100.0, 0.0] ]
                ]
            },
            }
        ]
        };
    let mode = "DRAW_MODE_NORMAL";

    it('updateBbox should return passed in bbox', () => {
        expect(actions.updateBbox(bbox)).toEqual({
            type: 'UPDATE_BBOX',
            bbox: bbox
        });
    });

    it('updateAoiInfo should return passed in json', () => {
        expect(actions.updateAoiInfo(geojson, 'Polygon', 'title', 'description')).toEqual({
            type: 'UPDATE_AOI_INFO',
            geojson: geojson,
            geomType: 'Polygon',
            title: 'title',
            description: 'description',
        });
    });

    it('clearAoiInfo should return type CLEAR_AOI_INFO and no action', () => {
        expect(actions.clearAoiInfo()).toEqual({
            type: 'CLEAR_AOI_INFO',
        });
    });

    it('updateMode should return the passed in mode string', () => {
        expect(actions.updateMode(mode)).toEqual({
            type: 'SET_MODE',
            mode: mode
        });
    });

    it('closeDrawer should return type CLOSE_DRAWER', () => {
        expect(actions.closeDrawer()).toEqual({
            type: 'CLOSE_DRAWER'
        });
    });

    it('openDrawer should return type OPEN_DRAWER', () => {
        expect(actions.openDrawer()).toEqual({
            type: 'OPEN_DRAWER'
        });
    });
});

