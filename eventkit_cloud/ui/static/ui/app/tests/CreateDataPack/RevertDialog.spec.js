import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import Clear from 'material-ui/svg-icons/content/clear';
import AlertWarning from 'material-ui/svg-icons/alert/warning';
import ImageCropSquare from 'material-ui/svg-icons/image/crop-square';
import ActionRoom from 'material-ui/svg-icons/action/room';
import Triangle from 'material-ui/svg-icons/image/details';
import Line from 'material-ui/svg-icons/action/timeline';
import Extent from 'material-ui/svg-icons/action/settings-overscan';
import RevertDialog from '../../components/CreateDataPack/RevertDialog';
import IrregularPolygon from '../../components/icons/IrregularPolygon';

describe('AlertCallout component', () => {
    const muiTheme = getMuiTheme();
    const getProps = () => (
        {
            show: true,
            onRevertClick: () => {},
            onReverClose: () => {},
            aoiInfo: {
                geojson: { type: 'FeatureCollection', features: [] },
                geomType: 'Polygon',
                description: 'Box',
                title: 'Box',
            },
        }
    );

    const getWrapper = props => (
        mount(<RevertDialog {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: React.PropTypes.object },
        })
    );

    it('should render the basic elements', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-RevertDialog-background')).toHaveLength(1);
        expect(wrapper.find('.qa-RevertDialog-dialog')).toHaveLength(1);
        expect(wrapper.find('.qa-RevertDialog-header')).toHaveLength(1);
        expect(wrapper.find(Clear)).toHaveLength(1);
        expect(wrapper.find('.qa-RevertDialog-body')).toHaveLength(1);
        expect(wrapper.find('.qa-RevertDialog-name')).toHaveLength(1);
        expect(wrapper.find('.qa-RevertDialog-description')).toHaveLength(1);
        expect(wrapper.find('.qa-RevertDialog-footer')).toHaveLength(1);
        expect(wrapper.find('.qa-RevertDialog-FlatButton-close')).toHaveLength(1);
        expect(wrapper.find('.qa-RevertDialog-RaisedButton-revert')).toHaveLength(1);
    });

    it('should not render anything if show is false', () => {
        const props = getProps();
        props.show = false;
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-RevertDialog-dialog')).toHaveLength(0);
        expect(wrapper.find('.qa-RevertDialog-background')).toHaveLength(0);
    });

    it('Close buttons should call onRevertClose', () => {
        const props = getProps();
        props.onRevertClose = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.find(FlatButton).simulate('click');
        expect(props.onRevertClose.calledOnce).toBe(true);
    });

    it('Revert button should call onRevertClick', () => {
        const props = getProps();
        props.onRevertClick = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.find(RaisedButton).find('button').simulate('click');
        expect(props.onRevertClick.calledOnce).toBe(true);
    });

    it('Clear icon should call onRevertClose on click', () => {
        const props = getProps();
        props.onRevertClose = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.find(Clear).simulate('click');
        expect(props.onRevertClose.calledOnce).toBe(true);
    });

    it('getIcon should return ImageCropSquare', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const expected = (
            <ImageCropSquare
                style={{ width: '35px', height: '35px', verticalAlign: 'top', flexShrink: 0 }}
                className="qa-RevertDialog-icon-box"
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
                className="qa-RevertDialog-icon-mapview"
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
                className="qa-RevertDialog-icon-point"
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
                className="qa-RevertDialog-icon-line"
            />
        );
        const icon = wrapper.instance().getIcon('Line', '');
        expect(icon).toEqual(expected);
    });

    it('getIcon should return img tag', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const expected = (
            <IrregularPolygon
                style={{ width: '35px', height: '35px', verticalAlign: 'top', flexShrink: 0 }}
                className="qa-RevertDialog-icon-polygon"
            />
        );
        const icon = wrapper.instance().getIcon('Polygon', '');
        expect(icon).toEqual(expected);
    });

    it('getIcon should return img tag', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const expected = (
            <IrregularPolygon
                style={{ width: '35px', height: '35px', verticalAlign: 'top', flexShrink: 0 }}
                className="qa-RevertDialog-icon-polygon"
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
                className="qa-RevertDialog-icon-no-selection"
            />
        );
        const icon = wrapper.instance().getIcon('', '');
        expect(icon).toEqual(expected);
    });
});
