import { Component } from 'react';
import { Theme, Breakpoint } from '@mui/material/styles';
import withTheme from '@mui/styles/withTheme';
import withStyles from '@mui/styles/withStyles';
import createStyles from '@mui/styles/createStyles';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import BaseDialog from '../Dialog/BaseDialog';

// FIXME checkout https://mui.com/components/use-media-query/#migrating-from-withwidth
const withWidth = () => (WrappedComponent) => (props) => <WrappedComponent {...props} width="xs" />;

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
    estimatedFinishColumn: {
        whiteSpace: 'pre',
        width: '80px',
        paddingRight: '0px',
        paddingLeft: '0px',
        textAlign: 'center',
        color: theme.eventkit.colors.black,
        fontSize: '12px',
        [theme.breakpoints.up('md')]: {
            fontSize: '14px',
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

export class LicenseRow extends Component<Props, State> {
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
                <TableCell classes={{ root: classes.estimatedFinishColumn }} />
                <TableCell classes={{ root: classes.providerStatusColumn }} />
                <TableCell classes={{ root: classes.menuColumn }} />
                <TableCell classes={{ root: classes.arrowColumn }} />
            </TableRow>
        );
    }
}

export default withWidth()(withTheme(withStyles(jss)(LicenseRow)));
