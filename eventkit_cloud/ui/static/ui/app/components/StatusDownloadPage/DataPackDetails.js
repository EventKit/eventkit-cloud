import React, {PropTypes, Component} from 'react'
import {connect} from 'react-redux';
import '../tap_events'
import {Table, TableBody, TableFooter, TableHeader, TableHeaderColumn, TableRow, TableRowColumn}
    from 'material-ui/Table';
import CloudDownload from 'material-ui/svg-icons/file/cloud-download'
import styles from '../../styles/StatusDownload.css'
import ProviderRow from './ProviderRow'
import RaisedButton from 'material-ui/RaisedButton';
import Checkbox from 'material-ui/Checkbox';
import UncheckedBox from 'material-ui/svg-icons/toggle/check-box-outline-blank'
import CheckedBox from 'material-ui/svg-icons/toggle/check-box'

export class DataPackDetails extends React.Component {
    constructor(props) {
        super(props)
        this.handleDownload = this.handleDownload.bind(this);
        this.onSelectionToggle = this.onSelectionToggle.bind(this);
        this.checkAll = this.checkAll.bind(this);
        this.allChecked = this.allChecked.bind(this);
        this.state = {
            selectedTasks: {},
            taskCount: 0,
        }
    }

    componentDidMount() {
        let selectedTasks = {}
        this.props.providerTasks.forEach((provider) => {
            provider.tasks.forEach((task) => {
                selectedTasks[task.uid] = false;
            })
        });
        this.setState({selectedTasks: selectedTasks});
    }

    checkAll(e, checked) {
        let taskCount = 0;
        let stateTasks = {...this.state.selectedTasks}
        let alteredTasks = {}
        Object.keys(stateTasks).forEach((keyName) => {
            alteredTasks[keyName] = checked;
            if(checked == true){
                taskCount++;
            }
        });
        this.setState({selectedTasks: alteredTasks, taskCount: taskCount});
    }

    allChecked() {
        let allChecked = true;
        const keys = Object.keys(this.state.selectedTasks);
        if (!keys.length) {return false}
        for(const key in keys) {
            if(!this.state.selectedTasks[keys[key]]){
                allChecked = false
                break
            }
        }
        return allChecked;
    }

    onSelectionToggle(selectedTasks){
        const tasks = Object.assign({}, this.state.selectedTasks, selectedTasks)
        let taskCount = 0;
        Object.keys(selectedTasks).forEach((keyName, keyIndex) => {
            if(selectedTasks[keyName] == true) {
                taskCount++;
            }
        });

        this.setState({selectedTasks : tasks, taskCount: taskCount})
    }

    handleDownload(event){
        let downloadUids = [];
        let selectedTasks = this.state.selectedTasks;
        Object.keys(selectedTasks).forEach((keyName, keyIndex) => {
            if(selectedTasks[keyName] == true) {
                downloadUids.push(keyName);
            }
        });

        let tasks = this.props.providerTasks;
        let taskArray = [];
        let downloadUrls = [];

        tasks.forEach((url) => {
            url.tasks.forEach((task) => {
                taskArray.push([task]);
                downloadUids.forEach(function(uid) {
                if (task.uid === uid) {
                    downloadUrls.push(task.result.url);
                }
                });
            });
        });

        downloadUrls.forEach((value, idx) => {
            // setTimeout(() => {
            //     window.location.href = value;
            // }, idx * 500);
            window.open(value, '_blank');
        });
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


    render() {
        const textFontSize = this.getTextFontSize();
        const providers = this.props.providerTasks;

        return (
            <div className={styles.downloadDiv}>
                <div className={styles.subHeading}>
                   Download Options
                </div>
                <Table
                    style={{width:'100%', tableLayout: 'auto'}}
                    selectable={false}
                >
                    <TableHeader
                        displaySelectAll={false}
                        adjustForCheckbox={false}
                        enableSelectAll={false}
                    >
                        <TableRow>
                            <TableHeaderColumn style={{width:'88px', fontSize: '14px'}}>
                                <Checkbox 
                                    checked={this.allChecked()} 
                                    onCheck={this.checkAll}
                                    checkedIcon={<CheckedBox style={{fill: '#4598bf'}}/>}
                                    uncheckedIcon={<UncheckedBox style={{fill: '#4598bf'}}/>}
                                />
                            </TableHeaderColumn>
                            <TableHeaderColumn style={{fontSize: textFontSize}}>
                                DATA SETS
                            </TableHeaderColumn>
                            <TableHeaderColumn style={{width: '128px', textAlign: 'center', fontSize: textFontSize}}>
                                # SELECTED
                            </TableHeaderColumn>
                            <TableHeaderColumn style={{width:'100px',textAlign: 'center', fontSize: textFontSize}}>
                                PROGRESS
                            </TableHeaderColumn>
                            <TableHeaderColumn style={{width: '234px', textAlign: 'center', fontSize: textFontSize, paddingLeft: '0px', paddingRight: '0px' }}>
                                <RaisedButton
                                    style={{width:'100%'}}
                                    backgroundColor={'rgba(179,205,224,0.5)'}
                                    disabled={this.state.taskCount == 0}
                                    disableTouchRipple={true}
                                    labelColor={'#4598bf'}
                                    labelStyle={{fontWeight:'bold', fontSize:textFontSize}}
                                    onTouchTap={this.handleDownload}
                                    label="Download All Selected"
                                    icon={<CloudDownload style={{fill:'#4598bf', verticalAlign: 'middle'}}/>}
                                />
                            </TableHeaderColumn>

                        </TableRow>
                    </TableHeader>
                    </Table>

                {providers.map((provider) => (
                    <ProviderRow 
                        key={provider.uid} 
                        onSelectionToggle={this.onSelectionToggle} 
                        updateSelectionNumber={this.updateSelectionNumber} 
                        provider={provider} 
                        selectedTasks={this.state.selectedTasks}/>
                ))}
           </div>
        )
    }
}

DataPackDetails.propTypes = {
    providerTasks: PropTypes.array.isRequired,
}


export default DataPackDetails;

