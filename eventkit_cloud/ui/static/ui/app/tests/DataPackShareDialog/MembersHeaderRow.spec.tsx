import * as React from 'react';
import * as sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CheckBox from '@material-ui/icons/CheckBox';
import ButtonBase from '@material-ui/core/ButtonBase';
import IndeterminateIcon from '../../components/icons/IndeterminateIcon';
import { MembersHeaderRow } from '../../components/DataPackShareDialog/MembersHeaderRow';

describe('MembersHeaderRow component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const getProps = () => ({
        memberCount: 2,
        selectedCount: 0,
        onMemberClick: sinon.spy(),
        onSharedClick: sinon.spy(),
        memberOrder: 'member',
        sharedOrder: 'shared',
        activeOrder: 'member',
        handleCheckAll: sinon.spy(),
        handleUncheckAll: sinon.spy(),
        canUpdateAdmin: false,
        ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;
    let instance;

    const setup = (params = {}, options = {}) => {
        props = { ...getProps(), ...params };
        wrapper = shallow(<MembersHeaderRow {...props} />, options);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render the basic components', () => {
        expect(wrapper.find(Card)).toHaveLength(1);
        expect(wrapper.find(CardHeader)).toHaveLength(1);
        expect(wrapper.find(CardHeader).shallow().dive().find(ButtonBase)).toHaveLength(2);
    });

    it('should render the checked icon', () => {
        wrapper.setProps({ selectedCount: props.memberCount });
        expect(wrapper.find(CardHeader).shallow().dive().find(CheckBox)).toHaveLength(1);
    });

    it('should render the indeterminate icon', () => {
        wrapper.setProps({ selectedCount: 1 });
        expect(wrapper.find(CardHeader).shallow().dive().find(IndeterminateIcon)).toHaveLength(1);
    });

    it('should render the condensed count text on small screens', () => {
        wrapper.setProps({ width: 'xs' });
        expect(wrapper.find(CardHeader).shallow().dive().find('.qa-MembersHeaderRow-countText')).toHaveLength(1);
        expect(wrapper.find(CardHeader).shallow().dive().find('.qa-MembersHeaderRow-countText')
            .text()).toEqual('(0/2)');
    });

    it('handleClick should setState to open popover', () => {
        wrapper.setProps({ canUpdateAdmin: true });
        const stateStub = sinon.stub(instance, 'setState');
        const e = { currentTarget: {} };
        instance.handleClick(e);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ anchor: e.currentTarget })).toBe(true);
        stateStub.restore();
    });

    it('handleClick should call onSharedClick with the sharedOrder', () => {
        instance.handleClick();
        expect(props.onSharedClick.calledOnce).toBe(true);
        expect(props.onSharedClick.calledWith(props.sharedOrder)).toBe(true);
    });

    it('handleClick should call onSharedClick with the oposite shared order', () => {
        wrapper.setProps({ activeOrder: 'shared', sharedOrder: 'shared' });
        instance.handleClick();
        expect(props.onSharedClick.calledOnce).toBe(true);
        expect(props.onSharedClick.calledWith('-shared')).toBe(true);
    });

    it('handleClose should set anchor to null', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleClose();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ anchor: null })).toBe(true);
    });

    it('handleChange should call onSharedCLick and handleClose', () => {
        const closeStub = sinon.stub(instance, 'handleClose');
        instance.handleChange('value');
        expect(props.onSharedClick.calledOnce).toBe(true);
        expect(props.onSharedClick.calledWith('value')).toBe(true);
        expect(closeStub.calledOnce).toBe(true);
        closeStub.restore();
    });

    it('handleMemberChange should call onMemberClick with the memberOrder', () => {
        wrapper.setProps({ activeOrder: 'shared', memberOrder: 'member' });
        instance.handleMemberChange();
        expect(props.onMemberClick.calledOnce).toBe(true);
        expect(props.onMemberClick.calledWith(props.memberOrder)).toBe(true);
    });

    it('handleMemberChange should call onMemberClick with the opposite member order', () => {
        wrapper.setProps({ activeOrder: 'username', memberOrder: 'username' });
        const expected = '-username';
        instance.handleMemberChange();
        expect(props.onMemberClick.calledOnce).toBe(true);
        expect(props.onMemberClick.calledWith(expected)).toBe(true);
    });
});
