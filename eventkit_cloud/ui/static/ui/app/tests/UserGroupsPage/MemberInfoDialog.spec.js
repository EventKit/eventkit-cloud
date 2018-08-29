import React from 'react';
import { mount } from 'enzyme';
import { BaseDialog } from '../../components/Dialog/BaseDialog';
import MemberInfoDialog from '../../components/UserGroupsPage/Dialogs/MemberInfoDialog';

describe('MemberInfoDialog component', () => {
    const props = {
        show: true,
        onClose: () => {},
    };

    it('should render a BaseDialog with a body', () => {
        const wrapper = mount(<MemberInfoDialog {...props} />);
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
        const body = mount(wrapper.find(BaseDialog).props().children);
        expect(body.find('.qa-MemberInfoDialog-body')).toHaveLength(1);
    });
});
