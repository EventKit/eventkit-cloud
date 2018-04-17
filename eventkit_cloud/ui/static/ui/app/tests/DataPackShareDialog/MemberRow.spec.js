import React, { PropTypes } from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { Card, CardHeader } from 'material-ui/Card';
import CheckBoxOutline from 'material-ui/svg-icons/toggle/check-box-outline-blank';
import MemberRow from '../../components/DataPackShareDialog/MemberRow';

describe('GroupRow component', () => {
    const muiTheme = getMuiTheme();
    const getProps = () => (
        {
            member: {
                user: {
                    username: 'user_one',
                    first_name: 'user',
                    last_name: 'one',
                    email: 'user.one@email.com',
                },
                groups: [1],
            },
            selected: false,
            handleCheck: () => {},
            handleAdminCheck: () => {},
            handleAdminMouseOut: () => {},
            handleAdminMouseOver: () => {},
            showAdmin: false,
            admin: false,
        }
    );

    const getWrapper = props => (
        mount(<MemberRow {...props} />, {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: PropTypes.object,
            },
        })
    );

    it('should render the basic elements', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(Card)).toHaveLength(1);
        expect(wrapper.find(CardHeader)).toHaveLength(1);
        expect(wrapper.find('.qa-MemberRow-CardHeader-text')).toHaveLength(1);
        expect(wrapper.find(CheckBoxOutline)).toHaveLength(1);
    });

    it('onAdminMouseOver should call handleAdminMouseOver', () => {
        const props = getProps();
        props.selected = true;
        props.handleAdminMouseOver = sinon.spy();
        const wrapper = getWrapper(props);
        const tooltip = { key: 'value' };
        wrapper.instance().tooltip = tooltip;
        wrapper.instance().onAdminMouseOver();
        expect(props.handleAdminMouseOver.calledOnce).toBe(true);
        expect(props.handleAdminMouseOver.calledWith(tooltip, props.admin)).toBe(true);
    });

    it('onAdminMouseOver should not call handleAdminMouseOver', () => {
        const props = getProps();
        props.selected = false;
        props.handleAdminMouseOver = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().onAdminMouseOver();
        expect(props.handleAdminMouseOver.called).toBe(false);
    });

    it('onAdminMouseOut should call handleAdminMouseOut', () => {
        const props = getProps();
        props.handleAdminMouseOut = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().onAdminMouseOut();
        expect(props.handleAdminMouseOut.calledOnce).toBe(true);
    });

    it('onKeyDown should call handleAdminCheck', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const checkStub = sinon.stub(wrapper.instance(), 'handleAdminCheck');
        const e = { which: 13 };
        wrapper.instance().onKeyDown(e);
        expect(checkStub.calledOnce).toBe(true);
        const e2 = { keyCode: 13 };
        wrapper.instance().onKeyDown(e2);
        expect(checkStub.calledTwice).toBe(true);
        checkStub.restore();
    });

    it('onKeyDown should not call handleAdminCheck', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const checkStub = sinon.stub(wrapper.instance(), 'handleAdminCheck');
        const e = { which: 12, keyCode: 12 };
        wrapper.instance().onKeyDown(e);
        expect(checkStub.called).toBe(false);
        checkStub.restore();
    });

    it('handleAdminCheck should call props.handleAdminCheck', () => {
        const props = getProps();
        props.showAdmin = true;
        props.selected = true;
        props.handleAdminCheck = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().handleAdminCheck();
        expect(props.handleAdminCheck.calledOnce).toBe(true);
        expect(props.handleAdminCheck.calledWith(props.member)).toBe(true);
    });

    it('handleAdminCheck should not call props.handleAdminCheck', () => {
        const props = getProps();
        props.showAdmin = true;
        props.selected = false;
        props.handleAdminCheck = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().handleAdminCheck();
        expect(props.handleAdminCheck.called).toBe(false);
    });
});
