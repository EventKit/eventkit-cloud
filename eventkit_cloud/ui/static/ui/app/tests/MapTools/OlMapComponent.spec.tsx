import React from 'react';
import MapComponent from "../../components/MapTools/OpenLayers/MapComponent";
import {mount} from "enzyme";


describe('SearchAOIToolbar button', () => {

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}) => {
        props = { ...getProps(), ...overrides };
        wrapper = mount(<MapComponent {...props}><div id="childDiv"/></MapComponent>);
        instance = wrapper.instance();
    };

    const getProps = () => ({
        divId: 'div12',
        style: {display: 'block', height: '55px'},
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

    it('should set display style to none when not visible', () => {
        setup({visible: false});
        expect(wrapper.find(`#${props.divId}`).get(0).props.style).toEqual({...props.style, display: 'none'});
    });


});
