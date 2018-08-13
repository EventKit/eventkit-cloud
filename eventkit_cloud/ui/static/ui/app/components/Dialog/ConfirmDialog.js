import PropTypes from 'prop-types';
import React, { Component } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import BaseDialog from './BaseDialog';

export class ConfirmDialog extends Component {
    render() {
        const deleteActions = [
            <RaisedButton
                className="qa-ConfirmDialog-RaisedButton-CancelButton"
                style={{ marginRight: '10px' }}
                backgroundColor="rgba(226,226,226,0.5)"
                labelStyle={{ fontWeight: 'bold' }}
                labelColor="#4598bf"
                disableTouchRipple
                label={this.props.cancelLabel}
                onClick={this.props.onCancel}
            />,
            <RaisedButton
                className="qa-ConfirmDialog-RaisedButton-ConfirmButton"
                backgroundColor="rgba(226,226,226,0.5)"
                labelStyle={{ fontWeight: 'bold' }}
                labelColor={this.props.isDestructive ? '#ff0000' : '#4598bf'}
                disableTouchRipple
                label={this.props.confirmLabel}
                onClick={this.props.onConfirm}
            />,
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
