import * as React from 'react';
import * as sinon from 'sinon';
import { mount } from 'enzyme';
import Clear from '@material-ui/icons/Clear';
import { AlertCallout } from '../../components/CreateDataPack/AlertCallout';

describe('AlertCallout component', () => {
    const getProps = () => ({
        style: {},
        onClose: sinon.spy(),
        title: 'test title',
        body: 'test body',
        ...(global as any).eventkit_test_props,
    });

    const getWrapper = props => (
        mount(<AlertCallout {...props} />)
    );

    it('should render the basic elements', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-AlertCallout')).toHaveLength(1);
        expect(wrapper.find('.qa-AlertCallout-title').text()).toEqual('test title');
        expect(wrapper.find('.qa-AlertCallout-body').text()).toEqual('test body');
    });

    it('should call onClose when the clear icon is clicked', () => {
        const props = getProps();
        props.onClose = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.find(Clear).simulate('click');
        expect(props.onClose.calledOnce).toBe(true);
    });
});
