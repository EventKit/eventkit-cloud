import React from 'react';
import sinon from 'sinon';
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
    const getProps = () => (
        {
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
            onRevertClick: () => {},
            clickZoomToSelection: () => {},
            handleBufferClick: () => {},
            ...global.eventkit_test_props,
        }
    );

    const getWrapper = props => (
        shallow(<AoiInfobar {...props} />)
    );

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
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-AoiInfobar')).toHaveLength(0);
    });

    it('should show aoiInfo', () => {
        const props = getProps();
        props.aoiInfo.geojson = geojson;
        props.aoiInfo.description = 'fake description';
        props.aoiInfo.geomType = 'Polygon';
        props.aoiInfo.title = 'fake title';
        const wrapper = getWrapper(props);
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
        const props = getProps();
        props.clickZoomToSelection = sinon.spy();
        props.aoiInfo.geojson = geojson;
        props.aoiInfo.description = 'fake description';
        props.aoiInfo.geomType = 'Polygon';
        props.aoiInfo.title = '0 sq km fake title';
        const wrapper = getWrapper(props);
        wrapper.find('.qa-AoiInfobar-button-zoom').simulate('click');
        expect(props.clickZoomToSelection.calledOnce).toEqual(true);
    });

    it('clicking on revert button should call onRevertClick', () => {
        const props = getProps();
        props.aoiInfo.geojson = geojson;
        props.aoiInfo.description = 'fake description';
        props.aoiInfo.geomType = 'Polygon';
        props.aoiInfo.title = '0 sq km fake title';
        props.showRevert = true;
        props.onRevertClick = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.find('.qa-AoiInfobar-button-revert').simulate('click');
        expect(props.onRevertClick.calledOnce).toBe(true);
    });

    it('clicking on buffer button should call handleBufferClick', () => {
        const props = getProps();
        props.aoiInfo.geojson = geojson;
        props.aoiInfo.description = 'fake description';
        props.aoiInfo.geomType = 'Polygon';
        props.aoiInfo.title = 'fake title';
        props.handleBufferClick = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.find('.qa-AoiInfobar-buffer-button').shallow().simulate('click');
        expect(props.handleBufferClick.calledOnce).toBe(true);
    });

    it('should show an alert icon which calls showAlert on click', () => {
        const props = getProps();
        props.aoiInfo.geojson = geojson;
        props.aoiInfo.description = 'fake description';
        props.aoiInfo.geomType = 'Polygon';
        props.aoiInfo.title = 'fake title';
        props.maxVectorAoiSqKm = 0.0000000001;
        const showSpy = sinon.spy(AoiInfobar.prototype, 'showAlert');
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-AoiInfobar-alert-icon')).toHaveLength(1);
        wrapper.find('.qa-AoiInfobar-alert-icon').simulate('click');
        expect(showSpy.calledOnce).toBe(true);
        showSpy.restore();
    });

    it('getIcon should return ImageCropSquare', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const icon = wrapper.instance().getIcon('Polygon', 'Box');
        expect(icon.type).toBe(ImageCropSquare);
    });

    it('getIcon should return Extent', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const icon = wrapper.instance().getIcon('Polygon', 'Map View');
        expect(icon.type).toBe(Extent);
    });

    it('getIcon should return ActionRoom', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const icon = wrapper.instance().getIcon('Point', '');
        expect(icon.type).toBe(ActionRoom);
    });

    it('getIcon should return Line', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const icon = wrapper.instance().getIcon('Line', '');
        expect(icon.type).toBe(Line);
    });

    it('getIcon should return IrregularPolygon', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const icon = wrapper.instance().getIcon('Polygon', '');
        expect(icon.type).toBe(IrregularPolygon);
    });

    it('getIcon should return IrregularPolygon', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const icon = wrapper.instance().getIcon('Collection', '');
        expect(icon.type).toBe(IrregularPolygon);
    });

    it('getIcon should return AlertWarning', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const icon = wrapper.instance().getIcon('', '');
        expect(icon.type).toEqual(AlertWarning);
    });

    it('showAlert should set show to true', () => {
        const props = getProps();
        const stateSpy = sinon.spy(AoiInfobar.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().showAlert();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ showAlert: true })).toBe(true);
        stateSpy.restore();
    });

    it('closeAlert should set show to false', () => {
        const props = getProps();
        const stateSpy = sinon.spy(AoiInfobar.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().closeAlert();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ showAlert: false })).toBe(true);
        stateSpy.restore();
    });

    it('AlertCallout should show when alert state is true', () => {
        const props = getProps();
        props.aoiInfo.geojson = geojson;
        props.aoiInfo.description = 'fake description';
        props.aoiInfo.geomType = 'Polygon';
        props.aoiInfo.title = 'fake title';
        props.maxVectorAoiSqKm = 500;
        const wrapper = getWrapper(props);
        expect(wrapper.find(AlertCallout)).toHaveLength(1);
    });
});
