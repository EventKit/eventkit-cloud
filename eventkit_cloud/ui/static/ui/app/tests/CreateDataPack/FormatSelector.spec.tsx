import * as React from 'react';
import * as sinon from 'sinon';
import Checkbox from '@material-ui/core/Checkbox';
import {mount} from 'enzyme';
import {FormatSelector} from "../../components/CreateDataPack/FormatSelector";

describe('DataProvider component', () => {
    let wrapper;
    let instance;

    const defaultProps = () => ({
        updateExportOptions: (x, y) => {},
        provider: {
            uid: '123',
            slug: 'slug',
            name: 'test provider',
            max_selection: '10000',
            type: 'wmts',
            service_description: 'test description',
            license: {
                text: 'test license text',
                name: 'test license',
            },
            availability: {},
            estimate: {},
        },
        formats: [
            {
                uid: 'ed48a7c1-1fc3-463e-93b3-e93eb3861a5a',
                url: 'http://cloud.eventkit.test/api/formats/shp',
                slug: 'shp',
                name: 'ESRI Shapefile Format',
                description: 'Esri Shapefile (OSM Schema)',
            },
            {
                uid: '978ab89c-caf7-4296-9a0c-836fc679ea07',
                url: 'http://cloud.eventkit.test/api/formats/gpkg',
                slug: 'gpkg',
                name: 'Geopackage',
                description: 'GeoPackage',
            }],
        providerOptions: {minZoom: 0, maxZoom: 1},
        classes: {},
        ...(global as any).eventkit_test_props,
    });

    const setup = (propsOverride = {}) => {
        const props = {
            ...defaultProps(),
            ...propsOverride,
        };
        wrapper = mount(<FormatSelector {...props} />);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render input controls', () => {
        expect(wrapper.find('.qa-FormatSelector-Container')).toHaveLength(1);
        expect(wrapper.find(Checkbox)).toHaveLength(2);
    });

    it('should default to not selected', () => {

        wrapper.find(Checkbox).forEach(node => {
            expect(node.props().checked).toBe(false);
        });
    });

    it('should list as checked when formats are in the store', () => {
        setup({providerOptions: {
            minZoom: 0, maxZoom: 1, formats: ['gpkg', 'shp']
        }});
        wrapper.find(Checkbox).forEach(node => {
            expect(node.props().checked).toBe(true);
        });
    });
});
