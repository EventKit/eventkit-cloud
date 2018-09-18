import PropTypes from 'prop-types';
import React, { Component } from 'react';
import withWidth, { isWidthUp } from '@material-ui/core/withWidth';
import { withTheme } from '@material-ui/core/styles';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import BaseDialog from '../Dialog/BaseDialog';

export class LicenseRow extends Component {
    constructor(props) {
        super(props);
        this.setLicenseOpen = this.setLicenseOpen.bind(this);
        this.handleLicenseClose = this.handleLicenseClose.bind(this);
        this.state = {
            licenseDialogOpen: false,
        };
    }

    getTableCellWidth() {
        if (!isWidthUp('md', this.props.width)) {
            return '80px';
        }

        return '120px';
    }

    setLicenseOpen() {
        this.setState({ licenseDialogOpen: true });
    }

    handleLicenseClose() {
        this.setState({ licenseDialogOpen: false });
    }


    render() {
        const { colors } = this.props.theme.eventkit;

        const tableCellWidth = this.getTableCellWidth();
        const toggleCellWidth = '50px';

        const { name, text } = this.props;
        return (
            <TableRow
                className="qa-LicenseRow-TableRow"
                style={{ height: '48px' }}
            >
                <TableCell
                    className="qa-LicenseRow-TableCell-empty"
                    style={{ paddingRight: '12px', paddingLeft: '12px', width: '44px' }}
                />
                <TableCell
                    className="qa-LicenseRow-TableCell-licenseText"
                    style={{ padding: '0px', fontSize: '12px' }}
                >
                    <i>
                        Use of this data is governed by&nbsp;
                        <span
                            role="button"
                            tabIndex={0}
                            onKeyPress={this.setLicenseOpen}
                            onClick={this.setLicenseOpen}
                            style={{ cursor: 'pointer', color: colors.primary }}
                        >
                            {name}
                        </span>
                    </i>
                    <BaseDialog
                        className="qa-LicenseRow-BaseDialog"
                        show={this.state.licenseDialogOpen}
                        title={name}
                        onClose={this.handleLicenseClose}
                    >
                        <div style={{ whiteSpace: 'pre-wrap' }}>{text}</div>
                    </BaseDialog>
                </TableCell>
                <TableCell
                    style={{
                        width: tableCellWidth,
                        paddingRight: '0px',
                        paddingLeft: '0px',
                    }}
                />
                <TableCell
                    style={{
                        width: tableCellWidth,
                        paddingRight: '10px',
                        paddingLeft: '10px',
                    }}
                />
                <TableCell
                    style={{
                        paddingRight: '0px',
                        paddingLeft: '0px',
                        width: '36px',
                    }}
                />
                <TableCell
                    style={{
                        paddingRight: '0px',
                        paddingLeft: '0px',
                        width: toggleCellWidth,
                    }}
                />
            </TableRow>
        );
    }
}

LicenseRow.propTypes = {
    name: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    theme: PropTypes.object.isRequired,
    width: PropTypes.string.isRequired,
};

export default
@withWidth()
@withTheme()
class Default extends LicenseRow {}
