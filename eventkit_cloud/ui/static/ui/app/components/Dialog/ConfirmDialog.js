import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import BaseDialog from './BaseDialog';

export class ConfirmDialog extends Component {
    render() {
        const { colors } = this.props.theme.eventkit;

        const style = {
            backgroundColor: colors.secondary,
            color: colors.primary,
            fontWeight: 'bold',
        };

        const deleteActions = [
            <Button
                className="qa-ConfirmDialog-Button-ConfirmButton"
                key="confirm"
                onClick={this.props.onConfirm}
                style={{ ...style, color: this.props.isDestructive ? colors.warning : colors.primary }}
                variant="contained"
            >
                {this.props.confirmLabel}
            </Button>,
            <Button
                className="qa-ConfirmDialog-Button-CancelButton"
                key="cancel"
                onClick={this.props.onCancel}
                style={{ ...style, marginRight: '10px' }}
                variant="contained"
            >
                {this.props.cancelLabel}
            </Button>,
        ];

        return (
            <BaseDialog
                actions={deleteActions}
                className="qa-ConfirmDialog-BaseDialog"
                onClose={this.props.onCancel}
                show={this.props.show}
                title={this.props.title}
            >
                {this.props.children}
            </BaseDialog>
        );
    }
}

ConfirmDialog.propTypes = {
    cancelLabel: PropTypes.string,
    children: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node),
    ]),
    confirmLabel: PropTypes.string,
    isDestructive: PropTypes.bool,
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    show: PropTypes.bool.isRequired,
    theme: PropTypes.object.isRequired,
    title: PropTypes.string.isRequired,
};

ConfirmDialog.defaultProps = {
    cancelLabel: 'Cancel',
    children: undefined,
    confirmLabel: 'Confirm',
    isDestructive: false,
};

export default withTheme()(ConfirmDialog);
