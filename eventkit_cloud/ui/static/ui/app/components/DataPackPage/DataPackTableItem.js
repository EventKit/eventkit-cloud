import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withTheme } from '@material-ui/core/styles';
import { Link, browserHistory } from 'react-router';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import MenuItem from '@material-ui/core/MenuItem';
import AlertError from '@material-ui/icons/Error';
import Lock from '@material-ui/icons/LockOutlined';
import SocialGroup from '@material-ui/icons/Group';
import NavigationCheck from '@material-ui/icons/Check';
import Star from '@material-ui/icons/Star';
import NotificationSync from '@material-ui/icons/Sync';
import List from '@material-ui/core/List';
import moment from 'moment';
import { userIsDataPackAdmin } from '../../utils/generic';
import IconMenu from '../common/IconMenu';
import DropDownListItem from '../common/DropDownListItem';
import BaseDialog from '../Dialog/BaseDialog';
import DeleteDataPackDialog from '../Dialog/DeleteDataPackDialog';
import DataPackShareDialog from '../DataPackShareDialog/DataPackShareDialog';
import { makeFullRunSelector } from '../../selectors/runSelector';

export class DataPackTableItem extends Component {
    constructor(props) {
        super(props);
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
        };
    }

    getOwnerText(run, user) {
        return run.user === user ? 'My DataPack' : run.user;
    }

    getPermissionsIcon(visibility) {
        const { colors } = this.props.theme.eventkit;

        return visibility !== 'PRIVATE' ?
            <SocialGroup
                className="qa-DataPackTableItem-SocialGroup"
                style={{ color: colors.success }}
            />
            :
            <Lock
                className="qa-DataPackTableItem-Lock"
                style={{ color: colors.grey }}
            />;
    }

    getStatusIcon(status) {
        const { colors } = this.props.theme.eventkit;
        if (status === 'SUBMITTED') {
            return <NotificationSync className="qa-DataPackTableItem-NotificationSync" style={{ color: colors.running }} />;
        } else if (status === 'INCOMPLETE') {
            return (
                <AlertError className="qa-DataPackTableItem-AlertError" style={{ color: colors.warning, opacity: '0.6', height: '22px' }} />
            );
        }
        return <NavigationCheck className="qa-DataPackTableItem-NavigationCheck" style={{ color: colors.success, height: '22px' }} />;
    }

    handleMenuButtonClick(e) {
        e.stopPropagation();
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
            providerDescs: providerDesc,
            providerDialogOpen: true,
        });
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

    handleShareOpen() {
        this.setState({ shareDialogOpen: true });
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
        const { colors } = this.props.theme.eventkit;
        const runProviders = this.props.run.provider_tasks.filter(provider => provider.display);
        const styles = {
            nameColumn: {
                padding: '0px 0px 0px 10px',
                textAlign: 'left',
                color: colors.primary,
                wordBreak: 'break-word',
            },
            eventColumn: {
                padding: '0px 0px 0px 10px',
                textAlign: 'left',
                color: colors.grey,
                wordBreak: 'break-word',
            },
            startedColumn: {
                width: '98px',
                padding: '0px 0px 0px 10px',
                textAlign: 'left',
                color: colors.grey,
            },
            statusColumn: {
                width: '70px',
                padding: '0px 0px 0px 10px',
                textAlign: 'center',
            },
            permissionsColumn: {
                width: '102px',
                padding: '0px 0px 0px 10px',
                textAlign: 'center',
            },
            ownerColumn: {
                padding: '0px 0px 0px 10px',
                textAlign: 'left',
                color: colors.grey,
                wordBreak: 'break-word',
            },
            featuredColumn: {
                padding: '0px 0px 0px 10px',
                width: '82px',
                textAlign: 'center',
            },
            optionsColumn: {
                padding: '0px',
                width: '35px',
            },
        };

        const adminPermissions = userIsDataPackAdmin(this.props.user.data.user, this.props.run.job.permissions, this.props.groups);

        return (
            <TableRow className="qa-DataPackTableItem-TableRow">
                <TableCell
                    className="qa-DataPackTableItem-TableCell-jobLink"
                    style={styles.nameColumn}
                >
                    <Link
                        to={`/status/${this.props.run.job.uid}`}
                        href={`/status/${this.props.run.job.uid}`}
                        style={{ color: 'inherit' }}
                    >
                        {this.props.run.job.name}
                    </Link>
                </TableCell>
                <TableCell
                    className="qa-DataPackTableItem-TableCell-event"
                    style={styles.eventColumn}
                >
                    {this.props.run.job.event}
                </TableCell>
                <TableCell
                    className="qa-DataPackTableItem-TableCell-started"
                    style={styles.startedColumn}
                >
                    {moment(this.props.run.started_at).format('M/D/YY')}
                </TableCell>
                <TableCell
                    className="qa-DataPackTableItem-TableCell-status tour-datapack-status"
                    style={styles.statusColumn}
                >
                    {this.getStatusIcon(this.props.run.status)}
                </TableCell>
                <TableCell
                    className="qa-DataPackTableItem-TableCell-published"
                    style={styles.permissionsColumn}
                >
                    {this.getPermissionsIcon(this.props.run.job.permissions.value)}
                </TableCell>
                <TableCell
                    className="qa-DataPackTableItem-TableCell-owner"
                    style={styles.ownerColumn}
                >
                    {this.getOwnerText(this.props.run, this.props.user.data.user.username)}
                </TableCell>
                <TableCell
                    className="qa-DataPackTableItem-TableCell-featured tour-datapack-featured"
                    style={styles.featuredColumn}
                >
                    {this.props.run.job.featured ? <Star style={{ fill: colors.grey }} /> : null}
                </TableCell>
                <TableCell
                    className="qa-DataPackTableItem-TableCell-iconMenu tour-datapack-options"
                    style={styles.optionsColumn}
                >
                    <IconMenu
                        className="qa-DataPackTableItem-IconMenu"
                        style={{ width: '30px', height: '30px' }}
                    >
                        <MenuItem
                            key="download"
                            className="qa-DataPackTableItem-MenuItem-statusDownloadLink"
                            style={{ fontSize: '12px' }}
                            onClick={() => { browserHistory.push(`/status/${this.props.run.job.uid}`); }}
                        >
                            Status & Download
                        </MenuItem>
                        <MenuItem
                            key="sources"
                            className="qa-DataPackTableItem-MenuItem-viewDataSources"
                            style={{ fontSize: '12px' }}
                            onClick={() => this.handleProviderOpen(runProviders)}
                        >
                            View Data Sources
                        </MenuItem>
                        {adminPermissions ?
                            <MenuItem
                                key="delete"
                                className="qa-DataPackTableItem-MenuItem-deleteExport"
                                style={{ fontSize: '12px' }}
                                onClick={this.showDeleteDialog}
                            >
                                Delete Export
                            </MenuItem>
                            : null
                        }
                        {adminPermissions ?
                            <MenuItem
                                key="share"
                                className="qa-DataPackTableItem-MenuItem-share"
                                style={{ fontSize: '12px' }}
                                onClick={this.handleShareOpen}
                            >
                                Share
                            </MenuItem>
                            : null
                        }
                    </IconMenu>
                    <BaseDialog
                        className="qa-DataPackTableItem-BaseDialog"
                        show={this.state.providerDialogOpen}
                        title="DATA SOURCES"
                        onClose={this.handleProviderClose}
                    >
                        <List className="qa-DataPackTableItem-List-dataSources">
                            {Object.entries(this.state.providerDescs).map(([key, value], ix) => (
                                <DropDownListItem
                                    title={key}
                                    key={key}
                                    alt={ix % 2 !== 0}
                                >
                                    {value}
                                </DropDownListItem>
                            ))}
                        </List>
                    </BaseDialog>
                    <DeleteDataPackDialog
                        className="qa-DataPackTableItem-DeleteDialog"
                        show={this.state.deleteDialogOpen}
                        onCancel={this.hideDeleteDialog}
                        onDelete={this.handleDelete}
                    />
                </TableCell>
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
    users: PropTypes.arrayOf(PropTypes.object).isRequired,
    groups: PropTypes.arrayOf(PropTypes.object).isRequired,
    theme: PropTypes.object.isRequired,
};

const makeMapStateToProps = () => {
    const getFullRun = makeFullRunSelector();
    const mapStateToProps = (state, props) => (
        {
            run: getFullRun(state, props),
        }
    );
    return mapStateToProps;
};

export default withTheme()(connect(makeMapStateToProps)(DataPackTableItem));
