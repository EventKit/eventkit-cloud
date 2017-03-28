import {MapViewButton} from '../components/MapViewButton';
import React from 'react';
import {expect} from 'chai';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import ActionSettingsOverscan from 'material-ui/svg-icons/action/settings-overscan';
import ContentClear from 'material-ui/svg-icons/content/clear';

describe('MapViewButton component', () => {
    const muiTheme = getMuiTheme();
    const getProps = () => {
        return {
            toolbarIcons: {
                box: 'DEFAULT',
                free: 'DEFAULT',
                mapView: 'DEFAULT',
                import: 'DEFAULT',
            },
            mode: 'DRAW_NORMAL',
            updateMode: () => {},
            setMapViewButtonSelected: () => {},
            setAllButtonsDefault: () => {},
            handleCancel: () => {},
            setMapView: () => {},
        }
    }
    it('should display the default icon', () => {
        const props = getProps()
        const wrapper = mount(<MapViewButton {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find('button')).to.have.length(1);
        expect(wrapper.find('div')).to.have.length(2);
        expect(wrapper.find(ActionSettingsOverscan)).to.have.length(1);
        expect(wrapper.find(ActionSettingsOverscan).hasClass('defaultButton')).to.be.true;
    });

    it('should display inactive icon based on updated props', () => {
        const props = getProps();
        const wrapper = mount(<MapViewButton {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        const newProps = {toolbarIcons: {mapView: 'INACTIVE'}}
        wrapper.setProps(newProps);
        expect(wrapper.find('button')).to.have.length(1);
        expect(wrapper.find('div')).to.have.length(2); 
        expect(wrapper.find(ActionSettingsOverscan)).to.have.length(1);
        expect(wrapper.find(ActionSettingsOverscan).hasClass('inactiveButton')).to.be.true;
    });

    it('should display selected icon based on updated props', () => {
        const props = getProps();
        const wrapper = mount(<MapViewButton {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        const newProps = {toolbarIcons: {mapView: 'SELECTED'}}
        wrapper.setProps(newProps);
        expect(wrapper.find('button')).to.have.length(1);
        expect(wrapper.find('div')).to.have.length(2);
        const icon = wrapper.find('i')   
        expect(wrapper.find(ContentClear)).to.have.length(1);
        expect(wrapper.find(ContentClear).hasClass('selectedButton')).to.be.true;
    });

    it('should execute componentWillReceiveProps when new props are passed in', () => {
        const props = getProps();
        const wrapper = mount(<MapViewButton {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        const updateSpy = new sinon.spy(MapViewButton.prototype, 'componentWillReceiveProps');
        wrapper.setProps(props);
        expect(updateSpy.calledOnce).to.equal(true);
    });

    it('should handleOnClick when icon is in SELECTED state', () => {   
        const props = getProps();
        const wrapper = mount(<MapViewButton {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        let newProps = getProps();
        newProps.toolbarIcons.mapView = 'SELECTED';
        newProps.setAllButtonsDefault = sinon.spy();
        newProps.handleCancel = sinon.spy();
        wrapper.setProps(newProps);
        wrapper.find('button').simulate('click');
        expect(newProps.setAllButtonsDefault.calledOnce).to.equal(true);
        expect(newProps.handleCancel.calledOnce).to.equal(true);
    });

    it('should handleOnClick when icon is in DEFAULT state', () => {
        let props = getProps();
        props.setMapViewButtonSelected = sinon.spy();
        props.setMapView = sinon.spy();
        const wrapper = mount(<MapViewButton {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        wrapper.find('button').simulate('click');
        expect(props.setMapViewButtonSelected.calledOnce).to.equal(true);
        expect(props.setMapView.calledOnce).to.equal(true);
    });

    it('handleOnClick should do nothing when icon is in INACTIVE state', () => {
        const props = getProps();
        const wrapper = mount(<MapViewButton {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        let newProps = getProps();
        newProps.toolbarIcons.mapView = 'INACTIVE';
        newProps.setAllButtonsDefault = sinon.spy();
        newProps.handleCancel = sinon.spy();
        newProps.setMapViewButtonSelected = sinon.spy();
        newProps.setMapView = sinon.spy();
        wrapper.setProps(newProps);
        expect(newProps.setAllButtonsDefault.calledOnce).to.equal(false);
        expect(newProps.handleCancel.calledOnce).to.equal(false);
        expect(newProps.setMapViewButtonSelected.calledOnce).to.equal(false);
        expect(newProps.setMapView.calledOnce).to.equal(false);
    });
});
