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

describe('DataPackDetails component', () => {

    const muiTheme = getMuiTheme();

    const selectedTasks = {
        'fcfcd526-8949-4c26-a669-a2cf6bae1e34': true,
        '81909b77-a6cd-403f-9e62-9662c9e2cdf3': false,
    }

    const getProps = () => {
        return  {
            providerTasks: providerTasks,
            providers: providers,
            zipFileProp: null,
            onProviderCancel: () => {},
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
        expect(table.find(TableHeaderColumn)).toHaveLength(4);
        //expect(table.find(TableHeaderColumn).at(0).find(Checkbox)).toHaveLength(1);
        expect(table.find(TableHeaderColumn).at(0).text()).toEqual('CREATING DATAPACK ZIP');
        expect(table.find(TableHeaderColumn).at(0).find(RaisedButton)).toHaveLength(1);
        expect(table.find(TableHeaderColumn).at(1).text()).toEqual('FILE SIZE');
        expect(table.find(TableHeaderColumn).at(2).text()).toEqual('PROGRESS');
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

    it('getTableCellWidth should return the pixel string for table width based on window width', () => {
        const props = getProps();
        const wrapper = getWrapper(props);

        window.resizeTo(700, 800);
        expect(window.innerWidth).toEqual(700);
        expect(wrapper.instance().getTableCellWidth()).toEqual('80px');

        window.resizeTo(800, 900);
        expect(window.innerWidth).toEqual(800);
        expect(wrapper.instance().getTableCellWidth()).toEqual('120px');

        window.resizeTo(1000, 600);
        expect(window.innerWidth).toEqual(1000);
        expect(wrapper.instance().getTableCellWidth()).toEqual('120px');

        window.resizeTo(1200, 600);
        expect(window.innerWidth).toEqual(1200);
        expect(wrapper.instance().getTableCellWidth()).toEqual('120px');
    });


    // it('should call checkAll when the checkbox is checked/unchecked', () => {
    //     const props = getProps();
    //     const checkAllSpy = new sinon.spy(DataPackDetails.prototype, 'checkAll');
    //     const wrapper = getWrapper(props);
    //     expect(checkAllSpy.notCalled).toBe(true);
    //     wrapper.find(TableHeaderColumn).at(0).find(Checkbox).find('input').simulate('change');
    //     expect(checkAllSpy.calledOnce).toBe(true);
    //     checkAllSpy.restore();
    // });

    // it('should call handleDownload when the download button is clicked', () => {
    //     const props = getProps();
    //     const downloadSpy = new sinon.spy(DataPackDetails.prototype, 'handleDownload');
    //     const wrapper = getWrapper(props);
    //     expect(downloadSpy.notCalled).toBe(true);
    //     const button = TestUtils.scryRenderedDOMComponentsWithTag(wrapper.instance(), 'button')[0];
    //     const node = ReactDOM.findDOMNode(button);
    //     expect(node.disabled).toBe(true);
    //     wrapper.setState({selectedProviders: {'e261d619-2a02-4ba5-a58c-be0908f97d04': true}});
    //     expect(node.disabled).toBe(false);
    //     TestUtils.Simulate.touchTap(node);
    //     expect(downloadSpy.calledOnce).toBe(true);
    //     downloadSpy.restore();
    // });

    // it('should call componentDidMount and update the state with selectedProviders', () => {
    //     const props = getProps();
    //     const stateSpy = new sinon.spy(DataPackDetails.prototype, 'setState');
    //     const mountSpy = new sinon.spy(DataPackDetails.prototype, 'componentDidMount');
    //     const wrapper = getWrapper(props);
    //     expect(mountSpy.calledOnce).toBe(true);
    //     expect(stateSpy.calledOnce).toBe(true);
    //     expect(stateSpy.calledWith({selectedProviders: {'e261d619-2a02-4ba5-a58c-be0908f97d04': false}})).toBe(true);
    //     stateSpy.restore();
    //     mountSpy.restore();
    // });

    // it('checkAll should set all task in selectedProviders state to checked/unchecked and update state of taskCount', () => {
    //     const props = getProps();
    //     const stateSpy = new sinon.spy(DataPackDetails.prototype, 'setState');
    //     const wrapper = getWrapper(props);
    //     expect(wrapper.state().selectedProviders).toEqual({'e261d619-2a02-4ba5-a58c-be0908f97d04': false});
    //     wrapper.instance().checkAll({}, true);
    //     expect(stateSpy.calledWith({selectedProviders: {'e261d619-2a02-4ba5-a58c-be0908f97d04': true}})).toBe(true);
    //     expect(wrapper.state().selectedProviders).toEqual({'e261d619-2a02-4ba5-a58c-be0908f97d04': true});
    //     wrapper.instance().checkAll({}, false);
    //     expect(stateSpy.calledWith({selectedProviders: {'e261d619-2a02-4ba5-a58c-be0908f97d04': false}})).toBe(true);
    //     let nextProps = {onProviderCancel: () => {}, providerTasks: [{...providerTasks[0]}]};
    //     // stateSpy.reset();
    //     nextProps.providerTasks[0].display =  false;
    //     nextProps.providerTasks[0].uid = 'not-called';
    //     wrapper.setProps(nextProps);
    //     wrapper.instance().checkAll({}, true);
    //     // expect(stateSpy.called).toBe(false);
    //     expect(stateSpy.calledWith({selectedProviders: {'not-called': true}})).toBe(false);
    //     stateSpy.restore();
    // });

    // it('allChecked should return true if all tasks in selectedProviders state are true, else it returns false', () => {
    //     const props = getProps();
    //     const wrapper = getWrapper(props);
    //     expect(wrapper.instance().allChecked()).toBe(false);
    //     wrapper.setState({selectedProviders: {'e261d619-2a02-4ba5-a58c-be0908f97d04': true}});
    //     expect(wrapper.instance().allChecked()).toBe(true);
    //     wrapper.setState({selectedProviders: {}});
    //     expect(wrapper.instance().allChecked()).toBe(false);
    // });
    //
    // it('onSelectionToggle should update the selectedProviders and taskCount state', () => {
    //     const props = getProps();
    //     const stateSpy = new sinon.spy(DataPackDetails.prototype, 'setState');
    //     const wrapper = getWrapper(props);
    //     expect(wrapper.state().selectedProviders).toEqual({'e261d619-2a02-4ba5-a58c-be0908f97d04': false});
    //     wrapper.instance().onSelectionToggle({'123-456-789': true, 'e261d619-2a02-4ba5-a58c-be0908f97d04': true})
    //     expect(stateSpy.calledWith({selectedProviders: {'123-456-789': true, 'e261d619-2a02-4ba5-a58c-be0908f97d04': true}})).toBe(true);
    //     stateSpy.restore();
    // });

    // it('isDownloadAllDisabled should return true or false', () => {
    //     const props = getProps();
    //     const wrapper = getWrapper(props);
    //     wrapper.setState({selectedProviders: {}});
    //     expect(wrapper.instance().isDownloadAllDisabled()).toEqual(true);
    //     wrapper.setState({selectedProviders: {one: true, two: false}});
    //     expect(wrapper.instance().isDownloadAllDisabled()).toEqual(false);
    //     wrapper.setState({selectedProviders: {one: false, two: false}});
    //     expect(wrapper.instance().isDownloadAllDisabled()).toEqual(true);
    // });

    it('isZipFileCompleted should return true or false', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const zipSpy = new sinon.spy(DataPackDetails.prototype, 'isZipFileCompleted');
        props.zipFileProp = null;
        wrapper.instance().isZipFileCompleted();
        expect(wrapper.instance().isZipFileCompleted()).toEqual(true);
        let nextProps = {...props};
        nextProps.zipFileProp = 'TESTING.zip';
        wrapper.setProps(nextProps);
        wrapper.instance().isZipFileCompleted();
        expect(wrapper.instance().isZipFileCompleted()).toEqual(false);
    });

    it('getCloudDownloadIcon should be called with correct data', () => {
        const props = getProps();
        const getCloudIcon = new sinon.spy(DataPackDetails.prototype, 'getCloudDownloadIcon');
        const wrapper = getWrapper(props);
        props.zipFileProp = null;
        wrapper.instance().getCloudDownloadIcon();
        expect(wrapper.instance().getCloudDownloadIcon()).toEqual(<CloudDownload className={'qa-DataPackDetails-CloudDownload-disabled'} style={{fill:'gray', verticalAlign: 'middle'}}/>);
        let nextProps = {...props};
        nextProps.zipFileProp = 'TESTING.zip';
        wrapper.setProps(nextProps);
        wrapper.instance().getCloudDownloadIcon();
        expect(wrapper.instance().getCloudDownloadIcon()).toEqual(<CloudDownload className={'qa-DataPackDetails-CloudDownload-enabled'} style={{fill:'#4598bf', verticalAlign: 'middle'}}/>);
    });
    // it('getCheckboxStatus should return true or false depending on providerTask prop', () => {
    //     let props = {...getProps()};
    //     props.providerTasks[0].status = 'PENDING';
    //     const wrapper = getWrapper(props);
    //     expect(wrapper.instance().getCheckboxStatus()).toBe(true);
    //     let nextProps = {...props};
    //     nextProps.providerTasks[0].status = 'COMPLETED';
    //     wrapper.setProps(nextProps);
    //     expect(wrapper.instance().getCheckboxStatus()).toBe(false);
    // });
    //
    // it('handDownload should open a tab for each file to be downloaded', () => {
    //     const openSpy = new sinon.spy(window, 'open');
    //     let props = getProps();
    //     let otherTask = JSON.parse(JSON.stringify(providerTasks[0]));
    //     otherTask.tasks[0].display = false;
    //     otherTask.uid = '12345';
    //     props.providerTasks.push(otherTask);
    //     const wrapper = getWrapper(props);
    //     wrapper.setState({selectedProviders: {'e261d619-2a02-4ba5-a58c-be0908f97d04': true, '12345': true, '3': false}});
    //     wrapper.instance().handleDownload();
    //     console.log(openSpy.callCount);
    //     expect(openSpy.calledOnce).toBe(true);
    // });
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
                "started_at": "2017-05-15T15:28:49.038510Z",
                "status": "SUCCESS",
                "uid": "fcfcd526-8949-4c26-a669-a2cf6bae1e34",
                "result": {
                    "size": "1.234 MB",
                    "url": "http://cloud.eventkit.dev/api/tasks/fcfcd526-8949-4c26-a669-a2cf6bae1e34",
                },
                "display": true,
            }
        ],
        "uid": "e261d619-2a02-4ba5-a58c-be0908f97d04",
        "url": "http://cloud.eventkit.dev/api/provider_tasks/e261d619-2a02-4ba5-a58c-be0908f97d04",
        "display": true,
        "slug":"osm"
    }];

const providers = [
    {
        "id": 2,
        "model_url": "http://cloud.eventkit.dev/api/providers/osm",
        "type": "osm",
        "license":  {
            "slug": "osm",
            "name": "Open Database License (ODbL) v1.0",
            "text": "ODC Open Database License (ODbL)."
        },
        "created_at": "2017-08-15T19:25:10.844911Z",
        "updated_at": "2017-08-15T19:25:10.844919Z",
        "uid": "bc9a834a-727a-4779-8679-2500880a8526",
        "name": "OpenStreetMap Data (Themes)",
        "slug": "osm",
        "preview_url": "",
        "service_copyright": "",
        "service_description": "OpenStreetMap vector data provided in a custom thematic schema. \n\nData is grouped into separate tables (e.g. water, roads...).",
        "layer": null,
        "level_from": 0,
        "level_to": 10,
        "zip": false,
        "display": true,
        "export_provider_type": 2
    },
]