import React, {PropTypes, Component} from 'react'
import '../tap_events'
import moment from 'moment'
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
import styles from '../../styles/StatusDownload.css'
import { Link, IndexLink } from 'react-router';
import Checkbox from 'material-ui/Checkbox'
import LinearProgress from 'material-ui/LinearProgress';

export class ProviderRow extends React.Component {
    constructor(props) {
        super(props)
        this.handleDownload = this.handleDownload.bind(this);
        this.handleToggle = this.handleToggle.bind(this);
        this.onChangeCheck = this.onChangeCheck.bind(this);
        this.state = {
            providerTasks: [],
            openTable: false,
            selectedRows: { },
            fileSize: null,
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
                if (task.display != false) {
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

    handleDownload()  {
        let downloadUids = [];
        let selectedTasks = {...this.state.selectedRows};
        Object.keys(selectedTasks).forEach((keyName, keyIndex) => {
            if (selectedTasks[keyName] == true) {
                downloadUids.push(keyName);
            }
        });

        let tasks = this.props.provider.tasks;
        let downloadUrls = [];
        downloadUids.forEach((uid) => {
            let a = tasks.find(x => x.uid === uid)
            downloadUrls.push(a.result.url);
        })
        downloadUrls.forEach((value, idx) => {
            // setTimeout(() => {
            //     window.location.href = value;
            // }, idx * 1000);
            window.open(value, '_blank');
        });
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

    handleCloudDownload(url) {
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

        // getTimeRemaining(task){
    //     let date = moment(task.estimated_finish);
    //     let now = moment();
    //     let timeRemaining = date - now;
    //     timeRemaining = timeRemaining/1000;
    //     return timeRemaining;
    //     //task.progress == 100 ? '' : task.progress + ' %'
    // }

    getTaskStatus(task) {
        switch (task.status) {
            case "SUCCESS":
                return <Check style={{fill:'#55ba63', verticalAlign: 'middle', marginBottom: '2px'}}/>;
            case "INCOMPLETE":
                return <span style={{
                    display: 'inlineBlock',
                    borderTopWidth: '10px',
                    borderBottomWidth: '10px',
                    borderLeftWidth: '10px',
                    color: '#ce4427'
                }}>ERROR</span>
            case "PENDING":
                return "WAITING";
            case "RUNNING":
                return <span><LinearProgress mode="determinate" value={task.progress}/>{task.progress == 100 ? '' : task.progress + ' %'}</span>;
            case "CANCELED":
                return <Warning style={{marginLeft:'10px', display:'inlineBlock', fill:'#f4d225', verticalAlign: 'bottom'}}/>;
            default:
                return "";
        }
    }

    getTaskStatusIcon(taskStatus) {
        switch(taskStatus) {
            case "SUCCESS":
                return <Check style={{fill:'#55ba63', verticalAlign: 'middle', marginBottom: '2px'}}/>;
            case "PENDING":
                return "WAITING";
            case "CANCELED":
                return "CANCELED";
            case "FAILED":
                return <span style={{color:'red'}}>Error</span>;
            default:
                return "";
        }
    }
    getProviderStatusIcon(providerStatus) {
        switch(providerStatus) {
            case "COMPLETED":
                return <Check style={{fill:'#55ba63', verticalAlign: 'middle', marginBottom: '2px'}}/>;
            case "INCOMPLETE":
                return <Warning style={{marginLeft:'10px', display:'inlineBlock', fill:'#ce4427', verticalAlign: 'bottom'}}/>;
            case "SUBMITTED":
                return null;
            case "CANCELED":
                return <Warning style={{marginLeft:'10px', display:'inlineBlock', fill:'#f4d225', verticalAlign: 'bottom'}}/>;
            default:
                return null;
        }
    }

    getProviderStatus(providerStatus) {
        switch (providerStatus) {
            case "COMPLETED":
                return null;
            case "INCOMPLETE":
                return <span style={{
                    display: 'inlineBlock',
                    borderTopWidth: '10px',
                    borderBottomWidth: '10px',
                    borderLeftWidth: '10px',
                    color: '#ce4427'
                }}>ERROR</span>
            case "PENDING":
                return "WAITING";
            case "RUNNING":
                return "IN PROGRESS";
            case "CANCELED":
                return <span style={{
                    fontWeight: 'bold',
                    display: 'inlineBlock',
                    borderTopWidth: '10px',
                    borderBottomWidth: '10px',
                    borderLeftWidth: '10px',
                    color: '#f4d225'
                }}>CANCELED</span>
            default:
                return "";
        }
    }


    getTaskLink(task) {
        if(task.result == null){
            return <span style={{display:'inlineBlock', borderTopWidth:'10px', borderBottomWidth:'10px', borderLeftWidth:'10px', color:'gray'}}>{task.name}</span>
        }
        else {
            return <a className={styles.taskLink} href={task.result.url} style={{display:'inlineBlock', borderTopWidth:'10px', borderBottomWidth:'10px', borderLeftWidth:'10px', color:'#4598bf'}}>{task.name}</a>
        }
    }

    getTaskDownloadIcon(task) {
        if(task.result == null){
            return <CloudDownload key={task.result == null ? '' : task.result.url} style={{marginLeft:'10px', display:'inlineBlock', fill:'gray', verticalAlign: 'middle'}}/>
        }
        else {
            return <CloudDownload  onClick={() => {this.handleCloudDownload(task.result.url)}} key={task.result.url} style={{marginLeft:'10px', cursor: 'pointer', display:'inlineBlock', fill:'#4598bf', verticalAlign: 'middle'}}/>
        }
    }

    getProviderLink(provider) {
        if(provider.status != "COMPLETED") {
            return <span style={{display:'inlineBlock', borderTopWidth:'10px', borderBottomWidth:'10px', borderLeftWidth:'10px', color:'gray'}}>{provider.name}</span>
        }
        else {
            return <a onClick={() => {this.handleProviderCloudDownload(provider.uid)}} style={{display:'inlineBlock', borderTopWidth:'10px', borderBottomWidth:'10px', borderLeftWidth:'10px', color:'#4598bf', cursor: 'pointer'}}>{provider.name}</a>
        }
    }

    getProviderDownloadIcon(provider) {
        if(provider.status != "COMPLETED"){
            return <CloudDownload key={provider.uid} style={{marginLeft:'10px', display:'inlineBlock', fill:'gray', verticalAlign: 'middle'}}/>
        }
        else {
            return <CloudDownload  onClick={() => {this.handleProviderCloudDownload(provider.uid)}} key={provider.uid} style={{marginLeft:'10px', cursor: 'pointer', display:'inlineBlock', fill:'#4598bf', verticalAlign: 'middle'}}/>
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

    getToggleCellWidth() {
        if(window.innerWidth <= 767) {
            return '30px';
        }
        else {
            return '50px';
        }
    }


    render() {
        const style = {
              textDecoration: 'underline'
             }
        const textFontSize = this.getTextFontSize();
        const tableCellWidth = this.getTableCellWidth();
        const toggleCellWidth = this.getToggleCellWidth();
        const {provider, ...rowProps} = this.props;

        let menuItems = [];
        if(this.props.provider.status == 'PENDING' || this.props.provider.status == 'RUNNING') {
            menuItems.push(<MenuItem
                key={'cancel'}
                style={{fontSize: '12px'}}
                primaryText="Cancel"
                onClick={() => {this.props.onProviderCancel(this.props.provider.uid)}}
            />);
        }

        const tasks = provider.tasks.filter((task) => {
            return task.display != false;
        });

        let tableData;
        if(this.state.openTable == true){
            tableData = <TableBody
                displayRowCheckbox={false}
                deselectOnClickaway={false}
                showRowHover={false}
                className={styles.tableRowHighlight}
            >
                {tasks.map((task) => (

                    <TableRow selectable={false} style={{height: '20px'}} displayBorder={true} key={task.uid} >
                    <TableRowColumn style={{paddingRight: '12px', paddingLeft: '12px', width: '44px'}}>

                    </TableRowColumn>
                        <TableRowColumn style={{paddingRight: '12px', paddingLeft: '12px', fontSize: textFontSize}}>
                            {this.getTaskLink(task)}
                            {this.getTaskDownloadIcon(task)}
                        </TableRowColumn>
                    <TableRowColumn style={{width: tableCellWidth, paddingRight: '0px', paddingLeft: '0px', textAlign: 'center', fontSize: textFontSize}}>{task.result == null ? '' : task.result.size}</TableRowColumn>
                    <TableRowColumn style={{width: tableCellWidth, paddingRight: '10px', paddingLeft: '10px', textAlign: 'center', fontSize: textFontSize, fontWeight: 'bold'}}>{this.getTaskStatus(task)}</TableRowColumn>
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
                   style={{width:'100%'}}
                   selectable={false}
                   multiSelectable={false}
            >
                <TableHeader
                    displaySelectAll={false}
                    adjustForCheckbox={false}
                    enableSelectAll={false}
                    >
                    <TableRow displayBorder={true}>
                        <TableHeaderColumn style={{paddingRight: '12px', paddingLeft: '12px', width:'44px'}}>
                            <Checkbox
                                disabled={this.props.provider.status != "COMPLETED"}
                                checked={this.props.selectedProviders[this.props.provider.uid] ? true : false}
                                name={this.props.provider.uid}
                                onCheck={this.onChangeCheck}
                                checkedIcon={<CheckedBox style={{fill: '#4598bf'}}/>}
                                uncheckedIcon={<UncheckedBox style={{fill: '#4598bf'}}/>}
                            />
                        </TableHeaderColumn>
                        <TableHeaderColumn style={{paddingRight: '12px', paddingLeft: '12px', whiteSpace: 'normal', color: 'black', fontWeight: 'bold', fontSize: textFontSize}}>
                            {this.getProviderLink(this.props.provider)}
                            {this.getProviderDownloadIcon(this.props.provider)}
                        </TableHeaderColumn>
                        <TableHeaderColumn style={{width: tableCellWidth, paddingRight: '0px', paddingLeft: '0px', textAlign: 'center', color: 'black!important', fontSize: textFontSize}}>
                            {this.state.fileSize == null ? '' : this.state.fileSize + " MB"}
                        </TableHeaderColumn>
                        <TableHeaderColumn style={{width: tableCellWidth, paddingRight: '0px', paddingLeft: '0px', textAlign: 'center', color: 'black!important', fontSize: textFontSize}}>
                            {this.getProviderStatus(this.props.provider.status)}
                            {this.getProviderStatusIcon((this.props.provider.status))}
                        </TableHeaderColumn>
                        <TableHeaderColumn style={{paddingRight: '0px', paddingLeft: '0px', width: '20px',textAlign: 'right'}}>
                            {menuItems.length > 0 ? 
                                <IconMenu
                                    iconButtonElement={
                                        <IconButton
                                            style={{padding: '0px', width: '20px', verticalAlign: 'middle'}}
                                            iconStyle={{color: '#4598bf'}}>
                                            <NavigationMoreVert />
                                        </IconButton>}
                                    anchorOrigin={{horizontal: 'middle', vertical: 'center'}}
                                    targetOrigin={{horizontal: 'right', vertical: 'top'}}
                                >
                                    {menuItems}
                                </IconMenu>
                            :
                                null
                            }
                        </TableHeaderColumn>
                        <TableHeaderColumn style={{paddingRight: '0px', paddingLeft: '0px', width: toggleCellWidth, textAlign: 'left'}}>
                            <IconButton disableTouchRipple={true} onTouchTap={this.handleToggle} iconStyle={{fill: '4598bf'}}>
                                {this.state.openTable ? <ArrowDown/> : <ArrowUp/>}
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
}

export default ProviderRow;

