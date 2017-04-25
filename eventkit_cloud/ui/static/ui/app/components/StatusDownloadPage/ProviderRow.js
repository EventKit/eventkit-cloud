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
import CloudDownload from 'material-ui/svg-icons/file/cloud-download'
import styles from '../../styles/StatusDownload.css'
import Checkbox from 'material-ui/Checkbox'


class ProviderRow extends React.Component {
    constructor(props) {
        super(props)


        this.state = {
            providerTasks: [],
            file: false,
            fixedHeader: true,
            fixedFooter: true,
            stripedRows: false,
            showRowHover: false,
            selectable: true,
            multiSelectable: true,
            enableSelectAll: true,
            showCheckboxes: true,
            height: '300px',
            selectedRows: 'none',
        }
    }


    getChildContext() {
        return {muiTheme: getMuiTheme(baseTheme)};
    }
    expandedChange(expanded) {

    }
    componentWillReceiveProps(nextProps) {

    }

    componentDidMount(){

    }
    componentDidUpdate(prevProps, prevState) {

    }
    toggleCheckbox(event, checked) {

        this.setState({file: checked})
    }
    _onRowSelection(rows) {
        this.setState({selectedRows: rows});
    }

    render() {
        const { ...rowProps} = this.props;
console.log(this.props.providerTasks);


        return (

            <Table key={this.props.providerTasks.uid}
                   selectable={this.state.selectable}
                   multiSelectable={this.state.multiSelectable}
                   onRowSelection={this._onRowSelection.bind(this)}
                   >

    <TableHeader
        displaySelectAll={this.state.showCheckboxes}
        adjustForCheckbox={this.state.showCheckboxes}
        enableSelectAll={true}
    >
    <TableRow displayBorder={true}>
        <TableHeaderColumn style={{width:'35%', color: 'black!important', fontWeight: 'bold', fontSize: '14px'}}>{this.props.providerTasks.name}</TableHeaderColumn>
        <TableHeaderColumn style={{width:'20%',textAlign: 'center', color: 'black!important', fontSize: '14px'}}>3/3</TableHeaderColumn>
        <TableHeaderColumn style={{width:'20%',textAlign: 'center', color: 'black!important', fontSize: '14px'}}>0:00:20</TableHeaderColumn>
        <TableHeaderColumn style={{width:'20%',textAlign: 'center'}}> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<CloudDownload style={{color:'#4598bf', verticalAlign: 'middle'}}/></TableHeaderColumn>
        <TableHeaderColumn style={{width:'5%',textAlign: 'center'}}> <ArrowUp style={{color:'#4598bf', verticalAlign: 'middle'}}/></TableHeaderColumn>
    </TableRow>
            </TableHeader>
            <TableBody
                displayRowCheckbox={false}
                deselectOnClickaway={false}
                showRowHover={this.state.showRowHover}
                stripedRows={this.state.stripedRows}
                >

        {this.props.providerTasks.tasks.map((task) => (
            <TableRow displayBorder={true} key={task.uid} >
                <TableRowColumn style={{width:'10%', textAlign: 'right'}}>
                    <Checkbox
                        checked={this.state.selectedRows == 'all' ? true : false}
                        defaultChecked={false}
                        checkedIcon={<CheckedBox />}
                        uncheckedIcon={<UncheckedBox
                        className={styles.checkboxColor}/>}
                    /></TableRowColumn>
                <TableRowColumn style={{width:'25%', fontSize: '14px'}}>{task.name}</TableRowColumn>
                <TableRowColumn style={{width:'25%', textAlign: 'center', fontSize: '14px'}} ></TableRowColumn>
                <TableRowColumn style={{width:'20%', textAlign: 'center', fontSize: '14px'}} >0:00:50</TableRowColumn>
                <TableRowColumn style={{width:'20%', textAlign: 'center', fontSize: '14px'}}>&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <CloudDownload style={{color:'#4598bf', verticalAlign: 'middle'}}/></TableRowColumn>
                <TableRowColumn style={{width:'5%', textAlign: 'center', fontSize: '14px'}}></TableRowColumn>
            </TableRow>
        ))}

    </TableBody>
    </Table>

        )
    }
}

ProviderRow.propTypes = {
    providerTasks: PropTypes.object.isRequired,
}
ProviderRow.childContextTypes = {
    muiTheme: React.PropTypes.object.isRequired,
};

export default connect(

)(ProviderRow);

