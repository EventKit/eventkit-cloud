import React, {PropTypes, Component} from 'react'
import {connect} from 'react-redux';
import ol from 'openlayers';
import baseTheme from 'material-ui/styles/baseThemes/lightBaseTheme'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import '../tap_events'
import {Table, TableBody, TableFooter, TableHeader, TableHeaderColumn, TableRow, TableRowColumn}
    from 'material-ui/Table';
import CloudDownload from 'material-ui/svg-icons/file/cloud-download'
import styles from '../../styles/StatusDownload.css'
import ProviderRow from './ProviderRow'


class DataPackDetails extends React.Component {
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
    handleToggle = (event, toggled) => {
        this.setState({
            [event.target.name]: toggled,
        });
    };

    handleChange = (event) => {
        this.setState({height: event.target.value});
    };

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
        console.log(this.props.providerTasks);

        return (
            <div className={styles.downloadDiv}>
                <div className={styles.subHeading}>
                   Download Options
                </div>
                <Table

                    fixedHeader={this.state.fixedHeader}
                    fixedFooter={this.state.fixedFooter}
                    selectable={this.state.selectable}
                    multiSelectable={this.state.multiSelectable}
                >
                    <TableHeader
                        displaySelectAll={this.state.showCheckboxes}
                        adjustForCheckbox={this.state.showCheckboxes}
                        enableSelectAll={this.state.enableSelectAll}
                    >
                        <TableRow>
                            <TableHeaderColumn style={{width:'35%', fontSize: '14px'}}>PROVIDER</TableHeaderColumn>
                            <TableHeaderColumn style={{width:'20%',textAlign: 'center', fontSize: '14px'}}># OF SELECTIONS</TableHeaderColumn>
                            <TableHeaderColumn style={{width:'20%',textAlign: 'center', fontSize: '14px'}} >RUN TIME</TableHeaderColumn>
                            <TableHeaderColumn style={{width:'25%',textAlign: 'center', fontSize: '14px'}}> <CloudDownload style={{color:'#4598bf', verticalAlign: 'middle'}}/>&nbsp;&nbsp;Download All Selected</TableHeaderColumn>

                        </TableRow>
                    </TableHeader>
                    </Table>

                {this.props.providerTasks.map((provider) => (
                    <ProviderRow key={provider.uid} providerTasks={provider}/>
                ))}






            </div>

        )
    }
}

DataPackDetails.propTypes = {
    providerTasks: PropTypes.array.isRequired,
}
DataPackDetails.childContextTypes = {
    muiTheme: React.PropTypes.object.isRequired,
};

export default connect(

)(DataPackDetails);

