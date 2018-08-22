import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import FilterHeader from '../../components/DataPackPage/FilterHeader';

describe('FilterHeader component', () => {
    const getProps = () => ({
        onApply: () => {},
        onClear: () => {},
    });

    it('should render a RaisedButton and a FlatButton', () => {
        const props = getProps();
        const wrapper = mount(<FilterHeader {...props} />);
        const apply = wrapper.find('.qa-FilterHeader-Button-apply').hostNodes();
        expect(apply).toHaveLength(1);
        expect(apply.text()).toEqual('Apply');
        expect(apply.props().onClick).toEqual(props.onApply);

        const clear = wrapper.find('.qa-FilterHeader-Button-clear').hostNodes();
        expect(clear).toHaveLength(1);
        expect(clear.text()).toEqual('Clear All');
        expect(clear.props().onClick).toEqual(props.onClear);
    });

    it('should call onApply when Apply Button is clicked', () => {
        const props = getProps();
        props.onApply = sinon.spy();
        const wrapper = mount(<FilterHeader {...props} />);
        wrapper.find('.qa-FilterHeader-Button-apply').find('button').simulate('click');
        expect(props.onApply.calledOnce).toBe(true);
    });

    it('should call onClear when Clear Button is clicked', () => {
        const props = getProps();
        props.onClear = sinon.spy();
        const wrapper = mount(<FilterHeader {...props} />);
        wrapper.find('.qa-FilterHeader-Button-clear').find('button').simulate('click');
        expect(props.onClear.calledOnce).toBe(true);
    });
});
