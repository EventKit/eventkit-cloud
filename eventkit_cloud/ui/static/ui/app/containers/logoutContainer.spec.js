import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import LogoutContainer from './logoutContainer';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('logout container', () => {
    it('should dispatch logout when mounted', () => {
        const store = mockStore();
        const dispatch = sinon.spy(store, 'dispatch');
        mount(<LogoutContainer store={store} />);
        expect(dispatch.calledOnce).toEqual(true);
    });
});
