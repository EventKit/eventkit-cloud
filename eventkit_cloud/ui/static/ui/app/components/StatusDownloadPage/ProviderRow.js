import React, {PropTypes, Component} from 'react'
import {connect} from 'react-redux';
import ol from 'openlayers';
import baseTheme from 'material-ui/styles/baseThemes/lightBaseTheme'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import '../tap_events'
import {Table, TableBody, TableFooter, TableHeader, TableHeaderColumn, TableRow, TableRowColumn}
    from 'material-ui/Table';
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
        this.state = {
            providerTasks: [],
            file: false,
            checkboxDisabled: false,
            stripedRows: true,
            showRowHover: false,
            selectable: true,
            multiSelectable: true,
            enableSelectAll: true,
            showCheckboxes: true,
            height: '300px',
            openTable: false,
            selectedTasks: [],
            taskChecked: false,
            taskStatusFontColor: '',
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
        let selectedTasks = this.state.selectedRows;
        Object.keys(selectedTasks).map(function (keyName, keyIndex) {
            if (selectedTasks[keyName] == true) {
                downloadUids.push(keyName);
            }
        });

        let tasks = this.props.provider.tasks;
        let downloadUrls = [];
        downloadUids.forEach(function (uid) {
            let a = tasks.find(x => x.uid === uid)
            downloadUrls.push(a.result.url);
        })

        downloadUrls.forEach(function (value, idx) {
            const response = {
                file: value,
            };
            setTimeout(() => {
                window.location.href = response.file;
            }, idx * 100)
        })
    }


    componentWillReceiveProps(nextProps) {

    }

    componentDidMount(){

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
    componentDidUpdate(prevProps, prevState) {

    }

    _setTaskStatusColumnColor() {

    }
    _setCheckBox() {
        if(this.props.providers.task.result == 'null') {
            this.setState({checkboxDisabled: false});
        }
        else {
            this.setState({checkboxDisabled: true});
        }
    }
    onChangeCheck(e, checked){
        let selectionCount = this.state.selectionCount;
        //if all, set all tasks to checked, if none, set to unchecked
        if(e == 'all' || e == 'none'){
            if(e == 'all'){
                selectionCount = 0;
                let t = {};
                this.props.provider.tasks.forEach(function(column){
                    selectionCount++
                    let uid = column.uid;
                    t[uid] = true;
                })
                this.setState({selectedRows:t, selectionCount})
            }
            else{
                let t = {};
                this.props.provider.tasks.forEach(function(column){
                        let uid = column.uid;
                    t[uid] = false;
                })
                this.setState({selectedRows:t, selectionCount: 0})
            }
        }

        //this means it was a task checkbox that was checked and not a parent provider
        else{
            console.log(e.target.id);
            const selectedRows = this.state.selectedRows;
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
        }
        this.props.onSelectionToggle(this.state.selectedRows);

    }


    render() {
        const {provider, ...rowProps} = this.props;

        let arrowToggle;
        if(this.state.openTable == false) {
            arrowToggle = <ArrowUp style={{color:'#4598bf', verticalAlign: 'middle'}} />
        }
        else {
            arrowToggle = <ArrowDown style={{color: '#4598bf', verticalAlign: 'middle'}} />
        }

        let cloudToggle;
        if(this.state.selectionCount > 0){
            cloudToggle = <IconButton className={styles.cloudButton} disableTouchRipple={true} onTouchTap={this.handleDownload.bind(this)}><CloudDownload style={{fill:'#4598bf', align:'right'}}/> </IconButton>
        }
        else {
            cloudToggle = <IconButton disableTouchRipple={true} disabled={true} onTouchTap={this.handleDownload.bind(this)}><CloudDownload style={{color:'gray', align:'right'}}/> </IconButton>
            //cloudToggle = <CloudDownload style={{color:'gray'}}/>
        }

        let tableData;
        if(this.state.openTable == true){
            tableData = <TableBody
                displayRowCheckbox={false}
                deselectOnClickaway={false}
                showRowHover={this.state.showRowHover}
                className={styles.tableRowHighlight}
            >
                {provider.tasks.map((task) => (
                    <TableRow selectable={false} style={{height: '20px'}} displayBorder={true} key={task.uid} >
                    <TableRowColumn style={{width: '10%'}}>
                    <Checkbox
                        disabled={task.result == null ? true : false}
                        name={task.uid}
                        checked={this.state.selectedRows[task.uid]}
                        checkedIcon={<CheckedBox />}
                        uncheckedIcon={<UncheckedBox />}
                        style={{marginLeft: '2em'}}
                        onCheck={this.onChangeCheck.bind(this)}
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
                   selectable={this.state.selectable}
                   multiSelectable={this.state.multiSelectable}
                   onRowSelection={this.onChangeCheck.bind(this)}
                   >

                <TableHeader
                    displaySelectAll={this.state.showCheckboxes}
                    adjustForCheckbox={this.state.showCheckboxes}
                    enableSelectAll={true}
                    >
                    <TableRow displayBorder={true}>
                        <TableHeaderColumn style={{width:'30%', color: 'black!important', fontWeight: 'bold', fontSize: '14px'}}>{this.props.provider.name}</TableHeaderColumn>
                        <TableHeaderColumn style={{width:'20%',textAlign: 'center', color: 'black!important', fontSize: '14px'}}>{this.state.selectionCount}/{this.state.taskCount}</TableHeaderColumn>
                        <TableHeaderColumn style={{width:'15%',textAlign: 'center', color: 'black!important', fontSize: '14px'}}></TableHeaderColumn>
                        <TableHeaderColumn style={{width:'15%',textAlign: 'right'}}>{cloudToggle} </TableHeaderColumn>
                        <TableHeaderColumn style={{width:'10%',textAlign: 'left'}}> <IconButton disableTouchRipple={true} onTouchTap={this.handleToggle.bind(this)}>{arrowToggle}</IconButton></TableHeaderColumn>
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

}

export default ProviderRow;

