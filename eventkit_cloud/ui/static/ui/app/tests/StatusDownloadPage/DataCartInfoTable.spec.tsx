import * as React from 'react';
import { createShallow } from '@material-ui/core/test-utils';
import CustomTableRow from '../../components/common/CustomTableRow';
import { DataCartInfoTable } from '../../components/StatusDownloadPage/DataCartInfoTable';

describe('DataCartInfoTable component', () => {
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

    it('should render the 4 needed rows', () => {
        const wrapper = shallow(<DataCartInfoTable {...props} />);
        expect(wrapper.find(CustomTableRow)).toHaveLength(4);
    });

    it('should render not started when not started', () => {
        props.dataPack.started_at = null
        const wrapper = shallow(<DataCartInfoTable {...props} />);
        expect(wrapper.find({title:"Started"}).text()).toContain("Not Started");
        expect(wrapper.find({title:"Finished"}).text()).toContain("Not Started");
    });

    it('should render processing when not finished', () => {
        props.dataPack.started_at = '2017-03-24T15:52:35.637258Z'
        props.dataPack.finished_at = null
        const wrapper = shallow(<DataCartInfoTable {...props} />);
        expect(wrapper.find({title:"Finished"}).text()).toContain("Currently Processing...");
    });
});
