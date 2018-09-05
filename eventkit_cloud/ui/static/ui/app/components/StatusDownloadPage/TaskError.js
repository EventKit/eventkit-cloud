import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';
import Divider from '@material-ui/core/Divider';
import Warning from '@material-ui/icons/Warning';
import BaseDialog from '../Dialog/BaseDialog';

export class TaskError extends Component {
    constructor(props) {
        super(props);
        this.handleTaskErrorClose = this.handleTaskErrorClose.bind(this);
        this.handleTaskErrorOpen = this.handleTaskErrorOpen.bind(this);
        this.state = {
            taskErrorDialogOpen: false,
        };
    }

    handleTaskErrorOpen() {
        this.setState({ taskErrorDialogOpen: true });
    }

    handleTaskErrorClose() {
        this.setState({ taskErrorDialogOpen: false });
    }

    render() {
        const { colors } = this.props.theme.eventkit;

        const styles = {
            errorText: {
                borderTopWidth: '10px',
                borderBottomWidth: '10px',
                borderLeftWidth: '10px',
                color: colors.warning,
                cursor: 'pointer',
            },
            warningIcon: {
                marginRight: '10px',
                fill: colors.warning,
                verticalAlign: 'bottom',
            },
        };

        const { task } = this.props;
        const { errors } = task;

        const taskErrors = errors.filter(error => error.exception != null);

        return (
            <span className="qa-TaskError-errorLink">
                <span
                    role="button"
                    tabIndex={0}
                    onClick={this.handleTaskErrorOpen}
                    onKeyPress={this.handleTaskErrorOpen}
                    style={styles.errorText}
                    className="qa-TaskError-error-text"
                >
                    ERROR
                </span>

                <BaseDialog
                    className="qa-TaskError-BaseDialog"
                    show={this.state.taskErrorDialogOpen}
                    title={
                        <strong id="error-title">
                            {task.name} has
                            <strong style={{ color: colors.warning }}> {taskErrors.length} error(s).</strong>
                        </strong>
                    }
                    onClose={this.handleTaskErrorClose}
                >
                    {taskErrors.map(error => (
                        <div
                            className="qa-TaskError-div-errorData"
                            key={error.exception}
                            style={{ marginTop: '15px', width: '100%' }}
                        >
                            <Warning
                                className="qa-TaskError-Warning"
                                style={styles.warningIcon}
                            />
                            {error.exception}
                            <Divider
                                className="qa-TaskError-Divider"
                                style={{ marginTop: '15px' }}
                            />
                        </div>
                    ))}
                </BaseDialog>
            </span>
        );
    }
}

TaskError.propTypes = {
    task: PropTypes.object.isRequired,
    theme: PropTypes.object.isRequired,
};

export default withTheme()(TaskError);

