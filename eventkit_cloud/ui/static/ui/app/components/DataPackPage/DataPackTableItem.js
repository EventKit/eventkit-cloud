import React, { PropTypes, Component } from 'react';
import { Link, browserHistory } from 'react-router';
import { TableRow, TableRowColumn } from 'material-ui/Table';
import IconButton from 'material-ui/IconButton';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import AlertError from 'material-ui/svg-icons/alert/error';
import Lock from 'material-ui/svg-icons/action/lock-outline';
import SocialGroup from 'material-ui/svg-icons/social/group';
import NavigationMoreVert from 'material-ui/svg-icons/navigation/more-vert';
import NavigationCheck from 'material-ui/svg-icons/navigation/check';
import Star from 'material-ui/svg-icons/toggle/star';
import NotificationSync from 'material-ui/svg-icons/notification/sync';
import { List, ListItem } from 'material-ui/List';
import moment from 'moment';
import BaseDialog from '../Dialog/BaseDialog';
import DeleteDataPackDialog from '../Dialog/DeleteDataPackDialog';

export class DataPackTableItem extends Component {
    constructor(props) {
        super(props);
        this.showDeleteDialog = this.showDeleteDialog.bind(this);
        this.hideDeleteDialog = this.hideDeleteDialog.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
        this.state = {
            providerDescs: {},
            providerDialogOpen: false,
            deleteDialogOpen: false,
        };
    }

    getOwnerText(run, user) {
        return run.user === user ? 'My DataPack' : run.user;
    }

    getPermissionsIcon(visibility) {
        return visibility !== 'PRIVATE' ?
            <SocialGroup
                className="qa-DataPackTableItem-SocialGroup"
                style={{ color: 'bcdfbb' }}
            />
            :
            <Lock
                className="qa-DataPackTableItem-Lock"
                style={{ color: 'grey' }}
            />;
    }

    getStatusIcon(status) {
        if (status === 'SUBMITTED') {
            return <NotificationSync className="qa-DataPackTableItem-NotificationSync" style={{ color: '#f4d225' }} />;
        } else if (status === 'INCOMPLETE') {
            return <AlertError className="qa-DataPackTableItem-AlertError" style={{ color: '#ce4427', opacity: '0.6', height: '22px' }} />;
        }
        return <NavigationCheck className="qa-DataPackTableItem-NavigationCheck" style={{ color: '#bcdfbb', height: '22px' }} />;
    }

    handleProviderClose() {
        this.setState({ providerDialogOpen: false });
    }

    handleProviderOpen(runProviders) {
        const providerDesc = {};
        runProviders.forEach((runProvider) => {
            const a = this.props.providers.find(x => x.slug === runProvider.slug);
            providerDesc[a.name] = a.service_description;
        });
        this.setState({ providerDescs: providerDesc, providerDialogOpen: true });
    }

    showDeleteDialog() {
        this.setState({ deleteDialogOpen: true });
    }

    hideDeleteDialog() {
        this.setState({ deleteDialogOpen: false });
    }

    handleDelete() {
        this.hideDeleteDialog();
        this.props.onRunDelete(this.props.run.uid);
    }

