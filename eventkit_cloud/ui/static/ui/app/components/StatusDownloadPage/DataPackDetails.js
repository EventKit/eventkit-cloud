import React, { PropTypes, Component } from 'react';
import { Table, TableHeader, TableHeaderColumn, TableRow }
    from 'material-ui/Table';
import RaisedButton from 'material-ui/RaisedButton';
import CloudDownload from 'material-ui/svg-icons/file/cloud-download';
import Info from 'material-ui/svg-icons/action/info';
import ProviderRow from './ProviderRow';
import BaseDialog from '../Dialog/BaseDialog';

export class DataPackDetails extends Component {
    constructor(props) {
        super(props);
        this.handleInfoOpen = this.handleInfoOpen.bind(this);
        this.handleInfoClose = this.handleInfoClose.bind(this);
        this.state = {
            infoOpen: false,
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
        if (!this.props.zipFileProp) {
            return (
                <CloudDownload
                    className="qa-DataPackDetails-CloudDownload-disabled"
                    style={{ fill: 'grey', verticalAlign: 'middle' }}
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
        if (!this.props.zipFileProp) {
            return false;
        }
        return true;
    }

    handleInfoOpen() {
        this.setState({ infoOpen: true });
    }

    handleInfoClose() {
        this.setState({ infoOpen: false });
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
            info: {
                margin: '5px 10px 5px 5px',
                height: '18px',
                width: '18px',
                cursor: 'pointer',
                fill: '#4598bf',
                verticalAlign: 'middle',
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
                                <RaisedButton
                                    id="CompleteDownload"
                                    href={this.props.zipFileProp}
                                    className="qa-DataPackDetails-RaisedButton-zipButton"
                                    backgroundColor="rgba(179,205,224,0.5)"
                                    disabled={!this.isZipFileCompleted()}
                                    disableTouchRipple
                                    labelColor="#4598bf"
                                    labelStyle={{ fontWeight: 'bold', fontSize: textFontSize }}
                                    label={this.props.zipFileProp ? 'DOWNLOAD DATAPACK (.ZIP)' : 'CREATING DATAPACK ZIP'}
                                    icon={this.getCloudDownloadIcon()}
                                />
                                <Info
                                    className="qa-DataPackDetails-info"
                                    onClick={this.handleInfoOpen}
                                    style={styles.info}
                                />
                                <BaseDialog
                                    className="qa-DataPackDetails-info-dialog"
                                    show={this.state.infoOpen}
                                    title="DataPack Information"
                                    onClose={this.handleInfoClose}
                                >
                                    <div style={{ paddingBottom: '10px', wordWrap: 'break-word' }}>
                                        For convenience, EventKit bundles all the individual data sources into a single download
                                         (formatted as a .zip file).
                                         Additionally, this file contains GIS application files (QGIS and ArcMap),
                                         cartographic styles, metadata, and associated documents.
                                         See the Page Tour for more details about other elements of the Status and Download page.
                                         Detailed information about how to use the DataPacks in QGIS and ArcMap are in
                                         the About EventKit page and in the metadata of the DataPack.
                                    </div>
                                </BaseDialog>
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
