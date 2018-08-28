import PropTypes from 'prop-types';
import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CheckBox from '@material-ui/icons/CheckBox';
import ButtonBase from '@material-ui/core/ButtonBase';
import IndeterminateIcon from '../../components/icons/IndeterminateIcon';
import MembersHeaderRow from '../../components/DataPackShareDialog/MembersHeaderRow';

describe('MembersHeaderRow component', () => {
    const muiTheme = getMuiTheme();
    const getProps = () => (
        {
            memberCount: 2,
            selectedCount: 0,
            onMemberClick: () => {},
            onSharedClick: () => {},
            memberOrder: 'member',
            sharedOrder: 'shared',
            activeOrder: 'member',
            handleCheckAll: () => {},
            handleUncheckAll: () => {},
            canUpdateAdmin: false,
        }
    );

    const getWrapper = props => (
        mount(<MembersHeaderRow {...props} />, {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: PropTypes.object,
            },
        })
    );

    it('should render the basic components', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(Card)).toHaveLength(1);
        expect(wrapper.find(CardHeader)).toHaveLength(1);
        expect(wrapper.find(ButtonBase)).toHaveLength(2);
    });

    it('should render the checked icon', () => {
        const props = getProps();
        props.selectedCount = props.memberCount;
        const wrapper = getWrapper(props);
        expect(wrapper.find(CheckBox)).toHaveLength(1);
    });

    it('should render the indeterminate icon', () => {
        const props = getProps();
        props.selectedCount = 1;
        const wrapper = getWrapper(props);
        expect(wrapper.find(IndeterminateIcon)).toHaveLength(1);
    });

    it('should render the condensed count text on small screens', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        window.resizeTo(500, 500);
        wrapper.instance().forceUpdate();
        wrapper.update();
        expect(wrapper.find('.qa-MembersHeaderRow-countText')).toHaveLength(1);
        expect(wrapper.find('.qa-MembersHeaderRow-countText').text()).toEqual('(0/2)');
    });

    it('handleClick should setState to open popover', () => {
        const props = getProps();
        props.canUpdateAdmin = true;
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const e = { currentTarget: {} };
        wrapper.instance().handleClick(e);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ anchor: e.currentTarget })).toBe(true);
        stateStub.restore();
    });

    it('handleClick should call onSharedClick with the sharedOrder', () => {
        const props = getProps();
        props.onSharedClick = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().handleClick();
        expect(props.onSharedClick.calledOnce).toBe(true);
        expect(props.onSharedClick.calledWith(props.sharedOrder)).toBe(true);
    });

    it('handleClick should call onSharedClick with the oposite shared order', () => {
        const props = getProps();
        props.activeOrder = 'shared';
        props.sharedOrder = 'shared';
        props.onSharedClick = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().handleClick();
        expect(props.onSharedClick.calledOnce).toBe(true);
        expect(props.onSharedClick.calledWith('-shared')).toBe(true);
    });

    it('handleClose should set anchor to null', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleClose();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ anchor: null })).toBe(true);
    });

    it('handleChange should call onSharedCLick and handleClose', () => {
        const props = getProps();
        props.onSharedClick = sinon.spy();
        const wrapper = getWrapper(props);
        const closeStub = sinon.stub(wrapper.instance(), 'handleClose');
        wrapper.instance().handleChange('value');
        expect(props.onSharedClick.calledOnce).toBe(true);
        expect(props.onSharedClick.calledWith('value')).toBe(true);
        expect(closeStub.calledOnce).toBe(true);
        closeStub.restore();
    });

    it('handleMemberChange should call onMemberClick with the memberOrder', () => {
        const props = getProps();
        props.activeOrder = 'shared';
        props.memberOrder = 'member';
        props.onMemberClick = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().handleMemberChange();
        expect(props.onMemberClick.calledOnce).toBe(true);
        expect(props.onMemberClick.calledWith(props.memberOrder)).toBe(true);
    });

    it('handleMemberChange should call onMemberClick with the opposite member order', () => {
        const props = getProps();
        props.activeOrder = 'member';
        props.memberOrder = 'member';
        props.onMemberClick = sinon.spy();
        const wrapper = getWrapper(props);
        const expected = '-member';
        wrapper.instance().handleMemberChange();
        expect(props.onMemberClick.calledOnce).toBe(true);
        expect(props.onMemberClick.calledWith(expected)).toBe(true);
    });
});
