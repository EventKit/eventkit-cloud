import React from 'react';
import { mount } from 'enzyme';
import Button from '@material-ui/core/Button';
import DataPackLinkButton from '../../components/DataPackPage/DataPackLinkButton';

describe('DataPackLinkButton component', () => {
    it('should render a linked button', () => {
        const wrapper = mount(<DataPackLinkButton />);
        expect(wrapper.find(Button)).toHaveLength(1);
        expect(wrapper.find(Button).props().href).toEqual('/create');
        expect(wrapper.find(Button).text()).toEqual('Create DataPack');
    });
});
