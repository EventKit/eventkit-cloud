import * as React from 'react';
import { createShallow } from '@material-ui/core/test-utils';
import CustomTableRow from '../../components/common/CustomTableRow';
import { ExportInfoTable } from '../../components/StatusDownloadPage/ExportInfoTable';

describe('ExportInfoTable component', () => {
    const shallow = createShallow();

    const props = {
        dataPack: {
            uid: '12345',
            user: 'admin',
            started_at: '2017-03-24T15:52:35.637258Z',
            finished_at: '2017-03-24T15:52:35.637258Z',
        },
        ...(global as any).eventkit_test_props,
    };

    const wrapper = shallow(<ExportInfoTable {...props} />);

    it('should render the 4 needed rows', () => {
        expect(wrapper.find(CustomTableRow)).toHaveLength(4);
    });
});
