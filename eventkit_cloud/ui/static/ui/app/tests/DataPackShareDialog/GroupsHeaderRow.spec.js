import React, { PropTypes } from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { Card, CardHeader } from 'material-ui/Card';
import Popover from 'material-ui/Popover';
import EnhancedButton from 'material-ui/internal/EnhancedButton';
import IndeterminateIcon from '../../components/icons/IndeterminateIcon';
import GroupsHeaderRow from '../../components/DataPackShareDialog/GroupsHeaderRow';

describe('GroupsHeaderRow component', () => {
    const muiTheme = getMuiTheme();
    const getProps = () => (
        {
            groupCount: 2,
            selectedCount: 0,
            onGroupClick: () => {},
            onSharedClick: () => {},
            groupOrder: 'group',
            sharedOrder: 'shared',
            activeOrder: 'group',
            handleCheckAll: () => {},
            handleUncheckAll: () => {},
            canUpdateAdmin: false,
        }
    );

    const getWrapper = props => (
        mount(<GroupsHeaderRow {...props} />, {
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
        expect(wrapper.find(EnhancedButton)).toHaveLength(2);
        expect(wrapper.find(Popover)).toHaveLength(1);
    });

    it('should render the indeterminate icon', () => {
        const props = getProps();
        props.selectedCount = 1;
        const wrapper = getWrapper(props);
        expect(wrapper.find(IndeterminateIcon)).toHaveLength(1);
    });

    it('handleClick should setState to open popover', () => {
        const props = getProps();
        props.canUpdateAdmin = true;
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const e = { currentTarget: {} };
        wrapper.instance().handleClick(e);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ open: true, anchor: e.currentTarget })).toBe(true);
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

    it('handleClose should set open to false', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleClose();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ open: false })).toBe(true);
    });

    it('handleChange should call onSharedCLick and handleClose', () => {
        const props = getProps();
        props.onSharedClick = sinon.spy();
        const wrapper = getWrapper(props);
        const closeStub = sinon.stub(wrapper.instance(), 'handleClose');
        wrapper.instance().handleChange({}, 'value');
        expect(props.onSharedClick.calledOnce).toBe(true);
        expect(props.onSharedClick.calledWith('value')).toBe(true);
        expect(closeStub.calledOnce).toBe(true);
        closeStub.restore();
    });

    it('handleGroupChange should call onGroupClick with the groupOrder', () => {
        const props = getProps();
        props.activeOrder = 'shared';
        props.groupOrder = 'group';
        props.onGroupClick = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().handleGroupChange();
        expect(props.onGroupClick.calledOnce).toBe(true);
        expect(props.onGroupClick.calledWith(props.groupOrder)).toBe(true);
    });

    it('handleGroupChange should call onGroupClick with the opposite group order', () => {
        const props = getProps();
        props.activeOrder = 'group';
        props.groupOrder = 'group';
        props.onGroupClick = sinon.spy();
        const wrapper = getWrapper(props);
        const expected = '-group';
        wrapper.instance().handleGroupChange();
        expect(props.onGroupClick.calledOnce).toBe(true);
        expect(props.onGroupClick.calledWith(expected)).toBe(true);
    });
});
