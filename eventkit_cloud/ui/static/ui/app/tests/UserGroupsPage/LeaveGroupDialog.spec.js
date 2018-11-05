import React from 'react';
import { createShallow } from '@material-ui/core/test-utils';
import BaseDialog from '../../components/Dialog/BaseDialog';
import { LeaveGroupDialog } from '../../components/UserGroupsPage/Dialogs/LeaveGroupDialog';

describe('LeaveGroupDialog component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const props = {
        show: true,
        onClose: () => {},
        onLeave: () => {},
        groupName: 'Test Group',
        ...global.eventkit_test_props,
    };

    it('should render a BaseDialog with message', () => {
        const wrapper = shallow(<LeaveGroupDialog {...props} />);
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
        expect(wrapper.find(BaseDialog).props().children)
            .toEqual("I'd like to opt out of all shared rights for the 'Test Group' group.");
    });
});
