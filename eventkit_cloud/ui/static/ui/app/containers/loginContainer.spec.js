import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import React from 'react'
import {expect} from 'chai'
import LoginContainer from './loginContainer';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme'


const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

describe('loginContainer', () => {

    it('changing username updates state', () => {

        const expected_username = "UserName";

        const expected_password = "Password";

        const store = mockStore({
            username: null,
            password: null
        })

        const wrapper = mount(<LoginContainer store={store}/>);
        const spy = sinon.spy(wrapper.instance(), 'setState');
        wrapper.update();
        wrapper.find('input[name="username"]').simulate('change', {target: {value: expected_username}});
        expect(spy.called).to.equal(true);
        wrapper.reset();
        wrapper.update();
        wrapper.find('input[name="password"]').simulate('change', {target: {value: expected_password}});
        expect(spy.called).to.equal(true);
    });




    it('calls componentDidMount', () => {
        const store = mockStore()
        const dispatch = sinon.spy(store, 'dispatch')

        const wrapper = mount(<LoginContainer store={store}/>);
        const state = {'username': 'UserName', 'password': 'Password'}
        wrapper.setState(state)
        wrapper.find('.submitButton').simulate('click');
        expect(dispatch.calledOnce).to.equal(true);

    });

});