import * as React from 'react';
import * as sinon from 'sinon';
import { shallow } from 'enzyme';
import DropDownMenu from '../../components/common/DropDownMenu';
import { DataPackOwnerSort } from '../../components/DataPackPage/DataPackOwnerSort';

describe('DataPackOwnerSort component', () => {
    const getProps = () => ({
        value: 'all',
        handleChange: sinon.spy(),
        owner: 'test_user',
        ...(global as any).eventkit_test_props,
    });

    it('should render a dropdown menu', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackOwnerSort {...props} />);
        expect(wrapper.find(DropDownMenu)).toHaveLength(1);
    });

    it('should render with text "All DataPacks"', () => {
        const props = getProps();
        const wrapper = shallow(<DataPackOwnerSort {...props} />);
        expect(wrapper.find(DropDownMenu).shallow().html()).toContain('All DataPacks');
    });

    it('should render with text "My DataPacks"', () => {
        const props = getProps();
        props.value = 'test_user';
        const wrapper = shallow(<DataPackOwnerSort {...props} />);
        expect(wrapper.find(DropDownMenu).shallow().html()).toContain('My DataPacks');
    });
});
