import React from 'react';
import { createShallow } from '@material-ui/core/test-utils';
import CustomTableRow from '../../components/CustomTableRow';
import { DataPackStatusTable } from '../../components/StatusDownloadPage/DataPackStatusTable';

describe('DataPackStatusTable component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const getProps = () => (
        {
            status: 'COMPLETED',
            expiration: '2017-03-24T15:52:35.637258Z',
            permissions: {
                value: 'PRIVATE',
                groups: {},
                members: {},
            },
            handleExpirationChange: () => {},
            handlePermissionsChange: () => {},
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
            ...global.eventkit_test_props,
        }
    );

    const getWrapper = props => (
        shallow(<DataPackStatusTable {...props} />)
    );

    it('should render basic components', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(CustomTableRow)).toHaveLength(3);
    });
});
