import React from 'react';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import IconButton from 'material-ui/IconButton';
import {ProviderRow} from '../../components/StatusDownloadPage/ProviderRow';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn}
    from 'material-ui/Table';
import Checkbox from 'material-ui/Checkbox';
import NavigationMoreVert from 'material-ui/svg-icons/navigation/more-vert';
import ArrowDown from 'material-ui/svg-icons/hardware/keyboard-arrow-down';
import Warning from 'material-ui/svg-icons/alert/warning';
import Check from 'material-ui/svg-icons/navigation/check';
import CloudDownload from 'material-ui/svg-icons/file/cloud-download';
import LinearProgress from 'material-ui/LinearProgress';
import ProviderError from '../../components/StatusDownloadPage/ProviderError';
import TaskError from '../../components/StatusDownloadPage/TaskError';
import BaseDialog from '../../components/BaseDialog';
import LicenseRow from '../../components/StatusDownloadPage/LicenseRow';

describe('ProviderRow component', () => {

    const muiTheme = getMuiTheme();

    const selectedProviders = {
        'fcfcd526-8949-4c26-a669-a2cf6bae1e34': true,
        '81909b77-a6cd-403f-9e62-9662c9e2cdf3': false,
    }

    const providers = [
        {
            "id": 2,
            "model_url": "http://cloud.eventkit.dev/api/providers/osm",
            "type": "osm",
            "license": {
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
    const getProps = () => {
        return  {
            provider: {
                name: "OpenStreetMap Data (Themes)",
                status: "COMPLETED",
                tasks: tasks,
                uid: "e261d619-2a02-4ba5-a58c-be0908f97d04",
                url: "http://cloud.eventkit.dev/api/provider_tasks/e261d619-2a02-4ba5-a58c-be0908f97d04",
                display: true,
                slug: 'osm',
            },
            selectedProviders: selectedProviders,
            providers: providers,
            backgroundColor:'white',
            onSelectionToggle: () => {},
            onProviderCancel: () => {},
        }
    };

    const getWrapper = (props) => {
        return mount(<ProviderRow {...props}/>, {
            context: {muiTheme},
            childContextTypes: {
                muiTheme: React.PropTypes.object
            }
        });
    };

    it('should render elements', () => {
        let props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(Table)).toHaveLength(1);
        expect(wrapper.find(TableHeader)).toHaveLength(1);
        expect(wrapper.find(TableRow)).toHaveLength(1);
        expect(wrapper.find(TableHeaderColumn)).toHaveLength(5);
        expect(wrapper.find(ArrowDown)).toHaveLength(1);
        //expect(wrapper.find(Checkbox)).toHaveLength(1);
        expect(wrapper.find(IconMenu)).toHaveLength(1);
        expect(wrapper.find(IconButton)).toHaveLength(2);
        expect(wrapper.find(IconButton).find(ArrowDown)).toHaveLength(1);
        expect(wrapper.find(MenuItem)).toHaveLength(0);
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
    });

    it('should render the cancel menu item if the task is pending/running and the cancel menu item should call onProviderCancel', () => {
        let props = {...getProps()};
        props.provider.status = 'PENDING';
        props.onProviderCancel = new sinon.spy();
        const wrapper = getWrapper(props);
        expect(wrapper.find(IconMenu)).toHaveLength(1);
        expect(wrapper.find(IconMenu).find(IconButton)).toHaveLength(1);
        expect(wrapper.find(IconMenu).find(NavigationMoreVert)).toHaveLength(1);
    });

    it('should render the task rows when the table is open', () => {
        let props = getProps();
        const wrapper = getWrapper(props);
        wrapper.setState({openTable: true});
        expect(wrapper.find(Table)).toHaveLength(1);
        expect(wrapper.find(TableHeader)).toHaveLength(1);
        expect(wrapper.find(TableRow)).toHaveLength(3);
        expect(wrapper.find(TableRowColumn)).toHaveLength(12);
        //expect(wrapper.find(Checkbox)).toHaveLength(1);
        expect(wrapper.find(TableBody)).toHaveLength(1);
        expect(wrapper.find(LicenseRow)).toHaveLength(1);
    });

    it('should handle summing up the file sizes', () => {
        let props = getProps();
        const wrapper = getWrapper(props);
        let nextProps = getProps();
        let fileSize = 1.234;
        const propsSpy = new sinon.spy(ProviderRow.prototype, 'componentWillReceiveProps');
        const stateSpy = new sinon.spy(ProviderRow.prototype, 'setState');
        wrapper.setProps(nextProps);
        expect(propsSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({fileSize: fileSize.toFixed(3)})).toBe(true);
        stateSpy.restore();
        propsSpy.restore();
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

    it('should call componentWillMount and set the row and count state', () => {
        const props = getProps();
        const mountSpy = new sinon.spy(ProviderRow.prototype, 'componentWillMount');
        const stateSpy = new sinon.spy(ProviderRow.prototype, 'setState');
        const wrapper = getWrapper(props);
        expect(mountSpy.calledOnce).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({selectedRows: {'e261d619-2a02-4ba5-a58c-be0908f97d04': false}})).toBe(true);
        stateSpy.restore();
        mountSpy.restore();
    });

    it('handleProviderOpen should set provider dialog to open', () => {
        const props = getProps();
        const stateSpy = new sinon.spy(ProviderRow.prototype, 'setState');
        const wrapper = shallow(<ProviderRow {...props}/>);
        wrapper.instance().handleProviderOpen(props.provider);
        expect(stateSpy.calledTwice).toBe(true);
        expect(stateSpy.calledWith({providerDesc:"OpenStreetMap vector data provided in a custom thematic schema. \n\nData is grouped into separate tables (e.g. water, roads...).", providerDialogOpen: true})).toBe(true);
        expect(wrapper.find(BaseDialog).childAt(0).text()).toEqual("OpenStreetMap vector data provided in a custom thematic schema. \n\nData is grouped into separate tables (e.g. water, roads...).");
        stateSpy.restore();
    });

    it('handleProviderClose should set the provider dialog to closed', () => {
        const props = getProps();
        const stateSpy = new sinon.spy(ProviderRow.prototype, 'setState');
        const wrapper = shallow(<ProviderRow {...props}/>);
        wrapper.instance().handleProviderClose();
        expect(stateSpy.calledTwice).toBe(true);
        expect(stateSpy.calledWith({providerDialogOpen: false})).toBe(true);
        stateSpy.restore();
    });
    // it('should call onAllCheck when the provider box is checked', () => {
    //     const props = getProps();
    //     const onChangeCheckSpy = new sinon.spy(ProviderRow.prototype, 'onChangeCheck');
    //     const wrapper = getWrapper(props);
    //     wrapper.find(TableHeader).find(Checkbox).find('input').simulate('change');
    //     expect(onChangeCheckSpy.calledOnce).toBe(true);
    //     onChangeCheckSpy.restore();
    // });

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

    it('handleSingleDownload should open a url in a different window', () => {
        const openSpy = new sinon.spy();
        window.open = openSpy;
        const props = getProps();
        const wrapper = getWrapper(props);
        wrapper.instance().handleSingleDownload();
        expect(openSpy.calledOnce).toBe(true);
    });

    it('getTaskStatus should be called with the correct status from a given task', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        props.provider.tasks[0].status = 'SUCCESS';
        expect(wrapper.instance().getTaskStatus(props.provider.tasks[0])).toEqual(
            <Check className={'qa-ProviderRow-Check-taskStatus'} style={{fill:'#55ba63', verticalAlign: 'middle', marginBottom: '2px'}}/>
        );
        props.provider.tasks[0].status = 'INCOMPLETE';
        expect(wrapper.instance().getTaskStatus(props.provider.tasks[0])).toEqual(
            <TaskError task={props.provider.tasks[0]}/>
        );
        props.provider.tasks[0].status = 'PENDING';
        expect(wrapper.instance().getTaskStatus(props.provider.tasks[0])).toEqual('WAITING');
        props.provider.tasks[0].status = 'RUNNING';
        expect(wrapper.instance().getTaskStatus({status: 'RUNNING', progress: 100})).toEqual(
            <span className={'qa-ProviderRow-span-taskStatus'}><LinearProgress mode="determinate" value={100}/>{''}</span>
        );
        expect(wrapper.instance().getTaskStatus({status: 'CANCELED'})).toEqual(
            <Warning className={'qa-ProviderRow-Warning-taskStatus'} style={{marginLeft:'10px', display:'inlineBlock', fill:'#f4d225', verticalAlign: 'bottom'}}/>
        );
        expect(wrapper.instance().getTaskStatus({status: ''})).toEqual('');
    });

    it('getProviderStatus should be called with the correct icon from a given provider status', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        props.provider.status = 'COMPLETED';
        expect(wrapper.instance().getProviderStatus(props.provider)).toEqual(
            <Check className={'qa-ProviderRow-Check-providerStatus'} style={{fill:'#55ba63', verticalAlign: 'middle', marginBottom: '2px'}}/>
        );
        props.provider.status = 'INCOMPLETE';
        expect(wrapper.instance().getProviderStatus(props.provider)).toEqual(
            <ProviderError provider={props.provider} key={props.provider.uid}/>
        );
        props.provider.status = 'PENDING';
        expect(wrapper.instance().getProviderStatus(props.provider)).toEqual('WAITING');
        props.provider.status = 'RUNNING';
        expect(wrapper.instance().getProviderStatus(props.provider)).toEqual('IN PROGRESS');
        props.provider.status = 'CANCELED';
        expect(wrapper.instance().getProviderStatus(props.provider)).toEqual(
            <span className={'qa-ProviderRow-span-providerStatus'} style={{
                fontWeight: 'bold',
                display: 'inlineBlock',
                borderTopWidth: '10px',
                borderBottomWidth: '10px',
                borderLeftWidth: '10px',
                color: '#f4d225'
            }}>CANCELED<Warning className={'qa-ProviderRow-Warning-providerStatus'} style={{marginLeft:'10px', display:'inlineBlock', fill:'#f4d225', verticalAlign: 'bottom'}}/></span>
        );
        expect(wrapper.instance().getProviderStatus('')).toEqual('');
    });

    it('getTaskLink should return a "span" element', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const task = {result: {}, name: 'test name'};
        const link = wrapper.instance().getTaskLink(task);
        const elem = shallow(link);
        expect(elem.is('span')).toBe(true);
        expect(elem.text()).toEqual('test name');
    });

    it('getTaskLink should return a "a" element with click handler', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const task = {result: {url: 'test-url.io'}, name: 'test name'};
        const link = wrapper.instance().getTaskLink(task);
        wrapper.instance().handleSingleDownload = new sinon.spy();
        const elem = shallow(link);
        expect(elem.is('a')).toBe(true);
        expect(elem.text()).toEqual('test name');
        elem.simulate('click');
        expect(wrapper.instance().handleSingleDownload.calledOnce).toBe(true);
        expect(wrapper.instance().handleSingleDownload.calledWith('test-url.io')).toBe(true);
    });

    it('getTaskDownloadIcon should return a disabled icon', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const task = {result: {}};
        const icon = wrapper.instance().getTaskDownloadIcon(task);
        const elem = mount(icon, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(elem.is(CloudDownload)).toBe(true);
        expect(elem.props().onClick).toBe(undefined);
    });

    it('getTaskDownloadIcon should return a icon with click handler', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const task = {result: {url: 'test-url.io'}};
        const icon = wrapper.instance().getTaskDownloadIcon(task);
        const elem = mount(icon, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(elem.is(CloudDownload)).toBe(true);
        expect(elem.props().onClick).not.toBe(undefined);
    });

    // it('getProviderLink should be called with the icon from a given provider', () => {
    //     const props = getProps();
    //     const getProviderLinkSpy = new sinon.spy(ProviderRow.prototype, 'getProviderLink');
    //     const wrapper = getWrapper(props);
    //     wrapper.instance().getProviderLink(provider);
    //     expect(getProviderLinkSpy.calledWith(provider)).toBe(true);
    // });
    //
    // it('getProviderDownloadIcon should be called with the correct icon from a given provider', () => {
    //     const props = getProps();
    //     const getProviderDownloadIconSpy = new sinon.spy(ProviderRow.prototype, 'getProviderDownloadIcon');
    //     const wrapper = getWrapper(props);
    //     wrapper.instance().getProviderDownloadIcon(provider);
    //     expect(getProviderDownloadIconSpy.calledWith(provider)).toBe(true);
    // });

    // it('onChangeCheck should find the selected task uid and set it to checked/unchecked, then update state and call onSelectionToggle', () => {
    //     let props = getProps();
    //     props.onSelectionToggle = new sinon.spy();
    //     const stateSpy = new sinon.spy(ProviderRow.prototype, 'setState');
    //     const wrapper = getWrapper(props);
    //     expect(wrapper.state().selectedRows).toEqual({'e261d619-2a02-4ba5-a58c-be0908f97d04': false});
    //     wrapper.instance().onChangeCheck({target: {name: 'e261d619-2a02-4ba5-a58c-be0908f97d04'}}, true);
    //     expect(stateSpy.calledWith({selectedRows: {'e261d619-2a02-4ba5-a58c-be0908f97d04': true}})).toBe(true);
    //     expect(props.onSelectionToggle.calledOnce).toBe(true);
    //     expect(props.onSelectionToggle.calledWith({'e261d619-2a02-4ba5-a58c-be0908f97d04': true})).toBe(true);
    //
    //     expect(wrapper.state().selectedRows).toEqual({'e261d619-2a02-4ba5-a58c-be0908f97d04': true});
    //     wrapper.instance().onChangeCheck({target: {name: 'e261d619-2a02-4ba5-a58c-be0908f97d04'}}, false);
    //     expect(stateSpy.calledWith({selectedRows: {'e261d619-2a02-4ba5-a58c-be0908f97d04': false}})).toBe(true);
    //     expect(props.onSelectionToggle.calledTwice).toBe(true);
    //     expect(props.onSelectionToggle.calledWith({'e261d619-2a02-4ba5-a58c-be0908f97d04': false})).toBe(true);
    //     stateSpy.restore();
    // });

    // it('should call handleProviderCloudDownload when the download link is clicked. ', () => {
    //     const props = getProps();
    //     const downloadSpy = new sinon.spy(ProviderRow.prototype, 'handleProviderCloudDownload');
    //     const wrapper = getWrapper(props);
    //     expect(downloadSpy.notCalled).toBe(true);
    //     wrapper.find('a').simulate('click');
    //     expect(downloadSpy.calledOnce).toBe(true);
    //     downloadSpy.restore();
    // });

});

const tasks = [
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
            "file":"osm.pkg",
            "size": "1.234 MB",
            "url": "http://cloud.eventkit.dev/api/tasks/fcfcd526-8949-4c26-a669-a2cf6bae1e34",
        },
        "display": true,
    }
];

const provider = {
    "name": "OpenStreetMap Data (Themes)",
    "status": "COMPLETED",
    "tasks": tasks,
    "uid": "e261d619-2a02-4ba5-a58c-be0908f97d04",
    "url": "http://cloud.eventkit.dev/api/provider_tasks/e261d619-2a02-4ba5-a58c-be0908f97d04",
    "display":true,
}