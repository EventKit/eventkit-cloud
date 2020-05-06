import * as React from 'react';
import {mount, shallow} from 'enzyme';
import * as sinon from 'sinon';
import { ZoomLevelSlider } from '../../components/CreateDataPack/ZoomLevelSlider';
import {Switch, TextField} from "@material-ui/core";
import {Slider} from "@material-ui/lab";
import {MapDrawer} from "../../components/CreateDataPack/MapDrawer";
import Radio from "@material-ui/core/Radio";


describe('ZoomLevelSlider component', () => {

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
        selectedMaxZoom: 10,
        selectedMinZoom: 0,
        maxZoom: 15,
        minZoom: 0,
        updateZoom: (x, y) => {},
        providerZoom: 1,
        classes: {},
        ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}) => {
        props = {...defaultProps(), ...overrides};
        wrapper = mount(<ZoomLevelSlider {...props} />);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render input controls and footprints switch control', () => {
        expect(wrapper.find(TextField)).toHaveLength(2);
        expect(wrapper.find(Slider)).toHaveLength(1);
    });

    it('should fire the updateMin function when the minimum zoom-value textbox is changed', () => {
      const mockedEvent = sinon.spy();
      const mockCallBack = sinon.spy();
      const value = 2;

      mockCallBack(mockedEvent, value);
      wrapper.find(TextField).at(0).simulate('change');
      expect(mockCallBack.calledOnce).toBe(true);
    });

    it('should fire the updateMax function when the maximum zoom-value textbox is changed', () => {
      const mockedEvent = sinon.spy();
      const mockCallBack = sinon.spy();
      const value = 8;

      mockCallBack(mockedEvent, value);
      wrapper.find(TextField).at(1).simulate('change');
      expect(mockCallBack.calledOnce).toBe(true);
    });
});
