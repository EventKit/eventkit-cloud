import * as React from 'react';
import * as sinon from 'sinon';
import { shallow } from 'enzyme';
import { FilterHeader } from '../../components/DataPackPage/FilterHeader';

describe('FilterHeader component', () => {
    const getProps = () => ({
        onApply: sinon.spy(),
        onClear: sinon.spy(),
        ...(global as any).eventkit_test_props,
    });

    it('should render a RaisedButton and a FlatButton', () => {
        const props = getProps();
        const wrapper = shallow(<FilterHeader {...props} />);
        const apply = wrapper.find('.qa-FilterHeader-Button-apply');
        expect(apply).toHaveLength(1);
        expect(apply.html()).toContain('Apply');
        expect(apply.props().onClick).toEqual(props.onApply);

        const clear = wrapper.find('.qa-FilterHeader-Button-clear');
        expect(clear).toHaveLength(1);
        expect(clear.html()).toContain('Clear All');
        expect(clear.props().onClick).toEqual(props.onClear);
    });

    it('should call onApply when Apply Button is clicked', () => {
        const props = getProps();
        props.onApply = sinon.spy();
        const wrapper = shallow(<FilterHeader {...props} />);
        wrapper.find('.qa-FilterHeader-Button-apply').simulate('click');
        expect(props.onApply.calledOnce).toBe(true);
    });

    it('should call onClear when Clear Button is clicked', () => {
        const props = getProps();
        props.onClear = sinon.spy();
        const wrapper = shallow(<FilterHeader {...props} />);
        wrapper.find('.qa-FilterHeader-Button-clear').simulate('click');
        expect(props.onClear.calledOnce).toBe(true);
    });
});
