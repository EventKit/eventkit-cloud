import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import React from 'react'
import {expect} from 'chai'
import LoginContainer, { Form } from './loginContainer';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme'
import {login} from '../actions/userActions'
import { Provider } from 'react-redux';


const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

describe('loginContainer', () => {

    it('changing username updates state', () => {

        const expected_username = "UserName";

        const expected_password = "Password";

        const wrapper = mount(<Form/>);
        const spy = sinon.spy(wrapper.instance(), 'setState');
        wrapper.find('input[name="username"]').simulate('change', {target: {name: "username", value: expected_username}});
        expect(spy.calledWith({username: expected_username})).to.equal(true);
        wrapper.find('input[name="password"]').simulate('change', {target: {name: "password", value: expected_password}});
        expect(spy.calledWith({password: expected_password})).to.equal(true);
    });

    it('calls componentDidMount', () => {
        const store = mockStore()
        const props = {
            handleLogin: sinon.spy(),
        }
        const expected_username = "UserName";
        const expected_password = "Password";
        const state = {username: expected_username, password: expected_password};

        const wrapper = mount(<Form {...props}/>);
        wrapper.setState({username: expected_username, password: expected_password});
        wrapper.find('form').simulate('submit');
        expect(props.handleLogin.callCount).to.equal(1);
        expect(props.handleLogin.calledWith(state)).to.equal(true);
    });

});