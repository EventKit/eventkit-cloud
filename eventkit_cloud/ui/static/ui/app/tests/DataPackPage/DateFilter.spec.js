import React from 'react';
import { mount } from 'enzyme';
import DatePicker from '../../components/common/DatePicker';
import DateFilter from '../../components/DataPackPage/DateFilter';

describe('DateFilter component', () => {
    const getProps = () => ({
        onMinChange: () => {},
        onMaxChange: () => {},
        minDate: null,
        maxDate: null,
    });

    it('should render a title and two date pickers', () => {
        const props = getProps();
        const wrapper = mount(<DateFilter {...props} />);
        expect(wrapper.find('p').text()).toEqual('Date Added');
        expect(wrapper.find(DatePicker)).toHaveLength(2);
        expect(wrapper.find('span').first().text()).toEqual('From');
        expect(wrapper.find(DatePicker).first().props().onChange).toEqual(props.onMinChange);
        expect(wrapper.find(DatePicker).first().props().value).toEqual(null);
        expect(wrapper.find('span').last().text()).toEqual('To');
        expect(wrapper.find(DatePicker).last().props().onChange).toEqual(props.onMaxChange);
        expect(wrapper.find(DatePicker).last().props().value).toEqual(null);
    });

    it('should handle minDate update', () => {
        const props = getProps();
        const wrapper = mount(<DateFilter {...props} />);
        const nextProps = getProps();
        nextProps.minDate = '2015-12-01';
        wrapper.setProps(nextProps);
        expect(wrapper.find(DatePicker).first().props().value).toEqual('2015-12-01');
    });

    it('should handle maxDate update', () => {
        const props = getProps();
        const wrapper = mount(<DateFilter {...props} />);
        const nextProps = getProps();
        nextProps.maxDate = '2015-12-01';
        wrapper.setProps(nextProps);
        expect(wrapper.find(DatePicker).last().props().value).toEqual('2015-12-01');
    });
});
