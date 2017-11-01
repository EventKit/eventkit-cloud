import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import Paper from 'material-ui/Paper';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { fakeStore } from '../../__mocks__/fakeStore';
import { LoginPage } from '../../components/auth/LoginPage';
import BrowserWarning from '../../components/auth/BrowserWarning';
import LoginForm from '../../containers/loginContainer';
import CustomScrollbar from '../../components/CustomScrollbar';
import * as utils from '../../utils/generic';


describe('LoginPage component', () => {
    const muiTheme = getMuiTheme();
    const store = fakeStore({});
    const loginConfig = { LOGIN_DISCLAIMER: 'This is a disclaimer' };

    function getWrapper(config) {
        return mount(<LoginPage />, {
            context: { muiTheme, store, config },
            childContextTypes: {
                muiTheme: React.PropTypes.object,
                store: React.PropTypes.object,
                config: React.PropTypes.object,
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

    it('should render a login paper and disclaimer paper', () => {
        const isValidStub = sinon.stub(utils, 'isBrowserValid')
            .returns(true);
        const wrapper = getWrapper(loginConfig);
        expect(wrapper.find(CustomScrollbar)).toHaveLength(2);
        expect(wrapper.find(Paper)).toHaveLength(2);
        expect(wrapper.find(LoginForm)).toHaveLength(1);
        expect(wrapper.find(Paper).last().find('strong').text()).toEqual('ATTENTION');
        expect(wrapper.find(CustomScrollbar).last().childAt(0).childAt(1)
            .text()).toEqual('This is a disclaimer');
        isValidStub.restore();
    });

    it('should display the browser warning if user browser is not valid', () => {
        const isValidStub = sinon.stub(utils, 'isBrowserValid')
            .returns(false);
        const wrapper = getWrapper({});
        expect(wrapper.find(BrowserWarning)).toHaveLength(1);
        expect(wrapper.find(Paper)).toHaveLength(0);
        isValidStub.restore();
    });
});
