import * as React from 'react';
import { mount } from 'enzyme';
import * as sinon from 'sinon';
import NavigationCheck from '@material-ui/icons/Check';
import Button from '@material-ui/core/Button';
import SaveButton from '../../components/AccountPage/SaveButton';

describe('SaveButton component', () => {
    const getProps = () => ({
        ...(global as any).eventkit_test_props,
        saved: false,
        saveDisabled: true,
        handleSubmit: sinon.spy(),
    });

    const getMountedWrapper = props => mount(<SaveButton {...props} />);

    it('should render a disabled save button', () => {
        const props = getProps();
        const wrapper = getMountedWrapper(props);
        expect(wrapper.find(Button)).toHaveLength(1);
        expect(wrapper.find(Button).props().disabled).toBe(true);
        expect(wrapper.find(Button).text()).toEqual('Save Changes');
    });

    it('should render a not disabled save button', () => {
        const props = getProps();
        props.saveDisabled = false;
        const wrapper = getMountedWrapper(props);
        expect(wrapper.find(Button)).toHaveLength(1);
        expect(wrapper.find(Button).props().disabled).toBe(false);
    });

    it('should render the "saved" button', () => {
        const props = getProps();
        props.saved = true;
        const wrapper = getMountedWrapper(props);
        expect(wrapper.find(Button)).toHaveLength(1);
        expect(wrapper.find(NavigationCheck)).toHaveLength(1);
        expect(wrapper.find(Button).text()).toEqual('Saved');
    });

    it('should switch to the "saved" button when props are updated', () => {
        const props = getProps();
        const wrapper = getMountedWrapper(props);
        expect(wrapper.find(Button).text()).toEqual('Save Changes');
        const nextProps = getProps();
        nextProps.saved = true;
        wrapper.setProps(nextProps);
        expect(wrapper.find(Button).text()).toEqual('Saved');
    });

    it('should call handleSubmit', () => {
        const props = getProps();
        props.saveDisabled = false;
        props.handleSubmit = sinon.spy();
        const wrapper = getMountedWrapper(props);
        expect(props.handleSubmit.notCalled).toBe(true);
        wrapper.find(Button).find('button').simulate('click');
        expect(props.handleSubmit.calledOnce).toBe(true);
    });

    it('should not call handleSubmit when disabled', () => {
        const props = getProps();
        props.handleSubmit = sinon.spy();
        const wrapper = getMountedWrapper(props);
        expect(props.handleSubmit.notCalled).toBe(true);
        wrapper.find(Button).find('button').simulate('click');
        expect(props.handleSubmit.notCalled).toBe(true);
    });
});
