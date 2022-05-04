import { Component } from 'react';
import { Theme, Breakpoint } from '@mui/material/styles';
import withTheme from '@mui/styles/withTheme';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Clear from '@mui/icons-material/Clear';
import CustomScrollbar from '../common/CustomScrollbar';
import BaseDialog from "../Dialog/BaseDialog";
import Divider from "@mui/material/Divider";
import {connect} from "react-redux";
import {clearDataCartPermissions} from "../../actions/datacartActions";
import Warning from "@mui/icons-material/Warning";

// FIXME checkout https://mui.com/components/use-media-query/#migrating-from-withwidth
const withWidth = () => (WrappedComponent) => (props) => <WrappedComponent {...props} width="xs" />;

export interface Props {
    className?: string;
    show: boolean;
    onClose: () => void;
    handleSave: () => void;
    title: string | HTMLElement;
    children: any;
    submitButtonLabel: string;
    theme: Eventkit.Theme & Theme;
    width: Breakpoint;
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

    render() {
        const errorMessages = this.getErrorMessage();

        if (!this.props.show) {
            return null;
        }

        const {colors} = this.props.theme.eventkit;
        const {width} = this.props;
        const marginSubtract = isWidthDown('sm', width) ? 32 : 96;
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
                <strong>{this.props.title as any}</strong>
                <Clear style={styles.clear} onClick={this.props.onClose} color="primary"/>
            </div>
        );

        return <>
            <Dialog
                className="qa-ShareBaseDialog-Dialog"
                style={{top: '50px'}}
                open={this.props.show}
                onClose={this.props.onClose}
                PaperProps={{style: styles.dialog}}
            >
                <DialogTitle style={styles.title}>{title}</DialogTitle>
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
        </>;
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

export default withWidth()(withTheme(connect(mapStateToProps, mapDispatchToProps)(ShareBaseDialog)));
