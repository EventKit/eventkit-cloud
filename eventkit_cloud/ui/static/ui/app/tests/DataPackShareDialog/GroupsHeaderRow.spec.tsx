import * as React from 'react';
import * as sinon from 'sinon';
import { shallow } from 'enzyme';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import ButtonBase from '@material-ui/core/ButtonBase';
import IndeterminateIcon from '../../components/icons/IndeterminateIcon';
import { GroupsHeaderRow } from '../../components/DataPackShareDialog/GroupsHeaderRow';

describe('GroupsHeaderRow component', () => {
    const getProps = () => ({
        groupCount: 2,
        selectedCount: 0,
        onGroupClick: sinon.spy(),
        onSharedClick: sinon.spy(),
        groupOrder: 'group',
        sharedOrder: 'shared',
        activeOrder: 'group',
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
        wrapper = shallow(<GroupsHeaderRow {...props} />, options);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render the basic components', () => {
        expect(wrapper.find(Card)).toHaveLength(1);
        expect(wrapper.find(CardHeader)).toHaveLength(1);
        expect(shallow(wrapper.find(CardHeader).props().title).find(ButtonBase)).toHaveLength(2);
    });

    it('should render the indeterminate icon', () => {
        wrapper.setProps({ selectedCount: 1 });
        expect(shallow(wrapper.find(CardHeader).props().title).find(IndeterminateIcon)).toHaveLength(1);
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

    it('handleGroupChange should call onGroupClick with the groupOrder', () => {
        wrapper.setProps({ activeOrder: 'shared', groupOrder: 'group' });
        instance.handleGroupChange();
        expect(props.onGroupClick.calledOnce).toBe(true);
        expect(props.onGroupClick.calledWith(props.groupOrder)).toBe(true);
    });

    it('handleGroupChange should call onGroupClick with the opposite group order', () => {
        props.activeOrder = 'name';
        props.groupOrder = 'name';
        wrapper.setProps({ activeOrder: 'name', groupOrder: 'name' });
        const expected = '-name';
        instance.handleGroupChange();
        expect(props.onGroupClick.calledOnce).toBe(true);
        expect(props.onGroupClick.calledWith(expected)).toBe(true);
    });
});
