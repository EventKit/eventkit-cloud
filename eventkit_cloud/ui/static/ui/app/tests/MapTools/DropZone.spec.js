import React from 'react';
import { mount } from 'enzyme';
import { DropZone } from '../../components/MapTools/DropZone';
import { DropZoneDialog } from '../../components/MapTools/DropZoneDialog';
import { DropZoneError } from '../../components/MapTools/DropZoneError';

describe('DropZone component', () => {
    const props = {
        importGeom: {},
        showImportModal: false,
        setAllButtonsDefault: () => {},
        setImportModalState: () => {},
        processGeoJSONFile: () => {},
        resetGeoJSONFile: () => {},
    };
    it('should render a div containing the dialog and error components', () => {
        const wrapper = mount(<DropZone {...props} />);
        expect(wrapper.find(DropZoneDialog)).toHaveLength(1);
        expect(wrapper.find(DropZoneError)).toHaveLength(1);
    });
});
