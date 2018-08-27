import React from 'react';
import { mount } from 'enzyme';
import DropDownMenu from '../../components/common/DropDownMenu';
import DataPackOwnerSort from '../../components/DataPackPage/DataPackOwnerSort';

describe('DataPackOwnerSort component', () => {
    const getProps = () => ({
        value: 'all',
        handleChange: () => {},
        owner: 'test_user',
    });

    it('should render a dropdown menu', () => {
        const props = getProps();
        const wrapper = mount(<DataPackOwnerSort {...props} />);
        expect(wrapper.find(DropDownMenu)).toHaveLength(1);
    });

    it('should render with text "All DataPacks"', () => {
        const props = getProps();
        const wrapper = mount(<DataPackOwnerSort {...props} />);
        expect(wrapper.text()).toEqual('All DataPacks');
    });

    it('should render with text "My DataPacks"', () => {
        const props = getProps();
        props.value = 'test_user';
        const wrapper = mount(<DataPackOwnerSort {...props} />);
        expect(wrapper.text()).toEqual('My DataPacks');
    });
});
