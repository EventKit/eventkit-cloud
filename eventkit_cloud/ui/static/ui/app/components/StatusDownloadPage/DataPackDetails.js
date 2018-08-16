import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Table, TableHeader, TableHeaderColumn, TableRow }
    from 'material-ui/Table';
import Button from '@material-ui/core/Button';
import CloudDownload from '@material-ui/icons/CloudDownload';
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
        if (!this.props.zipFileProp) {
            return (
                <CloudDownload
                    className="qa-DataPackDetails-CloudDownload-disabled"
                    style={{ fill: 'grey', verticalAlign: 'middle', marginRight: '5px' }}
                />
            );
        }
        return (
            <CloudDownload
                className="qa-DataPackDetails-CloudDownload-enabled"
                style={{ fill: '#4598bf', verticalAlign: 'middle', marginRight: '5px' }}
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

        const { classes } = this.props;

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
                                <Button
                                    id="CompleteDownload"
                                    href={this.props.zipFileProp}
                                    variant="contained"
                                    className="qa-DataPackDetails-RaisedButton-zipButton"
                                    classes={{ root: classes.root }}
                                    disabled={!this.isZipFileCompleted()}
                                    disableTouchRipple
                                    style={{ fontSize: textFontSize }}
                                >
                                    {this.getCloudDownloadIcon()}
                                    {this.props.zipFileProp ? 'DOWNLOAD DATAPACK (.ZIP)' : 'CREATING DATAPACK ZIP'}

                                </Button>
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
    classes: PropTypes.object.isRequired,
};

const classStyles = {
    root: {
        backgroundColor: 'rgba(179, 205, 224, 0.5)',
        color: '#4598bf',
        fontWeight: 'bold',
        '&:hover': {
            backgroundColor: 'rgba(179, 205, 224, 0.8)',
            color: '#4598bf',
        },
        '&:disabled': {
            backgroundColor: '#e5e5e5',
            color: 'rgba(0, 0, 0, 0.3)',
        },
    },
};

export default withStyles(classStyles)(DataPackDetails);
