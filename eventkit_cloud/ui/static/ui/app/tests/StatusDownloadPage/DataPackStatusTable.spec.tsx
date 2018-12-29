import * as React from 'react';
import * as sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import CustomTableRow from '../../components/CustomTableRow';
import { DataPackStatusTable } from '../../components/StatusDownloadPage/DataPackStatusTable';

describe('DataPackStatusTable component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const getProps = () => ({
        status: 'COMPLETED',
        expiration: '2017-03-24T15:52:35.637258Z',
        permissions: {
            value: 'PRIVATE',
            groups: {},
            members: {},
        },
        handleExpirationChange: sinon.spy(),
        handlePermissionsChange: sinon.spy(),
        members: [
            { user: { username: 'user_one' } },
            { user: { username: 'user_two' } },
        ],
        groups: [
            { id: 1 },
            { id: 2 },
        ],
        adminPermissions: true,
        user: { user: { username: 'admin' } },
        ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}) => {
        props = { ...getProps(), ...overrides };
        wrapper = shallow(<DataPackStatusTable {...props} />);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render basic components', () => {
        expect(wrapper.find(CustomTableRow)).toHaveLength(3);
    });
});
