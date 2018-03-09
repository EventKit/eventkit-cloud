import React, { PropTypes } from 'react';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { BaseDialog } from '../../components/Dialog/BaseDialog';
import { CustomTextField } from '../../components/CustomTextField';
import { CreateGroupDialog } from '../../components/UserGroupsPage/CreateGroupDialog';

describe('CreateGroupDialog component', () => {
    const muiTheme = getMuiTheme();

    const props = {
        show: true,
        onInputChange: () => {},
        onClose: () => {},
        onSave: () => {},
        value: '',
    };

    it('should render a BaseDialog with a textfield', () => {
        const wrapper = mount(<CreateGroupDialog {...props} />, {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: PropTypes.object,
            },
        });
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
        const textField = mount(wrapper.find(BaseDialog).props().children, {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: PropTypes.object,
            },
        });
        expect(textField.find(CustomTextField)).toHaveLength(1);
    });
});
