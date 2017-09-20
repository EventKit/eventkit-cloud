import {AoiInfobar} from '../../components/CreateDataPack/AoiInfobar';
import React from 'react';
import sinon from 'sinon';
import {mount} from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import ImageCropSquare from 'material-ui/svg-icons/image/crop-square';
import ActionSearch from 'material-ui/svg-icons/action/search';
import {NO_SELECTION_ICON, MULTIPOLYGON_ICON, 
    POLYGON_ICON, POINT_ICON}  from '../../components/CreateDataPack/AoiInfobar';

describe('AoiInfobar component', () => {
    const muiTheme = getMuiTheme();
    const getProps = () => {
        return {
            aoiInfo: {
                geojson: {},
                geomType: null,
                title: null,
                description: null,
            },
            disabled: true,
            clickZoomToSelection: () => {},
        }
    };

    const getWrapper = (props) => {
        return mount(<AoiInfobar {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
    }

    const geojson = { "type": "FeatureCollection",
    "features": [
      { "type": "Feature",
         "geometry": {
           "type": "Polygon",
           "coordinates": [
             [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0],
               [100.0, 1.0], [100.0, 0.0] ]
             ]
         },}]};

    it('should not display the infobar by default', () => {
        let props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('div')).toHaveLength(1);
        expect(wrapper.find('aoiInfobar')).toHaveLength(0);
    });

    it('should handle aoiInfo update', () => {
        let props = getProps();
        const wrapper = getWrapper(props);
        let nextProps = getProps();
        nextProps.aoiInfo.geojson = geojson;
        nextProps.aoiInfo.description = 'fake description';
        nextProps.aoiInfo.geomType = 'Polygon';
        nextProps.aoiInfo.title = 'fake title';
        wrapper.setProps(nextProps);

        expect(wrapper.find('div')).toHaveLength(8);
        expect(wrapper.find('.qa-AoiInfobar-title').text()).toEqual('Area Of Interest (AOI)');
        expect(wrapper.find('.qa-AoiInfobar-button-zoom')).toHaveLength(1);
        expect(wrapper.find('.qa-AoiInfobar-button-zoom').first().text()).toEqual(' ZOOM TO SELECTION');
        expect(wrapper.find(ActionSearch)).toHaveLength(1);
        expect(wrapper.find('.qa-AoiInfobar-name').text()).toEqual('fake title');
        expect(wrapper.find('.qa-AoiInfobar-description').text()).toEqual('fake description');
        expect(wrapper.find(ImageCropSquare)).toHaveLength(1);
        expect(wrapper.find(ImageCropSquare).hasClass('qa-AoiInfobar-icon-polygon')).toBe(true);
    });

    it('clicking on active buttons should execute click functions', () => {
        let props = getProps();
        const wrapper = getWrapper(props);
        let nextProps = getProps();
        nextProps.clickZoomToSelection = sinon.spy();
        nextProps.disabled = false,
        nextProps.aoiInfo.geojson = geojson;
        nextProps.aoiInfo.description = 'fake description';
        nextProps.aoiInfo.geomType = 'Polygon';
        nextProps.aoiInfo.title = 'fake title';
        wrapper.setProps(nextProps);
        wrapper.find('.qa-AoiInfobar-button-zoom').simulate('click');
        expect(nextProps.clickZoomToSelection.calledOnce).toEqual(true);
    });

    it('should call handleAoiInfo on mount', () => {
        const props = getProps();
        const infoSpy = new sinon.spy(AoiInfobar.prototype, 'handleAoiInfo');
        const mountSpy = new sinon.spy(AoiInfobar.prototype, 'componentDidMount');
        const wrapper = getWrapper(props);
        expect(mountSpy.calledOnce).toBe(true);
        expect(infoSpy.calledOnce).toBe(true);
        expect(infoSpy.calledWith(props.aoiInfo)).toBe(true);
        infoSpy.restore();
        mountSpy.restore();
    });

    it('componentWillReceiveProps should call handleAoiInfo if geojson changes', () => {
        const props = getProps();
        const infoSpy = new sinon.spy(AoiInfobar.prototype, 'handleAoiInfo');
        const receiveSpy = new sinon.spy(AoiInfobar.prototype, 'componentWillReceiveProps');
        const wrapper = getWrapper(props);
        expect(infoSpy.calledOnce).toBe(true);
        expect(receiveSpy.called).toBe(false);
        const nextProps = getProps();
        nextProps.aoiInfo.geojson = geojson;
        wrapper.setProps(nextProps);
        expect(receiveSpy.calledOnce).toBe(true);
        expect(infoSpy.calledTwice).toBe(true);
        expect(infoSpy.calledWith(nextProps.aoiInfo)).toBe(true);
        infoSpy.restore();
        receiveSpy.restore();
    });

    it('componenentWillReceiveProps should not call handleAoiInfo if geojson is the same', () => {
        const props = getProps();
        const infoSpy = new sinon.spy(AoiInfobar.prototype, 'handleAoiInfo');
        const receiveSpy = new sinon.spy(AoiInfobar.prototype, 'componentWillReceiveProps');
        const wrapper = getWrapper(props);
        expect(infoSpy.calledOnce).toBe(true);
        expect(receiveSpy.called).toBe(false);
        const nextProps = getProps();
        wrapper.setProps(nextProps);
        expect(infoSpy.calledTwice).toBe(false);
        expect(receiveSpy.calledOnce).toBe(true);
        infoSpy.restore();
        receiveSpy.restore();
    });

    it('handleAoiInfo should set the proper state to show the infobar with Point', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateSpy = new sinon.spy(wrapper.instance(), 'setState');
        const aoiInfo = props.aoiInfo;
        aoiInfo.geomType = 'Point';
        aoiInfo.title = 'My title';
        aoiInfo.description = 'My description';
        aoiInfo.geojson = geojson;
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleAoiInfo(aoiInfo);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({
            geometryIcon: POINT_ICON,
            aoiTitle: aoiInfo.title,
            aoiDescription: aoiInfo.description,
            showAoiInfobar: true
        })).toBe(true);
    });

    it('handleAoiInfo should set the proper state to show the infobar with Polygon', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateSpy = new sinon.spy(wrapper.instance(), 'setState');
        const aoiInfo = props.aoiInfo;
        aoiInfo.geomType = 'Polygon';
        aoiInfo.title = 'My title';
        aoiInfo.description = 'My description';
        aoiInfo.geojson = geojson;
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleAoiInfo(aoiInfo);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({
            geometryIcon: POLYGON_ICON,
            aoiTitle: aoiInfo.title,
            aoiDescription: aoiInfo.description,
            showAoiInfobar: true
        })).toBe(true);
    });

    it('handleAoiInfo should set the proper state to show the infobar with MultiPolygon', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateSpy = new sinon.spy(wrapper.instance(), 'setState');
        const aoiInfo = props.aoiInfo;
        aoiInfo.geomType = 'MultiPolygon';
        aoiInfo.title = 'My title';
        aoiInfo.description = 'My description';
        aoiInfo.geojson = geojson;
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleAoiInfo(aoiInfo);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({
            geometryIcon: MULTIPOLYGON_ICON,
            aoiTitle: aoiInfo.title,
            aoiDescription: aoiInfo.description,
            showAoiInfobar: true
        })).toBe(true);
    });

    it('handleAoiInfo should set the proper state to hide the infobar', () => {
        const props = getProps();
        props.geojson = geojson;
        const wrapper = getWrapper(props);
        const stateSpy = new sinon.spy(wrapper.instance(), 'setState');
        const aoiInfo = props.aoiInfo;
        aoiInfo.geojson = {};
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleAoiInfo(aoiInfo);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({
            showAoiInfobar: false,
            geometryIcon: NO_SELECTION_ICON,
            aoiTitle: '',
            aoiDescription: 'No AOI Set'
        }));
    });

    it('dispatchZoomToSelection should call clickZoomToSelection', () => {
        const props = getProps();
        props.disabled = false;
        props.clickZoomToSelection = new sinon.spy();
        const wrapper = getWrapper(props);
        expect(props.clickZoomToSelection.called).toBe(false);
        wrapper.instance().dispatchZoomToSelection();
        expect(props.clickZoomToSelection.calledOnce).toBe(true);
    });

    it('dispatchZoomToSelection should not call clickZoomToSelection', () => {
        const props = getProps();
        props.disabled = true;
        props.clickZoomToSelection = new sinon.spy();
        const wrapper = getWrapper(props);
        expect(props.clickZoomToSelection.called).toBe(false);
        wrapper.instance().dispatchZoomToSelection();
        expect(props.clickZoomToSelection.called).toBe(false);
    });
});