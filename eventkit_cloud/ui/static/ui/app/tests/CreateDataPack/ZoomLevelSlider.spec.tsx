import * as React from 'react';
import { shallow } from 'enzyme';
import { ZoomLevelSlider } from '../../components/CreateDataPack/ZoomLevelSlider';

import {TextField} from "@material-ui/core";
import {Slider} from "@material-ui/lab";

describe('ZoomLevelSlider component', () => {
    let wrapper;
    let instance;

    const defaultProps = () => ({
        provider: {
            uid: '123',
            type: 'wmts',
            name: 'test provider',
            max_selection: '10000',
            service_description: 'test description',
            license: {
                text: 'test license text',
                name: 'test license',
            },
            availability: {},
            estimate: {},
        },
        updateZoom: (x, y) => {},
        providerZoom: 1,
        classes: {},
        ...(global as any).eventkit_test_props,
    });

    const setup = (propsOverride = {}) => {
        const props = {
            ...defaultProps(),
            ...propsOverride,
        };
        wrapper = shallow(<ZoomLevelSlider {...props} />);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render input controls', () => {
        expect(wrapper.find(TextField)).toHaveLength(1);
        expect(wrapper.find(Slider)).toHaveLength(1);
    });
});
