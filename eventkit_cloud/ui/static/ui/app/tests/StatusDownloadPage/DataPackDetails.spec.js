import React from 'react';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import {DataPackDetails} from '../../components/StatusDownloadPage/DataPackDetails';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import {Table, TableBody, TableFooter, TableHeader, TableHeaderColumn, TableRow, TableRowColumn}
    from 'material-ui/Table';
import RaisedButton from 'material-ui/RaisedButton';
import CloudDownload from 'material-ui/svg-icons/file/cloud-download'

import '../../components/tap_events'

describe('DataPackDetails component', () => {

    const muiTheme = getMuiTheme();

    const selectedTasks = {
        'fcfcd526-8949-4c26-a669-a2cf6bae1e34': true,
        '81909b77-a6cd-403f-9e62-9662c9e2cdf3': false,
    }

    const getProps = () => {
        return  {
            providerTasks: providerTasks,
        }
    };

    const getWrapper = (props) => {
        return mount(<DataPackDetails {...props}/>, {
            context: {muiTheme},
            childContextTypes: {
                muiTheme: React.PropTypes.object
            }
        });
    }
    it('should render elements', () => {
        let props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(RaisedButton)).toHaveLength(1);
        expect(wrapper.find(Table)).toHaveLength(2);
        expect(wrapper.find(TableHeader)).toHaveLength(2);
        expect(wrapper.find(TableRow)).toHaveLength(2);
        expect(wrapper.find(TableHeaderColumn)).toHaveLength(12);
        expect(wrapper.find(CloudDownload)).toHaveLength(2);
    });

    it('should handle download when it is clicked', () => {
        const props = getProps();
        const handleSpy = new sinon.spy(DataPackDetails.prototype, 'handleDownload');
        const wrapper = getWrapper(props);
        wrapper.instance().handleDownload();
        expect(handleSpy.calledOnce).toBe(true);
        handleSpy.restore();
    });


});

const providerTasks = [
    {
        "name": "OpenStreetMap Data (Themes)",
        "status": "COMPLETED",
        "tasks": [
            {
                "duration": "0:00:15.317672",
                "errors": [],
                "estimated_finish": "",
                "finished_at": "2017-05-15T15:29:04.356182Z",
                "name": "OverpassQuery",
                "progress": 100,
                "result": {},
                "started_at": "2017-05-15T15:28:49.038510Z",
                "status": "SUCCESS",
                "uid": "fcfcd526-8949-4c26-a669-a2cf6bae1e34",
                "url": "http://cloud.eventkit.dev/api/tasks/fcfcd526-8949-4c26-a669-a2cf6bae1e34",
            }
        ],
        "uid": "e261d619-2a02-4ba5-a58c-be0908f97d04",
        "url": "http://cloud.eventkit.dev/api/provider_tasks/e261d619-2a02-4ba5-a58c-be0908f97d04"
    }];

