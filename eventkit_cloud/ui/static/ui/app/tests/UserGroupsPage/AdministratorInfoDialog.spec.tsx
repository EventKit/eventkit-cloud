import * as React from 'react';
import * as sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import BaseDialog from '../../components/Dialog/BaseDialog';
import { AdministratorInfoDialog } from '../../components/UserGroupsPage/Dialogs/AdministratorInfoDialog';

describe('AdministratorInfoDialog component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const props = {
        show: true,
        onClose: sinon.spy(),
        ...(global as any).eventkit_test_props,
    };

    it('should render a BaseDialog with a body', () => {
        const wrapper = shallow(<AdministratorInfoDialog {...props} />);
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
        const body = shallow(wrapper.find(BaseDialog).props().children);
        expect(body.find('.qa-AdministratorInfoDialog-body')).toHaveLength(1);
    });

    it('should return null', () => {
        props.show = false;
        const wrapper = shallow(<AdministratorInfoDialog {...props} />);
        expect(wrapper.find(BaseDialog)).toHaveLength(0);
    });
});
