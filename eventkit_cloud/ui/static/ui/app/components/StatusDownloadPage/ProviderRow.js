import React, {PropTypes, Component} from 'react'
import {Table, TableBody, TableHeader,
    TableHeaderColumn, TableRow, TableRowColumn} from 'material-ui/Table';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import NavigationMoreVert from 'material-ui/svg-icons/navigation/more-vert';
import ArrowDown from 'material-ui/svg-icons/hardware/keyboard-arrow-down'
import ArrowUp from 'material-ui/svg-icons/hardware/keyboard-arrow-up'
import UncheckedBox from 'material-ui/svg-icons/toggle/check-box-outline-blank'
import CheckedBox from 'material-ui/svg-icons/toggle/check-box'
import Warning from 'material-ui/svg-icons/alert/warning'
import Check from 'material-ui/svg-icons/navigation/check'
import IconButton from 'material-ui/IconButton';
import CloudDownload from 'material-ui/svg-icons/file/cloud-download'
import { Link, IndexLink } from 'react-router';
import Checkbox from 'material-ui/Checkbox'
import LinearProgress from 'material-ui/LinearProgress';
import CustomScrollbar from '../CustomScrollbar';
import TaskError from './TaskError';
import ProviderError from './ProviderError';
import BaseDialog from '../BaseDialog';
import LicenseRow from './LicenseRow';

export class ProviderRow extends React.Component {
    constructor(props) {
        super(props)
        this.handleSingleDownload = this.handleSingleDownload.bind(this);
        this.handleToggle = this.handleToggle.bind(this);
        this.onChangeCheck = this.onChangeCheck.bind(this);
        this.state = {
            providerTasks: [],
            openTable: false,
            selectedRows: { },
            fileSize: null,
            providerDesc: '',
            providerDialogOpen: false,
            cloneDialogOpen: false,
        }
    }

    componentWillMount(){
        //set state on the provider
        let t = {};
        let uid = this.props.provider.uid;
        t[uid] = false;
        this.setState({selectedRows:t})
    }

    componentWillReceiveProps(nextProps) {
        let fileSize = 0.000;
        nextProps.provider.tasks.forEach((task) => {
            if (task.result != null ){
                if (task.display != false && task.result.size) {
                    let textReplace = task.result.size.replace(' MB', '');
                    let number = textReplace;
                    fileSize = Number(fileSize) + Number(number);
                    this.setState({fileSize: fileSize.toFixed(3)});
                }
            }
        })

        if(nextProps.selectedProviders != this.state.selectedRows) {
            this.setState({selectedRows : nextProps.selectedProviders})
        }
    }

    handleToggle() {
        this.setState({openTable: !this.state.openTable});
    }

    onChangeCheck(e, checked){
        const selectedRows = {...this.state.selectedRows};
        selectedRows[e.target.name] = checked;

        // update state
        this.setState({
            selectedRows
        });
        this.props.onSelectionToggle(selectedRows);
    }

    getTextFontSize() {
        if(window.innerWidth <= 575) {
            return '10px';
        }
        else if (window.innerWidth <= 767) {
            return '11px';
        }
        else if (window.innerWidth <= 991) {
            return '12px';
        }
        else if(window.innerWidth <= 1199) {
            return '13px';
        }
        else {
            return '14px';
        }
    }

    handleSingleDownload(url) {
        window.open(url, '_blank');
    }

    handleProviderCloudDownload(providerUid) {
        let downloadUrls = [];
        this.props.provider.tasks.forEach((column) => {
            if(column.display == true) {
                let url = column.result.url;
                downloadUrls.push(url);
            }
        })
        downloadUrls.forEach((value, idx) => {
            window.open(value, '_blank');
        });
    }


    getTaskStatus(task) {
        switch (task.status) {
            case "SUCCESS":
                return <Check  className={'qa-ProviderRow-Check-taskStatus'} style={{fill:'#55ba63', verticalAlign: 'middle', marginBottom: '2px'}}/>;
            case "INCOMPLETE":
                return <TaskError task={task}/>
            case "PENDING":
                return "WAITING";
            case "RUNNING":
                return <span className={'qa-ProviderRow-span-taskStatus'}><LinearProgress mode="determinate" value={task.progress}/>{task.progress == 100 ? '' : task.progress + ' %'}</span>;
            case "CANCELED":
                return <Warning  className={'qa-ProviderRow-Warning-taskStatus'} style={{marginLeft:'10px', display:'inlineBlock', fill:'#f4d225', verticalAlign: 'bottom'}}/>;
            default:
                return "";
        }
    }

