import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import * as actions from '../../actions/searchToolbarActions'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

describe('async searchToolbar actions', () => {
    const mock = new MockAdapter(axios, {delayResponse: 1000});
    const expectedGeocodeReturn = [{bbox: [105.731049, 20.935789, 105.933609, 21.092829],
        name: "Hanoi",
        geometry: "some_geom",
        properties: {name: "Hanoi"}
    }]
    const expectedMGRSReturn = {
        "geometry": {
          "type": "Point",
          "coordinates": [
            -72.57553258519015,
            42.367593344066776
          ]
        },
        "type": "Feature",
        "properties": {
          "to": "decdeg",
          "from": "mgrs",
          "name": "18TXM9963493438"
        }
    };
    const expectedReverseReturn = {
        "type": "FeatureCollection",
        "features": [
          {
            "geometry": {
              "type": "Polygon",
              "coordinates": [
                [
                  [
                    -72.573182,
                    42.361518
                  ],
                  [
                    -72.572548,
                    42.361518
                  ],
                  [
                    -72.572548,
                    42.363861
                  ],
                  [
                    -72.573182,
                    42.363861
                  ],
                  [
                    -72.573182,
                    42.361518
                  ]
                ]
              ]
            },
            "type": "Feature",
            "properties": {
              "layer": "street",
              "localadmin": "Hadley",
              "county_gid": "whosonfirst:county:102084459",
              "region_gid": "whosonfirst:region:85688645",
              "county": "Hampshire County",
              "street": "Birch Meadow Drive",
              "country_a": "USA",
              "id": "polyline:9280403",
              "confidence": 0.6,
              "localadmin_gid": "whosonfirst:localadmin:404476295",
              "label": "Birch Meadow Drive, Hadley, MA, USA",
              "source": "openstreetmap",
              "gid": "openstreetmap:street:polyline:9280403",
              "accuracy": "centroid",
              "province": "Hampshire County",
              "country_gid": "whosonfirst:country:85633793",
              "source_id": "polyline:9280403",
              "distance": 0.563,
              "name": "Birch Meadow Drive",
              "country": "United States",
              "region": "Massachusetts",
              "region_a": "MA"
            },
            "bbox": [
              -72.573182,
              42.361518,
              -72.572548,
              42.363861
            ]
          }
        ],
        "bbox": [
          -72.585192,
          42.359825,
          -72.551186,
          42.373535
        ]
      };      
    const geocode = {features: expectedGeocodeReturn.concat({bbox: null, properties: {name: "Hanoi"}})};
    const mgrs = [expectedMGRSReturn].concat(expectedReverseReturn.features);
    let store = mockStore({ geocode: [] })
    
    it('getGeonames should create RECEIVED_GEONAMES after fetching', () => {
        mock.onGet('/geocode').reply(200, geocode);

        const expectedActions = [
            {type: 'FETCHING_GEOCODE'},
            {type: 'RECEIVED_GEOCODE', data: expectedGeocodeReturn}
        ]

        return store.dispatch(actions.getGeocode('Hanoi'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions)
            })
        store = mockStore({ geocode: [] })
    });
    it('should do a convert and then a reverse geocode when an MGRS string is given', () => {
        store = mockStore({ geocode: [] })
        mock.onGet('/convert').reply(200, expectedMGRSReturn);
        mock.onGet('/reverse_geocode').reply(200, expectedReverseReturn);

        const expectedActions = [
            {type: 'FETCHING_GEOCODE'},
            {type: 'RECEIVED_GEOCODE', data: mgrs}
        ]

        return store.dispatch(actions.getGeocode('18TXM9963493438'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions)
            })
        
    });
    it('should do a reverse geocode when a lat/lon coordinate is given', () => {
        store = mockStore({ geocode: [] })
        mock.onGet('/reverse_geocode').reply(200, expectedReverseReturn);

        const expectedActions = [
            {type: 'FETCHING_GEOCODE'},
            {type: 'RECEIVED_GEOCODE', data: expectedReverseReturn.features}
        ]
        return store.dispatch(actions.getGeocode('42.367593344066776, -72.57553258519015'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions)
            })
        
    });
    it('should fail and return an empty string if it cant connect', () => {
      store = mockStore({ geocode: [] })
      let fail = new MockAdapter(axios, {delayResponse: 1000});
      fail.onGet('/convert').reply(400, 'ERROR: Invalid MGRS String');
      

      const expectedActions = [
          {type: 'FETCHING_GEOCODE'},
          {type: 'GEOCODE_ERROR', error: new Error('Request failed with status code 400') },
          {type: 'RECEIVED_GEOCODE', data: []},
          
      ]

      return store.dispatch(actions.getGeocode('18SJT9710003009'))
          .then(() => {
              expect(store.getActions()).toEqual(expectedActions)
          })
      
  });
    
});