import * as React from 'react';
import * as sinon from 'sinon';
import { shallow } from 'enzyme';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import { MemberRow } from '../../components/DataPackShareDialog/MemberRow';

describe('GroupRow component', () => {
    const getProps = () => ({
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
        handleCheck: sinon.spy(),
        handleAdminCheck: sinon.spy(),
        handleAdminMouseOut: sinon.spy(),
        handleAdminMouseOver: sinon.spy(),
        showAdmin: false,
        admin: false,
        ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;
    let instance;

    const setup = (params = {}, options = {}) => {
        props = { ...getProps(), ...params };
        wrapper = shallow(<MemberRow {...props} />, options);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render the basic elements', () => {
        expect(wrapper.find(Card)).toHaveLength(1);
        expect(wrapper.find(CardHeader)).toHaveLength(1);
    });

    it('onAdminMouseOver should call handleAdminMouseOver', () => {
        wrapper.setProps({ selected: true });
        const tooltip = { key: 'value' };
        instance.tooltip = tooltip;
        instance.onAdminMouseOver();
        expect(props.handleAdminMouseOver.calledOnce).toBe(true);
        expect(props.handleAdminMouseOver.calledWith(tooltip, props.admin)).toBe(true);
    });

    it('onAdminMouseOver should not call handleAdminMouseOver', () => {
        wrapper.setProps({ selected: false });
        instance.onAdminMouseOver();
        expect(props.handleAdminMouseOver.called).toBe(false);
    });

    it('onAdminMouseOut should call handleAdminMouseOut', () => {
        instance.onAdminMouseOut();
        expect(props.handleAdminMouseOut.calledOnce).toBe(true);
    });

    it('onKeyDown should call handleAdminCheck', () => {
        const checkStub = sinon.stub(instance, 'handleAdminCheck');
        const e = { which: 13 };
        instance.onKeyDown(e);
        expect(checkStub.calledOnce).toBe(true);
        const e2 = { keyCode: 13 };
        instance.onKeyDown(e2);
        expect(checkStub.calledTwice).toBe(true);
        checkStub.restore();
    });

    it('onKeyDown should not call handleAdminCheck', () => {
        const checkStub = sinon.stub(instance, 'handleAdminCheck');
        const e = { which: 12, keyCode: 12 };
        instance.onKeyDown(e);
        expect(checkStub.called).toBe(false);
        checkStub.restore();
    });

    it('handleAdminCheck should call props.handleAdminCheck', () => {
        wrapper.setProps({ showAdmin: true, selected: true });
        instance.handleAdminCheck();
        expect(props.handleAdminCheck.calledOnce).toBe(true);
        expect(props.handleAdminCheck.calledWith(props.member)).toBe(true);
    });

    it('handleAdminCheck should not call props.handleAdminCheck', () => {
        wrapper.setProps({ showAdmin: true, selected: false });
        instance.handleAdminCheck();
        expect(props.handleAdminCheck.called).toBe(false);
    });
});
