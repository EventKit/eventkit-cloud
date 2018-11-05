import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import BaseDialog from '../../Dialog/BaseDialog';
import CustomTextField from '../../CustomTextField';

export class RenameGroupDialog extends Component {
    render() {
        const { colors } = this.props.theme.eventkit;

        const createActions = [
            <Button
                key="save"
                className="qa-RenameGroupDialog-save"
                onClick={this.props.onSave}
                disabled={!this.props.value || !this.props.valid}
                variant="contained"
                color="primary"
            >
                RENAME
            </Button>,
            <Button
                key="cancel"
                className="qa-RenameGroupDialog-cancel"
                onClick={this.props.onClose}
                variant="flat"
                color="primary"
            >
                CANCEL
            </Button>,
        ];

        return (
            <BaseDialog
                show={this.props.show}
                onClose={this.props.onClose}
                title="RENAME GROUP"
                actions={createActions}
                dialogStyle={{ maxWidth: '500px' }}
            >
                {!this.props.valid ?
                    <div style={{ color: colors.warning }}>Name unavailable</div>
                    :
                    null
                }
                <CustomTextField
                    placeholder="Rename Group"
                    maxLength={50}
                    onChange={this.props.onInputChange}
                    value={this.props.value}
                    style={{ width: '100%' }}
                    InputProps={{ style: { lineHeight: '24px', fontSize: '14px', paddingLeft: '5px' }, error: !this.props.valid }}
                    className="qa-RenameGroupDialog-textField"
                />
            </BaseDialog>
        );
    }
}

RenameGroupDialog.propTypes = {
    show: PropTypes.bool.isRequired,
    onInputChange: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    value: PropTypes.string.isRequired,
    valid: PropTypes.bool.isRequired,
    theme: PropTypes.object.isRequired,
};

export default withTheme()(RenameGroupDialog);
