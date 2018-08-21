import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import BaseDialog from './BaseDialog';

export class ConfirmDialog extends Component {
    render() {
        const style = {
            backgroundColor: 'whitesmoke',
            fontWeight: 'bold',
            color: '#4598bf',
        };

        const deleteActions = [
            <Button
                className="qa-ConfirmDialog-Button-CancelButton"
                style={{ ...style, marginRight: '10px' }}
                onClick={this.props.onCancel}
                variant="contained"
            >
                {this.props.cancelLabel}
            </Button>,
            <Button
                className="qa-ConfirmDialog-Button-ConfirmButton"
                style={{ ...style, color: this.props.isDestructive ? '#ff0000' : '#4598bf' }}
                onClick={this.props.onConfirm}
                variant="contained"
            >
                {this.props.confirmLabel}
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
};

ConfirmDialog.defaultProps = {
    cancelLabel: 'Cancel',
    confirmLabel: 'Confirm',
    isDestructive: false,
    children: undefined,
};

export default ConfirmDialog;
