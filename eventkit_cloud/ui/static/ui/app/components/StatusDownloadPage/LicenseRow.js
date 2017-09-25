import React, {PropTypes, Component} from 'react'
import {TableRow, TableRowColumn} from 'material-ui/Table';
import BaseDialog from '../BaseDialog';

export class LicenseRow extends React.Component {
    constructor(props) {
        super(props)
        this.setLicenseOpen = this.setLicenseOpen.bind(this);
        this.handleLicenseClose = this.handleLicenseClose.bind(this);
        this.state = {
            licenseDialogOpen: false,
        }
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

    setLicenseOpen() {
        this.setState({licenseDialogOpen: true});
    }

    handleLicenseClose() {
        this.setState({licenseDialogOpen: false});
    }


    render() {
        const textFontSize = this.getTextFontSize();
        const tableCellWidth = this.getTableCellWidth();
        const toggleCellWidth = '50px'
        
        return (
            <TableRow
                className={'qa-LicenseRow-TableRow'}
                selectable={false}
                style={{height: '20px'}}
                displayBorder={true}>
                <TableRowColumn className={'qa-LicenseRow-TableRowColumn-empty'} style={{paddingRight: '12px', paddingLeft: '12px', width: '44px'}}>
                </TableRowColumn>
                <TableRowColumn  className={'qa-LicenseRow-TableRowColumn-licenseText'} style={{paddingRight: '12px', paddingLeft: '12px', fontSize: '12px'}}>
                    <i>
                        Use of this data is governed by <a 
                                                            onClick={this.setLicenseOpen}
                                                            style={{cursor: 'pointer', color: '#4598bf'}}
                                                        >
                                                            {this.props.name}
                                                        </a>
                    </i>
                    <BaseDialog
                        className={'qa-LicenseRow-BaseDialog'}
                        show={this.state.licenseDialogOpen}
                        title={this.props.name}
                        onClose={this.handleLicenseClose}
                    >
                        <div style={{whiteSpace: 'pre-wrap'}}>{this.props.text}</div>
                    </BaseDialog>
                </TableRowColumn>
                <TableRowColumn style={{
                    width: tableCellWidth,
                    paddingRight: '0px',
                    paddingLeft: '0px',
                    textAlign: 'center',
                    fontSize: textFontSize
                }}>
                </TableRowColumn>
                <TableRowColumn style={{
                    width: tableCellWidth,
                    paddingRight: '10px',
                    paddingLeft: '10px',
                    textAlign: 'center',
                    fontSize: textFontSize,
                    fontWeight: 'bold'
                }}>
                </TableRowColumn>
                <TableRowColumn style={{
                    paddingRight: '0px',
                    paddingLeft: '0px',
                    width: '20px',
                    textAlign: 'center',
                    fontSize: textFontSize
                }}></TableRowColumn>
                <TableRowColumn style={{
                    paddingRight: '0px',
                    paddingLeft: '0px',
                    width: toggleCellWidth,
                    textAlign: 'center',
                    fontSize: textFontSize
                }}></TableRowColumn>
            </TableRow>
        )
    }
}

LicenseRow.propTypes = {
    name: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
}

export default LicenseRow;

