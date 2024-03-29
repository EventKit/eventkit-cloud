import {ChangeEvent} from 'react';
import { ZoomLevelSlider } from '../../components/CreateDataPack/ZoomLevelSlider';
import {TextField} from "@material-ui/core";
import {Slider} from "@material-ui/core";
import {createShallow} from "@material-ui/core/test-utils";


describe('ZoomLevelSlider component', () => {
    let shallow: any;

    beforeAll(() => {
        shallow = createShallow();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const updateZoomSpy = jest.fn()

    const getProps = () => ({
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
        updateZoom: updateZoomSpy,
        providerZoom: 1,
        classes: {},
        ...(global as any).eventkit_test_props,
    });

    const getWrapper = props => shallow(<ZoomLevelSlider {...props}/>);


    it('should render input controls and footprints switch control', () => {
        const wrapper = getWrapper(getProps());
        expect(wrapper.find(TextField)).toHaveLength(2);
        expect(wrapper.find(Slider)).toHaveLength(1);
    });

    it('should fire the updateZoom function when the minimum zoom-value textbox is changed', () => {
        const wrapper = getWrapper(getProps());
        const event = {target: {value: "3", name: "zoom-value"}} as ChangeEvent<HTMLInputElement>;
        wrapper.find(TextField).at(0).simulate("change", event);
        expect(updateZoomSpy).toBeCalledTimes(1);
    });

    it('should fire the updateZoom function when the maximum zoom-value textbox is changed', () => {
        const wrapper = getWrapper(getProps());
        const event = {target: {value: '13'}} as ChangeEvent<HTMLInputElement>;
        wrapper.find(TextField).at(1).simulate('change', event);
        expect(updateZoomSpy).toBeCalledTimes(1);
    });
});
