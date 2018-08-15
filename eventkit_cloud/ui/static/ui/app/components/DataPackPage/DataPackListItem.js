import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Link, browserHistory } from 'react-router';
import { Card, CardTitle } from 'material-ui/Card';
import IconButton from 'material-ui/IconButton';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import moment from 'moment';
import NavigationMoreVert from '@material-ui/icons/MoreVert';
import SocialGroup from '@material-ui/icons/Group';
import Lock from '@material-ui/icons/LockOutlined';
import NotificationSync from '@material-ui/icons/Sync';
import NavigationCheck from '@material-ui/icons/Check';
import AlertError from '@material-ui/icons/Error';
import { List, ListItem } from 'material-ui/List';
import BaseDialog from '../Dialog/BaseDialog';
import DeleteDataPackDialog from '../Dialog/DeleteDataPackDialog';
import FeaturedFlag from './FeaturedFlag';
import DataPackShareDialog from '../DataPackShareDialog/DataPackShareDialog';

export class DataPackListItem extends Component {
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
                className="qa-DataPackListItem-ListItem"
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
                        className="qa-DataPackListItem-NestedListItem"
                        key={1}
                        primaryText={<div style={{ whiteSpace: 'pre-wrap', fontWeight: 'bold' }}>{value}</div>}
                        style={{
                            backgroundColor: ix % 2 === 0 ? 'whitesmoke' : 'white', fontSize: '14px', width: '100%', zIndex: 0,
                        }}
                    />,
                ]}
            />
        ));

        const width = window.innerWidth;
        const subtitleFontSize = width < 576 ? '10px' : '14px';

        const styles = {
            card: {
                backgroundColor: this.props.backgroundColor || '#f7f8f8',
                borderRadius: '0px',
                borderTop: 'grey 1px solid',
                paddingBottom: '0px',
                position: 'relative',
            },
            cardTitle: {
                wordWrap: 'break-word',
                padding: '8px 15px 15px',
            },
            cardTitleFeatured: {
                wordWrap: 'break-word',
                padding: '15px',
            },
            completeIcon: {
                height: '18px',
                float: 'right',
                color: '#bcdfbb',
                opacity: '0.6',
            },
            errorIcon: {
                height: '18px',
                float: 'right',
                color: '#ce4427',
                opacity: '0.6',
            },
            runningIcon: {
                height: '18px',
                float: 'right',
                color: '#f4D225',
            },
            unpublishedIcon: {
                height: '18px',
                float: 'right',
                color: 'grey',
                marginRight: '5px',
            },
            publishedIcon: {
                height: '18px',
                float: 'right',
                color: 'grey',
                marginRight: '5px',
            },
            ownerLabel: {
                float: 'right',
                color: 'grey',
            },
            eventText: {
                height: '18px',
                lineHeight: '18px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
            },
            titleLink: {
                height: '36px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
            },
        };

        const cardTitleStyle = (this.props.run.job.featured) ? styles.cardTitleFeatured : styles.cardTitle;
        const onMouseEnter = this.props.onHoverStart ? () => { this.props.onHoverStart(this.props.run.uid); } : null;
        const onMouseLeave = this.props.onHoverEnd ? () => { this.props.onHoverEnd(this.props.run.uid); } : null;
        const onClick = this.props.onClick ? () => { this.props.onClick(this.props.run.uid); } : null;

        let status = <NavigationCheck className="qa-DataPackListItem-NavigationCheck" style={styles.completeIcon} />;
        if (this.props.run.status === 'SUBMITTED') {
            status = <NotificationSync className="qa-DataPackListItem-NotificationSync" style={styles.runningIcon} />;
        } else if (this.props.run.status === 'INCOMPLETE') {
            status = <AlertError className="qa-DataPackListItem-AlertError" style={styles.errorIcon} />;
        }

        return (
            <Card
                className="qa-DataPackListItem-Card"
                style={styles.card}
                key={this.props.run.uid}
                containerStyle={{ padding: '0px' }}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                onClick={onClick}
            >
                <FeaturedFlag show={this.props.run.job.featured} />
                <CardTitle
                    className="qa-DataPackListItem-CardTitle"
                    titleColor="#4598bf"
                    style={cardTitleStyle}
                    titleStyle={{ fontSize: '21px', height: '36px' }}
                    subtitleStyle={{ fontSize: '12px' }}
                    title={
                        <div>
                            <div style={{ display: 'inline-block', width: 'calc(100% - 24px)', height: '36px' }}>
                                <div className="qa-DataPackListItem-titleLink" style={styles.titleLink}>
                                    <Link
                                        to={`/status/${this.props.run.job.uid}`}
                                        href={`/status/${this.props.run.job.uid}`}
                                        style={{ color: 'inherit' }}
                                    >
                                        {this.props.run.job.name}
                                    </Link>
                                </div>
                            </div>
                            <IconMenu
                                className="qa-DataPackListItem-IconMenu tour-datapack-options"
                                style={{ float: 'right', width: '24px', height: '100%' }}
                                open={this.state.menuOpen}
                                iconButtonElement={
                                    <IconButton
                                        className="qa-DataPackListItem-IconButton"
                                        style={{
                                            padding: '0px', width: '24px', height: '24px', verticalAlign: 'middle',
                                        }}
                                        iconStyle={{ color: '#4598bf' }}
                                        onClick={this.handleMenuButtonClick}
                                    >
                                        <NavigationMoreVert className="qa-DataPackListItem-NavigationMoreVert" />
                                    </IconButton>}
                                anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
                                targetOrigin={{ horizontal: 'right', vertical: 'top' }}
                                onRequestChange={this.handleMenuChange}
                            >
                                <MenuItem
                                    className="qa-DataPackListItem-MenuItem-statusDownloadLink"
                                    style={{ fontSize: subtitleFontSize }}
                                    primaryText="Status & Download"
                                    onClick={() => { browserHistory.push(`/status/${this.props.run.job.uid}`); }}
                                />
                                <MenuItem
                                    className="qa-DataPackListItem-MenuItem-viewDataSources"
                                    style={{ fontSize: subtitleFontSize }}
                                    primaryText="View Data Sources"
                                    onClick={() => this.handleProviderOpen(runProviders)}
                                />

                                {this.props.adminPermission ?
                                    [
                                        <MenuItem
                                            key="delete"
                                            className="qa-DataPackListItem-MenuItem-deleteExport"
                                            style={{ fontSize: subtitleFontSize }}
                                            primaryText="Delete Export"
                                            onClick={this.showDeleteDialog}
                                        />,
                                        <MenuItem
                                            key="share"
                                            className="qa-DataPackListItem-MenuItem-share"
                                            style={{ fontSize: subtitleFontSize }}
                                            primaryText="Share"
                                            onClick={this.handleShareOpen}
                                        />,
                                    ]
                                    :
                                    null
                                }
                            </IconMenu>
                            <BaseDialog
                                className="qa-DataPackListItem-BaseDialog"
                                show={this.state.providerDialogOpen}
                                title="DATA SOURCES"
                                onClose={this.handleProviderClose}
                            >
                                <List>{providersList}</List>
                            </BaseDialog>
                            <DeleteDataPackDialog
                                className="qa-DataPackListItem-DeleteDialog"
                                show={this.state.deleteDialogOpen}
                                onCancel={this.hideDeleteDialog}
                                onDelete={this.handleDelete}
                            />
                        </div>
                    }
                    subtitle={
                        <div>
                            <div className="qa-DataPackListItem-subtitle-event" style={styles.eventText}>
                                {`Event: ${this.props.run.job.event}`}
                            </div>
                            <div
                                className="qa-DataPackListItem-subtitle-date"
                                style={{ lineHeight: '18px', display: 'inline-block', width: '100%' }}
                            >
                                {`Added: ${moment(this.props.run.started_at).format('M/D/YY')}`}
                                {this.props.run.user === this.props.user.data.user.username ?
                                    <div style={styles.ownerLabel}>My DataPack</div>
                                    :
                                    <div style={styles.ownerLabel}>{this.props.run.user}</div>
                                }
                                <div
                                    className="qa-DataPackListItem-subtitle-status tour-datapack-status"
                                    style={{ display: 'inline-block', float: 'right' }}
                                >
                                    {this.props.run.job.permissions.value !== 'PRIVATE' ?
                                        <SocialGroup className="qa-DataPackListItem-SocialGroup" style={styles.publishedIcon} />
                                        :

                                        <Lock className="qa-DataPackListItem-Lock" style={styles.unpublishedIcon} />
                                    }
                                    {status}
                                </div>
                            </div>
                        </div>
                    }
                />
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
            </Card>
        );
    }
}

DataPackListItem.defaultProps = {
    onHoverStart: undefined,
    onHoverEnd: undefined,
    onClick: undefined,
    backgroundColor: undefined,
};

DataPackListItem.propTypes = {
    run: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired,
    onRunDelete: PropTypes.func.isRequired,
    onRunShare: PropTypes.func.isRequired,
    providers: PropTypes.arrayOf(PropTypes.object).isRequired,
    onHoverStart: PropTypes.func,
    onHoverEnd: PropTypes.func,
    onClick: PropTypes.func,
    backgroundColor: PropTypes.string,
    adminPermission: PropTypes.bool.isRequired,
    users: PropTypes.arrayOf(PropTypes.object).isRequired,
    groups: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default DataPackListItem;
