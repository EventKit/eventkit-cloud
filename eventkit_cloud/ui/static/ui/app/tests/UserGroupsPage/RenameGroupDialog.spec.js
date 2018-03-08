import React, { PropTypes } from 'react';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import RaisedButton from 'material-ui/RaisedButton';
import { BaseDialog } from '../../components/Dialog/BaseDialog';
import CustomTextField from '../../components/CustomTextField';
import RenameGroupDialog from '../../components/UserGroupsPage/RenameGroupDialog';

describe('LeaveGroupDialog component', () => {
    const muiTheme = getMuiTheme();

    const props = {
        show: true,
        onInputChange: () => {},
        onClose: () => {},
        onSave: () => {},
        value: '',
        valid: true,
    };


    it('should render a BaseDialog with text field', () => {
        const wrapper = mount(<RenameGroupDialog {...props} />, {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: PropTypes.object,
            },
        });
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
        const child = mount(wrapper.find(BaseDialog).props().children[1], {
            ...props,
            context: { muiTheme },
            childContextTypes: { muiTheme: PropTypes.object },
        });
        expect(child.find(CustomTextField)).toHaveLength(1);
    });

    it('should show name unavailable warning', () => {
        props.valid = false;
        const wrapper = mount(<RenameGroupDialog {...props} />, {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: PropTypes.object,
            },
        });
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
        const child = mount(wrapper.find(BaseDialog).props().children[0], {
            ...props,
            context: { muiTheme },
            childContextTypes: { muiTheme: PropTypes.object },
        });
        expect(child.text()).toEqual('Name unavailable');
    });

    it('should set the save button disabled if no value or its invalid', () => {
        props.valid = true;
        props.value = '';
        const wrapper = mount(<RenameGroupDialog {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: PropTypes.object },
        });
        expect(wrapper.find(BaseDialog).props().actions[0].props.disabled).toBe(true);
        wrapper.setProps({ valid: false, value: 'something' });
        expect(wrapper.find(BaseDialog).props().actions[0].props.disabled).toBe(true);
    });
});
