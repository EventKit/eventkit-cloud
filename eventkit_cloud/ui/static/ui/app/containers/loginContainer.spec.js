import React from 'react';
import sinon from 'sinon';
import { mount, shallow } from 'enzyme';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import Button from '@material-ui/core/Button';
import { Form } from './loginContainer';


describe('loginContainer', () => {
    it('shows only the form if auth endpoint is available', () => {
        const props = {
            handleLogin: sinon.spy(),
        };

        const state = {
            username: 'UserName',
            password: 'Password',
            button: 'Button',
            loginForm: true,
            oauthName: '',
        };

        const wrapper = mount(<Form {...props} />);
        wrapper.setState(state);
        expect(wrapper.find('form').exists()).toEqual(true);
        expect(wrapper.find(Button)).toHaveLength(1);
        expect(wrapper.find(Button).text()).toEqual('Login');
    });

    it('shows only the oauth button if oauth endpoint is available', () => {
        const props = {
            handleLogin: sinon.spy(),
        };

        const state = {
            username: 'UserName',
            password: 'Password',
            button: 'Button',
            loginForm: false,
            oauthName: 'OAuth',
        };

        const wrapper = mount(<Form {...props} />);
        wrapper.setState(state);
        expect(wrapper.find('form').exists()).toEqual(false);
        expect(wrapper.find(Button)).toHaveLength(1);
        expect(wrapper.find(Button).text()).toEqual('Login with OAuth');
    });

    it('shows both the form and oauth button if endpoints are available', () => {
        const props = {
            handleLogin: sinon.spy(),
        };

        const state = {
            username: 'UserName',
            password: 'Password',
            buttonDisabled: false,
            loginForm: true,
            oauthName: 'OAuth',
        };

        const wrapper = mount(<Form {...props} />);
        wrapper.setState(state);
        expect(wrapper.find('form').exists()).toEqual(true);
        expect(wrapper.find(Button)).toHaveLength(1);
        expect(wrapper.find('.qa-LoginForm-oauth')).toHaveLength(1);
        expect(wrapper.find(Button).text()).toEqual('Login');
        expect(wrapper.find('.qa-LoginForm-oauth').text()).toEqual('Or, login with OAuth');
    });

    it('if no login methods available, it displays text to the user', () => {
        const wrapper = mount(<Form />);
        expect(wrapper.state().loginForm).toBe(false);
        expect(wrapper.state().oauthName).toEqual('');
        expect(wrapper.find('div')).toHaveLength(2);
        expect(wrapper.find('div').last().text()).toEqual('No login methods available, please contact an administrator');
    });

    it('should call checkAuth and checkOAuth on mount', () => {
        const mountSpy = sinon.spy(Form.prototype, 'componentDidMount');
        const authSpy = sinon.spy(Form.prototype, 'checkAuthEndpoint');
        const oauthSpy = sinon.spy(Form.prototype, 'checkOAuthEndpoint');
        mount(<Form />);
        expect(mountSpy.calledOnce).toBe(true);
        expect(authSpy.calledOnce).toBe(true);
        expect(oauthSpy.calledOnce).toBe(true);
        mountSpy.restore();
        authSpy.restore();
        oauthSpy.restore();
    });

    it('handleSubmit should call preventDefault and handleLogin', () => {
        const state = {
            username: 'UserName',
            password: 'Password',
            buttonDisabled: false,
            loginForm: true,
            oauthName: '',
        };
        const props = { handleLogin: sinon.spy() };
        const wrapper = shallow(<Form {...props} />);
        wrapper.setState(state);
        const event = { preventDefault: sinon.spy() };
        wrapper.instance().handleSubmit(event);
        expect(event.preventDefault.calledOnce).toBe(true);
        expect(props.handleLogin.calledOnce).toBe(true);
        expect(props.handleLogin.calledWith(state)).toBe(true);
    });

    it('handleOAuth should call prevent default and change window location', () => {
        const wrapper = shallow(<Form />);
        const event = { preventDefault: sinon.spy() };
        const locationSpy = sinon.spy();
        window.location.assign = locationSpy;
        wrapper.instance().handleOAuth(event);
        expect(event.preventDefault.calledOnce).toBe(true);
        expect(locationSpy.calledOnce).toBe(true);
        expect(locationSpy.calledWith('/oauth')).toBe(true);
    });

    it('changing username updates state', () => {
        const expectedUsername = 'UserName';
        const expectedPassword = 'Password';
        const wrapper = mount(<Form />);
        const spy = sinon.spy(wrapper.instance(), 'setState');
        wrapper.setState({ loginForm: true });
        expect(wrapper.state().buttonDisabled).toBe(true);
        wrapper.find('input[name="username"]').simulate('change', {
            target: {
                name: 'username',
                value: expectedUsername,
            },
        });
        expect(spy.calledWith({ username: expectedUsername })).toEqual(true);
        expect(wrapper.state().buttonDisabled).toBe(true);
        wrapper.find('input[name="password"]').simulate('change', {
            target: {
                name: 'password',
                value: expectedPassword,
            },
        });
        expect(spy.calledWith({ password: expectedPassword })).toEqual(true);
        expect(wrapper.state().buttonDisabled).toBe(false);
        expect(spy.calledWith({ buttonDisabled: false })).toBe(true);

        wrapper.find('input[name="password"]').simulate('change', {
            target: {
                name: 'password',
                value: '',
            },
        });
        expect(spy.calledWith({ password: '' })).toBe(true);
        expect(wrapper.state().buttonDisabled).toBe(true);
        expect(spy.calledWith({ buttonDisabled: true })).toBe(true);
    });

    it('submit calls handleLogin', () => {
        const props = {
            handleLogin: sinon.spy(),
        };

        const state = {
            username: 'UserName',
            password: 'Password',
            buttonDisabled: false,
            loginForm: true,
            oauthName: '',
        };

        const wrapper = mount(<Form {...props} />);
        wrapper.setState(state);
        wrapper.find('form').simulate('submit');
        expect(props.handleLogin.callCount).toEqual(1);
        expect(props.handleLogin.calledWith(state)).toEqual(true);
    });

    it('checkAuthEndpoint updates state if available', async () => {
        const props = {
            handleLogin: sinon.spy(),
        };
        const mock = new MockAdapter(axios, { delayResponse: 100 });

        mock.onGet('/auth').reply(200, {
            users: [
                { id: 1, name: 'John Smith' },
            ],
        });
        const wrapper = shallow(<Form {...props} />);
        expect(wrapper.state('loginForm')).toEqual(false);
        await wrapper.instance().checkAuthEndpoint();
        wrapper.update();
        expect(wrapper.state('loginForm')).toEqual(true);
    });

    it('checkOAuthEndpoint updates state if available', async () => {
        const oauthName = 'oauth_provider';
        const props = {
            handleLogin: sinon.spy(),
        };

        const mock = new MockAdapter(axios, { delayResponse: 100 });

        mock.onGet('/oauth').reply(200, {
            name: oauthName,
        });

        const wrapper = shallow(<Form {...props} />);
        expect(wrapper.state('oauthName')).toEqual('');


        await wrapper.instance().checkOAuthEndpoint();
        wrapper.update();
        expect(wrapper.state('oauthName')).toEqual(oauthName);
    });
});
