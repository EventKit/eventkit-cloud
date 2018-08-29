import PropTypes from 'prop-types';
import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import Paper from '@material-ui/core/Paper';
import { fakeStore } from '../../__mocks__/fakeStore';
import { LoginPage } from '../../components/auth/LoginPage';
import LoginForm from '../../containers/loginContainer';
import CustomScrollbar from '../../components/CustomScrollbar';
import * as utils from '../../utils/generic';


describe('LoginPage component', () => {
    const store = fakeStore({});
    const loginConfig = { LOGIN_DISCLAIMER: 'This is a disclaimer' };

    function getWrapper(config) {
        return mount(<LoginPage />, {
            context: { store, config },
            childContextTypes: {
                store: PropTypes.object,
                config: PropTypes.object,
            },
        });
    }

    it('should render just the login paper', () => {
        const isValidStub = sinon.stub(utils, 'isBrowserValid')
            .returns(true);
        const wrapper = getWrapper({});
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
        expect(wrapper.find(Paper)).toHaveLength(1);
        expect(wrapper.find(LoginForm)).toHaveLength(1);
        expect(wrapper.find('.qa-LoginPage-browser-text')).toHaveLength(1);
        isValidStub.restore();
    });

    it('should render the version number', () => {
        const isValidStub = sinon.stub(utils, 'isBrowserValid')
            .returns(true);
        const wrapper = getWrapper({ VERSION: '1.2.3' });
        expect(wrapper.find('.qa-LoginPage-version')).toHaveLength(1);
        expect(wrapper.find('.qa-LoginPage-version').text()).toEqual('EventKit Version 1.2.3');
        isValidStub.restore();
    });

    it('should not render the version number', () => {
        const isValidStub = sinon.stub(utils, 'isBrowserValid')
            .returns(true);
        const wrapper = getWrapper({});
        expect(wrapper.find('.qa-LoginPage-version')).toHaveLength(0);
        isValidStub.restore();
    });

    it('should render a login paper and disclaimer paper', () => {
        const isValidStub = sinon.stub(utils, 'isBrowserValid')
            .returns(true);
        const wrapper = getWrapper(loginConfig);
        expect(wrapper.find(CustomScrollbar)).toHaveLength(2);
        expect(wrapper.find(Paper)).toHaveLength(2);
        expect(wrapper.find(LoginForm)).toHaveLength(1);
        expect(wrapper.find(Paper).last().find('strong').text()).toEqual('ATTENTION');
        expect(wrapper.find(CustomScrollbar).find('.qa-LoginPage-disclaimer')
            .text()).toEqual('This is a disclaimer');
        isValidStub.restore();
    });
});