    render() {
        const runProviders = this.props.run.provider_tasks.filter((provider) => {
            return provider.display !== false;
        });

        const providersList = Object.entries(this.state.providerDescs).map(([key, value], ix) => {
            return (
                <ListItem
                    className="qa-DataPackTableItem-ListItem-providerDescs"
                    key={key}
                    style={{ backgroundColor: ix % 2 === 0 ? 'whitesmoke' : 'white', fontWeight: 'bold', width: '100%', zIndex: 0 }}
                    nestedListStyle={{ padding: '0px' }}
                    primaryText={key}
                    initiallyOpen={false}
                    primaryTogglesNestedList={false}
                    nestedItems={[
                        <ListItem
                            key={1}
                            primaryText={<div style={{ whiteSpace: 'pre-wrap', fontWeight: 'bold' }}>{value}</div>}
                            style={{ backgroundColor: ix % 2 === 0 ? 'whitesmoke' : 'white', fontSize: '14px', width: '100%', zIndex: 0 }}
                        />,
                    ]}
                />

            );
        });

        const styles = {
            nameColumn: {
                padding: '0px 0px 0px 10px',
                textAlign: 'left',
                color: '#4598bf',
            },
            eventColumn: {
                padding: '0px 0px 0px 10px',
                textAlign: 'left',
                color: 'grey',
            },
            startedColumn: {
                width: '98px',
                padding: '0px 0px 0px 10px',
                textAlign: 'left',
                color: 'grey',
            },
            statusColumn: {
                width: '65px',
                padding: '0px 0px 0px 0px',
                textAlign: 'center',
            },
            permissionsColumn: {
                width: '100px',
                padding: '0px 0px 0px 0px',
                textAlign: 'center',
            },
            ownerColumn: {
                padding: '0px 0px 0px 10px',
                textAlign: 'left',
            },
            featuredColumn: {
                padding: '0px 0px 0px 10px',
                width: '80px',
                textAlign: 'center',
            },
            optionsColumn: {
                paddingRight: '10px',
                padding: '0px',
                width: '35px',
            },
            dropDownIcon: {
                padding: '0px',
                width: '20px',
                verticalAlign: 'middle',
            },
        };

        return (
            <TableRow className="qa-DataPackTableItem-TableRow">
                <TableRowColumn
                    className="qa-DataPackTableItem-TableRowColumn-jobLink"
                    style={styles.nameColumn}
                >
                    <Link
                        to={`/status/${this.props.run.job.uid}`}
                        href={`/status/${this.props.run.job.uid}`}
                        style={{ color: 'inherit' }}
                    >
                        {this.props.run.job.name}
                    </Link>
                </TableRowColumn>
                <TableRowColumn
                    className="qa-DataPackTableItem-TableRowColumn-event"
                    style={styles.eventColumn}
                >
                    {this.props.run.job.event}
                </TableRowColumn>
                <TableRowColumn
                    className="qa-DataPackTableItem-TableRowColumn-started"
                    style={styles.startedColumn}
                >
                    {moment(this.props.run.started_at).format('YYYY-MM-DD')}
                </TableRowColumn>
                <TableRowColumn
                    className="qa-DataPackTableItem-TableRowColumn-status"
                    style={styles.statusColumn}
                >
                    {this.getStatusIcon(this.props.run.status)}
                </TableRowColumn>
                <TableRowColumn
                    className="qa-DataPackTableItem-TableRowColumn-published"
                    style={styles.permissionsColumn}
                >
                    {this.getPermissionsIcon(this.props.run.job.permissions.value)}
                </TableRowColumn>
                <TableRowColumn
                    className="qa-DataPackTableItem-TableRowColumn-owner"
                    style={styles.ownerColumn}
                >
                    {this.getOwnerText(this.props.run, this.props.user.data.user.username)}
                </TableRowColumn>
                <TableRowColumn
                    className="qa-DataPackTableItem-TableRowColumn-featured"
                    style={styles.featuredColumn}
                >
                    {this.props.run.job.featured ? <Star style={{ fill: 'grey' }} /> : null}
                </TableRowColumn>
                <TableRowColumn
                    className="qa-DataPackTableItem-TableRowColumn-iconMenu"
                    style={styles.optionsColumn}
                >
                    <IconMenu
                        iconButtonElement={
                            <IconButton
                                className="qa-DataPackTableItem-IconMenu"
                                style={styles.dropDownIcon}
                                iconStyle={{ color: '#4598bf' }}
                            >
                                <NavigationMoreVert className="qa-DataPackTableItem-NavigationMoreVert" />
                            </IconButton>}
                        anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
                        targetOrigin={{ horizontal: 'right', vertical: 'top' }}
                    >
                        <MenuItem
                            className="qa-DataPackTableItem-MenuItem-statusDownloadLink"
                            style={{ fontSize: '12px' }}
                            primaryText="Go to Status & Download"
                            onClick={() => { browserHistory.push(`/status/${this.props.run.job.uid}`); }}
                        />
                        <MenuItem
                            className="qa-DataPackTableItem-MenuItem-viewDataSources"
                            style={{ fontSize: '12px' }}
                            primaryText="View Data Sources"
                            onClick={this.handleProviderOpen.bind(this, runProviders)}
                        />
                        { this.props.adminPermissions ?
                            [
                                <MenuItem
                                    key="delete"
                                    className="qa-DataPackTableItem-MenuItem-deleteExport"
                                    style={{ fontSize: '12px' }}
                                    primaryText="Delete Export"
                                    onClick={this.showDeleteDialog}
                                />,
                                <MenuItem
                                    key="share"
                                    className="qa-DataPackTableItem-MenuItem-share"
                                    style={{ fontSize: '12px' }}
                                    primaryText="Share"
                                    onClick={() => this.props.openShare(this.props.run)}
                                />,
                            ]
                            :
                            null
                        }
                    </IconMenu>
                    <BaseDialog
                        className="qa-DataPackTableItem-BaseDialog"
                        show={this.state.providerDialogOpen}
                        title="DATA SOURCES"
                        onClose={this.handleProviderClose.bind(this)}
                    >
                        <List className="qa-DataPackTableItem-List-dataSources">{providersList}</List>
                    </BaseDialog>
                    <DeleteDataPackDialog
                        className="qa-DataPackTableItem-DeleteDialog"
                        show={this.state.deleteDialogOpen}
                        onCancel={this.hideDeleteDialog}
                        onDelete={this.handleDelete}
                    />
                </TableRowColumn>
            </TableRow>
        );
    }
}

DataPackTableItem.propTypes = {
    run: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired,
    onRunDelete: PropTypes.func.isRequired,
    providers: PropTypes.array.isRequired,
    openShare: PropTypes.func.isRequired,
    adminPermissions: PropTypes.bool.isRequired,
};

export default DataPackTableItem;

