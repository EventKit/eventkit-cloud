import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Clear from '@material-ui/icons/Clear';
import CustomScrollbar from '../CustomScrollbar';

export class BaseDialog extends Component {
    render() {
        const { colors } = this.props.theme.eventkit;

        // default styling with the option for overriding with custom props
        const styles = {
            actions: {
                flexDirection: 'row-reverse',
                justifyContent: 'space-between',
                margin: '20px 24px 24px',
                ...this.props.actionsStyle,
            },
            body: {
                color: colors.text_primary,
                fontSize: '16px',
                padding: '0px 24px',
                ...this.props.bodyStyle,
            },
            button: {
                color: colors.secondary,
                fontWeight: 'bold',
                ...this.props.buttonStyle,
            },
            clear: {
                cursor: 'pointer',
                float: 'right',
            },
            dialog: {
                maxHeight: '90%',
                maxWidth: '610px',
                minWidth: '300px',
                width: '70%',
                ...this.props.dialogStyle,
            },
            title: {
                fontSize: '18px',
                fontWeight: 700,
                lineHeight: '32px',
                padding: '24px 24px 20px',
                ...this.props.titleStyle,
            }
        };

        // the default is just a close button
        const defaultActions = [
            <Button
                className="qa-BaseDialog-Button"
                color="primary"
                key="close"
                onClick={this.props.onClose}
                style={styles.button}
                variant="contained"
            >
                {this.props.buttonText || 'Close'}
            </Button>,
        ];

        // if actions have been passed in, use those instead of the default
        const actions = this.props.actions ? this.props.actions : defaultActions;

        // display passed in title and a clear button which calls props.onClose
        const title = (
            <div className="qa-BaseDialog-div" style={{ display: 'flex' }}>
                <strong style={{ width: '100%' }}>{this.props.title ? this.props.title : ''}</strong>
                <Clear style={styles.clear} color="primary" onClick={this.props.onClose} />
            </div>
        );

        return (
            <Dialog
                className={this.props.className}
                maxWidth="md"
                open={this.props.show}
                onClose={this.props.onClose}
                PaperProps={{ style: styles.dialog }}
                style={this.props.overlayStyle}
            >
                <DialogTitle style={styles.title} disableTypography>{title}</DialogTitle>
                <DialogContent style={styles.body}>
                    <CustomScrollbar
                        autoHeight
                        autoHeightMax={this.props.innerMaxHeight}
                    >
                        {this.props.children}
                    </CustomScrollbar>
                </DialogContent>
                <DialogActions style={styles.actions}>{actions}</DialogActions>
            </Dialog>
        );
    }
}

BaseDialog.defaultProps = {
    actions: undefined,
    actionsStyle: {},
    bodyStyle: {},
    buttonStyle: {},
    buttonText: undefined,
    children: undefined,
    className: 'qa-BaseDialog-Dialog',
    dialogStyle: {},
    innerMaxHeight: 400,
    onClose: undefined,
    overlayStyle: {},
    title: undefined,
    titleStyle: {},
};

BaseDialog.propTypes = {
    actions: PropTypes.arrayOf(PropTypes.node),
    actionsStyle: PropTypes.object,
    bodyStyle: PropTypes.object,
    buttonStyle: PropTypes.object,
    buttonText: PropTypes.string,
    children: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node),
    ]),
    className: PropTypes.string,
    dialogStyle: PropTypes.object,
    innerMaxHeight: PropTypes.number,
    onClose: PropTypes.func,
    overlayStyle: PropTypes.object,
    show: PropTypes.bool.isRequired,
    theme: PropTypes.object.isRequired,
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    titleStyle: PropTypes.object,
};

export default withTheme()(BaseDialog);
