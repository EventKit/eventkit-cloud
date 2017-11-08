import {DropZoneDialog} from '../../components/MapTools/DropZoneDialog';
import React from 'react';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import BaseDialog from '../../components/BaseDialog';
import RaisedButton from 'material-ui/RaisedButton';
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

    const getWrapper = (props) => {
        return mount(<DropZoneDialog {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
    }

    it('should have a dropzone', () => {
        let props = getProps();
        props.showImportModal = true;
        const wrapper = getWrapper(props);
        const children = mount(wrapper.find(BaseDialog).props().children, {
            ...props,
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(children.find(Dropzone)).toHaveLength(1);
        expect(children.find('.qa-DropZoneDialog-text')).toHaveLength(1);
        expect(children.find('.qa-DropZoneDialog-text').find('span').first().text())
            .toEqual('GeoJSON, KML, GPKG, zipped SHP,and other major geospatial data formats are supported. 5 MB maxDrag and drop or');
        expect(children.find('.qa-DropZoneDialog-RaisedButton-select')).toHaveLength(1);
        expect(children.find(FileFileUpload)).toHaveLength(1);
    });

    it('should handle onDrop', () => {
        global.window.URL.createObjectURL = sinon.mock();
        let props = getProps();
        props.showImportModal = true;
        props.setImportModalState = sinon.spy();
        props.processGeoJSONFile = sinon.spy();
        const fakeFile = new File([""], "fakeFile");
        const wrapper = getWrapper(props);
        const children = mount(wrapper.find(BaseDialog).props().children, {
            ...props,
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        children.find(Dropzone).simulate('drop', { dataTransfer: {files: [fakeFile] } });
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
        const wrapper = getWrapper(props);
        const children = mount(wrapper.find(BaseDialog).props().children, {
            ...props,
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        children.find(Dropzone).simulate('drop', { dataTransfer: {files: oversizedFile } });
        expect(props.setImportModalState.calledOnce).toEqual(false);
        expect(props.processGeoJSONFile.calledWith(oversizedFile)).toEqual(false);
    });

    it('onOpenClick should call dropzone.open', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const openSpy = new sinon.spy();
        wrapper.instance().dropzone = {open: openSpy};
        expect(openSpy.called).toBe(false);
        wrapper.instance().onOpenClick();
        expect(openSpy.calledOnce).toBe(true);
    });

    it('handleClear should call setImportModalState and setAllButtonsDefault', () => {
        const props = getProps();
        props.setImportModalState = new sinon.spy();
        props.setAllButtonsDefault = new sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().handleClear();
        expect(props.setImportModalState.calledOnce).toBe(true);
        expect(props.setAllButtonsDefault.calledOnce).toBe(true);
    });
});
