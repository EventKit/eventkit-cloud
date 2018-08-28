import React from 'react';
import { mount } from 'enzyme';
import { BaseDialog } from '../../components/Dialog/BaseDialog';
import { DeleteGroupDialog } from '../../components/UserGroupsPage/Dialogs/DeleteGroupDialog';

describe('LeaveGroupDialog component', () => {
    const props = {
        show: true,
        onClose: () => {},
        onDelete: () => {},
        groupName: 'Test Group',
    };

    it('should render a BaseDialog with message', () => {
        const wrapper = mount(<DeleteGroupDialog {...props} />);
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
        expect(wrapper.find(BaseDialog).props().children)
            .toEqual("Are you sure you'd like to delete 'Test Group'?");
    });
});
