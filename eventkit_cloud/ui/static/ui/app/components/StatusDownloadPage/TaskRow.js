import React, {PropTypes, Component} from 'react'
import {connect} from 'react-redux';
import ol from 'openlayers';
import baseTheme from 'material-ui/styles/baseThemes/lightBaseTheme'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import '../tap_events'
import {Table, TableBody, TableFooter, TableHeader, TableHeaderColumn, TableRow, TableRowColumn}
    from 'material-ui/Table';
import CloudDownload from 'material-ui/svg-icons/file/cloud-download'


class TaskRow extends React.Component {
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
    render() {

        return (

                        <TableRowColumn>{this.props.tasks.name}</TableRowColumn>,
                        <TableRowColumn>la la la</TableRowColumn>,
                        <TableRowColumn>la la la</TableRowColumn>,
                        <TableRowColumn style={{textAlign:'center'}}><CloudDownload style={{color:'#4598bf'}}/></TableRowColumn>



        )
    }
}

TaskRow.propTypes = {

}
TaskRow.childContextTypes = {
    muiTheme: React.PropTypes.object.isRequired,
};

export default connect(

)(TaskRow);


