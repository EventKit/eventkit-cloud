import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import React from 'react'
import {Form} from './loginContainer';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme'
import {Provider} from 'react-redux';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';


describe('loginContainer', () => {

    it('changing username updates state', () => {

        const expected_username = "UserName";

        const expected_password = "Password";

        const wrapper = mount(<Form/>);
        const spy = sinon.spy(wrapper.instance(), 'setState');

        wrapper.setState({login_form: true});

        wrapper.find('input[name="username"]').simulate('change', {
            target: {
                name: "username",
                value: expected_username
            }
        });
        expect(spy.calledWith({username: expected_username})).toEqual(true);
        wrapper.find('input[name="password"]').simulate('change', {
            target: {
                name: "password",
                value: expected_password
            }
        });
        expect(spy.calledWith({password: expected_password})).toEqual(true);
    });

    it('submit calls handleLogin', () => {

        const props = {
            handleLogin: sinon.spy(),
        }
        const expected_username = "UserName";
        const expected_password = "Password";
        const expected_button = "Button";
        const state = {
            username: expected_username,
            password: expected_password,
            button: expected_button,
            login_form: true,
            oauth_name: ""
        };

        const wrapper = mount(<Form {...props}/>);
        wrapper.setState(state);
        wrapper.find('form').simulate('submit');
        expect(props.handleLogin.callCount).toEqual(1);
        // console.log(props.handleLogin.getCall(0).args)
        expect(props.handleLogin.calledWith(state)).toEqual(true);
    });

    // it('shows only the form if auth endpoint is available', () => {
    //
    //     const props = {
    //         handleLogin: sinon.spy(),
    //     }
    //
    //     const mock = new MockAdapter(axios);//, {delayResponse: 100});
    //     mock.onGet('/auth').reply(200);
    //     mock.onGet('/oauth', { params: {query: 'name'}}).reply(200, {"name": "oauth_provider"});
    //     const wrapper = mount(<Form {...props}/>);
    //     expect(wrapper.render().find('form').exists()).toEqual(true);
    //     expect(wrapper.find('.mui-btn--raised').exists()).toEqual(false);
    // });

    // it('shows only the oauth button if oauth endpoint is available', () => {
    //     const props = {
    //         handleLogin: sinon.spy(),
    //     }
    //
    //     const mock = new MockAdapter(axios, {delayResponse: 100});
    //     mock.onGet('/auth').reply(400);
    //     mock.onGet('/oauth', { params: {query: 'name'}}).reply(200, {"name": "oauth_provider"});
    //
    //     const wrapper = mount(<Form {...props}/>);
    //     expect(wrapper.render().find('form').exists()).toEqual(false);
    //     expect(wrapper.render().find('.mui-btn--raised').exists()).toEqual(true);
    // });
    //
    // it('shows both the form and oauth button if endpoints are available', () => {
    //     const props = {
    //         handleLogin: sinon.spy(),
    //     }
    //
    //     const mock = new MockAdapter(axios, {delayResponse: 100});
    //     mock.onGet('/auth').reply(200);
    //     mock.onGet('/oauth', { params: {query: 'name'}}).reply(200, {"name": "oauth_provider"});
    //
    //
    //     const wrapper = mount(<Form {...props}/>);
    //     wrapper.render().componentDidMount();
    //     // console.log(wrapper.find('div').debug())
    //     // console.log(wrapper.state())
    //     // console.log(wrapper.find('form').html())
    //     // console.log(wrapper.find('.mui-btn--raised').html())
    //     expect(wrapper.find('form').exists()).toEqual(true);
    //     expect(wrapper.find('.mui-btn--raised').exists()).toEqual(true);
    // });

});