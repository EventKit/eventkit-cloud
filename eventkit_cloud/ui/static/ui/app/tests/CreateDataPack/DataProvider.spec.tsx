import * as React from 'react';
import * as sinon from 'sinon';
import {shallow} from 'enzyme';
import {DataProvider} from '../../components/CreateDataPack/DataProvider';

const formats = [
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
    },
    {
        uid: '',
        url: 'http://cloud.eventkit.test/api/formats/no3857',
        slug: 'no3857',
        name: 'No 3857',
        description: 'Format not supporting 3857',
    }];

describe('DataProvider component', () => {
    let wrapper;
    let instance;

    const defaultProps = () => ({
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
            supported_formats: formats,
        },
        exportInfo: {
            exportOptions: {123: {minZoom: 0, maxZoom: 1}}
        },
        checked: false,
        onChange: sinon.spy(),
        alt: false,
        classes: {},
        ...(global as any).eventkit_test_props,
    });

    const setup = (propsOverride = {}) => {
        const props = {
            ...defaultProps(),
            ...propsOverride,
        };
        wrapper = shallow(<DataProvider {...props} />, {
            context: { config: { BASEMAP_URL: '', BASEMAP_COPYRIGHT: '' } },
        });
        instance = wrapper.instance();
    };

    beforeEach(setup);

    describe('it sets state correctly', () => {
        let stateSpy;

        beforeEach(() => {
            stateSpy = sinon.spy(instance, 'setState');
        });

        afterEach(() => {
            stateSpy.restore();
        });

        it('handleLicenseOpen sets true in state', () => {
            instance.handleLicenseOpen();
            expect(stateSpy.calledWith({licenseDialogOpen: true})).toBe(true);
        });

        it('handleLicenseClose should set false in state', () => {
            instance.handleLicenseClose();
            expect(stateSpy.calledWith({licenseDialogOpen: false})).toBe(true);
        });

        it('handleExpand should negate the open state', () => {
            const expected = !instance.state.open;
            instance.handleExpand();
            expect(stateSpy.calledOnce).toBe(true);
            expect(instance.state.open).toBe(expected);
        });
    });

    describe('it handles providers correctly', () => {

        it('it renders ZoomLevelSlider when type is valid', () => {
            expect(wrapper.find('div.slug-sliderDiv')).toHaveLength(1);
            expect(wrapper.find('div.slug-mapDiv')).toHaveLength(1);
        });

        it('it renders zoom not supported message when type invalid', () => {
            const provider = {
                uid: '123',
                name: 'test provider',
                max_selection: '10000',
                type: 'osm',
                service_description: 'test description',
                license: {
                    text: 'test license text',
                    name: 'test license',
                },
                availability: {},
                estimate: {},
            };
            setup({provider});
            expect(wrapper.find('div.slug-sliderDiv')).toHaveLength(0);
            expect(wrapper.find('div.slug-mapDiv')).toHaveLength(0);
        });
    });
});
