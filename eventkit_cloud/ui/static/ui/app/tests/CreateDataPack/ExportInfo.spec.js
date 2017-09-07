import {ExportInfo} from '../../components/CreateDataPack/ExportInfo'
import React from 'react'
import {mount, shallow} from 'enzyme'
import {fakeStore} from '../../__mocks__/fakeStore'
import { Provider } from 'react-redux'
import CustomScrollbar from '../../components/CustomScrollbar';
import BaseDialog from '../../components/BaseDialog';
import Checkbox from 'material-ui/Checkbox'

describe('ExportInfo component', () => {
    const getProps = () => {
        return {
            providers: [],
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
            exportInfo: {
                exportName: '',
                datapackDescription: '',
                projectName: '',
                makePublic: false,
            },
            updateExportInfo: () => {},
            setNextDisabled: () => {},
            setNextEnabled: () => {},
            setExportInfoNotDone: () => {},
        }
    }
    it('should render a form', () => {
        const store = fakeStore({});
        const props = getProps();
        const wrapper = mount(<Provider store={store}><ExportInfo {...props}/></Provider>);
        expect(wrapper.find('.root')).toHaveLength(1);
        expect(wrapper.find('.form')).toHaveLength(1);
        expect(wrapper.find('.paper')).toHaveLength(1);
        expect(wrapper.find(BaseDialog)).toHaveLength(2);
    })

    it('should render a CustomScrollbar component', () => {
        const store = fakeStore({});
        const props = getProps();
        const wrapper = mount(<Provider store={store}><ExportInfo {...props}/></Provider>);
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
    })

    it('should render a General Information Div', () => {
        const store = fakeStore({});
        const props = getProps();
        const wrapper = mount(<Provider store={store}><ExportInfo {...props}/></Provider>);
        expect(wrapper.find('#mainHeading').text()).toEqual('Enter General Information');
        // expect(wrapper.find('.fieldWrapper')).toHaveLength(2);
        // expect(wrapper.find('.fieldWrapperLarge')).toHaveLength(1);
        // expect(wrapper.find('#datapackName')).toHaveLength(1);
        // expect(wrapper.find('#description')).toHaveLength(1);
        // expect(wrapper.find('#projectName')).toHaveLength(1);
        // expect(wrapper.find('#makePublic')).toHaveLength(1);
    })

    it('should render a Data Providers Div', () => {
        const store = fakeStore({});
        const props = getProps();
        const wrapper = mount(<Provider store={store}><ExportInfo {...props}/></Provider>);
        expect(wrapper.find('#layersHeader').text()).toEqual('Select Data Sources');
        expect(wrapper.find('.subHeading')).toHaveLength(1);
        expect(wrapper.find('.subHeading').text()).toEqual('You must choose at least one');
        // expect(wrapper.find('.sectionBottom')).toHaveLength(1);
        expect(wrapper.find('.list')).toHaveLength(1);
        // expect(wrapper.find('.checkboxColor')).toHaveLength(5)

    })

    it('should render a File Formats Div', () => {
        const store = fakeStore({});
        const props = getProps();
        const wrapper = mount(<Provider store={store}><ExportInfo {...props}/></Provider>);
        expect(wrapper.find('#formatsHeader').text()).toEqual('Select Export File Formats');
    })

    it('should render a projections Div', () => {
        const store = fakeStore({});
        const props = getProps();
        const wrapper = mount(<Provider store={store}><ExportInfo {...props}/></Provider>);
        expect(wrapper.find('#projectionsHeader').text()).toEqual('Select Projection');
    })

});
