import React from 'react';
import { shallow } from 'enzyme';
import Dialog from '@material-ui/core/Dialog';
import { ShareBaseDialog } from '../../components/DataPackShareDialog/ShareBaseDialog';


describe('ShareBaseDialog component', () => {
    const getProps = () => (
        {
            title: 'SHARE',
            children: [<div>hello</div>],
            submitButtonLabel: 'SAVE',
            show: true,
            onClose: () => {},
            handleSave: () => {},
            ...global.eventkit_test_props,
        }
    );

    const getWrapper = props => (
        shallow(<ShareBaseDialog {...props} />)
    );

    it('should render the basic components', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(Dialog)).toHaveLength(1);
    });

    it('should render null', () => {
        const props = getProps();
        props.show = false;
        const wrapper = getWrapper(props);
        expect(wrapper.getElement()).toBe(null);
    });
});
