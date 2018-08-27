import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Divider from '@material-ui/core/Divider';
import Warning from '@material-ui/icons/Warning';
import BaseDialog from '../Dialog/BaseDialog';

export class ProviderError extends Component {
    constructor(props) {
        super(props);
        this.handleProviderErrorOpen = this.handleProviderErrorOpen.bind(this);
        this.handleProviderErrorClose = this.handleProviderErrorClose.bind(this);
        this.state = {
            providerErrorDialogOpen: false,
        };
    }

    handleProviderErrorOpen() {
        this.setState({ providerErrorDialogOpen: true });
    }

    handleProviderErrorClose() {
        this.setState({ providerErrorDialogOpen: false });
    }

    render() {
        const styles = {
            errorText: {
                display: 'inlineBlock',
                borderTopWidth: '10px',
                borderBottomWidth: '10px',
                borderLeftWidth: '10px',
                color: '#ce4427',
                cursor: 'pointer',
                fontWeight: 'bold',
            },
            warning: {
                marginLeft: '10px',
                cursor: 'pointer',
                display: 'inlineBlock',
                fill: '#ce4427',
                verticalAlign: 'bottom',
            },
            warningIcon: {
                marginRight: '10px',
                display: 'inlineBlock',
                fill: '#e8ac90',
                verticalAlign: 'bottom',
            },
        };

        const { provider } = this.props;
        const errors = [];

        provider.tasks.forEach((task) => {
            if (task.display === true) {
                if (task.errors.length !== 0) {
                    task.errors.forEach(error => errors.push(error.exception));
                }
            }
        });

        const errorTitle = (
            <strong id="error-title">
                {provider.name} has
                <strong style={{ color: '#ce4427' }}> {errors.length} error(s).</strong>
            </strong>
        );

        const errorData = errors.slice(0, 3).map(error => (
            <div
                key={error}
                className="qa-ProviderError-errorData"
                style={{ marginTop: '15px', width: '100%' }}
                id="error-data"
            >
                <Warning
                    className="qa-ProviderError-Warning-icon"
                    style={styles.warningIcon}
                />
                {error}
                <Divider
                    className="qa-ProviderError-Divider"
                    style={{ marginTop: '15px' }}
                />
            </div>
        ));

        return (
            <span className="qa-ProviderError-span-errorText">
                <span
                    role="button"
                    tabIndex={0}
                    onKeyPress={this.handleProviderErrorOpen}
                    onClick={this.handleProviderErrorOpen}
                    style={styles.errorText}
                    className="qa-ProviderError-error-text"
                >
                    ERROR
                </span>
                <Warning
                    className="qa-ProviderError-Warning"
                    onClick={this.handleProviderErrorOpen}
                    style={styles.warning}
                />
                <BaseDialog
                    className="qa-ProviderError-BaseDialog"
                    show={this.state.providerErrorDialogOpen}
                    title={errorTitle}
                    onClose={this.handleProviderErrorClose}
                >
                    {errorData}
                </BaseDialog>
            </span>
        );
    }
}

ProviderError.propTypes = {
    provider: PropTypes.object.isRequired,
};

export default ProviderError;
