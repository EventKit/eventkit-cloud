import * as sinon from 'sinon';
import Dialog from '@mui/material/Dialog';
import {ShareBaseDialog} from '../../components/DataPackShareDialog/ShareBaseDialog';
import { shallow } from 'enzyme';

describe('ShareBaseDialog component', () => {

    const getProps = () => ({
        title: 'SHARE',
        children: [<div key="1">hello</div>],
        submitButtonLabel: 'SAVE',
        show: true,
        onClose: sinon.spy(),
        handleSave: sinon.spy(),
        permissionState: {},
        clearDataCartPermissions: sinon.spy(),
        ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;
    let instance;
    const setup = (params = {}, options = {}) => {
        props = {...getProps(), ...params};
        wrapper = shallow(<ShareBaseDialog {...props}/>, options);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render the basic components', () => {
        expect(wrapper.find(Dialog)).toHaveLength(1);
    });

    it('should render null if not open', () => {
        setup({show: false});
        expect(wrapper.getElement()).toBe(null);
    });
});
