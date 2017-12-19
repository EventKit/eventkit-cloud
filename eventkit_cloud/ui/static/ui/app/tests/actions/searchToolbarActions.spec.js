import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import * as actions from '../../actions/searchToolbarActions'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

describe('async searchToolbar actions', () => {

    const geocode = {
        features: [{
                bbox: [105.731049, 20.935789, 105.933609, 21.092829],
                geometry: "some_geom",
                properties: {
                    name: "Hanoi"
                }
            },
            {
                bbox: null,
                properties: {
                    name: "Hanoi"
                }
            },
        ]
    };

    const reverse = {
        "geocoding": {
            "version": "0.2",
            "attribution": "/v1/attribution",
            "query": {
                "size": 10,
                "private": false,
                "point.lat": 38.85243997515966,
                "point.lon": -77.3381869614356,
                "boundary.circle.radius": 1,
                "boundary.circle.lat": 38.85243997515966,
                "boundary.circle.lon": -77.3381869614356,
                "lang": {
                    "name": "English",
                    "iso6391": "en",
                    "iso6393": "eng",
                    "defaulted": false
                },
                "querySize": 20
            },
            "engine": {
                "name": "Pelias",
                "author": "Mapzen",
                "version": "1.0"
            },
            "timestamp": 1513700451220
        },
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [-77.338077,
                    38.852504
                ]
            },
            "properties": {
                "id": "polyline:20813648",
                "gid": "openstreetmap:street:polyline:20813648",
                "layer": "street",
                "source": "openstreetmap",
                "source_id": "polyline:20813648",
                "name": "Waples Mill Road",
                "street": "Waples Mill Road",
                "confidence": 0.8,
                "distance": 0.012,
                "accuracy": "centroid",
                "country": "United States",
                "country_gid": "whosonfirst:country:85633793",
                "country_a": "USA",
                "region": "Virginia",
                "region_gid": "whosonfirst:region:85688747",
                "region_a": "VA",
                "county": "Fairfax County",
                "county_gid": "whosonfirst:county:102084863",
                "locality": "Fair Oaks",
                "locality_gid": "whosonfirst:locality:101729805",
                "label": "Waples Mill Road, Fair Oaks, VA, USA"
            },
            "bbox": [-77.338166,
                38.851097, -77.3378,
                38.8539
            ]
        }],
        "bbox": [-77.349717,
            38.833671, -77.335663,
            38.85403
        ]
    };
    const convert = {
        "geometry": {
            "type": "Point",
            "coordinates": [-77.3381869614356,
                38.85243997515966
            ]
        },
        "type": "Feature",
        "properties": {
            "to": "decdeg",
            "from": "mgrs",
            "name": "18S TJ 97100 03002"
        }
    };


    const expectedGeocodeData = [{
        bbox: [105.731049, 20.935789, 105.933609, 21.092829],
        name: "Hanoi",
        geometry: "some_geom",
        properties: {
            name: "Hanoi"
        }
    }]

    const expectedConvertData = [{
        "from": "mgrs",
        "geometry": {
            "coordinates": [-77.3381869614356, 38.85243997515966],
            "type": "Point"
        },
        "name": "18S TJ 97100 03002",
        "properties": {
            "bbox": [-77.3881869614356, 38.802439975159665, -77.2881869614356, 38.90243997515966],
            "from": "mgrs",
            "name": "18S TJ 97100 03002",
            "to": "decdeg"
        },
        "source": "MGRS",
        "to": "decdeg",
        "type": "Feature"
    }, {
        "accuracy": "centroid",
        "bbox": [-77.338166, 38.851097, -77.3378, 38.8539],
        "confidence": 0.8,
        "country": "United States",
        "country_a": "USA",
        "country_gid": "whosonfirst:country:85633793",
        "county": "Fairfax County",
        "county_gid": "whosonfirst:county:102084863",
        "distance": 0.012,
        "geometry": {
            "coordinates": [-77.338077, 38.852504],
            "type": "Point"
        },
        "gid": "openstreetmap:street:polyline:20813648",
        "id": "polyline:20813648",
        "label": "Waples Mill Road, Fair Oaks, VA, USA",
        "layer": "street",
        "locality": "Fair Oaks",
        "locality_gid": "whosonfirst:locality:101729805",
        "name": "Waples Mill Road",
        "properties": {
            "accuracy": "centroid",
            "confidence": 0.8,
            "country": "United States",
            "country_a": "USA",
            "country_gid": "whosonfirst:country:85633793",
            "county": "Fairfax County",
            "county_gid": "whosonfirst:county:102084863",
            "distance": 0.012,
            "gid": "openstreetmap:street:polyline:20813648",
            "id": "polyline:20813648",
            "label": "Waples Mill Road, Fair Oaks, VA, USA",
            "layer": "street",
            "locality": "Fair Oaks",
            "locality_gid": "whosonfirst:locality:101729805",
            "name": "Waples Mill Road",
            "region": "Virginia",
            "region_a": "VA",
            "region_gid": "whosonfirst:region:85688747",
            "source": "openstreetmap",
            "source_id": "polyline:20813648",
            "street": "Waples Mill Road"
        },
        "query": "18STJ9710003002",
        "region": "Virginia",
        "region_a": "VA",
        "region_gid": "whosonfirst:region:85688747",
        "source": "openstreetmap",
        "source_id": "polyline:20813648",
        "street": "Waples Mill Road",
        "type": "Feature"
    }];


    it('getGeonames should call /geocode if given a name', () => {

        var mock = new MockAdapter(axios, {
            delayResponse: 1000
        });

        mock.onGet('/geocode').reply(200, geocode);

        const expectedActions = [{
                type: 'FETCHING_GEOCODE'
            },
            {
                type: 'RECEIVED_GEOCODE',
                data: expectedGeocodeData
            }
        ]

        const store = mockStore({
            geocode: []
        })

        return store.dispatch(actions.getGeocode('Hanoi'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions)
            })

    });
    it('should call /convert and /reverse if given a valid MGRS string', () => {

        var mock = new MockAdapter(axios, {
            delayResponse: 1000
        });

        mock.onGet('/convert').reply(200, convert);
        mock.onGet('/reverse_geocode').reply(200, reverse);

        const expectedActions = [{
                type: 'FETCHING_GEOCODE'
            },
            {
                type: 'RECEIVED_GEOCODE',
                data: expectedConvertData
            }
        ]

        const store = mockStore({
            geocode: []
        })

        return store.dispatch(actions.getGeocode('18STJ9710003002'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions)
            })

    });


    it('should call reverse if given a decimal degree coordinate', () => {
        var mock = new MockAdapter(axios, {
            delayResponse: 1000
        });
        const coordinateQuery = '-77.3381869614356 38.85243997515966';
        mock.onGet('/reverse_geocode').reply(200, reverse);

        //Process data
        expectedConvertData.shift();
        expectedConvertData[0].query = coordinateQuery;

        const expectedActions = [{
                type: 'FETCHING_GEOCODE'
            },
            {
                type: 'RECEIVED_GEOCODE',
                data: expectedConvertData
            }
        ]

        const store = mockStore({
            geocode: []
        })

        return store.dispatch(actions.getGeocode(coordinateQuery))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions)
            })
    });
})