    getProviderStatus(provider) {
        switch (provider.status) {
            case "COMPLETED":
                return <Check className={'qa-ProviderRow-Check-providerStatus'} style={{fill:'#55ba63', verticalAlign: 'middle', marginBottom: '2px'}}/>;
            case "INCOMPLETE":
                return <ProviderError provider={provider} key={provider.uid}/>;
            case "PENDING":
                return "WAITING";
            case "RUNNING":
                return "IN PROGRESS";
            case "CANCELED":
                return <span  className={'qa-ProviderRow-span-providerStatus'} style={{
                    fontWeight: 'bold',
                    display: 'inlineBlock',
                    borderTopWidth: '10px',
                    borderBottomWidth: '10px',
                    borderLeftWidth: '10px',
                    color: '#f4d225'
                }}>CANCELED<Warning className={'qa-ProviderRow-Warning-providerStatus'} style={{marginLeft:'10px', display:'inlineBlock', fill:'#f4d225', verticalAlign: 'bottom'}}/></span>
            default:
                return "";
        }
    }


    getTaskLink(task) {
        if (!task.result.hasOwnProperty('url')) {
            return <span className={'qa-ProviderRow-span-taskLinkDisabled'} style={{display:'inlineBlock', color:'gray'}}>{task.name}</span>
        }
        else {
            return <a  className={'qa-ProviderRow-a-taskLinkenabled'} onClick={() => {this.handleSingleDownload(task.result.url)}} style={{display:'inlineBlock', color:'#4598bf', cursor: 'pointer'}}>{task.name}</a>
        }
    }

    getTaskDownloadIcon(task) {
        if (!task.result.hasOwnProperty('url')) {
            return <CloudDownload  className={'qa-ProviderRow-CloudDownload-taskLinkDisabled'} key={task.result == null ? '' : task.result.url} style={{marginLeft:'10px', display:'inlineBlock', fill:'gray', verticalAlign: 'middle'}}/>
        }
        else {
            return <CloudDownload className={'qa-ProviderRow-CloudDownload-taskLinkEnabled'} onClick={() => {this.handleSingleDownload(task.result.url)}} key={task.result.url} style={{marginLeft:'10px', cursor: 'pointer', display:'inlineBlock', fill:'#4598bf', verticalAlign: 'middle'}}/>
        }
    }

    getProviderLink(provider) {
        if(provider.status != "COMPLETED") {
            return <span className={'qa-ProviderRow-span-providerLinkDisabled'} style={{display:'inlineBlock', borderTopWidth:'10px', borderBottomWidth:'10px', borderLeftWidth:'10px', color:'gray'}}>{provider.name}</span>
        }
        else {
            return <a className={'qa-ProviderRow-a-providerLinkEnabled'} onClick={() => {this.handleProviderCloudDownload(provider.uid)}} style={{display:'inlineBlock', borderTopWidth:'10px', borderBottomWidth:'10px', borderLeftWidth:'10px', color:'#4598bf', cursor: 'pointer'}}>{provider.name}</a>
        }
    }

    getProviderDownloadIcon(provider) {
        if(provider.status != "COMPLETED"){
            return <CloudDownload className={'qa-ProviderRow-CloudDownload-providerLinkDisabled'} key={provider.uid} style={{marginLeft:'10px', display:'inlineBlock', fill:'gray', verticalAlign: 'middle'}}/>
        }
        else {
            return <CloudDownload className={'qa-ProviderRow-CloudDownload-providerLinkEnabled'} onClick={() => {this.handleProviderCloudDownload(provider.uid)}} key={provider.uid} style={{marginLeft:'10px', cursor: 'pointer', display:'inlineBlock', fill:'#4598bf', verticalAlign: 'middle'}}/>
        }
    }

    getTableCellWidth() {
        if(window.innerWidth <= 767) {
            return '80px';
        }
        else {
            return '120px';
        }
    }

    handleProviderClose = () => {
        this.setState({providerDialogOpen: false});
    };

