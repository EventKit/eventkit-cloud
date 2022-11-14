import { Component } from 'react';
import {withTheme, Theme} from '@material-ui/core/styles';
import {isWidthDown} from '@material-ui/core/withWidth';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Clear from '@material-ui/icons/Clear';
import CustomScrollbar from '../common/CustomScrollbar';
import BaseDialog from "../Dialog/BaseDialog";
import Divider from "@material-ui/core/Divider";
import {connect} from "react-redux";
import {clearDataCartPermissions} from "../../actions/datacartActions";
import Warning from "@material-ui/icons/Warning";
import {CUSTOM_BREAKPOINTS} from "../DashboardPage/DashboardPage";
import {Breakpoint} from "@material-ui/core/styles/createBreakpoints";

export interface Props {
    className?: string;
    show: boolean;
    onClose: () => void;
    handleSave: () => void;
    title: string | HTMLElement;
    children: any;
    submitButtonLabel: string;
    theme: Eventkit.Theme & Theme;
    permissionState: Eventkit.Store.UpdatePermissions;
    clearDataCartPermissions: () => void;
}

export class ShareBaseDialog extends Component<Props, {}> {
    static defaultProps = {
        title: 'SHARE',
        children: undefined,
        submitButtonLabel: 'SAVE',
    };

    constructor(props: Props) {
        super(props);
        this.getErrorMessage = this.getErrorMessage.bind(this);
        this.clearError = this.clearError.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.getWidth = this.getWidth.bind(this);
        this.state = {
            shareDialogOpen: this.props.onClose,
        };
    }

    getErrorMessage() {
        if (!this.props.permissionState.error) {
            return null;
        }

        const messages = this.props.permissionState.error.map((error, ix) => (
            <div className="GroupsBody-error-container" key={error.detail}>
                {ix > 0 ? <Divider style={{marginBottom: '5px'}}/> : null}
                <p className="GroupsBody-error-title">
                    <Warning style={{
                        fill: this.props.theme.eventkit.colors.warning,
                        verticalAlign: 'bottom',
                        marginRight: '10px'
                    }}/>
                </p>
                <p className="GroupsBody-error-detail">
                    {error.detail}
                </p>
            </div>
        ));
        return messages;
    }

    clearError() {
        this.props.clearDataCartPermissions();
    }

    handleClose() {
        this.setState({shareDialogOpen: false});
    }

    getWidth() {
        const windowWidth = window.innerWidth;
        let value = 'xs';
        if (windowWidth >= CUSTOM_BREAKPOINTS.xl) {
            value = 'xl';
        } else if (windowWidth >= CUSTOM_BREAKPOINTS.lg) {
            value = 'lg';
        } else if (windowWidth >= CUSTOM_BREAKPOINTS.md) {
            value = 'md';
        } else if (windowWidth >= CUSTOM_BREAKPOINTS.sm) {
            value = 'sm';
        }

        return value;
    };

    render() {
        const errorMessages = this.getErrorMessage();

        if (!this.props.show) {
            return null;
        }

        const {colors} = this.props.theme.eventkit;
        const width = this.getWidth();
        const marginSubtract = isWidthDown('sm', width as Breakpoint) ? 32 : 96;
        const styles = {
            dialog: {
                width: 'calc(100% - 32px)',
                height: '90%',
                minWidth: '325px',
                maxWidth: '650px',
                margin: 'auto',
                maxHeight: `calc(100% - ${marginSubtract}px)`,
            },
            title: {
                padding: '24px 24px 20px',
                fontWeight: 700,
                fontSize: '18px',
                lineHeight: '32px',
            },
            body: {
                padding: '0px 24px',
                fontSize: '16px',
                color: colors.text_primary,
                position: 'relative' as 'relative',
            },
            actions: {
                margin: '20px 24px 24px',
                justifyContent: 'space-between',
            },
            clear: {
                float: 'right' as 'right',
                cursor: 'pointer',
            },
        };

        const actions = [
            <Button
                key="cancel"
                className="qa-ShareBaseDialog-cancel"
                style={{fontWeight: 'bold'}}
                variant="text"
                color="primary"
                onClick={this.props.onClose}
            >
                CANCEL
            </Button>,
            <Button
                key="save"
                className="qa-ShareBaseDialog-save"
                style={{fontWeight: 'bold'}}
                variant="contained"
                color="primary"
                onClick={this.props.handleSave}
            >
                {this.props.submitButtonLabel}
            </Button>,
        ];

        // display passed in title and a clear button which calls props.onClose
        const title = (
            <div className="qa-ShareBaseDialog-title">
                <strong>{this.props.title}</strong>
                <Clear style={styles.clear} onClick={this.props.onClose} color="primary"/>
            </div>
        );

        return (
            <>
                <Dialog
                    className="qa-ShareBaseDialog-Dialog"
                    style={{top: '50px'}}
                    open={this.props.show}
                    onClose={this.props.onClose}
                    PaperProps={{style: styles.dialog}}
                >
                    <DialogTitle style={styles.title} disableTypography>{title}</DialogTitle>
                    <DialogContent style={styles.body}>
                        <CustomScrollbar
                            style={{height: `calc(100vh - ${marginSubtract + 76 + 80}px)`}}
                        >
                            {this.props.children}
                        </CustomScrollbar>
                    </DialogContent>
                    <DialogActions style={styles.actions}>{actions}</DialogActions>
                </Dialog>
                {this.props.permissionState.error &&
                    <BaseDialog
                        className="qa-GroupsBody-BaseDialog-error"
                        show={!!this.props.permissionState.error}
                        title="ERROR"
                        onClose={this.clearError}
                    >
                        {errorMessages}
                    </BaseDialog>
                }
            </>
        );
    }
}

const mapStateToProps = state => (
    {
        permissionState: state.updatePermission,
    }
);

const mapDispatchToProps = dispatch => (
    {
        clearDataCartPermissions: () => (
            dispatch(clearDataCartPermissions())
        ),
    }
);

export default withTheme(connect(mapStateToProps, mapDispatchToProps)(ShareBaseDialog));
