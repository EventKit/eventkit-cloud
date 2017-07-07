import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import * as actions from '../actions/searchToolbarActions'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

describe('async searchToolbar actions', () => {

    const geocode = {features: [
        {bbox: [105.731049, 20.935789, 105.933609, 21.092829], geometry: "some_geom",
            properties: {name: "Hanoi"}},
        {bbox: null, properties: {name: "Hanoi"}},
    ]
    }

    const expectedGeocode = [{bbox: [105.731049, 20.935789, 105.933609, 21.092829],
                                name: "Hanoi",
                                geometry: "some_geom",
                                properties: {name: "Hanoi"}
                            }]

    it('getGeonames should create RECEIVED_GEONAMES after fetching', () => {

        var mock = new MockAdapter(axios, {delayResponse: 1000});

        mock.onGet('/geocode').reply(200, geocode);

        const expectedActions = [
            {type: 'FETCHING_GEOCODE'},
            {type: 'RECEIVED_GEOCODE', data: expectedGeocode}
        ]

        const store = mockStore({ geocode: [] })

        return store.dispatch(actions.getGeocode('Hanoi'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions)
            })
        
    })
})
