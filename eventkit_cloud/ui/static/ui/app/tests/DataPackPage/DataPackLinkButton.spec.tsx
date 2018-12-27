import * as React from 'react';
import { shallow } from 'enzyme';
import Button from '@material-ui/core/Button';
import { DataPackLinkButton } from '../../components/DataPackPage/DataPackLinkButton';

describe('DataPackLinkButton component', () => {
    it('should render a linked button', () => {
        const wrapper = shallow(<DataPackLinkButton {...(global as any).eventkit_test_props} />);
        expect(wrapper.find(Button)).toHaveLength(1);
        expect(wrapper.find(Button).props().href).toEqual('/create');
        expect(wrapper.find(Button).html()).toContain('Create DataPack');
    });
});
