import React from 'react';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {fakeStore} from '../../__mocks__/fakeStore';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import {LoginPage} from '../../components/auth/LoginPage';
import LoginForm from '../../containers/loginContainer';
import CustomScrollbar from '../../components/CustomScrollbar';
import Paper from 'material-ui/Paper';

describe('LoginPage component', () => {
    const muiTheme = getMuiTheme();
    const store = fakeStore({});
    const config = {LOGIN_DISCLAIMER: 'This is a disclaimer'};
    const getWrapper = (config) => {
        return mount(<LoginPage/>, {
            context: {muiTheme, store, config: config},
            childContextTypes: {
                muiTheme: React.PropTypes.object,
                store: React.PropTypes.object,
                config: React.PropTypes.object
            }
        });
    }

    it('should render just the login paper', () => {
        const wrapper = getWrapper({});
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
        expect(wrapper.find(Paper)).toHaveLength(1);
        expect(wrapper.find(LoginForm)).toHaveLength(1);
    });

    it('should render a login paper and disclaimer paper', () => {
        const wrapper = getWrapper(config);
        const state = {disclaimer: 'This is a disclaimer'};
        wrapper.setState(state);
        expect(wrapper.find(CustomScrollbar)).toHaveLength(2);
        expect(wrapper.find(Paper)).toHaveLength(2);
        expect(wrapper.find(LoginForm)).toHaveLength(1);
        expect(wrapper.find(Paper).last().find('strong').text()).toEqual('ATTENTION');
        expect(wrapper.find(CustomScrollbar).last().childAt(0).childAt(1).text()).toEqual('This is a disclaimer');
    });
});
