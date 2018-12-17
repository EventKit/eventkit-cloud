import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withTheme } from '@material-ui/core/styles';
import moment from 'moment';
import { Link, browserHistory } from 'react-router';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import MenuItem from '@material-ui/core/MenuItem';
import SocialGroup from '@material-ui/icons/Group';
import Lock from '@material-ui/icons/LockOutlined';
import NotificationSync from '@material-ui/icons/Sync';
import NavigationCheck from '@material-ui/icons/Check';
import AlertError from '@material-ui/icons/Error';
import IconMenu from '../common/IconMenu';
import DeleteDataPackDialog from '../Dialog/DeleteDataPackDialog';
import ProviderDialog from '../Dialog/ProviderDialog';
import FeaturedFlag from './FeaturedFlag';
import DataPackShareDialog from '../DataPackShareDialog/DataPackShareDialog';
import { makeFullRunSelector } from '../../selectors/runSelector';

export class DataPackListItem extends Component {
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
            providerDialogOpen: false,
            deleteDialogOpen: false,
            shareDialogOpen: false,
        };
    }

    handleProviderClose() {
        this.setState({ providerDialogOpen: false });
    }

    handleProviderOpen() {
        this.setState({
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
        const subtitleFontSize = 12;

        const styles = {
            gridItem: {
                position: 'relative',
                ...this.props.style,
            },
            card: {
                backgroundColor: this.props.backgroundColor || colors.secondary,
                borderRadius: '0px',
                borderTop: `${colors.grey} 1px solid`,
                paddingBottom: '0px',
                position: 'relative',
            },
            cardTitle: {
                wordWrap: 'break-word',
                display: 'block',
                padding: '8px 15px 15px',
            },
            cardTitleFeatured: {
                wordWrap: 'break-word',
                padding: '15px',
            },
            completeIcon: {
                height: '18px',
                float: 'right',
                color: colors.success,
                opacity: '0.6',
            },
            errorIcon: {
                height: '18px',
                float: 'right',
                color: colors.warning,
                opacity: '0.6',
            },
            runningIcon: {
                height: '18px',
                float: 'right',
                color: colors.running,
            },
            unpublishedIcon: {
                height: '18px',
                float: 'right',
                color: colors.grey,
                marginRight: '5px',
            },
            publishedIcon: {
                height: '18px',
                float: 'right',
                color: colors.grey,
                marginRight: '5px',
            },
            ownerLabel: {
                float: 'right',
                color: colors.grey,
            },
            eventText: {
                height: '18px',
                lineHeight: '18px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
            },
            title: {
                display: 'inline-block',
                width: 'calc(100% - 36px)',
                height: '36px',
                lineHeight: '36px',
                fontSize: '21px',
                color: colors.primary,
            },
            titleLink: {
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
            <div style={styles.gridItem}>
                <Card
                    className="qa-DataPackListItem-Card"
                    style={styles.card}
                    key={this.props.run.uid}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    onClick={onClick}
                >
                    <FeaturedFlag show={this.props.run.job.featured} style={{ top: 0, right: 0 }} />
                    <CardHeader
                        className="qa-DataPackListItem-CardTitle"
                        style={cardTitleStyle}
                        title={
                            <div>
                                <div style={styles.title}>
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
                                >
                                    <MenuItem
                                        key="link"
                                        className="qa-DataPackListItem-MenuItem-statusDownloadLink"
                                        style={{ fontSize: subtitleFontSize }}
                                        onClick={() => { browserHistory.push(`/status/${this.props.run.job.uid}`); }}
                                    >
                                        Status & Download
                                    </MenuItem>
                                    <MenuItem
                                        key="sources"
                                        className="qa-DataPackListItem-MenuItem-viewDataSources"
                                        style={{ fontSize: subtitleFontSize }}
                                        onClick={this.handleProviderOpen}
                                    >
                                        View Data Sources
                                    </MenuItem>

                                    {this.props.run.job.relationship === 'ADMIN' ?
                                        <MenuItem
                                            key="delete"
                                            className="qa-DataPackListItem-MenuItem-deleteExport"
                                            style={{ fontSize: subtitleFontSize }}
                                            onClick={this.showDeleteDialog}
                                        >
                                            Delete Export
                                        </MenuItem>
                                        : null
                                    }
                                    {this.props.run.job.relationship === 'ADMIN' ?
                                        <MenuItem
                                            key="share"
                                            className="qa-DataPackListItem-MenuItem-share"
                                            style={{ fontSize: subtitleFontSize }}
                                            onClick={this.handleShareOpen}
                                        >
                                            Share
                                        </MenuItem>
                                        : null
                                    }
                                </IconMenu>
                                <ProviderDialog
                                    open={this.state.providerDialogOpen}
                                    uids={this.props.run.provider_tasks}
                                    providers={this.props.providers}
                                    onClose={this.handleProviderClose}
                                />
                                <DeleteDataPackDialog
                                    className="qa-DataPackListItem-DeleteDialog"
                                    show={this.state.deleteDialogOpen}
                                    onCancel={this.hideDeleteDialog}
                                    onDelete={this.handleDelete}
                                />
                            </div>
                        }
                        subheader={
                            <div style={{ fontSize: '12px' }}>
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
                        permissions={this.props.run.job.permissions}
                        groupsText="You may share view and edit rights with groups exclusively.
                            Group sharing is managed separately from member sharing."
                        membersText="You may share view and edit rights with members exclusively.
                            Member sharing is managed separately from group sharing."
                        canUpdateAdmin
                        warnPublic
                    />
                </Card>
            </div>
        );
    }
}

DataPackListItem.defaultProps = {
    onHoverStart: undefined,
    onHoverEnd: undefined,
    onClick: undefined,
    backgroundColor: undefined,
    style: {},
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
    style: PropTypes.object,
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

export default withTheme()(connect(makeMapStateToProps)(DataPackListItem));
