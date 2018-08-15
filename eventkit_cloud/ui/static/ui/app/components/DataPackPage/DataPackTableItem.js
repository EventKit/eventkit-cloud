import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Link, browserHistory } from 'react-router';
import { TableRow, TableRowColumn } from 'material-ui/Table';
import IconButton from 'material-ui/IconButton';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import AlertError from '@material-ui/icons/Error';
import Lock from '@material-ui/icons/LockOutlined';
import SocialGroup from '@material-ui/icons/Group';
import NavigationMoreVert from '@material-ui/icons/MoreVert';
import NavigationCheck from '@material-ui/icons/Check';
import Star from '@material-ui/icons/Star';
import NotificationSync from '@material-ui/icons/Sync';
import { List, ListItem } from 'material-ui/List';
import moment from 'moment';
import BaseDialog from '../Dialog/BaseDialog';
import DeleteDataPackDialog from '../Dialog/DeleteDataPackDialog';
import DataPackShareDialog from '../DataPackShareDialog/DataPackShareDialog';

export class DataPackTableItem extends Component {
    constructor(props) {
        super(props);
        this.handleMenuChange = this.handleMenuChange.bind(this);
        this.handleProviderOpen = this.handleProviderOpen.bind(this);
        this.handleProviderClose = this.handleProviderClose.bind(this);
        this.showDeleteDialog = this.showDeleteDialog.bind(this);
        this.hideDeleteDialog = this.hideDeleteDialog.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
        this.handleShareOpen = this.handleShareOpen.bind(this);
        this.handleShareClose = this.handleShareClose.bind(this);
        this.handleShareSave = this.handleShareSave.bind(this);
        this.state = {
            providerDescs: {},
            providerDialogOpen: false,
            deleteDialogOpen: false,
            shareDialogOpen: false,
            menuOpen: false,
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

    handleMenuButtonClick(e) {
        e.stopPropagation();
    }

    handleMenuChange(menuOpen) {
        this.setState({ menuOpen });
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
        this.setState({
            menuOpen: false,
            providerDescs: providerDesc,
            providerDialogOpen: true,
        });
    }

    showDeleteDialog() {
        this.setState({
            menuOpen: false,
            deleteDialogOpen: true,
        });
    }

    hideDeleteDialog() {
        this.setState({ deleteDialogOpen: false });
    }

    handleDelete() {
        this.hideDeleteDialog();
        this.props.onRunDelete(this.props.run.uid);
    }

    handleShareOpen() {
        this.setState({
            menuOpen: false,
            shareDialogOpen: true,
        });
    }

    handleShareClose() {
        this.setState({ shareDialogOpen: false });
    }

    handleShareSave(perms) {
        this.handleShareClose();
        const permissions = { ...perms };
        this.props.onRunShare(this.props.run.job.uid, permissions);
    }

    render() {
        const runProviders = this.props.run.provider_tasks.filter(provider => provider.display);

        const providersList = Object.entries(this.state.providerDescs).map(([key, value], ix) => (
            <ListItem
                className="qa-DataPackTableItem-ListItem-providerDescs"
                key={key}
                style={{
                    backgroundColor: ix % 2 === 0 ? 'whitesmoke' : 'white', fontWeight: 'bold', width: '100%', zIndex: 0,
                }}
                nestedListStyle={{ padding: '0px' }}
                primaryText={key}
                initiallyOpen={false}
                primaryTogglesNestedList={false}
                nestedItems={[
                    <ListItem
                        key={1}
                        primaryText={<div style={{ whiteSpace: 'pre-wrap', fontWeight: 'bold' }}>{value}</div>}
                        style={{
                            backgroundColor: ix % 2 === 0 ? 'whitesmoke' : 'white', fontSize: '14px', width: '100%', zIndex: 0,
                        }}
                    />,
                ]}
            />
        ));

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
                    {moment(this.props.run.started_at).format('M/D/YY')}
                </TableRowColumn>
                <TableRowColumn
                    className="qa-DataPackTableItem-TableRowColumn-status tour-datapack-status"
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
                    className="qa-DataPackTableItem-TableRowColumn-featured tour-datapack-featured"
                    style={styles.featuredColumn}
                >
                    {this.props.run.job.featured ? <Star style={{ fill: 'grey' }} /> : null}
                </TableRowColumn>
                <TableRowColumn
                    className="qa-DataPackTableItem-TableRowColumn-iconMenu tour-datapack-options"
                    style={styles.optionsColumn}
                >
                    <IconMenu
                        className="qa-DataPackTableItem-IconMenu"
                        open={this.state.menuOpen}
                        iconButtonElement={
                            <IconButton
                                className="qa-DataPackTableItem-IconMenu"
                                style={styles.dropDownIcon}
                                iconStyle={{ color: '#4598bf' }}
                                onClick={this.handleMenuButtonClick}
                            >
                                <NavigationMoreVert className="qa-DataPackTableItem-NavigationMoreVert" />
                            </IconButton>}
                        anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
                        targetOrigin={{ horizontal: 'right', vertical: 'top' }}
                        onRequestChange={this.handleMenuChange}
                    >
                        <MenuItem
                            className="qa-DataPackTableItem-MenuItem-statusDownloadLink"
                            style={{ fontSize: '12px' }}
                            primaryText="Status & Download"
                            onClick={() => { browserHistory.push(`/status/${this.props.run.job.uid}`); }}
                        />
                        <MenuItem
                            className="qa-DataPackTableItem-MenuItem-viewDataSources"
                            style={{ fontSize: '12px' }}
                            primaryText="View Data Sources"
                            onClick={() => this.handleProviderOpen(runProviders)}
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
                                    onClick={this.handleShareOpen}
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
                        onClose={this.handleProviderClose}
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
                <DataPackShareDialog
                    show={this.state.shareDialogOpen}
                    onClose={this.handleShareClose}
                    onSave={this.handleShareSave}
                    user={this.props.user.data}
                    groups={this.props.groups}
                    members={this.props.users}
                    permissions={this.props.run.job.permissions}
                    groupsText="You may share view and edit rights with groups exclusively.
                        Group sharing is managed separately from member sharing."
                    membersText="You may share view and edit rights with members exclusively.
                        Member sharing is managed separately from group sharing."
                    canUpdateAdmin
                    warnPublic
                />
            </TableRow>
        );
    }
}

DataPackTableItem.propTypes = {
    run: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired,
    onRunDelete: PropTypes.func.isRequired,
    onRunShare: PropTypes.func.isRequired,
    providers: PropTypes.arrayOf(PropTypes.object).isRequired,
    adminPermissions: PropTypes.bool.isRequired,
    users: PropTypes.arrayOf(PropTypes.object).isRequired,
    groups: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default DataPackTableItem;

