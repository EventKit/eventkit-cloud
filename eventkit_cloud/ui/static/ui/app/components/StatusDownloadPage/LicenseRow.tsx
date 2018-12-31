import * as React from 'react';
import withWidth from '@material-ui/core/withWidth';
import { Breakpoint } from '@material-ui/core/styles/createBreakpoints';
import { withTheme, withStyles, createStyles, Theme } from '@material-ui/core/styles';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import BaseDialog from '../Dialog/BaseDialog';

const jss = (theme: Eventkit.Theme & Theme) => createStyles({
    insetColumn: {
        width: '44px',
        padding: '0px',
    },
    licenseColumn: {
        padding: '0px',
        fontSize: '12px',
    },
    license: {
        cursor: 'pointer',
        color: theme.eventkit.colors.primary,
    },
    fileSizeColumn: {
        width: '80px',
        padding: '0px',
        [theme.breakpoints.up('md')]: {
            width: '120px',
        },
    },
    providerStatusColumn: {
        width: '80px',
        padding: '0px',
        [theme.breakpoints.up('md')]: {
            width: '120px',
        },
    },
    menuColumn: {
        width: '36px',
        padding: '0px',
    },
    arrowColumn: {
        width: '50px',
        padding: '0px',
    },
});

interface Props {
    name: string;
    text: string;
    theme: Eventkit.Theme & Theme;
    width: Breakpoint;
    classes: { [s: string]: string };
}

interface State {
    licenseDialogOpen: boolean;
}

export class LicenseRow extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.setLicenseOpen = this.setLicenseOpen.bind(this);
        this.handleLicenseClose = this.handleLicenseClose.bind(this);
        this.state = {
            licenseDialogOpen: false,
        };
    }

    private setLicenseOpen() {
        this.setState({ licenseDialogOpen: true });
    }

    private handleLicenseClose() {
        this.setState({ licenseDialogOpen: false });
    }

    render() {
        const { name, text, classes } = this.props;
        return (
            <TableRow
                className="qa-LicenseRow-TableRow"
                style={{ height: '48px' }}
            >
                <TableCell
                    className="qa-LicenseRow-TableCell-empty"
                    classes={{ root: classes.insetColumn }}
                />
                <TableCell
                    className="qa-LicenseRow-TableCell-licenseText"
                    classes={{ root: classes.licenseColumn }}
                >
                    <i>
                        Use of this data is governed by&nbsp;
                        <span
                            role="button"
                            tabIndex={0}
                            onKeyPress={this.setLicenseOpen}
                            onClick={this.setLicenseOpen}
                            className={classes.license}
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
                <TableCell classes={{ root: classes.fileSizeColumn }} />
                <TableCell classes={{ root: classes.providerStatusColumn }} />
                <TableCell classes={{ root: classes.menuColumn }} />
                <TableCell classes={{ root: classes.arrowColumn }} />
            </TableRow>
        );
    }
}

export default withWidth()(withTheme()(withStyles(jss)(LicenseRow)));
