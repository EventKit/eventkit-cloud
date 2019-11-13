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
            dialog: {
                width: '70%',
                minWidth: '300px',
                maxWidth: '610px',
                maxHeight: '90%',
                ...this.props.dialogStyle,
            },
            title: {
                padding: '24px 24px 20px',
                fontWeight: 700,
                fontSize: '18px',
                lineHeight: '32px',
                ...this.props.titleStyle,
            },
            body: {
                padding: '0px 24px',
                fontSize: '16px',
                color: colors.text_primary,
                ...this.props.bodyStyle,
            },
            actions: {
                margin: '20px 24px 24px',
                flexDirection: 'row-reverse',
                justifyContent: 'space-between',
                ...this.props.actionsStyle,
            },
            clear: {
                float: 'right',
                cursor: 'pointer',
            },
            button: {
                color: colors.secondary,
                fontWeight: 'bold',
                ...this.props.buttonStyle,
            },
        };

        // the default is just a close button
        const defaultActions = [
            <Button
                key="close"
                className="qa-BaseDialog-Button"
                style={styles.button}
                variant="contained"
                color="primary"
                onClick={this.props.onClose}
            >
                {this.props.buttonText || 'Close'}
            </Button>,
        ];

        // if actions have been passed in, use those instead of the default
        const actions = this.props.actions ? this.props.actions : defaultActions;

        // display passed in title and a clear button which calls props.onClose
        const title = (
            <div className="qa-BaseDialog-div" style={{display: 'flex'}}>
                <strong style={{width: '100%'}}>{this.props.title ? this.props.title : ''}</strong>
                <Clear style={styles.clear} color="primary" onClick={this.props.onClose} />
            </div>
        );

        return (
            <Dialog
                className={this.props.className}
                open={this.props.show}
                onClose={this.props.onClose}
                maxWidth="md"
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
    onClose: undefined,
    title: undefined,
    actions: undefined,
    buttonText: undefined,
    children: undefined,
    dialogStyle: {},
    titleStyle: {},
    bodyStyle: {},
    actionsStyle: {},
    buttonStyle: {},
    overlayStyle: {},
    className: 'qa-BaseDialog-Dialog',
    innerMaxHeight: 400
};

BaseDialog.propTypes = {
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func,
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    actions: PropTypes.arrayOf(PropTypes.node),
    children: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node),
    ]),
    buttonText: PropTypes.string,
    dialogStyle: PropTypes.object,
    titleStyle: PropTypes.object,
    bodyStyle: PropTypes.object,
    actionsStyle: PropTypes.object,
    buttonStyle: PropTypes.object,
    overlayStyle: PropTypes.object,
    theme: PropTypes.object.isRequired,
    className: PropTypes.string,
    innerMaxHeight: PropTypes.number,
};

export default withTheme()(BaseDialog);
