import * as React from 'react';
import * as sinon from 'sinon';
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
    const getProps = () => ({
        show: true,
        onRevertClick: sinon.spy(),
        onRevertClose: sinon.spy(),
        aoiInfo: {
            geojson: { type: 'FeatureCollection', features: [] },
            geomType: 'Polygon',
            description: 'Box',
            title: 'Box',
        },
        ...(global as any).eventkit_test_props,
        classes: {},
    });

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}) => {
        props = { ...getProps(), ...overrides };
        wrapper = mount(<RevertDialog {...props} />);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render the basic elements', () => {
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
        wrapper.setProps({ show: false });
        expect(wrapper.find('.qa-RevertDialog-dialog').hostNodes()).toHaveLength(0);
        expect(wrapper.find('.qa-RevertDialog-background').hostNodes()).toHaveLength(0);
    });

    it('Close buttons should call onRevertClose', () => {
        wrapper.find(Button).first().simulate('click');
        expect(props.onRevertClose.calledOnce).toBe(true);
    });

    it('Revert button should call onRevertClick', () => {
        wrapper.find(Button).last().find('button').simulate('click');
        expect(props.onRevertClick.calledOnce).toBe(true);
    });

    it('Clear icon should call onRevertClose on click', () => {
        wrapper.find(Clear).simulate('click');
        expect(props.onRevertClose.calledOnce).toBe(true);
    });

    it('getIcon should return ImageCropSquare', () => {
        const icon = instance.getIcon('Polygon', 'Box');
        expect(icon.type).toEqual(ImageCropSquare);
    });

    it('getIcon should return Extent', () => {
        const icon = instance.getIcon('Polygon', 'Map View');
        expect(icon.type).toEqual(Extent);
    });

    it('getIcon should return ActionRoom', () => {
        const icon = instance.getIcon('Point', '');
        expect(icon.type).toEqual(ActionRoom);
    });

    it('getIcon should return Line', () => {
        const icon = instance.getIcon('Line', '');
        expect(icon.type).toEqual(Line);
    });

    it('getIcon should return img tag', () => {
        const icon = instance.getIcon('Polygon', '');
        expect(icon.type).toEqual(IrregularPolygon);
    });

    it('getIcon should return img tag', () => {
        const icon = instance.getIcon('Collection', '');
        expect(icon.type).toEqual(IrregularPolygon);
    });

    it('getIcon should return AlertWarning', () => {
        const icon = instance.getIcon('', '');
        expect(icon.type).toEqual(AlertWarning);
    });
});
