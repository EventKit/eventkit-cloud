import React from 'react';
import sinon from 'sinon';
import Edit from '@material-ui/icons/Edit';
import { createShallow } from '@material-ui/core/test-utils';
import { ExpirationData } from '../../components/StatusDownloadPage/ExpirationData';

describe('ExpirationData component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const getProps = () => (
        {
            expiration: '2017-03-24T15:52:35.637258Z',
            handleExpirationChange: () => {},
            adminPermissions: true,
            user: { user: { username: 'admin' } },
            ...global.eventkit_test_props,
        }
    );

    const getWrapper = props => (
        shallow(<ExpirationData {...props} />)
    );

    it('should render the edit icon when adminPermissions is true', () => {
        const props = getProps();
        props.adminPermissions = true;
        const wrapper = getWrapper(props);
        expect(wrapper.find(Edit)).toHaveLength(1);
    });

    it('should only render the expiration text when adminPermissions is false', () => {
        const props = getProps();
        props.adminPermissions = false;
        const wrapper = getWrapper(props);
        expect(wrapper.find(Edit)).toHaveLength(0);
    });

    it('handleDayClick should call close and handleExpirationChange', () => {
        const props = getProps();
        props.handleExpirationChange = sinon.spy();
        const wrapper = getWrapper(props);
        const closeStub = sinon.stub(wrapper.instance(), 'handleClose');
        wrapper.instance().handleDayClick('date');
        expect(closeStub.calledOnce).toBe(true);
        expect(props.handleExpirationChange.calledWith('date')).toBe(true);
    });

    it('handleClick should set the anchor in state', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleClick({ currentTarget: 'target' });
        expect(stateStub.calledWithExactly({ anchor: 'target' })).toBe(true);
    });

    it('handleClose should clear the anchor in state', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleClose();
        expect(stateStub.calledWithExactly({ anchor: null })).toBe(true);
    });
});
