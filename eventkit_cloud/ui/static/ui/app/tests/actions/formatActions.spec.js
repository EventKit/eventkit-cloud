
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import * as actions from '../../actions/formatActions';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('format actions', () => {
    it('getFormats should return formats from the api', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onGet('/api/formats').reply(200, ['my formats']);

        const expectedActions = [
            { type: actions.types.GETTING_FORMATS },
            { type: actions.types.FORMATS_RECEIVED, formats: ['my formats'] },
        ];
        const store = mockStore({});
        return store.dispatch(actions.getFormats())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('getFormats should handle errors', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onGet('/api/formats').reply(400);

        const expectedActions = [
            { type: actions.types.GETTING_FORMATS },
        ];
        const store = mockStore({});
        return store.dispatch(actions.getFormats())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });
});
