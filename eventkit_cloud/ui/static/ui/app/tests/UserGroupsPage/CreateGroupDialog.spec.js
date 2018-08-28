import React from 'react';
import { mount } from 'enzyme';
import { BaseDialog } from '../../components/Dialog/BaseDialog';
import { CustomTextField } from '../../components/CustomTextField';
import { CreateGroupDialog } from '../../components/UserGroupsPage/Dialogs/CreateGroupDialog';

describe('CreateGroupDialog component', () => {
    const props = {
        show: true,
        onInputChange: () => {},
        onClose: () => {},
        onSave: () => {},
        value: '',
    };

    it('should render a BaseDialog with a textfield', () => {
        const wrapper = mount(<CreateGroupDialog {...props} />);
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
        const textField = mount(wrapper.find(BaseDialog).props().children);
        expect(textField.find(CustomTextField)).toHaveLength(1);
    });
});
