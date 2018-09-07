import React from 'react';
import { createShallow } from '@material-ui/core/test-utils';
import BaseDialog from '../../components/Dialog/BaseDialog';
import { DeleteGroupDialog } from '../../components/UserGroupsPage/Dialogs/DeleteGroupDialog';

describe('LeaveGroupDialog component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const props = {
        show: true,
        onClose: () => {},
        onDelete: () => {},
        groupName: 'Test Group',
        ...global.eventkit_test_props,
    };

    it('should render a BaseDialog with message', () => {
        const wrapper = shallow(<DeleteGroupDialog {...props} />);
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
        expect(wrapper.find(BaseDialog).props().children)
            .toEqual("Are you sure you'd like to delete 'Test Group'?");
    });
});
