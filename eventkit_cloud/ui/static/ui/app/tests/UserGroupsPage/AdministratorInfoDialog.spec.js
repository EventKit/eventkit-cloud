import React from 'react';
import { mount } from 'enzyme';
import { BaseDialog } from '../../components/Dialog/BaseDialog';
import AdministratorInfoDialog from '../../components/UserGroupsPage/Dialogs/AdministratorInfoDialog';

describe('AdministratorInfoDialog component', () => {
    const props = {
        show: true,
        onClose: () => {},
    };

    it('should render a BaseDialog with a body', () => {
        const wrapper = mount(<AdministratorInfoDialog {...props} />);
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
        const body = mount(wrapper.find(BaseDialog).props().children);
        expect(body.find('.qa-AdministratorInfoDialog-body')).toHaveLength(1);
    });
});
