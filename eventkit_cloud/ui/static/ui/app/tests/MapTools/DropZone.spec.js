import {DropZone} from '../../components/MapTools/DropZone';
import {DropZoneDialog} from '../../components/MapTools/DropZoneDialog';
import {DropZoneError} from '../../components/MapTools/DropZoneError';
import React from 'react';
import {mount} from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

describe('DropZone component', () => {
    const muiTheme = getMuiTheme();
    const props = {
        importGeom : {},
        showImportModal: false,
        setAllButtonsDefault: () => {},
        setImportModalState: () => {},
        processGeoJSONFile: () => {},
        resetGeoJSONFile: () => {}
    }
    it('should render a div containing the dialog and error components', () => {
        const wrapper = mount(<DropZone/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find(DropZoneDialog)).toHaveLength(1);
        expect(wrapper.find(DropZoneError)).toHaveLength(1);
    });
});
