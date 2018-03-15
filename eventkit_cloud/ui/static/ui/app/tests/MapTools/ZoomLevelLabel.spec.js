import React from 'react';
import { shallow } from 'enzyme';
import ZoomLevelLabel from '../../components/MapTools/ZoomLevelLabel';

describe('ZoomLevelLabel component', () => {
    const getProps = () => {
        return {
            zoomLevel: 2,
        };
    };
    
    const getShallowWrapper = (props = getProps()) => {
        return shallow(<ZoomLevelLabel {...props} />);
    };
    
    it('should display zoom level', () => {
        const wrapper = getShallowWrapper();
        wrapper.setProps({ zoomLevel: 5 });
        expect(wrapper.find('div').text()).toBe('Zoom Level: 5');
    });
});
