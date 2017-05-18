import React from 'react';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import {ProviderRow} from '../../components/StatusDownloadPage/ProviderRow';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn}
    from 'material-ui/Table';
import ArrowUp from 'material-ui/svg-icons/hardware/keyboard-arrow-up'
import IconButton from 'material-ui/IconButton';
import CloudDownload from 'material-ui/svg-icons/file/cloud-download'
import '../../components/tap_events'

describe('ProviderRow component', () => {

    const muiTheme = getMuiTheme();

    const selectedTasks = {
        'fcfcd526-8949-4c26-a669-a2cf6bae1e34': true,
        '81909b77-a6cd-403f-9e62-9662c9e2cdf3': false,
    }

    const getProps = () => {
        return  {
            provider: {
                name: "OpenStreetMap Data (Themes)",
                status: "COMPLETED",
                tasks: tasks,
                uid: "e261d619-2a02-4ba5-a58c-be0908f97d04",
                url: "http://cloud.eventkit.dev/api/provider_tasks/e261d619-2a02-4ba5-a58c-be0908f97d04"
            },
            onSelectionToggle: () => {},
        }
    };

    const getWrapper = (props) => {
        return mount(<ProviderRow {...props}/>, {
            context: {muiTheme},
            childContextTypes: {
                muiTheme: React.PropTypes.object
            }
        });
    }
    it('should render elements', () => {
        let props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(Table)).toHaveLength(1);
        expect(wrapper.find(TableHeader)).toHaveLength(1);
        expect(wrapper.find(TableRow)).toHaveLength(1);
        expect(wrapper.find(TableHeaderColumn)).toHaveLength(6);
        expect(wrapper.find(CloudDownload)).toHaveLength(1);
        expect(wrapper.find(IconButton)).toHaveLength(2);
        expect(wrapper.find(ArrowUp)).toHaveLength(1);
    });

    it('handleToggle should open/close Table', () => {
        const props = getProps();
        const stateSpy = new sinon.spy(ProviderRow.prototype, 'setState');
        let handleSpy = new sinon.spy(ProviderRow.prototype, 'handleToggle');
        const wrapper = getWrapper(props);
        wrapper.setState({openTable: false});
        wrapper.instance().handleToggle();
        expect(handleSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({openTable: true})).toBe(true);
        handleSpy.restore();
        stateSpy.restore();
    });

    it('should handle download when it is clicked', () => {
        const props = getProps();
        let handleSpy = new sinon.spy(ProviderRow.prototype, 'handleDownload');
        const wrapper = getWrapper(props);
        wrapper.instance().handleDownload();
        expect(handleSpy.calledOnce).toBe(true);
        handleSpy.restore();
    });

    it('should package up tasks for download onSelectionToggle', () => {


    });

});

const tasks = [
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
];

