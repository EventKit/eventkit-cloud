import React from 'react';
import sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import Dropzone from 'react-dropzone';
import { DropZoneDialog } from '../../components/MapTools/DropZoneDialog';

import BaseDialog from "../../components/Dialog/BaseDialog";
jest.mock("../../components/Dialog/BaseDialog", () => {
    const React = require('react');
    return (props) => (<div id="basedialog">{props.children}</div>);
});

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
        ...(global as any).eventkit_test_props,
    });

    const getWrapper = props => shallow(<DropZoneDialog {...props} />);

    it('should have a dropzone', () => {
        const props = getProps();
        props.showImportModal = true;
        const wrapper = getWrapper(props);
        const children = wrapper.find(BaseDialog).dive();
        expect(children.find(Dropzone)).toHaveLength(1);
        expect(children.find('.qa-DropZoneDialog-Dropzone')).toHaveLength(1);
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
        (global as any).window.URL.createObjectURL = sinon.mock();
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
