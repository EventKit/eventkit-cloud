import * as React from 'react';
import * as sinon from 'sinon';
import { shallow } from 'enzyme';
import { ZoomLevelSlider } from '../../components/CreateDataPack/ZoomLevelSlider';
import Paper from "@material-ui/core/Paper";
import List from "@material-ui/core/List";
import DataProvider from "../../components/CreateDataPack/DataProvider";
import Checkbox from "@material-ui/core/Checkbox";
import MapCard from "../../components/common/MapCard";
import Joyride from "react-joyride";
import {TextField} from "@material-ui/core";
import {Slider} from "@material-ui/lab";

describe('ZoomLevelSlider component', () => {
    let wrapper;
    let instance;

    const defaultProps = () => ({
        provider: {
            uid: '123',
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

    it('should render', () => {
        expect(wrapper.find(TextField)).toHaveLength(1);
        expect(wrapper.find(Slider)).toHaveLength(1);
    });
});
