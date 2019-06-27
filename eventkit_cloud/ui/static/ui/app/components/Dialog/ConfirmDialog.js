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
            fontWeight: 'bold',
            color: colors.primary,
        };

        const deleteActions = [
            <Button
                key="confirm"
                className="qa-ConfirmDialog-Button-ConfirmButton"
                style={{ ...style, color: this.props.isDestructive ? colors.warning : colors.primary }}
                onClick={this.props.onConfirm}
                variant="contained"
            >
                {this.props.confirmLabel}
            </Button>,
            <Button
                key="cancel"
                className="qa-ConfirmDialog-Button-CancelButton"
                style={{ ...style, marginRight: '10px' }}
                onClick={this.props.onCancel}
                variant="contained"
            >
                {this.props.cancelLabel}
            </Button>,
        ];

        return (
            <BaseDialog
                className="qa-ConfirmDialog-BaseDialog"
                show={this.props.show}
                title={this.props.title}
                actions={deleteActions}
                onClose={this.props.onCancel}
            >
                {this.props.children}
            </BaseDialog>
        );
    }
}

ConfirmDialog.propTypes = {
    show: PropTypes.bool.isRequired,
    title: PropTypes.string.isRequired,
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    children: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node),
    ]),
    cancelLabel: PropTypes.string,
    confirmLabel: PropTypes.string,
    isDestructive: PropTypes.bool,
    theme: PropTypes.object.isRequired,
};

ConfirmDialog.defaultProps = {
    cancelLabel: 'Cancel',
    confirmLabel: 'Confirm',
    isDestructive: false,
    children: undefined,
};

export default withTheme(ConfirmDialog);
