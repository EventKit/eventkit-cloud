import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Info from '@material-ui/icons/Info';
import CustomTableRow from '../CustomTableRow';
import BaseDialog from '../Dialog/BaseDialog';

export class DataCartGeneralTable extends Component {
    constructor(props) {
        super(props);
        this.handleProviderOpen = this.handleProviderOpen.bind(this);
        this.handleProviderClose = this.handleProviderClose.bind(this);
        this.handleProjectionsOpen = this.handleProjectionsOpen.bind(this);
        this.handleProjectionsClose = this.handleProjectionsClose.bind(this);
        this.state = {
            providerName: '',
            providerDescription: '',
            providerDialogOpen: false,
            projectionsDialogOpen: false,
        };
    }

    handleProviderClose() {
        this.setState({ providerDialogOpen: false });
    }

    handleProviderOpen(runProviders) {
        const propsProvider = this.props.providers.find(x => x.slug === runProviders.slug);
        const providerDescription = propsProvider.service_description.toString();
        const providerName = propsProvider.name.toString();
        this.setState({ providerDescription, providerName, providerDialogOpen: true });
    }

    handleProjectionsClose() {
        this.setState({ projectionsDialogOpen: false });
    }

    handleProjectionsOpen() {
        this.setState({ projectionsDialogOpen: true });
    }

    render() {
        const providerTasks = this.props.dataPack.provider_tasks.filter(task => (
            task.display
        ));

        const styles = {
            tableRowInfoIcon: {
                marginLeft: '5px',
                height: '18px',
                width: '18px',
                cursor: 'pointer',
                display: 'inlineBlock',
                fill: '#4598bf',
                verticalAlign: 'middle',
                marginRight: '10px',
            },
        };

        return (
            <div className="qa-DataPackGeneralTable">
                <CustomTableRow
                    className="qa-DataPackGeneralTable-description"
                    title="Description"
                    data={this.props.dataPack.job.description}
                />
                <CustomTableRow
                    className="qa-DataPackGeneralTable-project"
                    title="Project / Category"
                    data={this.props.dataPack.job.event}
                />
                <CustomTableRow
                    className="qa-DataPackGeneralTable-sources"
                    title="Data Sources"
                    dataStyle={{ flexWrap: 'wrap', padding: '5px 10px 5px', display: 'grid' }}
                    data={
                        providerTasks.map(providerTask => (
                            <div key={providerTask.name} style={{ margin: '5px 0px' }}>
                                {providerTask.name}
                                <Info
                                    className="qa-DataPackGeneralTable-Info-source"
                                    onClick={() => this.handleProviderOpen(providerTask)}
                                    key={providerTask.description}
                                    style={styles.tableRowInfoIcon}
                                />
                                <BaseDialog
                                    className="qa-DataPackGeneralTable-BaseDialog-source"
                                    show={this.state.providerDialogOpen}
                                    title={this.state.providerName}
                                    onClose={this.handleProviderClose}
                                >
                                    <div style={{ paddingTop: '20px', wordWrap: 'break-word' }}>
                                        {this.state.providerDescription}
                                    </div>
                                </BaseDialog>
                            </div>
                        ))
                    }
                />
                <CustomTableRow
                    className="qa-DataPackGeneralTable-projection"
                    title="Projection"
                    data={
                        <div>
                            EPSG:4326 - World Geodetic System 1984 (WGS84)
                            <Info
                                className="qa-DataPackGeneralTable-projection-icon"
                                onClick={this.handleProjectionsOpen}
                                style={styles.tableRowInfoIcon}
                            />
                            <BaseDialog
                                className="qa-DataCartGeneralTable-BaseDialog-projection"
                                show={this.state.projectionsDialogOpen}
                                title="Projection Information"
                                onClose={this.handleProjectionsClose}
                            >
                                <div style={{ paddingBottom: '10px', wordWrap: 'break-word' }}>
                                    All geospatial data provided by EventKit are in the
                                        World Geodetic System 1984 (WGS 84)projection.
                                        This projection is also commonly known by its EPSG code: 4326.
                                        Additional projection support will be added in subsequent versions.
                                </div>
                            </BaseDialog>
                        </div>
                    }
                />
            </div>
        );
    }
}

DataCartGeneralTable.propTypes = {
    dataPack: PropTypes.shape({
        job: PropTypes.shape({
            description: PropTypes.string,
            event: PropTypes.string,
            formats: PropTypes.arrayOf(PropTypes.string),
        }),
        provider_tasks: PropTypes.arrayOf(PropTypes.object),
    }).isRequired,
    providers: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default DataCartGeneralTable;
