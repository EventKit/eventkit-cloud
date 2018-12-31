import * as React from 'react';
import * as sinon from 'sinon';
import Edit from '@material-ui/icons/Edit';
import { createShallow } from '@material-ui/core/test-utils';
import { ExpirationData } from '../../components/StatusDownloadPage/ExpirationData';

describe('ExpirationData component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const getProps = () => ({
        expiration: '2017-03-24T15:52:35.637258Z',
        handleExpirationChange: sinon.spy(),
        adminPermissions: true,
        user: { user: { username: 'admin' } },
        ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}) => {
        props = { ...getProps(), ...overrides };
        wrapper = shallow(<ExpirationData {...props} />);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render the edit icon when adminPermissions is true', () => {
        expect(wrapper.find(Edit)).toHaveLength(1);
    });

    it('should only render the expiration text when adminPermissions is false', () => {
        wrapper.setProps({ adminPermissions: false });
        expect(wrapper.find(Edit)).toHaveLength(0);
    });

    it('handleDayClick should call close and handleExpirationChange', () => {
        const closeStub = sinon.stub(instance, 'handleClose');
        instance.handleDayClick('date');
        expect(closeStub.calledOnce).toBe(true);
        expect(props.handleExpirationChange.calledWith('date')).toBe(true);
    });

    it('handleClick should set the anchor in state', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleClick({ currentTarget: 'target' });
        expect(stateStub.calledWithExactly({ anchor: 'target' })).toBe(true);
    });

    it('handleClose should clear the anchor in state', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleClose();
        expect(stateStub.calledWithExactly({ anchor: null })).toBe(true);
    });
});
