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
        this.isDownloadAllDisabled = this.isDownloadAllDisabled.bind(this);
        this.state = {
            selectedProviders: {},
        }
    }

    componentDidMount() {
        let selectedProviders = {};
        this.props.providerTasks.forEach((provider) => {
            if (provider.display == true) {
                selectedProviders[provider.uid] = false;
            }
        });
        this.setState({selectedProviders: selectedProviders});
    }

    checkAll(e, checked) {
        let stateProviders = {...this.state.selectedProviders};
        let alteredTasks = {};
        this.props.providerTasks.forEach((column) => {
            if(column.display == true) {
                let uid = column.uid;
                alteredTasks[uid] = checked;
            }
        })
        this.setState({selectedProviders: alteredTasks});
    }

    allChecked() {
        let allChecked = true;
        const keys = Object.keys(this.state.selectedProviders);
        if (!keys.length) {return false}
        for(const key in keys) {
            if(!this.state.selectedProviders[keys[key]]){
                allChecked = false;
                break
            }
        }
        return allChecked;
    }

    isDownloadAllDisabled() {
        const keys = Object.keys(this.state.selectedProviders);
        if(!keys.length) {return true}
        for(const key in keys) {
            if(this.state.selectedProviders[keys[key]]) {
                return false;
            }
        }
        return true;
    }

    onSelectionToggle(selectedProviders){
        const providers = Object.assign({}, this.state.selectedProviders, selectedProviders);
        this.setState({selectedProviders : providers})
    }

    handleDownload(event){
        let providerUids = [];
        let selectedProviders = this.state.selectedProviders;
        Object.keys(selectedProviders).forEach((keyName, keyIndex) => {
            if(selectedProviders[keyName] == true) {
                providerUids.push(keyName);
            }
        });

        let providers = this.props.providerTasks;
        let taskArray = [];
        let downloadUrls = [];

        providers.forEach((provider) => {
            providerUids.forEach(function(uid) {
                if (provider.uid === uid) {
                    provider.tasks.forEach((task) => {
                        if (task.display == true) {
                            taskArray.push([task.result.url]);
                        }
                    });
                }
            });
        });

        taskArray.forEach((value, idx) => {
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

    getTableCellWidth() {
        if(window.innerWidth <= 767) {
            return '80px';
        }
        else {
            return '120px';
        }
    }

    getToggleCellWidth() {
        return '70px';
    }

    getCheckboxStatus() {
        let disableCheckbox = true;
        this.props.providerTasks.forEach((provider) => {
            if(provider.status != "COMPLETED"){
                disableCheckbox = true;
            }
            else {
                disableCheckbox = false;
            }
        });
        return disableCheckbox;
    }


    render() {
        const tableCellWidth = this.getTableCellWidth();
        const toggleCellWidth = this.getToggleCellWidth();
        const textFontSize = this.getTextFontSize();

        const providers = this.props.providerTasks.filter((provider) => {
            return provider.display != false;
        });

        return (
            <div className={styles.downloadDiv}>
                <div className={styles.subHeading}>
                   Download Options
                </div>
                <Table
                    style={{width:'100%', tableLayout: 'fixed'}}
                    selectable={false}
                >
                    <TableHeader
                        displaySelectAll={false}
                        adjustForCheckbox={false}
                        enableSelectAll={false}
                    >
                        <TableRow>
                            <TableHeaderColumn style={{paddingRight: '12px', paddingLeft: '12px', width:'44px', fontSize: '14px'}}>
                                <Checkbox
                                    disabled={this.getCheckboxStatus()}
                                    checked={this.allChecked()} 
                                    onCheck={this.checkAll}
                                    checkedIcon={<CheckedBox style={{fill: '#4598bf'}}/>}
                                    uncheckedIcon={<UncheckedBox style={{fill: '#4598bf'}}/>}
                                />
                            </TableHeaderColumn>
                            <TableHeaderColumn style={{paddingRight: '12px', paddingLeft: '12px', fontSize: textFontSize, whiteSpace: 'normal',}}>
                                <RaisedButton
                                    backgroundColor={'rgba(179,205,224,0.5)'}
                                    disabled={this.isDownloadAllDisabled()}
                                    disableTouchRipple={true}
                                    labelColor={'#4598bf'}
                                    labelStyle={{fontWeight:'bold', fontSize:textFontSize}}
                                    onTouchTap={this.handleDownload}
                                    label="DOWNLOAD SELECTED DATA SETS"
                                    icon={<CloudDownload style={{fill:'#4598bf', verticalAlign: 'middle'}}/>}
                                />
                            </TableHeaderColumn>

                            <TableHeaderColumn style={{paddingRight: '0px', paddingLeft: '0px', width: tableCellWidth, textAlign: 'center', fontSize: textFontSize}}>
                                FILE SIZE
                            </TableHeaderColumn>
                            <TableHeaderColumn style={{paddingRight: '0px', paddingLeft: '0px', width: tableCellWidth,textAlign: 'center', fontSize: textFontSize}}>
                                PROGRESS
                            </TableHeaderColumn>
                            <TableHeaderColumn style={{paddingRight: '0px', paddingLeft: '0px', width: toggleCellWidth, textAlign: 'center', fontSize: textFontSize, paddingLeft: '0px', paddingRight: '0px' }}>

                            </TableHeaderColumn>

                        </TableRow>
                    </TableHeader>
                    </Table>

                {providers.map((provider, ix) => (
                    <ProviderRow
                        backgroundColor={ix % 2 == 0 ? 'whitesmoke': 'white'}
                        key={provider.uid} 
                        onSelectionToggle={this.onSelectionToggle}
                        onProviderCancel={this.props.onProviderCancel}
                        updateSelectionNumber={this.updateSelectionNumber} 
                        provider={provider} 
                        selectedProviders={this.state.selectedProviders}
                        providers={this.props.providers}/>
                ))}
           </div>
        )
    }
}

DataPackDetails.propTypes = {
    providerTasks: PropTypes.array.isRequired,
    onProviderCancel: PropTypes.func.isRequired,
    providers: PropTypes.array.isRequired
}


export default DataPackDetails;

