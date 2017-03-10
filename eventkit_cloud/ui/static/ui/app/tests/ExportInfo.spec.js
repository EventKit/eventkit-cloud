import {ExportInfo} from '../components/ExportInfo'
import React from 'react'
import {expect} from 'chai'
import {mount, shallow} from 'enzyme'
import {fakeStore} from '../__mocks__/fakeStore'
import { Provider } from 'react-redux'

describe('ExportInfo component', () => {
    const getProps = () => {
        return {
            providers: [],
            bbox: [],
            geojson: { 
                "type": "FeatureCollection",
                "features": [{ "type": "Feature",
                    "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0],
                        [100.0, 1.0], [100.0, 0.0] ]
                        ]
                    },}]
            },
            setExportPackageFlag: false,
            exportName: '',
            datapackDescription: '',
            projectName: '',
            makePublic: false,
            updateExportInfo: () => {},
            setNextDisabled: () => {},
            setNextEnabled: () => {},
        }
    }
    it('should render a form', () => {
        const store = fakeStore({});
        const props = getProps();
        const wrapper = mount(<Provider store={store}><ExportInfo {...props}/></Provider>);
        expect(wrapper.find('.wholeDiv')).to.have.length(1);
        expect(wrapper.find('.root')).to.have.length(1);
        expect(wrapper.find('.form')).to.have.length(1);
        expect(wrapper.find('.paper')).to.have.length(1);
    })

    it('should render a General Information Div', () => {
        const store = fakeStore({});
        const props = getProps();
        const wrapper = mount(<Provider store={store}><ExportInfo {...props}/></Provider>);
        expect(wrapper.find('#mainHeading').text()).to.equal('Enter General Information');
        expect(wrapper.find('.fieldWrapper')).to.have.length(2);
        expect(wrapper.find('.fieldWrapperLarge')).to.have.length(1);
        // expect(wrapper.find('#datapackName')).to.have.length(1);
        // expect(wrapper.find('#description')).to.have.length(1);
        // expect(wrapper.find('#projectName')).to.have.length(1);
        // expect(wrapper.find('#makePublic')).to.have.length(1);
    })

    it('should render a Data Providers Div', () => {
        const store = fakeStore({});
        const props = getProps();
        const wrapper = mount(<Provider store={store}><ExportInfo {...props}/></Provider>);
        expect(wrapper.find('#layersHeader').text()).to.equal('Select Layers');
        expect(wrapper.find('.subHeading')).to.have.length(1);
        expect(wrapper.find('.subHeading').text()).to.equal('You must choose at least one');
        // expect(wrapper.find('.sectionBottom')).to.have.length(1);
        expect(wrapper.find('.list')).to.have.length(1);
        // expect(wrapper.find('.checkboxColor')).to.have.length(5)

    })

});
