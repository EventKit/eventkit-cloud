import React from 'react';
import { mount } from 'enzyme';
import CustomTableRow from '../../components/CustomTableRow';
import DataCartInfoTable from '../../components/StatusDownloadPage/DataCartInfoTable';

describe('DataCartInfoTable component', () => {
    const props = {
        dataPack: {
            uid: '12345',
            user: 'admin',
            started_at: '2017-03-24T15:52:35.637258Z',
            finished_at: '2017-03-24T15:52:35.637258Z',
        },
    };

    const wrapper = mount(<DataCartInfoTable {...props} />);

    it('should render the 4 needed rows', () => {
        expect(wrapper.find(CustomTableRow)).toHaveLength(4);
    });
});
