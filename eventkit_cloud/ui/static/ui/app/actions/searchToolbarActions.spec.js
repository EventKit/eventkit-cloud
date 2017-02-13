import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import * as actions from './searchToolbarActions'
import nock from 'nock'

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

describe('async searchToolbar actions', () => {
    afterEach(() => {
        nock.cleanAll()
    })

    const geonames = {geonames: [
        {name: 'Hanoi', bbox: {east: 105.731049, south: 20.935789, west: 105.933609, north: 21.092829}},
        {name: 'No Bbox', bbox: {}}
    ]}

    const expectedGeonames = [geonames.geonames[0]]

    it('getGeonames should create RECEIVED_GEONAMES after fetching', () => {
        nock('http://api.geonames.org/')
            .post('/searchJSON')
            .query({q: 'Hanoi', maxRows: 20, username: 'hotexports', style: 'full'})
            .reply(200, geonames)

        const expectedActions = [
            {type: 'FETCHING_GEONAMES'},
            {type: 'RECEIVED_GEONAMES', geonames: expectedGeonames}
        ]

        const store = mockStore({ geonames: [] })

        return store.dispatch(actions.getGeonames('Hanoi'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions)
            })
        
    })
})
