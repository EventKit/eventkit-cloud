import sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import ActionSettingsOverscan from '@material-ui/icons/SettingsOverscan';
import ContentClear from '@material-ui/icons/Clear';
import { MapViewButton } from '../../components/MapTools/MapViewButton';

describe('MapViewButton component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const getProps = () => ({
        buttonState: 'DEFAULT',
        setMapViewButtonSelected: () => {},
        setAllButtonsDefault: () => {},
        handleCancel: () => {},
        setMapView: () => {},
        ...global.eventkit_test_props,
    });
    it('should display the default icon', () => {
        const props = getProps();
        const wrapper = shallow(<MapViewButton {...props} />);
        expect(wrapper.find('button')).toHaveLength(1);
        expect(wrapper.find('div')).toHaveLength(2);
        expect(wrapper.find(ActionSettingsOverscan)).toHaveLength(1);
        expect(wrapper.find('#default_icon')).toHaveLength(1);
    });

    it('should display inactive icon based on updated props', () => {
        const props = getProps();
        const wrapper = shallow(<MapViewButton {...props} />);
        const newProps = getProps();
        newProps.buttonState = 'INACTIVE';
        wrapper.setProps(newProps);
        expect(wrapper.find('button')).toHaveLength(1);
        expect(wrapper.find('div')).toHaveLength(2);
        expect(wrapper.find(ActionSettingsOverscan)).toHaveLength(1);
        expect(wrapper.find('#inactive_icon')).toHaveLength(1);
    });

    it('should display selected icon based on updated props', () => {
        const props = getProps();
        const wrapper = shallow(<MapViewButton {...props} />);
        const newProps = getProps();
        newProps.buttonState = 'SELECTED';
        wrapper.setProps(newProps);
        expect(wrapper.find('button')).toHaveLength(1);
        expect(wrapper.find('div')).toHaveLength(2);
        expect(wrapper.find(ContentClear)).toHaveLength(1);
        expect(wrapper.find('#selected_icon')).toHaveLength(1);
    });

    it('should handleOnClick when icon is in SELECTED state', () => {
        const props = getProps();
        const wrapper = shallow(<MapViewButton {...props} />);
        const newProps = getProps();
        newProps.buttonState = 'SELECTED';
        newProps.setAllButtonsDefault = sinon.spy();
        newProps.handleCancel = sinon.spy();
        wrapper.setProps(newProps);
        wrapper.find('button').simulate('click');
        expect(newProps.setAllButtonsDefault.calledOnce).toEqual(true);
        expect(newProps.handleCancel.calledOnce).toEqual(true);
    });

    it('should handleOnClick when icon is in DEFAULT state', () => {
        const props = getProps();
        props.setMapViewButtonSelected = sinon.spy();
        props.setMapView = sinon.spy();
        const wrapper = shallow(<MapViewButton {...props} />);
        wrapper.find('button').simulate('click');
        expect(props.setMapViewButtonSelected.calledOnce).toEqual(true);
        expect(props.setMapView.calledOnce).toEqual(true);
    });

    it('handleOnClick should do nothing when icon is in INACTIVE state', () => {
        const props = getProps();
        const wrapper = shallow(<MapViewButton {...props} />);
        const newProps = getProps();
        newProps.buttonState = 'INACTIVE';
        newProps.setAllButtonsDefault = sinon.spy();
        newProps.handleCancel = sinon.spy();
        newProps.setMapViewButtonSelected = sinon.spy();
        newProps.setMapView = sinon.spy();
        wrapper.setProps(newProps);
        expect(newProps.setAllButtonsDefault.calledOnce).toEqual(false);
        expect(newProps.handleCancel.calledOnce).toEqual(false);
        expect(newProps.setMapViewButtonSelected.calledOnce).toEqual(false);
        expect(newProps.setMapView.calledOnce).toEqual(false);
    });
});
