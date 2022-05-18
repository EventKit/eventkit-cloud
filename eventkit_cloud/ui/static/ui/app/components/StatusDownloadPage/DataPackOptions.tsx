import { Component } from 'react';
import Button from '@material-ui/core/Button';
import BaseDialog from '../Dialog/BaseDialog';
import DeleteDataPackDialog from '../Dialog/DeleteDataPackDialog';
import {arrayHasValue} from "../../utils/generic";
import {MatomoClickTracker} from "../MatomoHandler";

export interface Props {
    adminPermissions: boolean;
    onRerun: (uid: string) => void;
    onClone: (cartDetails: Eventkit.FullRun, providerArray: Eventkit.Provider[],
              exportOptions: Eventkit.Map<Eventkit.Store.ProviderExportOptions>,
              providerInfo: Eventkit.Map<Eventkit.Store.ProviderInfo>
    ) => void;
    onDelete: (uid: string) => void;
    dataPack: Eventkit.FullRun;
    job: Eventkit.Job;
    providers: Eventkit.Provider[];
}

export interface State {
    showDeleteDialog: boolean;
    showRerunDialog: boolean;
    showCloneDialog: boolean;
}

export class DataPackOptions extends Component<Props, State> {
    static defaultProps = {
        adminPermissions: false,
    };

    constructor(props: Props) {
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

    private handleDeleteOpen() {
        this.setState({showDeleteDialog: true});
    }

    private handleDeleteClose() {
        this.setState({showDeleteDialog: false});
    }

    private handleRerunOpen() {
        this.setState({showRerunDialog: true});
    }

    private handleRerunClose() {
        this.setState({showRerunDialog: false});
    }

    private handleCloneOpen() {
        this.setState({showCloneDialog: true});
    }

    private handleCloneClose() {
        this.setState({showCloneDialog: false});
    }

    private handleDelete() {
        this.props.onDelete(this.props.dataPack.uid);
        this.setState({showDeleteDialog: false});
    }

    private handleRerun() {
        this.props.onRerun(this.props.dataPack.job.uid);
        this.setState({showRerunDialog: false});
    }

    private handleClone() {
        const providerArray = [];
        const exportOptions = {};
        const providerInfo = {};
        let supportedFormats = null;
        this.props.dataPack.provider_tasks.forEach((providerTask) => {
            // Strictly speaking, any hidden provider SHOULD always be parked with `display: false`
            // But the check is still included for an abundance of caution.
            if (providerTask.display === true && !providerTask.hidden) {
                // Map the provider task to its Provider to ensure we have all needed data for the Provider.
                const provider = this.props.providers.find(provider => provider.slug === providerTask.provider.slug);
                // Cannot clone a provider without the full set of info.
                // We *shouldn't* have a hidden provider as we filter out hidden provider tasks, but check for caution.
                if (!provider || !provider.display || provider.hidden) {
                    return;
                }
                const dataProviderTask = this.props.job.provider_tasks.find((jobProviderTask) =>
                    // Currently `provider` is the provider name
                    // The backend should be updated in the future to make it point to a uuid or the slug
                    // this change will need to happen here as well
                    providerTask.name === jobProviderTask.provider
                );
                if (!!dataProviderTask) {
                    supportedFormats = dataProviderTask.formats.filter(slug =>
                        arrayHasValue(provider.supported_formats.map((format: Eventkit.Format) => format.slug), slug)
                    );
                    exportOptions[provider.slug] = {
                        minZoom: (dataProviderTask.min_zoom) ? dataProviderTask.min_zoom : provider.level_from,
                        maxZoom: (dataProviderTask.max_zoom <= provider.level_to) ? dataProviderTask.max_zoom : provider.level_to,
                        formats: supportedFormats
                    }
                }
                // Cannot clone a provider without the full set of info.
                providerArray.push(provider);
            }
        });
        this.props.onClone(this.props.dataPack, providerArray, exportOptions, providerInfo);
        this.setState({showCloneDialog: false});
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
                style={{marginRight: '10px'}}
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
                style={{marginRight: '10px'}}
                variant="contained"
                color="secondary"
                onClick={this.handleCloneClose}
            >
                Cancel
            </Button>,
        ];

        return (
            <div>
                <MatomoClickTracker
                    eventAction="Rerun Export"
                    eventName={`Rerun ${this?.props?.job?.name}`}
                    eventCategory="Status and Download"
                    eventValue={2}
                >
                    <Button
                        className="qa-DataPackOptions-RaisedButton-rerunExport"
                        style={{margin: '10px', fontWeight: 'bold'}}
                        variant="contained"
                        color="secondary"
                        disabled={!this.props.adminPermissions}
                        onClick={this.handleRerunOpen}
                    >
                        RUN EXPORT AGAIN
                    </Button>
                </MatomoClickTracker>
                <BaseDialog
                    className="qa-DataPackOptions-BaseDialog-rerunExport"
                    show={this.state.showRerunDialog}
                    title="RERUN DATAPACK"
                    onClose={this.handleRerunClose}
                    actions={rerunExportActions}
                >
                    <strong>Are you sure you want to run this DataPack again?</strong>
                </BaseDialog>
                <MatomoClickTracker
                    eventAction="Clone Export"
                    eventName={`Clone ${this.props?.job?.name}`}
                    eventCategory="Status and Download"
                >
                    <Button
                        className="qa-DataPackOptions-RaisedButton-cloneExport"
                        style={{margin: '10px', fontWeight: 'bold'}}
                        variant="contained"
                        color="secondary"
                        onClick={this.handleCloneOpen}
                    >
                        CLONE
                    </Button>
                </MatomoClickTracker>
                <BaseDialog
                    className="qa-DataPackOptions-BaseDialog-cloneExport"
                    show={this.state.showCloneDialog}
                    title="CLONE DATAPACK"
                    onClose={this.handleCloneClose}
                    actions={cloneExportActions}
                >
                    <strong>Are you sure you want to clone this DataPack?</strong>
                </BaseDialog>
                <MatomoClickTracker
                    eventAction="Delete Export"
                    eventName={`Delete ${this.props?.job?.name}`}
                    eventCategory="Status and Download"
                >
                    <Button
                        className="qa-DataPackOptions-RaisedButton-deleteExport"
                        style={{margin: '10px', color: '#ff0000', fontWeight: 'bold'}}
                        variant="contained"
                        color="secondary"
                        disabled={!this.props.adminPermissions}
                        onClick={this.handleDeleteOpen}
                    >
                        DELETE
                    </Button>
                </MatomoClickTracker>
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

export default DataPackOptions;