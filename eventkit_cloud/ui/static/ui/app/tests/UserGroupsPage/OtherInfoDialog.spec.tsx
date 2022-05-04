import * as sinon from 'sinon';
import { shallow } from 'enzyme';
import BaseDialog from '../../components/Dialog/BaseDialog';
import { OtherInfoDialog } from '../../components/UserGroupsPage/Dialogs/OtherInfoDialog';

describe('OtherInfoDialog component', () => {

    const props = {
        show: true,
        onClose: sinon.spy(),
        ...(global as any).eventkit_test_props,
    };

    it('should render a BaseDialog with a body', () => {
        const wrapper = shallow(<OtherInfoDialog {...props} />);
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
        expect(wrapper.find(BaseDialog).children().find('.qa-OtherInfoDialog-body')).toHaveLength(1);
    });

    it('should return null', () => {
        props.show = false;
        const wrapper = shallow(<OtherInfoDialog {...props} />);
        expect(wrapper.find(BaseDialog)).toHaveLength(0);
    });
});
