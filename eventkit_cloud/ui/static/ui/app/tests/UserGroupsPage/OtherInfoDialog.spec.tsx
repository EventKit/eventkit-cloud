import * as React from 'react';
import * as sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import BaseDialog from '../../components/Dialog/BaseDialog';
import { OtherInfoDialog } from '../../components/UserGroupsPage/Dialogs/OtherInfoDialog';

describe('OtherInfoDialog component', () => {
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
        const wrapper = shallow(<OtherInfoDialog {...props} />);
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
        const body = shallow(wrapper.find(BaseDialog).props().children);
        expect(body.find('.qa-OtherInfoDialog-body')).toHaveLength(1);
    });

    it('should return null', () => {
        props.show = false;
        const wrapper = shallow(<OtherInfoDialog {...props} />);
        expect(wrapper.find(BaseDialog)).toHaveLength(0);
    });
});
