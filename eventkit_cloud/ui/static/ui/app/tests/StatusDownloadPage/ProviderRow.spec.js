import React from 'react';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import {ProviderRow} from '../../components/StatusDownloadPage/ProviderRow';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn}
    from 'material-ui/Table';
import Checkbox from 'material-ui/Checkbox';
import ArrowUp from 'material-ui/svg-icons/hardware/keyboard-arrow-up';
import IconButton from 'material-ui/IconButton';
import CloudDownload from 'material-ui/svg-icons/file/cloud-download';
import LinearProgress from 'material-ui/LinearProgress';
import '../../components/tap_events';

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
            selectedTasks: selectedTasks,
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
        expect(wrapper.find(Checkbox)).toHaveLength(1);
    });

    it('should render the task rows when the table is open', () => {
        let props = getProps();
        const wrapper = getWrapper(props);
        wrapper.setState({openTable: true});
        expect(wrapper.find(Table)).toHaveLength(1);
        expect(wrapper.find(TableHeader)).toHaveLength(1);
        expect(wrapper.find(TableRow)).toHaveLength(2);
        expect(wrapper.find(TableRowColumn)).toHaveLength(5);
        expect(wrapper.find(Checkbox)).toHaveLength(2);
        expect(wrapper.find(TableBody)).toHaveLength(1);
        expect(wrapper.find(LinearProgress)).toHaveLength(1);
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

    it('should call componentWillMount and set the row and count state', () => {
        const props = getProps();
        const mountSpy = new sinon.spy(ProviderRow.prototype, 'componentWillMount');
        const stateSpy = new sinon.spy(ProviderRow.prototype, 'setState');
        const wrapper = getWrapper(props);
        expect(mountSpy.calledOnce).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({selectedRows: {'fcfcd526-8949-4c26-a669-a2cf6bae1e34': false}, taskCount: 1})).toBe(true);
        stateSpy.restore();
        mountSpy.restore();
    });

    it('should call onChangeCheck with the task box is checked', () => {
        const props = getProps();
        const onChangeSpy = new sinon.spy(ProviderRow.prototype, 'onChangeCheck');
        const wrapper = getWrapper(props);
        wrapper.setState({openTable: true});
        wrapper.find(TableBody).find(Checkbox).find('input').simulate('change');
        expect(onChangeSpy.calledOnce).toBe(true);
        onChangeSpy.restore();
    });

    it('should call onAllCheck when the provider box is checked', () => {
        const props = getProps();
        const onAllCheckSpy = new sinon.spy(ProviderRow.prototype, 'onAllCheck');
        const wrapper = getWrapper(props);
        wrapper.find(TableHeader).find(Checkbox).find('input').simulate('change');
        expect(onAllCheckSpy.calledOnce).toBe(true);
        onAllCheckSpy.restore();
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

    it('handleDownload should set timeout to open window with download url', () => {
        const openSpy = new sinon.spy();
        window.open = openSpy;
        const props = getProps();
        const wrapper = getWrapper(props);
        wrapper.setState({selectedRows: {'fcfcd526-8949-4c26-a669-a2cf6bae1e34': true}});
        wrapper.instance().handleDownload();
        expect(openSpy.calledOnce).toBe(true);
    });

    it('onChangeCheck should find the selected task uid and set it to checked/unchecked, then update state and call onSelectionToggle', () => {
        let props = getProps();
        props.onSelectionToggle = new sinon.spy();
        const stateSpy = new sinon.spy(ProviderRow.prototype, 'setState');
        const wrapper = getWrapper(props);
        expect(wrapper.state().selectedRows).toEqual({'fcfcd526-8949-4c26-a669-a2cf6bae1e34': false});
        wrapper.instance().onChangeCheck({target: {name: 'fcfcd526-8949-4c26-a669-a2cf6bae1e34'}}, true);
        expect(stateSpy.calledWith({selectedRows: {'fcfcd526-8949-4c26-a669-a2cf6bae1e34': true}, selectionCount: 1})).toBe(true);
        expect(props.onSelectionToggle.calledOnce).toBe(true);
        expect(props.onSelectionToggle.calledWith({'fcfcd526-8949-4c26-a669-a2cf6bae1e34': true})).toBe(true);

        expect(wrapper.state().selectedRows).toEqual({'fcfcd526-8949-4c26-a669-a2cf6bae1e34': true});
        wrapper.instance().onChangeCheck({target: {name: 'fcfcd526-8949-4c26-a669-a2cf6bae1e34'}}, false);
        expect(stateSpy.calledWith({selectedRows: {'fcfcd526-8949-4c26-a669-a2cf6bae1e34': false}, selectionCount: 0})).toBe(true);
        expect(props.onSelectionToggle.calledTwice).toBe(true);
        expect(props.onSelectionToggle.calledWith({'fcfcd526-8949-4c26-a669-a2cf6bae1e34': false})).toBe(true);
        stateSpy.restore();
    });

    it('onAllCheck should set all tasks to checked or unchecked then update state and call onSelectionToggle', () => {
        let props = getProps();
        props.onSelectionToggle = new sinon.spy();
        const stateSpy = new sinon.spy(ProviderRow.prototype, 'setState');
        const wrapper = getWrapper(props);
        expect(wrapper.state().selectedRows).toEqual({'fcfcd526-8949-4c26-a669-a2cf6bae1e34': false});
        wrapper.instance().onAllCheck({}, true);
        expect(stateSpy.calledWith({selectedRows: {'fcfcd526-8949-4c26-a669-a2cf6bae1e34': true}, selectionCount: 1})).toBe(true);
        expect(props.onSelectionToggle.calledWith({'fcfcd526-8949-4c26-a669-a2cf6bae1e34': true})).toBe(true);

        expect(wrapper.state().selectedRows).toEqual({'fcfcd526-8949-4c26-a669-a2cf6bae1e34': true});
        wrapper.instance().onAllCheck({}, false);
        expect(stateSpy.calledWith({selectedRows: {'fcfcd526-8949-4c26-a669-a2cf6bae1e34': false}, selectionCount: 0})).toBe(true);
        expect(props.onSelectionToggle.calledWith({'fcfcd526-8949-4c26-a669-a2cf6bae1e34': false})).toBe(true);
        stateSpy.restore();
    });

    it('allChecked should determine if all teh tasks in state.selectedRows are checked in the parent component', () => {
        let props = getProps();
        props.selectedTasks = {}
        const wrapper = getWrapper(props);
        expect(wrapper.instance().allChecked()).toBe(false);
        let nextProps = getProps();
        wrapper.setProps(nextProps);
        expect(wrapper.instance().allChecked()).toBe(true);
        nextProps = getProps();
        nextProps.selectedTasks['fcfcd526-8949-4c26-a669-a2cf6bae1e34'] = false;
        wrapper.setProps(nextProps);
        expect(wrapper.instance().allChecked()).toBe(false);
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
        "result": {
            "url": "http://cloud.eventkit.dev/api/tasks/fcfcd526-8949-4c26-a669-a2cf6bae1e34",
        },
    }
];