    handleProviderOpen(runProviders) {
        let propsProvider = this.props.providers.find(x => x.slug === runProviders.slug);
        let providerDesc = propsProvider.service_description;
        this.setState({providerDesc, providerDialogOpen: true});
    };

    render() {
        const textFontSize = this.getTextFontSize();
        const tableCellWidth = this.getTableCellWidth();
        const toggleCellWidth = '50px';
        const {provider, ...rowProps} = this.props;
        let propsProvider = this.props.providers.find(x => x.slug === this.props.provider.slug);
        const licenseData = propsProvider.license ?
            <LicenseRow name={propsProvider.license.name} text={propsProvider.license.text}/>
            :
            null;
        let menuItems = [];
        let cancelMenuDisabled;
        if(this.props.provider.status == 'PENDING' || this.props.provider.status == 'RUNNING') {
            cancelMenuDisabled = false;
        }
        else {
            cancelMenuDisabled = true;
        }
        menuItems.push(<MenuItem
            className={'qa-ProviderRow-MenuItem-cancel'}
            key={'cancel'}
            disabled={cancelMenuDisabled}
            style={{fontSize: '12px'}}
            primaryText="Cancel"
            onClick={() => {this.props.onProviderCancel(this.props.provider.uid)}}
        />,<MenuItem
            className={'qa-ProviderRow-MenuItem-viewDataSources'}
        key={'viewProviderData'}
        style={{fontSize: '12px'}}
        primaryText='View Data Source'
        onClick={this.handleProviderOpen.bind(this, this.props.provider)}
    />);

        const tasks = provider.tasks.filter((task) => {
            return task.display != false;
        });

        let tableData;
        if(this.state.openTable == true){
            tableData = <TableBody
                className={'qa-ProviderRow-TableBody'}
                displayRowCheckbox={false}
                deselectOnClickaway={false}
                showRowHover={false}
                >
                {licenseData}
                {tasks.map((task) => (

                    <TableRow className={'qa-ProviderRow-TableRow-task'} selectable={false} style={{height: '20px'}} displayBorder={true} key={task.uid} >
                    <TableRowColumn style={{paddingRight: '12px', paddingLeft: '12px', width: '12px'}}>

                    </TableRowColumn>
                        <TableRowColumn className={'qa-ProviderRow-TableRowColumn-taskLinks'} style={{paddingRight: '12px', paddingLeft: '0px', fontSize: textFontSize}}>
                            {this.getTaskLink(task)}
                            {this.getTaskDownloadIcon(task)}
                        </TableRowColumn>
                    <TableRowColumn  className={'qa-ProviderRow-TableRowColumn-size'} style={{width: tableCellWidth, paddingRight: '0px', paddingLeft: '0px', textAlign: 'center', fontSize: textFontSize}}>{task.result == null ? '' : task.result.size}</TableRowColumn>
                    <TableRowColumn  className={'qa-ProviderRow-TableRowColumn-status'} style={{width: tableCellWidth, paddingRight: '10px', paddingLeft: '10px', textAlign: 'center', fontSize: textFontSize, fontWeight: 'bold'}}>{this.getTaskStatus(task)}</TableRowColumn>
                    <TableRowColumn style={{paddingRight: '0px', paddingLeft: '0px', width: '20px',textAlign: 'center', fontSize: textFontSize}}></TableRowColumn>
                    <TableRowColumn style={{paddingRight: '0px', paddingLeft: '0px', width: toggleCellWidth, textAlign: 'center', fontSize: textFontSize}}></TableRowColumn>
                    </TableRow>

                ))}

            </TableBody>
        }
        else{
            tableData = <TableBody/>
        }

        return (
            <Table key={this.props.provider.uid}
                   className={'qa-ProviderRow-Table'}
                   style={{width:'100%', backgroundColor:this.props.backgroundColor}}
                   selectable={false}
                   multiSelectable={false}
            >
                <TableHeader
                    className={'qa-ProviderRow-TableHeader'}
                    displaySelectAll={false}
                    adjustForCheckbox={false}
                    enableSelectAll={false}
                    >
                    <TableRow  className={'qa-ProviderRow-TableRow-provider'} displayBorder={true}>
                        {/*<TableHeaderColumn style={{paddingRight: '12px', paddingLeft: '12px', width:'12px'}}>*/}
                            {/*<Checkbox*/}
                                {/*disabled={this.props.provider.status != "COMPLETED"}*/}
                                {/*checked={this.props.selectedProviders[this.props.provider.uid] ? true : false}*/}
                                {/*name={this.props.provider.uid}*/}
                                {/*onCheck={this.onChangeCheck}*/}
                                {/*checkedIcon={<CheckedBox style={{fill: '#4598bf'}}/>}*/}
                                {/*uncheckedIcon={<UncheckedBox style={{fill: '#4598bf'}}/>}*/}
                            {/*/>*/}
                        {/*</TableHeaderColumn>*/}
                        {/*<TableHeaderColumn style={{paddingRight: '12px', paddingLeft: '12px', whiteSpace: 'normal', color: 'black', fontWeight: 'bold', fontSize: textFontSize}}>*/}
                            {/*{this.getProviderLink(this.props.provider)}*/}
                            {/*{this.getProviderDownloadIcon(this.props.provider)}*/}
                        {/*</TableHeaderColumn>*/}
                        <TableHeaderColumn className={'qa-ProviderRow-TableRowColumn-providerName'} style={{paddingRight: '12px', paddingLeft: '12px', whiteSpace: 'normal', color: 'black', fontWeight: 'bold', fontSize: textFontSize}}>
                            {this.props.provider.name}
                        </TableHeaderColumn>
                        <TableHeaderColumn className={'qa-ProviderRow-TableRowColumn-fileSize'} style={{width: tableCellWidth, paddingRight: '0px', paddingLeft: '0px', textAlign: 'center', color: 'black!important', fontSize: textFontSize}}>
                            {this.state.fileSize == null ? '' : this.state.fileSize + " MB"}
                        </TableHeaderColumn>
                        <TableHeaderColumn className={'qa-ProviderRow-TableRowColumn-providerStatus'} style={{width: tableCellWidth, paddingRight: '0px', paddingLeft: '0px', textAlign: 'center', color: 'black!important', fontSize: textFontSize}}>
                            {this.getProviderStatus(this.props.provider)}

                        </TableHeaderColumn>
                        <TableHeaderColumn className={'qa-ProviderRow-TableRowColumn-menu'} style={{paddingRight: '0px', paddingLeft: '0px', width: '20px',textAlign: 'right'}}>
                            {menuItems.length > 0 ? 
                                <IconMenu
                                    className={'qa-ProviderRow-IconMenu'}
                                    iconButtonElement={
                                        <IconButton
                                            className={'qa-ProviderRow-IconButton'}
                                            style={{padding: '0px', width: '20px', verticalAlign: 'middle'}}
                                            iconStyle={{color: '#4598bf'}}>
                                            <NavigationMoreVert className={'qa-ProviderRow-NavigationMoreVert'}/>
                                        </IconButton>}
                                    anchorOrigin={{horizontal: 'right', vertical: 'top'}}
                                    targetOrigin={{horizontal: 'right', vertical: 'top'}}
                                >
                                    {menuItems}
                                </IconMenu>
                            :
                                null
                            }
                            <BaseDialog
                                className={'qa-ProviderRow-BaseDialog'}
                                show={this.state.providerDialogOpen}
                                title={this.props.provider.name}
                                onClose={this.handleProviderClose.bind(this)}
                            >
                                {this.state.providerDesc}
                            </BaseDialog>
                        </TableHeaderColumn>
                        <TableHeaderColumn className={'qa-ProviderRow-TableRowColumn-arrows'} style={{paddingRight: '0px', paddingLeft: '0px', width: toggleCellWidth, textAlign: 'left'}}>
                            <IconButton disableTouchRipple={true} onTouchTap={this.handleToggle} iconStyle={{fill: '4598bf'}}>
                                {this.state.openTable ? <ArrowUp className={'qa-ProviderRow-ArrowUp'}/> : <ArrowDown className={'qa-ProviderRow-ArrowDown'}/>}
                            </IconButton>
                        </TableHeaderColumn>
                    </TableRow>
                </TableHeader>
                            {tableData}
            </Table>
        )
    }
}

ProviderRow.propTypes = {
    provider: PropTypes.object.isRequired,
    onSelectionToggle: PropTypes.func,
    selectedProviders: PropTypes.object,
    onProviderCancel: PropTypes.func.isRequired,
    providers: PropTypes.array.isRequired,
    backgroundColor: PropTypes.string.isRequired,
}

export default ProviderRow;

