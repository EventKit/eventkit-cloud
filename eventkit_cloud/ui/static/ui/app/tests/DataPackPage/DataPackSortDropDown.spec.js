import React from 'react';
import { mount } from 'enzyme';
import DropDownMenu from '../../components/common/DropDownMenu';
import DataPackSortDropDown from '../../components/DataPackPage/DataPackSortDropDown';

describe('DataPackSortDropDown component', () => {
    const getProps = () => ({
        handleChange: () => {},
        value: '-started_at',
    });

    it('should render a dropdown menu', () => {
        const props = getProps();
        const wrapper = mount(<DataPackSortDropDown {...props} />);
        expect(wrapper.find(DropDownMenu)).toHaveLength(1);
        expect(wrapper.find(DropDownMenu).props().children).toHaveLength(5);
    });

    it('should render with text "Newest"', () => {
        const props = getProps();
        const wrapper = mount(<DataPackSortDropDown {...props} />);
        expect(wrapper.text()).toEqual('Newest');
    });

    it('should render with text "Oldest"', () => {
        const props = getProps();
        props.value = 'started_at';
        const wrapper = mount(<DataPackSortDropDown {...props} />);
        expect(wrapper.text()).toEqual('Oldest');
    });

    it('should render with text "Name (A-Z)"', () => {
        const props = getProps();
        props.value = 'job__name';
        const wrapper = mount(<DataPackSortDropDown {...props} />);
        expect(wrapper.text()).toEqual('Name (A-Z)');
    });

    it('should render with text "Name (Z-A)"', () => {
        const props = getProps();
        props.value = '-job__name';
        const wrapper = mount(<DataPackSortDropDown {...props} />);
        expect(wrapper.text()).toEqual('Name (Z-A)');
    });
});
