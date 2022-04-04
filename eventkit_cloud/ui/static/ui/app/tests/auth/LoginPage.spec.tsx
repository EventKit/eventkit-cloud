import * as React from 'react';
import { shallow } from 'enzyme';
import Paper from '@material-ui/core/Paper';
import LoginForm from '../../containers/loginContainer';
import CustomScrollbar from '../../components/common/CustomScrollbar';
import { LoginPage } from '../../components/auth/LoginPage';

describe('LoginPage component', () => {
    const loginConfig = { LOGIN_DISCLAIMER: 'This is a disclaimer', ...(global as any).eventkit_test_props };

    function getWrapper(config) {
        return shallow(<LoginPage {...(global as any).eventkit_test_props} />, {
            context: { config }
        });
    }

    it('should render just the login paper', () => {
        const wrapper = getWrapper({});
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
        expect(wrapper.find(Paper)).toHaveLength(1);
        expect(wrapper.find(LoginForm)).toHaveLength(1);
        expect(wrapper.find('.qa-LoginPage-browser-text')).toHaveLength(1);
    });

    it('should render a login paper and disclaimer paper', () => {
        const wrapper = getWrapper(loginConfig);
        expect(wrapper.find(CustomScrollbar)).toHaveLength(2);
        expect(wrapper.find(Paper)).toHaveLength(2);
        expect(wrapper.find(LoginForm)).toHaveLength(1);
        expect(wrapper.find(Paper).last().find('strong').text()).toEqual('ATTENTION');
        expect(wrapper.find(CustomScrollbar).at(1).dive().find('.qa-LoginPage-disclaimer')
            .html()).toContain('This is a disclaimer');
    });
});
