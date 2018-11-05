import React from 'react';
import sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import Dropzone from 'react-dropzone';
import FileFileUpload from '@material-ui/icons/CloudUpload';
import BaseDialog from '../../components/Dialog/BaseDialog';
import { DropZoneDialog } from '../../components/MapTools/DropZoneDialog';

describe('DropZoneDialog component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const getProps = () => ({
        showImportModal: false,
        setAllButtonsDefault: () => {},
        setImportModalState: () => {},
        processGeoJSONFile: () => {},
        ...global.eventkit_test_props,
    });

    const getWrapper = props => shallow(<DropZoneDialog {...props} />);

    it('should have a dropzone', () => {
        const props = getProps();
        props.showImportModal = true;
        const wrapper = getWrapper(props);
        const children = wrapper.find(BaseDialog).dive();
        expect(children.find(Dropzone)).toHaveLength(1);
        expect(children.find('.qa-DropZoneDialog-text')).toHaveLength(1);
        expect(children.find('.qa-DropZoneDialog-text').find('span').first().text())
            .toEqual('GeoJSON, KML, GPKG, zipped SHP,and other major geospatial data formats are supported. 5 MB maxDrag and drop or');
        expect(children.find('.qa-DropZoneDialog-Button-select')).toHaveLength(1);
        expect(children.find(FileFileUpload)).toHaveLength(1);
    });

    it('onDrop should setModalState and process file', () => {
        const props = getProps();
        props.showImportModal = true;
        props.setImportModalState = sinon.spy();
        props.processGeoJSONFile = sinon.spy();
        const fakeFile = new File([''], 'fakeFile');
        const wrapper = getWrapper(props);
        wrapper.instance().onDrop([fakeFile]);
        expect(props.setImportModalState.calledOnce).toEqual(true);
        expect(props.processGeoJSONFile.calledWith(fakeFile)).toEqual(true);
    });

    it('should reject oversized file', () => {
        global.window.URL.createObjectURL = sinon.mock();
        const props = getProps();
        props.showImportModal = true;
        props.setImportModalState = sinon.spy();
        props.processGeoJSONFile = sinon.spy();
        const oversizedFile = [{ name: 'file.geojson', size: 99999999, type: 'application/json' }];
        const wrapper = getWrapper(props);
        const children = wrapper.find(BaseDialog).dive();
        children.find(Dropzone).simulate('drop', { dataTransfer: { files: oversizedFile } });
        expect(props.setImportModalState.calledOnce).toEqual(false);
        expect(props.processGeoJSONFile.calledWith(oversizedFile)).toEqual(false);
    });

    it('onOpenClick should call dropzone.open', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const openSpy = sinon.spy();
        wrapper.instance().dropzone = { open: openSpy };
        expect(openSpy.called).toBe(false);
        wrapper.instance().onOpenClick();
        expect(openSpy.calledOnce).toBe(true);
    });

    it('handleClear should call setImportModalState and setAllButtonsDefault', () => {
        const props = getProps();
        props.setImportModalState = sinon.spy();
        props.setAllButtonsDefault = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().handleClear();
        expect(props.setImportModalState.calledOnce).toBe(true);
        expect(props.setAllButtonsDefault.calledOnce).toBe(true);
    });
});
