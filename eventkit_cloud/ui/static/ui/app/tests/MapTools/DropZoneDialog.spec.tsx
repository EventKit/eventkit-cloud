import {render, screen} from '@testing-library/react';

jest.doMock("../../components/Dialog/BaseDialog", () => {
    return (props) => (<div id="basedialog">{props.children}</div>);
});

const { DropZoneDialog } = require('../../components/MapTools/DropZoneDialog');

describe('DropZoneDialog component', () => {

    const props = {
        showImportModal: false,
        setAllButtonsDefault: () => {},
        setImportModalState: () => {},
        processGeoJSONFile: () => {},
        ...(global as any).eventkit_test_props,
    };

    it('should have a dropzone', () => {
        render(<DropZoneDialog {...props} />);
        screen.getByText('GeoJSON, KML, GPKG, zipped SHP, GeoTIFF')
    });

});
