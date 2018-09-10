import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import BaseDialog from '../Dialog/BaseDialog';
import DeleteDataPackDialog from '../Dialog/DeleteDataPackDialog';

export class DataPackOptions extends Component {
    constructor(props) {
        super(props);
        this.handleDeleteOpen = this.handleDeleteOpen.bind(this);
        this.handleDeleteClose = this.handleDeleteClose.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
        this.handleRerunOpen = this.handleRerunOpen.bind(this);
        this.handleRerunClose = this.handleRerunClose.bind(this);
        this.handleRerun = this.handleRerun.bind(this);
        this.handleCloneOpen = this.handleCloneOpen.bind(this);
        this.handleCloneClose = this.handleCloneClose.bind(this);
        this.handleClone = this.handleClone.bind(this);
        this.state = {
            showDeleteDialog: false,
            showRerunDialog: false,
            showCloneDialog: false,
        };
    }

    handleDeleteOpen() {
        this.setState({ showDeleteDialog: true });
    }

    handleDeleteClose() {
        this.setState({ showDeleteDialog: false });
    }

    handleRerunOpen() {
        this.setState({ showRerunDialog: true });
    }

    handleRerunClose() {
        this.setState({ showRerunDialog: false });
    }
    handleCloneOpen() {
        this.setState({ showCloneDialog: true });
    }

    handleCloneClose() {
        this.setState({ showCloneDialog: false });
    }

    handleDelete() {
        this.props.onDelete(this.props.dataPack.uid);
        this.setState({ showDeleteDialog: false });
    }

    handleRerun() {
        this.props.onRerun(this.props.dataPack.job.uid);
        this.setState({ showRerunDialog: false });
    }

    handleClone() {
        const providerArray = [];
        this.props.dataPack.provider_tasks.forEach((provider) => {
            if (provider.display === true) {
                providerArray.push(provider);
            }
        });
        this.props.onClone(this.props.dataPack, providerArray);
        this.setState({ showCloneDialog: false });
    }

    render() {
        const rerunExportActions = [
            <Button
                key="rerun"
                className="qa-DataPackOptions-RaisedButton-rerun"
                variant="contained"
                color="primary"
                onClick={this.handleRerun}
            >
                Rerun
            </Button>,
            <Button
                key="cancel-rerun"
                className="qa-DataPackOptions-Button-rerunCancel"
                variant="contained"
                color="secondary"
                style={{ marginRight: '10px' }}
                onClick={this.handleRerunClose}
            >
                Cancel
            </Button>,
        ];
        const cloneExportActions = [
            <Button
                key="clone"
                className="qa-DataPackOptions-RaisedButton-clone"
                variant="contained"
                color="primary"
                onClick={this.handleClone}
            >
                Clone
            </Button>,
            <Button
                key="cancel-clone"
                className="qa-DataPackOptions-RaisedButton-cloneCancel"
                style={{ marginRight: '10px' }}
                variant="contained"
                color="secondary"
                onClick={this.handleCloneClose}
            >
                Cancel
            </Button>,
        ];

        return (
            <div>
                <Button
                    className="qa-DataPackOptions-RaisedButton-rerunExport"
                    style={{ margin: '10px', fontWeight: 'bold' }}
                    variant="contained"
                    color="secondary"
                    disabled={!this.props.adminPermissions}
                    onClick={this.handleRerunOpen}
                >
                    RUN EXPORT AGAIN
                </Button>
                <BaseDialog
                    className="qa-DataPackOptions-BaseDialog-rerunExport"
                    show={this.state.showRerunDialog}
                    title="RERUN DATAPACK"
                    onClose={this.handleRerunClose}
                    actions={rerunExportActions}
                >
                    <strong>Are you sure you want to run this DataPack again?</strong>
                </BaseDialog>
                <Button
                    className="qa-DataPackOptions-RaisedButton-cloneExport"
                    style={{ margin: '10px', fontWeight: 'bold' }}
                    variant="contained"
                    color="secondary"
                    onClick={this.handleCloneOpen}
                >
                    CLONE
                </Button>
                <BaseDialog
                    className="qa-DataPackOptions-BaseDialog-cloneExport"
                    show={this.state.showCloneDialog}
                    title="CLONE DATAPACK"
                    onClose={this.handleCloneClose}
                    actions={cloneExportActions}
                >
                    <strong>Are you sure you want to clone this DataPack?</strong>
                </BaseDialog>
                <Button
                    className="qa-DataPackOptions-RaisedButton-deleteExport"
                    style={{ margin: '10px', color: '#ff0000', fontWeight: 'bold' }}
                    variant="contained"
                    color="secondary"
                    disabled={!this.props.adminPermissions}
                    onClick={this.handleDeleteOpen}
                >
                    DELETE
                </Button>
                <DeleteDataPackDialog
                    className="qa-DataPackOptions-DeleteDialog-deleteExport"
                    show={this.state.showDeleteDialog}
                    onCancel={this.handleDeleteClose}
                    onDelete={this.handleDelete}
                />
            </div>
        );
    }
}

DataPackOptions.defaultProps = {
    adminPermissions: false,
};

DataPackOptions.propTypes = {
    adminPermissions: PropTypes.bool,
    onRerun: PropTypes.func.isRequired,
    onClone: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    dataPack: PropTypes.shape({
        uid: PropTypes.string,
        job: PropTypes.shape({
            uid: PropTypes.string,
        }),
        provider_tasks: PropTypes.arrayOf(PropTypes.object),
    }).isRequired,
};

export default DataPackOptions;
