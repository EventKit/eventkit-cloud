import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import RaisedButton from 'material-ui/RaisedButton';
import AlertWarning from 'material-ui/svg-icons/alert/warning';
import ImageCropSquare from 'material-ui/svg-icons/image/crop-square';
import ActionRoom from 'material-ui/svg-icons/action/room';
import ActionZoomIn from 'material-ui/svg-icons/action/zoom-in';
import ActionRestore from 'material-ui/svg-icons/action/restore';
import Triangle from 'material-ui/svg-icons/image/details';
import Line from 'material-ui/svg-icons/action/timeline';
import Extent from 'material-ui/svg-icons/action/settings-overscan';
import AlertCallout from '../../components/CreateDataPack/AlertCallout';
import { AoiInfobar } from '../../components/CreateDataPack/AoiInfobar';

describe('AoiInfobar component', () => {
    const muiTheme = getMuiTheme();
    const getProps = () => {
        return {
            aoiInfo: {
                geojson: {},
                geomType: null,
                title: null,
                description: null,
                buffer: 0,
            },
            showAlert: false,
            showRevert: false,
            onRevertClick: () => {},
            clickZoomToSelection: () => {},
            onBufferClick: () => {},
        }
    };

    const getWrapper = props => (
        mount(<AoiInfobar {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: React.PropTypes.object },
        })
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
        expect(wrapper.find('.qa-AoiInfobar-button-zoom').first().text()).toEqual(' ZOOM TO SELECTION');
        expect(wrapper.find(ActionZoomIn)).toHaveLength(1);
        expect(wrapper.find('.qa-AoiInfobar-name').text()).toEqual('fake title');
        expect(wrapper.find('.qa-AoiInfobar-description').text()).toEqual('fake description');
        expect(wrapper.find('img')).toHaveLength(1);
        expect(wrapper.find('img').hasClass('qa-AoiInfobar-icon-polygon')).toBe(true);
    });

    it('clicking on zoom button should call clickZoomToSelection', () => {
        const props = getProps();
        props.clickZoomToSelection = sinon.spy();
        props.aoiInfo.geojson = geojson;
        props.aoiInfo.description = 'fake description';
        props.aoiInfo.geomType = 'Polygon';
        props.aoiInfo.title = 'fake title';
        const wrapper = getWrapper(props);
        wrapper.find('.qa-AoiInfobar-button-zoom').simulate('click');
        expect(props.clickZoomToSelection.calledOnce).toEqual(true);
    });

    it('clicking on revert button should call onRevertClick', () => {
        const props = getProps();
        props.aoiInfo.geojson = geojson;
        props.aoiInfo.description = 'fake description';
        props.aoiInfo.geomType = 'Polygon';
        props.aoiInfo.title = 'fake title';
        props.showRevert = true;
        props.onRevertClick = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.find('.qa-AoiInfobar-button-revert').simulate('click');
        expect(props.onRevertClick.calledOnce).toBe(true);
    });

    it('clicking on buffer button should call onBufferClick', () => {
        const props = getProps();
        props.aoiInfo.geojson = geojson;
        props.aoiInfo.description = 'fake description';
        props.aoiInfo.geomType = 'Polygon';
        props.aoiInfo.title = 'fake title';
        props.onBufferClick = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.find('.qa-AoiInfobar-buffer-button').find('button').simulate('click');
        expect(props.onBufferClick.calledOnce).toBe(true);
    });

    it('should show an alert icon which calls showAlert on click', () => {
        const props = getProps();
        props.aoiInfo.geojson = geojson;
        props.aoiInfo.description = 'fake description';
        props.aoiInfo.geomType = 'Polygon';
        props.aoiInfo.title = 'fake title';
        props.showAlert = true;
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
        const expected = (
            <ImageCropSquare
                style={{ width: '35px', height: '35px', verticalAlign: 'top', flexShrink: 0 }}
                className="qa-AoiInfobar-icon-box"
            />
        );
        const icon = wrapper.instance().getIcon('Polygon', 'Box');
        expect(icon).toEqual(expected);
    });

    it('getIcon should return Extent', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const expected = (
            <Extent
                style={{ width: '35px', height: '35px', verticalAlign: 'top', flexShrink: 0 }}
                className="qa-AoiInfobar-icon-mapview"
            />
        );
        const icon = wrapper.instance().getIcon('Polygon', 'Map View');
        expect(icon).toEqual(expected);
    });

    it('getIcon should return ActionRoom', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const expected = (
            <ActionRoom
                style={{ width: '35px', height: '35px', verticalAlign: 'top', flexShrink: 0 }}
                className="qa-AoiInfobar-icon-point"
            />
        );
        const icon = wrapper.instance().getIcon('Point', '');
        expect(icon).toEqual(expected);
    });

    it('getIcon should return Line', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const expected = (
            <Line
                style={{ width: '35px', height: '35px', verticalAlign: 'top', flexShrink: 0 }}
                className="qa-AoiInfobar-icon-line"
            />
        );
        const icon = wrapper.instance().getIcon('Line', '');
        expect(icon).toEqual(expected);
    });

    it('getIcon should return img tag', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const expected = (
            <img
                src="test-file-stub"
                style={{ width: '32px', height: '35px', verticalAlign: 'top', flexShrink: 0 }}
                className="qa-AoiInfobar-icon-polygon"
                alt=""
            />
        );
        const icon = wrapper.instance().getIcon('Polygon', '');
        expect(icon).toEqual(expected);
    });

    it('getIcon should return img tag', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const expected = (
            <img
                src="test-file-stub"
                style={{ width: '32px', height: '35px', verticalAlign: 'top', flexShrink: 0 }}
                className="qa-AoiInfobar-icon-polygon"
                alt=""
            />
        );
        const icon = wrapper.instance().getIcon('Collection', '');
        expect(icon).toEqual(expected);
    });

    it('getIcon should return AlertWarning', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const expected = (
            <AlertWarning
                style={{ width: '35px', height: '35px', verticalAlign: 'top', flexShrink: 0 }}
                className="qa-AoiInfobar-icon-no-selection"
            />
        );
        const icon = wrapper.instance().getIcon('', '');
        expect(icon).toEqual(expected);
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
        props.showAlert = true;
        const wrapper = getWrapper(props);
        expect(wrapper.find(AlertCallout)).toHaveLength(1);
    });
});
