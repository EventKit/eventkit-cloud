import * as React from 'react';
import * as sinon from 'sinon';
import Dialog from '@material-ui/core/Dialog';
import {ShareBaseDialog} from '../../components/DataPackShareDialog/ShareBaseDialog';
import {createShallow} from "@material-ui/core/test-utils";

describe('ShareBaseDialog component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

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
