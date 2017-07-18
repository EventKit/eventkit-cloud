import {DropZoneDialog} from '../../components/CreateDataPack/DropZoneDialog';
import React from 'react';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import {PopupBox} from '../../components/PopupBox.js';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import ContentClear from 'material-ui/svg-icons/content/clear';
import FileFileUpload from 'material-ui/svg-icons/file/file-upload';
const Dropzone = require('react-dropzone');

describe('DropZoneDialog component', () => {
    const muiTheme = getMuiTheme();
    const getProps = () => {
        return {
            showImportModal: false,
            setAllButtonsDefault: () => {},
            setImportModalState: () => {},
            processGeoJSONFile: () => {},
        }
    }

    it('by default it should only have an empty div', () => {
        const wrapper = mount(<DropZoneDialog {...getProps()}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find('div')).toHaveLength(1);
    })

    it('should have a titlebar', () => {
        let props = getProps();
        props.showImportModal = true;
        const wrapper = mount(<DropZoneDialog {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find('.container')).toHaveLength(1);
        expect(wrapper.find('.titlebar')).toHaveLength(1);
        expect(wrapper.find('.title')).toHaveLength(1);
        expect(wrapper.find('.title').text()).toEqual('Import AOI');
        expect(wrapper.find('.exit')).toHaveLength(1);
        expect(wrapper.find(ContentClear)).toHaveLength(1);
    });

    it('should have a dropzone', () => {
        let props = getProps();
        props.showImportModal = true;
        const wrapper = mount(<DropZoneDialog {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find('.container')).toHaveLength(1);
        expect(wrapper.find(Dropzone)).toHaveLength(1);
        expect(wrapper.find('.dropZoneText')).toHaveLength(1);
        expect(wrapper.find('.dropZoneText').find('span')).toHaveLength(1);
        expect(wrapper.find('.dropZoneText').find('span').text()).toEqual('GeoJSON format only, 2MB max,Drag and drop or');
        expect(wrapper.find('.dropZoneImportButton')).toHaveLength(1);
        expect(wrapper.find(FileFileUpload)).toHaveLength(1);
    });

    it('should handle button click', () => {
        let props = getProps();
        props.showImportModal = true;
        const wrapper = mount(<DropZoneDialog {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        const openSpy = sinon.spy(wrapper.instance().dropzone, 'open');
        wrapper.find(Dropzone).find('button').simulate('click');
        expect(openSpy.calledOnce).toEqual(true);
    });

    it('should handle exit button click', () => {
        let props = getProps();
        props.showImportModal = true;
        props.setImportModalState = sinon.spy();
        props.setAllButtonsDefault = sinon.spy();
        const wrapper = mount(<DropZoneDialog {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        wrapper.find('.titlebar').find('button').simulate('click');
        expect(props.setAllButtonsDefault.calledOnce).toEqual(true);
        expect(props.setImportModalState.calledOnce).toEqual(true);
    });

    it('should handle onDrop', () => {
        global.window.URL.createObjectURL = sinon.mock();
        let props = getProps();
        props.showImportModal = true;
        props.setImportModalState = sinon.spy();
        props.processGeoJSONFile = sinon.spy();
        const fakeFile = new File([""], "fakeFile");
        const wrapper = mount(<DropZoneDialog {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        wrapper.find(Dropzone).simulate('drop', { dataTransfer: {files: [fakeFile] } });
        expect(props.setImportModalState.calledOnce).toEqual(true);
        expect(props.processGeoJSONFile.calledWith(fakeFile)).toEqual(true);
    });

    it('should reject oversized file', () => {
        global.window.URL.createObjectURL = sinon.mock();
        let props = getProps();
        props.showImportModal = true;
        props.setImportModalState = sinon.spy();
        props.processGeoJSONFile = sinon.spy();
        const oversizedFile = [{name: 'file.geojson', size: 99999999, type: 'application/json'}];
        const wrapper = mount(<DropZoneDialog {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        wrapper.find(Dropzone).simulate('drop', { dataTransfer: {files: oversizedFile } });
        expect(props.setImportModalState.calledOnce).toEqual(false);
        expect(props.processGeoJSONFile.calledWith(oversizedFile)).toEqual(false);
    });
});
