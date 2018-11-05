import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import createTestStore from '../store/configureTestStore';
import LogoutContainer from './logoutContainer';

describe('logout container', () => {
    it('should dispatch logout when mounted', () => {
        const store = createTestStore({});
        const dispatch = sinon.spy(store, 'dispatch');
        mount(<LogoutContainer store={store} />);
        expect(dispatch.calledOnce).toEqual(true);
    });
});
