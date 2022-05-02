import OlMapComponent from "../../components/MapTools/OpenLayers/OlMapComponent";
import {mount} from "enzyme";


describe('OlMapComponent', () => {

    let props;
    let wrapper;
    const setup = (overrides = {}) => {
        props = { ...getProps(), ...overrides };
        wrapper = mount(<OlMapComponent {...props}><div id="childDiv"/></OlMapComponent>);
    };

    const getProps = () => ({
        divId: 'div12',
        style: {visibility: 'hidden', height: '55px'},
        zoomLevel: 2,
        minZoom: 0,
        maxZoom: 20,
        visible: true,
        ...(global as any).eventkit_test_props,
    });


    beforeEach(setup);
    it('should render the map div', () => {
        expect(wrapper.find(`#${props.divId}`)).toHaveLength(1);
    });

    it('should pass style props correctly', () => {
        expect(wrapper.find(`#${props.divId}`).get(0).props.style).toEqual({...props.style});
    });

    it('should set visibility style to hidden when not visible', () => {
        setup({visible: false});
        expect(wrapper.find(`#${props.divId}`).get(0).props.style).toEqual({...props.style, visibility: 'hidden'});
    });
});
