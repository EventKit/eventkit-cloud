import React, { PropTypes, Component } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import BaseDialog from '../BaseDialog';
import DeleteDialog from '../DeleteDialog';

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
            <RaisedButton
                className="qa-DataPackOptions-RaisedButton-rerunCancel"
                style={{ marginRight: '10px' }}
                labelStyle={{ color: '#4598bf', fontWeight: 'bold' }}
                buttonStyle={{ backgroundColor: 'whitesmoke' }}
                disableTouchRipple
                label="Cancel"
                primary={false}
                onTouchTap={this.handleRerunClose}
            />,
            <RaisedButton
                className="qa-DataPackOptions-RaisedButton-rerun"
                buttonStyle={{ backgroundColor: '#4598bf' }}
                label="Rerun"
                primary
                onTouchTap={this.handleRerun}
            />,
        ];
        const cloneExportActions = [
            <RaisedButton
                className="qa-DataPackOptions-RaisedButton-cloneCancel"
                style={{ marginRight: '10px' }}
                labelStyle={{ color: '#4598bf', fontWeight: 'bold' }}
                buttonStyle={{ backgroundColor: 'whitesmoke' }}
                disableTouchRipple
                label="Cancel"
                primary={false}
                onTouchTap={this.handleCloneClose}
            />,
            <RaisedButton
                className="qa-DataPackOptions-RaisedButton-clone"
                buttonStyle={{ backgroundColor: '#4598bf' }}
                label="Clone"
                primary
                onTouchTap={this.handleClone}
            />,
        ];

        return (
            <div>
                <RaisedButton
                    className="qa-DataPackOptions-RaisedButton-rerunExport"
                    style={{ margin: '10px' }}
                    disabled={this.props.rerunDisabled}
                    backgroundColor="rgba(226,226,226,0.5)"
                    disableTouchRipple
                    labelColor="#4598bf"
                    labelStyle={{ fontWeight: 'bold' }}
                    onTouchTap={this.handleRerunOpen}
                    label="RUN EXPORT AGAIN"
                />
                <BaseDialog
                    className="qa-DataPackOptions-BaseDialog-rerunExport"
                    show={this.state.showRerunDialog}
                    title="RERUN DATAPACK"
                    onClose={this.handleRerunClose}
                    actions={rerunExportActions}
                >
                    <strong>Are you sure you want to run this DataPack again?</strong>
                </BaseDialog>
                <RaisedButton
                    className="qa-DataPackOptions-RaisedButton-cloneExport"
                    style={{ margin: '10px' }}
                    backgroundColor="rgba(226,226,226,0.5)"
                    disableTouchRipple
                    labelColor="#4598bf"
                    labelStyle={{ fontWeight: 'bold' }}
                    onTouchTap={this.handleCloneOpen}
                    label="CLONE"
                />
                <BaseDialog
                    className="qa-DataPackOptions-BaseDialog-cloneExport"
                    show={this.state.showCloneDialog}
                    title="CLONE DATAPACK"
                    onClose={this.handleCloneClose}
                    actions={cloneExportActions}
                >
                    <strong>Are you sure you want to clone this DataPack?</strong>
                </BaseDialog>
                <RaisedButton
                    className="qa-DataPackOptions-RaisedButton-deleteExport"
                    style={{ margin: '10px' }}
                    backgroundColor="rgba(226,226,226,0.5)"
                    disableTouchRipple
                    labelColor="#ff0000"
                    labelStyle={{ fontWeight: 'bold' }}
                    onTouchTap={this.handleDeleteOpen}
                    label="DELETE"
                />
                <DeleteDialog
                    className="qa-DataPackOptions-DeleteDialog-deleteExport"
                    show={this.state.showDeleteDialog}
                    handleCancel={this.handleDeleteClose}
                    handleDelete={this.handleDelete}
                />
            </div>
        );
    }
}

DataPackOptions.defaultProps = {
    rerunDisabled: true,
};

DataPackOptions.propTypes = {
    rerunDisabled: PropTypes.bool,
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
