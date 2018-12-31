import * as React from 'react';
import * as sinon from 'sinon';
import { shallow } from 'enzyme';
import AlertWarning from '@material-ui/icons/Warning';
import ImageCropSquare from '@material-ui/icons/CropSquare';
import ActionRoom from '@material-ui/icons/Room';
import ActionZoomIn from '@material-ui/icons/ZoomIn';
import Line from '@material-ui/icons/Timeline';
import Extent from '@material-ui/icons/SettingsOverscan';
import IrregularPolygon from '../../components/icons/IrregularPolygon';
import AlertCallout from '../../components/CreateDataPack/AlertCallout';
import { AoiInfobar } from '../../components/CreateDataPack/AoiInfobar';

describe('AoiInfobar component', () => {
    const getProps = () => ({
        aoiInfo: {
            geojson: {},
            originalGeojson: {},
            geomType: null,
            title: null,
            description: null,
            buffer: 0,
        },
        showAlert: false,
        showRevert: false,
        onRevertClick: sinon.spy(),
        clickZoomToSelection: sinon.spy(),
        handleBufferClick: sinon.spy(),
        limits: {
            max: 10,
            sizes: [5, 10],
        },
        ...(global as any).eventkit_test_props,
        classes: {},
    });

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}) => {
        props = { ...getProps(), ...overrides };
        wrapper = shallow(<AoiInfobar {...props} />);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    const geojson = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [[
                        [100.0, 0.0],
                        [101.0, 0.0],
                        [101.0, 1.0],
                        [100.0, 1.0],
                        [100.0, 0.0],
                    ]],
                },
            },
        ],
    };

    it('should not display the infobar by default', () => {
        expect(wrapper.find('.qa-AoiInfobar')).toHaveLength(0);
    });

    it('should show aoiInfo', () => {
        const aoiInfo = {
            ...props.aoiInfo,
            geojson,
            description: 'fake description',
            geomType: 'Polygon',
            title: 'fake title',
        };
        setup({ aoiInfo });
        expect(wrapper.find('.qa-AoiInfobar')).toHaveLength(1);
        expect(wrapper.find('.qa-AoiInfobar-title').text()).toEqual('AREA OF INTEREST (AOI)');
        expect(wrapper.find('.qa-AoiInfobar-button-zoom')).toHaveLength(1);
        expect(wrapper.find('.qa-AoiInfobar-button-zoom').first().text()).toContain(' ZOOM TO');
        expect(wrapper.find(ActionZoomIn)).toHaveLength(1);
        expect(wrapper.find('.qa-AoiInfobar-infoTitle').text()).toEqual('fake title');
        expect(wrapper.find('.qa-AoiInfobar-infoDescription').text()).toEqual('fake description');
        expect(wrapper.find('.qa-AoiInfobar-icon-polygon')).toHaveLength(1);
    });

    it('clicking on zoom button should call clickZoomToSelection', () => {
        const aoiInfo = {
            ...props.aoiInfo,
            geojson,
            description: 'fake description',
            geomType: 'Polygon',
            title: '0 sq km fake title',
        };
        setup({ aoiInfo });
        wrapper.find('.qa-AoiInfobar-button-zoom').simulate('click');
        expect(props.clickZoomToSelection.calledOnce).toEqual(true);
    });

    it('clicking on revert button should call onRevertClick', () => {
        const aoiInfo = {
            ...props.aoiInfo,
            geojson,
            description: 'fake description',
            geomType: 'Polygon',
            title: '0 sq km fake title',
        };
        setup({ aoiInfo, showRevert: true });
        wrapper.find('.qa-AoiInfobar-button-revert').simulate('click');
        expect(props.onRevertClick.calledOnce).toBe(true);
    });

    it('clicking on buffer button should call handleBufferClick', () => {
        const aoiInfo = {
            ...props.aoiInfo,
            geojson,
            description: 'fake description',
            geomType: 'Polygon',
            title: 'fake title',
        };
        setup({ aoiInfo });
        wrapper.find('.qa-AoiInfobar-buffer-button').shallow().simulate('click');
        expect(props.handleBufferClick.calledOnce).toBe(true);
    });

    it('should show an alert icon which calls showAlert on click', () => {
        const showSpy = sinon.spy(AoiInfobar.prototype, 'showAlert');
        const aoiInfo = {
            ...props.aoiInfo,
            geojson,
            description: 'fake description',
            geomType: 'Polygon',
            title: 'fake title',
        };
        setup({ aoiInfo, limits: { ...props.limits, max: 0.0000000001 } });
        expect(wrapper.find('.qa-AoiInfobar-alert-icon')).toHaveLength(1);
        wrapper.find('.qa-AoiInfobar-alert-icon').simulate('click');
        expect(showSpy.calledOnce).toBe(true);
        showSpy.restore();
    });

    it('getIcon should return ImageCropSquare', () => {
        const icon = instance.getIcon('Polygon', 'Box');
        expect(icon.type).toBe(ImageCropSquare);
    });

    it('getIcon should return Extent', () => {
        const icon = instance.getIcon('Polygon', 'Map View');
        expect(icon.type).toBe(Extent);
    });

    it('getIcon should return ActionRoom', () => {
        const icon = instance.getIcon('Point', '');
        expect(icon.type).toBe(ActionRoom);
    });

    it('getIcon should return Line', () => {
        const icon = instance.getIcon('Line', '');
        expect(icon.type).toBe(Line);
    });

    it('getIcon should return IrregularPolygon', () => {
        const icon = instance.getIcon('Polygon', '');
        expect(icon.type).toBe(IrregularPolygon);
    });

    it('getIcon should return IrregularPolygon', () => {
        const icon = instance.getIcon('Collection', '');
        expect(icon.type).toBe(IrregularPolygon);
    });

    it('getIcon should return AlertWarning', () => {
        const icon = instance.getIcon('', '');
        expect(icon.type).toEqual(AlertWarning);
    });

    it('showAlert should set show to true', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        instance.showAlert();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ showAlert: true })).toBe(true);
    });

    it('closeAlert should set show to false', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        instance.closeAlert();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ showAlert: false })).toBe(true);
    });

    it('AlertCallout should show when alert state is true', () => {
        const aoiInfo = {
            ...props.aoiInfo,
            geojson,
            description: 'fake description',
            geomType: 'Polygon',
            title: 'fake title',
        };
        setup({ aoiInfo, limits: { ...props.limits, max: 500 } });
        expect(wrapper.find(AlertCallout)).toHaveLength(1);
    });
});
