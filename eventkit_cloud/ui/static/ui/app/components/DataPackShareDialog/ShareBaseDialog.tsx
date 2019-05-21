import * as React from 'react';
import { withTheme, Theme } from '@material-ui/core/styles';
import withWidth, { isWidthDown } from '@material-ui/core/withWidth';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Clear from '@material-ui/icons/Clear';
import CustomScrollbar from '../CustomScrollbar';
import { Breakpoint } from '@material-ui/core/styles/createBreakpoints';

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
}

export class ShareBaseDialog extends React.Component<Props, {}> {
    static defaultProps = {
        title: 'SHARE',
        children: undefined,
        submitButtonLabel: 'SAVE',
    };

    render() {
        if (!this.props.show) {
            return null;
        }

        const { colors } = this.props.theme.eventkit;
        const { width } = this.props;
        const marginSubtract = isWidthDown('sm', width) ? 32 : 96;
        const styles = {
            dialog: {
                width: 'calc(100% - 32px)',
                height: '100%',
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
                style={{ fontWeight: 'bold' }}
                variant="text"
                color="primary"
                onClick={this.props.onClose}
            >
                CANCEL
            </Button>,
            <Button
                key="save"
                className="qa-ShareBaseDialog-save"
                style={{ fontWeight: 'bold' }}
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
                <Clear style={styles.clear} onClick={this.props.onClose} color="primary" />
            </div>
        );

        return (
            <Dialog
                className="qa-ShareBaseDialog-Dialog"
                style={{ zIndex: 1501 }}
                open={this.props.show}
                onClose={this.props.onClose}
                PaperProps={{ style: styles.dialog }}
            >
                <DialogTitle style={styles.title} disableTypography>{title}</DialogTitle>
                <DialogContent style={styles.body}>
                    <CustomScrollbar
                        style={{ height: `calc(100vh - ${marginSubtract + 76 + 80}px)` }}
                    >
                        {this.props.children}
                    </CustomScrollbar>
                </DialogContent>
                <DialogActions style={styles.actions}>{actions}</DialogActions>
            </Dialog>
        );
    }
}

export default withWidth()(withTheme()(ShareBaseDialog));
