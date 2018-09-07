import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import Button from '@material-ui/core/Button';
import Clear from '@material-ui/icons/Clear';
import AlertWarning from '@material-ui/icons/Warning';
import ImageCropSquare from '@material-ui/icons/CropSquare';
import ActionRoom from '@material-ui/icons/Room';
import Line from '@material-ui/icons/Timeline';
import Extent from '@material-ui/icons/SettingsOverscan';
import { RevertDialog } from '../../components/CreateDataPack/RevertDialog';
import IrregularPolygon from '../../components/icons/IrregularPolygon';

describe('AlertCallout component', () => {
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
            ...global.eventkit_test_props,
        }
    );

    const getWrapper = props => (
        mount(<RevertDialog {...props} />)
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
        expect(wrapper.find('.qa-RevertDialog-FlatButton-close').hostNodes()).toHaveLength(1);
        expect(wrapper.find('.qa-RevertDialog-RaisedButton-revert').hostNodes()).toHaveLength(1);
    });

    it('should not render anything if show is false', () => {
        const props = getProps();
        props.show = false;
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-RevertDialog-dialog').hostNodes()).toHaveLength(0);
        expect(wrapper.find('.qa-RevertDialog-background').hostNodes()).toHaveLength(0);
    });

    it('Close buttons should call onRevertClose', () => {
        const props = getProps();
        props.onRevertClose = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.find(Button).first().simulate('click');
        expect(props.onRevertClose.calledOnce).toBe(true);
    });

    it('Revert button should call onRevertClick', () => {
        const props = getProps();
        props.onRevertClick = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.find(Button).last().find('button').simulate('click');
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
        const icon = wrapper.instance().getIcon('Polygon', 'Box');
        expect(icon.type).toEqual(ImageCropSquare);
    });

    it('getIcon should return Extent', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const icon = wrapper.instance().getIcon('Polygon', 'Map View');
        expect(icon.type).toEqual(Extent);
    });

    it('getIcon should return ActionRoom', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const icon = wrapper.instance().getIcon('Point', '');
        expect(icon.type).toEqual(ActionRoom);
    });

    it('getIcon should return Line', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const icon = wrapper.instance().getIcon('Line', '');
        expect(icon.type).toEqual(Line);
    });

    it('getIcon should return img tag', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const icon = wrapper.instance().getIcon('Polygon', '');
        expect(icon.type).toEqual(IrregularPolygon);
    });

    it('getIcon should return img tag', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const icon = wrapper.instance().getIcon('Collection', '');
        expect(icon.type).toEqual(IrregularPolygon);
    });

    it('getIcon should return AlertWarning', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const icon = wrapper.instance().getIcon('', '');
        expect(icon.type).toEqual(AlertWarning);
    });
});
