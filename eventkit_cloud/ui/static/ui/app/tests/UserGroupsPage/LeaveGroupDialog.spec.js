import React, { PropTypes } from 'react';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { BaseDialog } from '../../components/Dialog/BaseDialog';
import { LeaveGroupDialog } from '../../components/UserGroupsPage/LeaveGroupDialog';

describe('LeaveGroupDialog component', () => {
    const muiTheme = getMuiTheme();

    const props = {
        show: true,
        onClose: () => {},
        onLeave: () => {},
        groupName: 'Test Group',
    };

    it('should render a BaseDialog with message', () => {
        const wrapper = mount(<LeaveGroupDialog {...props} />, {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: PropTypes.object,
            },
        });
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
        expect(wrapper.find(BaseDialog).props().children)
            .toEqual("I'd like to opt out of all shared rights for the 'Test Group' group.");
    });
});
