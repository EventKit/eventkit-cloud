import React, { PropTypes, Component } from 'react';
import { Table, TableHeader, TableHeaderColumn, TableRow }
    from 'material-ui/Table';
import RaisedButton from 'material-ui/RaisedButton';
import CloudDownload from 'material-ui/svg-icons/file/cloud-download';
import ProviderRow from './ProviderRow';

export class DataPackDetails extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedProviders: {},
        };
    }

    componentDidMount() {
        this.onMount();
    }

    onMount() {
        const selectedProviders = {};
        this.props.providerTasks.forEach((provider) => {
            if (provider.display === true) {
                selectedProviders[provider.uid] = false;
            }
        });
        this.setState({ selectedProviders });
    }

    getCloudDownloadIcon() {
        if (this.props.zipFileProp === null) {
            return (
                <CloudDownload
                    className="qa-DataPackDetails-CloudDownload-disabled"
                    style={{ fill: 'gray', verticalAlign: 'middle' }}
                />
            );
        }
        return (
            <CloudDownload
                className="qa-DataPackDetails-CloudDownload-enabled"
                style={{ fill: '#4598bf', verticalAlign: 'middle' }}
            />
        );
    }

    getTextFontSize() {
        if (window.innerWidth <= 575) {
            return '10px';
        } else if (window.innerWidth <= 767) {
            return '11px';
        } else if (window.innerWidth <= 991) {
            return '12px';
        } else if (window.innerWidth <= 1199) {
            return '13px';
        }
        return '14px';
    }

    getTableCellWidth() {
        if (window.innerWidth <= 767) {
            return '80px';
        }
        return '120px';
    }

    getToggleCellWidth() {
        return '70px';
    }

    isZipFileCompleted() {
        if (this.props.zipFileProp === null) {
            return true;
        }
        return false;
    }

    render() {
        const tableCellWidth = this.getTableCellWidth();
        const toggleCellWidth = this.getToggleCellWidth();
        const textFontSize = this.getTextFontSize();

        const providers = this.props.providerTasks.filter(provider => (provider.display));

        const styles = {
            subHeading: {
                fontSize: '16px',
                fontWeight: 'bold',
                color: 'black',
                alignContent: 'flex-start',
                paddingBottom: '5px',
            },
            download: {
                paddingRight: '12px',
                paddingLeft: '0px',
                fontSize: textFontSize,
                whiteSpace: 'normal',
            },
            genericColumn: {
                paddingRight: '0px',
                paddingLeft: '0px',
                width: tableCellWidth,
                textAlign: 'center',
                fontSize: textFontSize,
            },
        };

        return (
            <div>
                <div className="qa-DataPackDetails-heading" style={styles.subHeading}>
                   Download Options
                </div>
                <Table
                    className="qa-DataPackDetails-Table"
                    style={{ width: '100%', tableLayout: 'fixed' }}
                    selectable={false}
                >
                    <TableHeader
                        className="qa-DataPackDetails-TableHeader"
                        displaySelectAll={false}
                        adjustForCheckbox={false}
                        enableSelectAll={false}
                    >
                        <TableRow className="qa-DataPackDetails-TableRow">
                            <TableHeaderColumn
                                className="qa-DataPackDetails-TableHeaderColumn-zipButton"
                                style={styles.download}
                            >
                                <a href={this.props.zipFileProp}>
                                    <RaisedButton
                                        id="CompleteDownload"
                                        className="qa-DataPackDetails-RaisedButton-zipButton"
                                        backgroundColor="rgba(179,205,224,0.5)"
                                        disabled={this.isZipFileCompleted()}
                                        disableTouchRipple
                                        labelColor="#4598bf"
                                        labelStyle={{ fontWeight: 'bold', fontSize: textFontSize }}
                                        label={this.props.zipFileProp ? 'DOWNLOAD DATAPACK (.ZIP)' : 'CREATING DATAPACK ZIP'}
                                        icon={this.getCloudDownloadIcon()}
                                    />
                                </a>
                            </TableHeaderColumn>
                            <TableHeaderColumn
                                className="qa-DataPackDetails-TableHeaderColumn-fileSize"
                                style={styles.genericColumn}
                            >
                                FILE SIZE
                            </TableHeaderColumn>
                            <TableHeaderColumn
                                className="qa-DataPackDetails-TableHeaderColumn-progress"
                                style={styles.genericColumn}
                            >
                                PROGRESS
                            </TableHeaderColumn>
                            <TableHeaderColumn
                                className="qa-DataPackDetails-TableHeaderColumn-empty"
                                style={{ ...styles.genericColumn, width: toggleCellWidth }}
                            />
                        </TableRow>
                    </TableHeader>
                </Table>
                <div className="qa-DataPackDetails-providers" id="Providers">
                    {providers.map((provider, ix) => (
                        <ProviderRow
                            backgroundColor={ix % 2 === 0 ? 'whitesmoke' : 'white'}
                            key={provider.uid}
                            onSelectionToggle={this.onSelectionToggle}
                            onProviderCancel={this.props.onProviderCancel}
                            updateSelectionNumber={this.updateSelectionNumber}
                            provider={provider}
                            selectedProviders={this.state.selectedProviders}
                            providers={this.props.providers}
                        />
                    ))}
                </div>
            </div>
        );
    }
}

DataPackDetails.defaultProps = {
    zipFileProp: null,
};

DataPackDetails.propTypes = {
    providerTasks: PropTypes.arrayOf(PropTypes.object).isRequired,
    onProviderCancel: PropTypes.func.isRequired,
    providers: PropTypes.arrayOf(PropTypes.object).isRequired,
    zipFileProp: PropTypes.string,
};

export default DataPackDetails;
