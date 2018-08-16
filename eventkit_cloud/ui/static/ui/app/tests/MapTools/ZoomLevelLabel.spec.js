import React from 'react';
import { shallow } from 'enzyme';
import ZoomLevelLabel from '../../components/MapTools/ZoomLevelLabel';

describe('ZoomLevelLabel component', () => {
    const getProps = () => ({
        zoomLevel: 2,
    });

    const getShallowWrapper = (props = getProps()) => shallow(<ZoomLevelLabel {...props} />);

    it('should display zoom level', () => {
        const wrapper = getShallowWrapper();
        wrapper.setProps({ zoomLevel: 5 });
        expect(wrapper.find('div').text()).toBe('Zoom Level: 5');
    });
});
