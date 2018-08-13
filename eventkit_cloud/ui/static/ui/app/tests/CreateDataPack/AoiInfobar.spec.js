import PropTypes from 'prop-types';
import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import AlertWarning from 'material-ui/svg-icons/alert/warning';
import ImageCropSquare from 'material-ui/svg-icons/image/crop-square';
import ActionRoom from 'material-ui/svg-icons/action/room';
import ActionZoomIn from 'material-ui/svg-icons/action/zoom-in';
import Line from 'material-ui/svg-icons/action/timeline';
import Extent from 'material-ui/svg-icons/action/settings-overscan';
import IrregularPolygon from '../../components/icons/IrregularPolygon';
import AlertCallout from '../../components/CreateDataPack/AlertCallout';
import { AoiInfobar } from '../../components/CreateDataPack/AoiInfobar';

describe('AoiInfobar component', () => {
    const muiTheme = getMuiTheme();
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
        }
    );

    const getWrapper = props => (
        mount(<AoiInfobar {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: PropTypes.object },
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
        expect(wrapper.find('.qa-AoiInfobar-button-zoom').first().text()).toEqual(' ZOOM TO');
        expect(wrapper.find(ActionZoomIn)).toHaveLength(1);
        expect(wrapper.find('.qa-AoiInfobar-infoTitle').text()).toEqual('fake title');
        expect(wrapper.find('.qa-AoiInfobar-infoDescription').text()).toEqual('fake description');
        expect(wrapper.find('.qa-AoiInfobar-icon-polygon').hostNodes()).toHaveLength(1);
    });

    it('should add an event listener on mount', () => {
        const props = getProps();
        const addStub = sinon.stub(window, 'addEventListener');
        const wrapper = getWrapper(props);
        expect(addStub.called).toBe(true);
        expect(addStub.calledWith('resize', wrapper.instance().update)).toBe(true);
        addStub.restore();
    });

    it('should remove an event listener on unmount', () => {
        const props = getProps();
        const removeSpy = sinon.spy(window, 'addEventListener');
        const wrapper = getWrapper(props);
        const { update } = wrapper.instance();
        wrapper.instance().componentWillUnmount();
        expect(removeSpy.called).toBe(true);
        expect(removeSpy.calledWith('resize', update)).toBe(true);
        removeSpy.restore();
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
        wrapper.find('.qa-AoiInfobar-buffer-button').find('button').simulate('click');
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
        expect(wrapper.find('.qa-AoiInfobar-alert-icon').hostNodes()).toHaveLength(1);
        wrapper.find('.qa-AoiInfobar-alert-icon').hostNodes().simulate('click');
        expect(showSpy.calledOnce).toBe(true);
        showSpy.restore();
    });

    it('getIcon should return ImageCropSquare', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const expected = (
            <ImageCropSquare
                style={{ width: '30px', height: '30px' }}
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
                style={{ width: '30px', height: '30px' }}
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
                style={{ width: '30px', height: '30px' }}
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
                style={{ width: '30px', height: '30px' }}
                className="qa-AoiInfobar-icon-line"
            />
        );
        const icon = wrapper.instance().getIcon('Line', '');
        expect(icon).toEqual(expected);
    });

    it('getIcon should return IrregularPolygon', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const expected = (
            <IrregularPolygon
                style={{ width: '30px', height: '30px' }}
                className="qa-AoiInfobar-icon-polygon"
            />
        );
        const icon = wrapper.instance().getIcon('Polygon', '');
        expect(icon).toEqual(expected);
    });

    it('getIcon should return IrregularPolygon', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const expected = (
            <IrregularPolygon
                style={{ width: '30px', height: '30px' }}
                className="qa-AoiInfobar-icon-polygon"
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
                style={{ width: '30px', height: '30px' }}
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
        props.maxVectorAoiSqKm = 500;
        const wrapper = getWrapper(props);
        expect(wrapper.find(AlertCallout)).toHaveLength(1);
    });
});
