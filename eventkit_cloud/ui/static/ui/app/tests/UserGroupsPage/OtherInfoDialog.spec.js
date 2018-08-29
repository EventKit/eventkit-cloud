import React from 'react';
import { mount } from 'enzyme';
import { BaseDialog } from '../../components/Dialog/BaseDialog';
import OtherInfoDialog from '../../components/UserGroupsPage/Dialogs/OtherInfoDialog';

describe('OtherInfoDialog component', () => {
    const props = {
        show: true,
        onClose: () => {},
    };

    it('should render a BaseDialog with a body', () => {
        const wrapper = mount(<OtherInfoDialog {...props} />);
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
        const body = mount(wrapper.find(BaseDialog).props().children);
        expect(body.find('.qa-OtherInfoDialog-body')).toHaveLength(1);
    });
});
