import React, {PropTypes, Component} from 'react'
import '../tap_events'
import {Table, TableBody, TableHeader,
    TableHeaderColumn, TableRow, TableRowColumn} from 'material-ui/Table';
import ArrowDown from 'material-ui/svg-icons/hardware/keyboard-arrow-down'
import ArrowUp from 'material-ui/svg-icons/hardware/keyboard-arrow-up'
import UncheckedBox from 'material-ui/svg-icons/toggle/check-box-outline-blank'
import CheckedBox from 'material-ui/svg-icons/toggle/check-box'
import IconButton from 'material-ui/IconButton';
import CloudDownload from 'material-ui/svg-icons/file/cloud-download'
import styles from '../../styles/StatusDownload.css'
import Checkbox from 'material-ui/Checkbox'
import LinearProgress from 'material-ui/LinearProgress';

export class ProviderRow extends React.Component {
    constructor(props) {
        super(props)
        this.handleDownload = this.handleDownload.bind(this);
        this.handleToggle = this.handleToggle.bind(this);
        this.allChecked = this.allChecked.bind(this);
        this.onAllCheck = this.onAllCheck.bind(this);
        this.onChangeCheck = this.onChangeCheck.bind(this);
        this.state = {
            providerTasks: [],
            openTable: false,
            selectedRows: { },
            selectionCount: 0,
            taskCount: 0,

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
            setTimeout(() => {
                window.location.href = value;
            }, idx * 100)
        })
    }

    componentWillMount(){
        //set state on the tasks
        let taskCount = 0;
        let t = {};
        this.props.provider.tasks.forEach(function(column){
            let uid = column.uid;
            t[uid] = false;
            taskCount++
        })
        this.setState({selectedRows:t, taskCount})
    }

    allChecked() {
        let allChecked = true;
        const keys = Object.keys(this.props.selectedTasks);
        if (!keys.length) {return false}
        for(const key in keys) {
            if(this.state.selectedRows.hasOwnProperty(keys[key])) {
                if(!this.props.selectedTasks[keys[key]]){
                    allChecked = false
                    break
                }
            }
        }
        return allChecked;
    }

    onAllCheck(e, checked) {
        let t = {};
        if(checked){
            let selectionCount = 0;
            this.props.provider.tasks.forEach(function(column){
                selectionCount++
                let uid = column.uid;
                t[uid] = true;
            })
            this.setState({selectedRows:t, selectionCount: selectionCount})
        }
        else{
            this.props.provider.tasks.forEach(function(column){
                    let uid = column.uid;
                t[uid] = false;
            })
            this.setState({selectedRows:t, selectionCount: 0})
        }
        this.props.onSelectionToggle(t);
    }

    onChangeCheck(e, checked){
        let selectionCount = this.state.selectionCount;
        const selectedRows = {...this.state.selectedRows};
        selectedRows[e.target.name] = checked;
        if(checked == false ){
            selectionCount--;
        }
        else {
            selectionCount++;
        }

        // update state
        this.setState({
            selectedRows, selectionCount
        });
        this.props.onSelectionToggle(selectedRows);
    }


    render() {
        const {provider, ...rowProps} = this.props;

        let tableData;
        if(this.state.openTable == true){
            tableData = <TableBody
                displayRowCheckbox={false}
                deselectOnClickaway={false}
                showRowHover={false}
                className={styles.tableRowHighlight}
            >
                {provider.tasks.map((task) => (
                    <TableRow selectable={false} style={{height: '20px'}} displayBorder={true} key={task.uid} >
                    <TableRowColumn style={{width: '10%'}}>
                    <Checkbox
                        disabled={task.result == null ? true : false}
                        name={task.uid}
                        checked={this.props.selectedTasks[task.uid] ? true : false}
                        checkedIcon={<CheckedBox style={{fill: '#4598bf'}}/>}
                        uncheckedIcon={<UncheckedBox style={{fill: '#4598bf'}}/>}
                        style={{marginLeft: '2em'}}
                        onCheck={this.onChangeCheck}
                        /></TableRowColumn>
                    <TableRowColumn style={{width: '20%', fontSize: '14px'}}>{task.name}</TableRowColumn>
                    <TableRowColumn style={{width: '25%', textAlign: 'center', fontSize: '14px'}} ></TableRowColumn>
                    <TableRowColumn style={{width: '15%', textAlign: 'center', fontSize: '14px', fontWeight: 'bold'}} ><LinearProgress mode="determinate" value={task.progress} />{task.progress}%</TableRowColumn>
                    <TableRowColumn style={{width: '15%', textAlign: 'center', fontSize: '14px'}}></TableRowColumn>
                    <TableRowColumn style={{width: '10%', textAlign: 'center', fontSize: '14px'}}></TableRowColumn>
                    </TableRow>

                ))}

            </TableBody>

        }
        else{
            tableData = <TableBody/>
        }

        return (

            <Table key={this.props.provider.uid}
                   selectable={false}
                   multiSelectable={false}
                   >

                <TableHeader
                    displaySelectAll={false}
                    adjustForCheckbox={false}
                    enableSelectAll={false}
                    >
                    <TableRow displayBorder={true}>
                        <TableHeaderColumn>
                            <Checkbox 
                                checked={this.allChecked()} 
                                onCheck={this.onAllCheck}
                                checkedIcon={<CheckedBox style={{fill: '#4598bf'}}/>}
                                uncheckedIcon={<UncheckedBox style={{fill: '#4598bf'}}/>}
                            />
                        </TableHeaderColumn>
                        <TableHeaderColumn style={{width:'30%', color: 'black', fontWeight: 'bold', fontSize: '14px'}}>
                            {this.props.provider.name}
                        </TableHeaderColumn>
                        <TableHeaderColumn style={{width:'20%',textAlign: 'center', color: 'black!important', fontSize: '14px'}}>
                            {this.state.selectionCount}/{this.state.taskCount}
                        </TableHeaderColumn>
                        <TableHeaderColumn style={{width:'15%',textAlign: 'center', color: 'black!important', fontSize: '14px'}}/>
                        <TableHeaderColumn style={{width:'15%',textAlign: 'right'}}>
                            <IconButton 
                                disableTouchRipple={true} 
                                onTouchTap={this.handleDownload} 
                                disabled={this.state.selectionCount == 0}
                                iconStyle={{align: 'right', fill: '#4598bf'}}
                            >
                                <CloudDownload/>
                            </IconButton>
                        </TableHeaderColumn>
                        <TableHeaderColumn style={{width:'10%',textAlign: 'left'}}> 
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
    selectedTasks: PropTypes.object,
}

export default ProviderRow;

