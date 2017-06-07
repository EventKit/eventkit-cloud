import React from 'react';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import {DataPackDetails} from '../../components/StatusDownloadPage/DataPackDetails';
import ProviderRow from '../../components/StatusDownloadPage/ProviderRow';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import {Table, TableBody, TableFooter, TableHeader, TableHeaderColumn, TableRow, TableRowColumn}
    from 'material-ui/Table';
import RaisedButton from 'material-ui/RaisedButton';
import CloudDownload from 'material-ui/svg-icons/file/cloud-download';
import Checkbox from 'material-ui/Checkbox';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';
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
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('div').at(1).text()).toEqual('Download Options');
        expect(wrapper.find(Table)).toHaveLength(2);
        const table = wrapper.find(Table).first();
        expect(table.find(TableHeader)).toHaveLength(1);
        expect(table.find(TableRow)).toHaveLength(1);
        expect(table.find(TableHeaderColumn)).toHaveLength(5);
        expect(table.find(TableHeaderColumn).at(0).find(Checkbox)).toHaveLength(1);
        expect(table.find(TableHeaderColumn).at(1).text()).toEqual('DATA SETS');
        expect(table.find(TableHeaderColumn).at(2).text()).toEqual('# SELECTED');
        expect(table.find(TableHeaderColumn).at(3).text()).toEqual('PROGRESS');
        expect(table.find(TableHeaderColumn).at(4).find(RaisedButton)).toHaveLength(1);
        expect(wrapper.find(ProviderRow)).toHaveLength(1);
    });
    it('getTextFontSize should return the font string for table text based on window width', () => {
        const props = getProps();
        const wrapper = getWrapper(props);

        window.resizeTo(500, 600);
        expect(window.innerWidth).toEqual(500);
        expect(wrapper.instance().getTextFontSize()).toEqual('10px');

        window.resizeTo(700, 800);
        expect(window.innerWidth).toEqual(700);
        expect(wrapper.instance().getTextFontSize()).toEqual('11px');

        window.resizeTo(800, 900);
        expect(window.innerWidth).toEqual(800);
        expect(wrapper.instance().getTextFontSize()).toEqual('12px');

        window.resizeTo(1000, 600);
        expect(window.innerWidth).toEqual(1000);
        expect(wrapper.instance().getTextFontSize()).toEqual('13px');

        window.resizeTo(1200, 600);
        expect(window.innerWidth).toEqual(1200);
        expect(wrapper.instance().getTextFontSize()).toEqual('14px');
    });

    it('should call checkAll when the checkbox is checked/unchecked', () => {
        const props = getProps();
        const checkAllSpy = new sinon.spy(DataPackDetails.prototype, 'checkAll');
        const wrapper = getWrapper(props);
        expect(checkAllSpy.notCalled).toBe(true);
        wrapper.find(TableHeaderColumn).at(0).find(Checkbox).find('input').simulate('change');
        expect(checkAllSpy.calledOnce).toBe(true);
        checkAllSpy.restore();
    });

    it('should call handleDownload when the download button is clicked.  Button should not be enabled until taskCount is greater than zero', () => {
        const props = getProps();
        const downloadSpy = new sinon.spy(DataPackDetails.prototype, 'handleDownload');
        const wrapper = getWrapper(props);
        expect(downloadSpy.notCalled).toBe(true);
        const button = TestUtils.scryRenderedDOMComponentsWithTag(wrapper.instance(), 'button')[0];
        const node = ReactDOM.findDOMNode(button);
        expect(node.disabled).toBe(true);
        wrapper.setState({selectedTasks: {'fcfcd526-8949-4c26-a669-a2cf6bae1e34': true}, taskCount: 1});
        expect(node.disabled).toBe(false);
        TestUtils.Simulate.touchTap(node);
        expect(downloadSpy.calledOnce).toBe(true);
        downloadSpy.restore();
    });

    it('should call componentDidMount and update the state with selectedTasks', () => {
        const props = getProps();
        const stateSpy = new sinon.spy(DataPackDetails.prototype, 'setState');
        const mountSpy = new sinon.spy(DataPackDetails.prototype, 'componentDidMount');
        const wrapper = getWrapper(props);
        expect(mountSpy.calledOnce).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({selectedTasks: {'fcfcd526-8949-4c26-a669-a2cf6bae1e34': false}, taskCount: 0}));
        stateSpy.restore();
        mountSpy.restore();
    });

    it('checkAll should set all task in selectedTasks state to checked/unchecked and update state of taskCount', () => {
        const props = getProps();
        const stateSpy = new sinon.spy(DataPackDetails.prototype, 'setState');
        const wrapper = getWrapper(props);
        expect(wrapper.state().selectedTasks).toEqual({'fcfcd526-8949-4c26-a669-a2cf6bae1e34': false});
        wrapper.instance().checkAll({}, true);
        expect(stateSpy.calledWith({selectedTasks: {'fcfcd526-8949-4c26-a669-a2cf6bae1e34': true}, taskCount: 1})).toBe(true);
        expect(wrapper.state().selectedTasks).toEqual({'fcfcd526-8949-4c26-a669-a2cf6bae1e34': true});
        wrapper.instance().checkAll({}, false);
        expect(stateSpy.calledWith({selectedTasks: {'fcfcd526-8949-4c26-a669-a2cf6bae1e34': false}, taskCount: 0})).toBe(true);
        stateSpy.restore();
    });

    it('allChecked should return true if all tasks in selectedTasks state are true, else it returns false', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.instance().allChecked()).toBe(false);
        wrapper.setState({selectedTasks: {'fcfcd526-8949-4c26-a669-a2cf6bae1e34': true}});
        expect(wrapper.instance().allChecked()).toBe(true);
        wrapper.setState({selectedTasks: {}});
        expect(wrapper.instance().allChecked()).toBe(false);
    });

    it('onSelectionToggle should update the selectedTasks and taskCount state', () => {
        const props = getProps();
        const stateSpy = new sinon.spy(DataPackDetails.prototype, 'setState');
        const wrapper = getWrapper(props);
        expect(wrapper.state().selectedTasks).toEqual({'fcfcd526-8949-4c26-a669-a2cf6bae1e34': false});
        wrapper.instance().onSelectionToggle({'123-456-789': true, 'fcfcd526-8949-4c26-a669-a2cf6bae1e34': true})
        expect(stateSpy.calledWith({selectedTasks: {'123-456-789': true, 'fcfcd526-8949-4c26-a669-a2cf6bae1e34': true}, taskCount: 2})).toBe(true);
        stateSpy.restore();
    });

    it('handDownload should setTimeout for each file to be downloaded', () => {
        const openSpy = new sinon.spy();
        window.open = openSpy;
        const props = getProps();
        const wrapper = getWrapper(props);
        wrapper.setState({selectedTasks: {'fcfcd526-8949-4c26-a669-a2cf6bae1e34': true, '123456': true}});
        wrapper.instance().handleDownload();
        expect(openSpy.calledOnce).toBe(true);
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
                "result": { 
                    "url": "http://cloud.eventkit.dev/api/tasks/fcfcd526-8949-4c26-a669-a2cf6bae1e34",
                },
            }
        ],
        "uid": "e261d619-2a02-4ba5-a58c-be0908f97d04",
        "url": "http://cloud.eventkit.dev/api/provider_tasks/e261d619-2a02-4ba5-a58c-be0908f97d04"
    }];

