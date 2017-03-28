import {DrawFreeButton} from '../components/DrawFreeButton';
import React from 'react';
import {expect} from 'chai';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import ContentCreate from 'material-ui/svg-icons/content/create';
import ContentClear from 'material-ui/svg-icons/content/clear';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

describe('DrawFreeButton component', () => {
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
            setFreeButtonSelected: () => {},
            setAllButtonsDefault: () => {},
            handleCancel: () => {},
        }
    }
    it('should display the default icon', () => {
        const props = getProps()
        const wrapper = mount(<DrawFreeButton {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find('button')).to.have.length(1);
        expect(wrapper.find('div')).to.have.length(2);
        expect(wrapper.find(ContentCreate)).to.have.length(1);
        expect(wrapper.find(ContentCreate).hasClass('defaultButton')).to.be.true;
    });

    it('should display inactive icon based on updated props', () => {
        const props = getProps();
        const wrapper = mount(<DrawFreeButton {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        const newProps = {toolbarIcons: {free: 'INACTIVE'}}
        wrapper.setProps(newProps);
        expect(wrapper.find('button')).to.have.length(1);
        expect(wrapper.find('div')).to.have.length(2);  
        expect(wrapper.find(ContentCreate)).to.have.length(1);
        expect(wrapper.find(ContentCreate).hasClass('inactiveButton')).to.be.true;
    });

    it('should display selected icon based on updated props', () => {
        const props = getProps();
        const wrapper = mount(<DrawFreeButton {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        const newProps = {toolbarIcons: {free: 'SELECTED'}}
        wrapper.setProps(newProps);
        expect(wrapper.find('button')).to.have.length(1);
        expect(wrapper.find('div')).to.have.length(2);
        expect(wrapper.find(ContentClear)).to.have.length(1);
        expect(wrapper.find(ContentClear).hasClass('selectedButton')).to.be.true;
    });

    it('should execute componentWillReceiveProps when new props are passed in', () => {
        const props = getProps();
        const wrapper = mount(<DrawFreeButton {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        const updateSpy = new sinon.spy(DrawFreeButton.prototype, 'componentWillReceiveProps');
        wrapper.setProps(props);
        expect(updateSpy.calledOnce).to.equal(true);
    });

    it('should handleOnClick when icon is in SELECTED state', () => {   
        const props = getProps();
        const wrapper = mount(<DrawFreeButton {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        let newProps = getProps();
        newProps.toolbarIcons.free = 'SELECTED';
        newProps.setAllButtonsDefault = sinon.spy();
        newProps.handleCancel = sinon.spy();
        wrapper.setProps(newProps);
        wrapper.find('button').simulate('click');
        expect(newProps.setAllButtonsDefault.calledOnce).to.equal(true);
        expect(newProps.handleCancel.calledOnce).to.equal(true);
    });

    it('should handleOnClick when icon is in DEFAULT state', () => {
        let props = getProps();
        props.setFreeButtonSelected = sinon.spy();
        props.updateMode = sinon.spy();
        const wrapper = mount(<DrawFreeButton {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        wrapper.find('button').simulate('click');
        expect(props.setFreeButtonSelected.calledOnce).to.equal(true);
        expect(props.updateMode.calledOnce).to.equal(true);
    });

    it('handleOnClick should do nothing when icon is in INACTIVE state', () => {
        const props = getProps();
        const wrapper = mount(<DrawFreeButton {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        let newProps = getProps();
        newProps.toolbarIcons.free = 'INACTIVE';
        newProps.setAllButtonsDefault = sinon.spy();
        newProps.handleCancel = sinon.spy();
        newProps.setFreeButtonSelected = sinon.spy();
        newProps.updateMode = sinon.spy();
        wrapper.setProps(newProps);
        expect(newProps.setAllButtonsDefault.calledOnce).to.equal(false);
        expect(newProps.handleCancel.calledOnce).to.equal(false);
        expect(newProps.setFreeButtonSelected.calledOnce).to.equal(false);
        expect(newProps.updateMode.calledOnce).to.equal(false);
    });
});
