import React, {PropTypes, Component} from 'react'
import {connect} from 'react-redux';
import '../tap_events'
import {Table, TableBody, TableFooter, TableHeader, TableHeaderColumn, TableRow, TableRowColumn}
    from 'material-ui/Table';
import CloudDownload from 'material-ui/svg-icons/file/cloud-download'
import styles from '../../styles/StatusDownload.css'
import ProviderRow from './ProviderRow'
import RaisedButton from 'material-ui/RaisedButton';

export class DataPackDetails extends React.Component {
    constructor(props) {
        super(props)

        this.onSelectionToggle = this.onSelectionToggle.bind(this);

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
            downloadUrls: [],
            selectedTasks: {},
            provider: [],
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

    toggleCheckbox(event, checked) {
        this.setState({file: checked})
    }

    onSelectionToggle(selectedTasks){
        const tasks = Object.assign({}, this.state.selectedTasks, selectedTasks)
        this.setState({selectedTasks : tasks})
    }

    handleDownload(event){
        let downloadUids = [];
        let selectedTasks = this.state.selectedTasks;
        Object.keys(selectedTasks).map(function(keyName, keyIndex) {
            if(selectedTasks[keyName] == true) {
                downloadUids.push(keyName);
            }
        });

        let tasks = this.props.providerTasks;
        let taskArray = [];
        let downloadUrls = [];

        tasks.forEach(function (url) {
            url.tasks.forEach(function (task) {
                taskArray.push([task]);
                downloadUids.forEach(function(uid) {
                if (task.uid === uid) {
                    downloadUrls.push(task.result.url);
                }
                })
            })
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

    render() {
        const providers = this.props.providerTasks.filter((provider) => {
            return provider.name != 'OpenStreetMap Data (Generic)';
        });

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
                            <TableHeaderColumn style={{width:'30%', fontSize: '14px'}}>DATA SETS</TableHeaderColumn>
                            <TableHeaderColumn style={{width:'20%',textAlign: 'center', fontSize: '14px'}}># OF SELECTIONS</TableHeaderColumn>
                            <TableHeaderColumn style={{width:'15%',textAlign: 'center', fontSize: '14px'}} >STATUS</TableHeaderColumn>
                            <TableHeaderColumn style={{width:'15%',textAlign: 'center', fontSize: '14px'}}> <RaisedButton
                                backgroundColor={'rgba(179,205,224,0.5)'}
                                disableTouchRipple={true}
                                labelColor={'#4598bf'}
                                labelStyle={{fontWeight:'bold'}}
                                onTouchTap={this.handleDownload.bind(this)}
                                label="Download All Selected"
                                icon={<CloudDownload style={{fill:'#4598bf',verticalAlign: 'middle'}}/>} />
                            </TableHeaderColumn>
                            <TableHeaderColumn style={{width:'10%', fontSize: '14px'}}></TableHeaderColumn>
                        </TableRow>
                    </TableHeader>
                    </Table>

                {providers.map((provider) => (
                    <ProviderRow key={provider.uid} onSelectionToggle={this.onSelectionToggle} updateSelectionNumber={this.updateSelectionNumber} provider={provider}/>
                ))}
           </div>

        )
    }
}

DataPackDetails.propTypes = {
    providerTasks: PropTypes.array.isRequired,
}


export default DataPackDetails;

