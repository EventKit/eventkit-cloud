import {ImportButton} from '../../components/CreateDataPack/ImportButton';
import React from 'react';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import FileFileUpload from 'material-ui/svg-icons/file/file-upload';
import ContentClear from 'material-ui/svg-icons/content/clear';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

describe('ImportButton component', () => {
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
            setImportButtonSelected: () => {},
            setAllButtonsDefault: () => {},
            handleCancel: () => {},
            setImportModalState: () => {},
        }
    }
    it('should display the default icon', () => {
        const props = getProps()
        const wrapper = mount(<ImportButton {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find('button')).toHaveLength(1);
        expect(wrapper.find('div')).toHaveLength(2);
        // const icon = wrapper.find('i')
        // expect(icon).toHaveLength(1);
        // expect(icon.text()).toEqual('file_upload')
        // expect(icon.hasClass('material-icons')).toEqual(true);
        // expect(icon.hasClass('defaultButton')).toEqual(true);    
        expect(wrapper.find(FileFileUpload)).toHaveLength(1);
        expect(wrapper.find(FileFileUpload).hasClass('defaultButton')).toBe(true);
    });

    it('should display inactive icon based on updated props', () => {
        const props = getProps();
        const wrapper = mount(<ImportButton {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        const newProps = {toolbarIcons: {import: 'INACTIVE'}}
        wrapper.setProps(newProps);
        expect(wrapper.find('button')).toHaveLength(1);
        expect(wrapper.find('div')).toHaveLength(2);
        // const icon = wrapper.find('i')
        // expect(icon).toHaveLength(1);
        // expect(icon.text()).toEqual('file_upload')
        // expect(icon.hasClass('material-icons')).toEqual(true);
        // expect(icon.hasClass('inactiveButton')).toEqual(true);    
        expect(wrapper.find(FileFileUpload)).toHaveLength(1);
        expect(wrapper.find(FileFileUpload).hasClass('inactiveButton')).toBe(true);
    });

    it('should display selected icon based on updated props', () => {
        const props = getProps();
        const wrapper = mount(<ImportButton {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        const newProps = {toolbarIcons: {import: 'SELECTED'}}
        wrapper.setProps(newProps);
        expect(wrapper.find('button')).toHaveLength(1);
        expect(wrapper.find('div')).toHaveLength(2);
        // const icon = wrapper.find('i')
        // expect(icon).toHaveLength(1);
        // expect(icon.text()).toEqual('clear')
        // expect(icon.hasClass('material-icons')).toEqual(true);
        // expect(icon.hasClass('selectedButton')).toEqual(true);    
        expect(wrapper.find(ContentClear)).toHaveLength(1);
        expect(wrapper.find(ContentClear).hasClass('selectedButton')).toBe(true);
    });

    it('should execute componentWillReceiveProps when new props are passed in', () => {
        const props = getProps();
        const wrapper = mount(<ImportButton {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        const updateSpy = new sinon.spy(ImportButton.prototype, 'componentWillReceiveProps');
        wrapper.setProps(props);
        expect(updateSpy.calledOnce).toEqual(true);
    });

    it('should handleOnClick when icon is in SELECTED state', () => {   
        const props = getProps();
        const wrapper = mount(<ImportButton {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        let newProps = getProps();
        newProps.toolbarIcons.import = 'SELECTED';
        newProps.setAllButtonsDefault = sinon.spy();
        newProps.handleCancel = sinon.spy();
        newProps.setImportModalState = sinon.spy();
        wrapper.setProps(newProps);
        wrapper.find('button').simulate('click');
        expect(newProps.setAllButtonsDefault.calledOnce).toEqual(true);
        expect(newProps.setImportModalState.calledOnce).toEqual(true);
        expect(newProps.handleCancel.calledOnce).toEqual(true);
    });

    it('should handleOnClick when icon is in DEFAULT state', () => {
        let props = getProps();
        props.setImportButtonSelected = sinon.spy();
        props.setImportModalState = sinon.spy();
        const wrapper = mount(<ImportButton {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        wrapper.find('button').simulate('click');
        expect(props.setImportButtonSelected.calledOnce).toEqual(true);
        expect(props.setImportModalState.calledOnce).toEqual(true);
    });

    it('handleOnClick should do nothing when icon is in INACTIVE state', () => {
        const props = getProps();
        const wrapper = mount(<ImportButton {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        let newProps = getProps();
        newProps.toolbarIcons.import = 'INACTIVE';
        newProps.setAllButtonsDefault = sinon.spy();
        newProps.handleCancel = sinon.spy();
        newProps.setImportButtonSelected = sinon.spy();
        newProps.setImportModalState = sinon.spy();
        wrapper.setProps(newProps);
        expect(newProps.setAllButtonsDefault.calledOnce).toEqual(false);
        expect(newProps.handleCancel.calledOnce).toEqual(false);
        expect(newProps.setImportButtonSelected.calledOnce).toEqual(false);
        expect(newProps.setImportModalState.calledOnce).toEqual(false);
    });
});
