import * as React from 'react';
import * as sinon from 'sinon';
import {shallow} from 'enzyme';
import {DataProvider} from '../../components/CreateDataPack/DataProvider';
import ZoomLevelSlider from "../../components/CreateDataPack/ZoomLevelSlider";

describe('DataProvider component', () => {
    let wrapper;
    let instance;

    const defaultProps = () => ({
        provider: {
            uid: '123',
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
        wrapper = shallow(<DataProvider {...props} />);
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
            expect(wrapper.find(ZoomLevelSlider)).toHaveLength(1);
        });

        it('it renders zoom not supported message when type invalid', () => {
            let provider = {
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
            expect(wrapper.find(ZoomLevelSlider)).toHaveLength(0);
        });
    })
});