import React from 'react';
import { createShallow } from '@material-ui/core/test-utils';
import { DropZone } from '../../components/MapTools/DropZone';
import DropZoneDialog from '../../components/MapTools/DropZoneDialog';
import DropZoneError from '../../components/MapTools/DropZoneError';
import sinon from "sinon";

describe('DropZone component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const props = {
        importGeom: {},
        processGeoJSONFile: sinon.spy(),
        resetGeoJSONFile: sinon.spy(),
        setAllButtonsDefault: sinon.spy(),
        setImportModalState: sinon.spy(),
        showImportModal: false,
        ...global.eventkit_test_props,
    };
    it('should render a div containing the dialog and error components', () => {
        const wrapper = shallow(<DropZone {...props} />);
        expect(wrapper.find(DropZoneDialog)).toHaveLength(1);
        expect(wrapper.find(DropZoneError)).toHaveLength(1);
    });
});
