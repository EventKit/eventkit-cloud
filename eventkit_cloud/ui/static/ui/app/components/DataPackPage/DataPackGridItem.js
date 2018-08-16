import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Link, browserHistory } from 'react-router';
import { Card, CardActions, CardMedia, CardTitle, CardText } from 'material-ui/Card';
import IconButton from 'material-ui/IconButton';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import moment from 'moment';
import { List, ListItem } from 'material-ui/List';
import NavigationMoreVert from '@material-ui/icons/MoreVert';
import SocialGroup from '@material-ui/icons/Group';
import Lock from '@material-ui/icons/LockOutlined';
import NotificationSync from '@material-ui/icons/Sync';
import NavigationCheck from '@material-ui/icons/Check';
import AlertError from '@material-ui/icons/Error';
import isUndefined from 'lodash/isUndefined';

import Map from 'ol/map';
import View from 'ol/view';
import interaction from 'ol/interaction';
import VectorSource from 'ol/source/vector';
import XYZ from 'ol/source/xyz';
import GeoJSON from 'ol/format/geojson';
import VectorLayer from 'ol/layer/vector';
import Tile from 'ol/layer/tile';
import Attribution from 'ol/control/attribution';
import Zoom from 'ol/control/zoom';
import ScaleLine from 'ol/control/scaleline';

import BaseDialog from '../Dialog/BaseDialog';
import DeleteDataPackDialog from '../Dialog/DeleteDataPackDialog';
import FeaturedFlag from './FeaturedFlag';
import ol3mapCss from '../../styles/ol3map.css';
import DataPackShareDialog from '../DataPackShareDialog/DataPackShareDialog';

export class DataPackGridItem extends Component {
    constructor(props) {
        super(props);
        this.initMap = this.initMap.bind(this);
        this.toggleExpanded = this.toggleExpanded.bind(this);
        this.handleExpandChange = this.handleExpandChange.bind(this);
        this.handleMenuChange = this.handleMenuChange.bind(this);
        this.showDeleteDialog = this.showDeleteDialog.bind(this);
        this.hideDeleteDialog = this.hideDeleteDialog.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
        this.handleProviderOpen = this.handleProviderOpen.bind(this);
        this.handleProviderClose = this.handleProviderClose.bind(this);
        this.handleShareOpen = this.handleShareOpen.bind(this);
        this.handleShareClose = this.handleShareClose.bind(this);
        this.handleShareSave = this.handleShareSave.bind(this);
        this.state = {
            expanded: true,
            overflowTitle: false,
            overflowText: false,
            providerDescs: {},
            providerDialogOpen: false,
            deleteDialogOpen: false,
            shareDialogOpen: false,
            menuOpen: false,
        };
    }

    componentDidMount() {
        this.initMap();
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.expanded !== this.state.expanded) {
            if (this.state.expanded) {
                this.initMap();
            }
        }
    }

    getMapId() {
        let mapId = '';
        if (!isUndefined(this.props.gridName)) {
            mapId += `_${this.props.gridName}`;
        }
        mapId += `_${this.props.run.uid}`;
        if (!isUndefined(this.props.index)) {
            mapId += `_${this.props.index}`;
        }
        mapId = `map${mapId}`;

        return mapId;
    }

    initMap() {
        const map = new Map({
            target: this.getMapId(),
            layers: [
                new Tile({
                    source: new XYZ({
                        url: this.context.config.BASEMAP_URL,
                        wrapX: true,
                        attributions: this.context.config.BASEMAP_COPYRIGHT,
                    }),
                }),
            ],
            view: new View({
                projection: 'EPSG:3857',
                center: [110, 0],
                zoom: 2,
                minZoom: 2,
                maxZoom: 22,
            }),
            interactions: interaction.defaults({ mouseWheelZoom: false }),
            controls: [
                new Attribution({
                    className: ['ol-attribution', ol3mapCss['ol-attribution']].join(' '),
                    collapsible: false,
                    collapsed: false,
                }),
                new Zoom({
                    className: [ol3mapCss.olZoom, ol3mapCss.olControlTopLeft].join(' '),
                }),
                new ScaleLine({
                    className: ol3mapCss.olScaleLine,
                }),
            ],
        });

        const source = new VectorSource({ wrapX: true });

        const geojson = new GeoJSON();
        const feature = geojson.readFeature(this.props.run.job.extent, {
            featureProjection: 'EPSG:3857',
            dataProjection: 'EPSG:4326',
        });
        source.addFeature(feature);
        const layer = new VectorLayer({
            source,
        });
        map.addLayer(layer);
        map.getView().fit(source.getExtent(), map.getSize());
    }

    handleExpandChange(expanded) {
        this.setState({ expanded });
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

    handleProviderOpen() {
        const runProviders = this.props.run.provider_tasks
            .filter(provider => (provider.display !== false));
        const providerDescs = {};
        runProviders.forEach((runProvider) => {
            const a = this.props.providers.find(x => x.slug === runProvider.slug);
            providerDescs[a.name] = a.service_description;
        });
        this.setState({
            menuOpen: false,
            providerDescs,
            providerDialogOpen: true,
        });
    }

    toggleExpanded() {
        this.setState({ expanded: !this.state.expanded });
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

    mapContainerRef(element) {
        if (!element) {
            return;
        }

        // Absorb touch move events.
        element.addEventListener('touchmove', (e) => {
            e.stopPropagation();
        });
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
        const providersList = Object.entries(this.state.providerDescs).map(([key, value], ix) => (
            <ListItem
                key={key}
                style={{
                    backgroundColor: ix % 2 === 0 ? 'whitesmoke' : 'white',
                    fontWeight: 'bold',
                    width: '100%',
                    zIndex: 0,
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
                            backgroundColor: ix % 2 === 0 ? 'whitesmoke' : 'white',
                            fontSize: '14px',
                            width: '100%',
                            zIndex: 0,
                        }}
                    />,
                ]}
            />
        ));

        const cardTextFontSize = window.innerWidth < 768 ? 10 : 12;
        const titleFontSize = 22;
        const styles = {
            card: {
                backgroundColor: '#f7f8f8',
                position: 'relative',
            },
            cardTitle: {
                wordWrap: 'break-word',
                padding: '15px 0px 10px',
                zIndex: 2000,
            },
            title: {
                fontSize: titleFontSize,
                height: '36px',
                lineHeight: '28px',
            },
            titleInnerDiv: {
                backgroundColor: '#f7f8f8',
                display: 'flex',
                position: 'absolute',
                width: '100%',
                padding: '0px 10px 2px',
            },
            name: {
                display: 'inline-block',
                width: 'calc(100% - 24px)',
            },
            titleLink: {
                color: 'inherit',
                display: 'block',
                width: '100%',
                height: '36px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                margin: '0px',
            },
            titleLinkExpanded: {
                color: 'inherit',
                display: 'block',
                width: '100%',
                overflow: 'visible',
                whiteSpace: 'normal',
                wordWrap: 'break-word',
                margin: '0px 0px 8px',
            },
            cardSubtitle: {
                fontSize: cardTextFontSize,
                padding: '0px 10px',
            },
            completeIcon: {
                float: 'left',
                color: '#bcdfbb',
                fontSize: '20px',
            },
            errorIcon: {
                float: 'left',
                color: '#ce4427',
                fontSize: '20px',
                opacity: '0.6',
            },
            runningIcon: {
                float: 'left',
                color: '#f4D225',
                fontSize: '22px',
            },
            unpublishedIcon: {
                float: 'right',
                color: 'grey',
                fontSize: '18px',
                marginRight: '5px',
            },
            publishedIcon: {
                float: 'right',
                color: 'grey',
                fontSize: '20px',
                marginRight: '5px',
            },
            ownerLabel: {
                float: 'right',
                color: 'grey',
                paddingTop: '5px',
                margin: '0px',
                fontSize: cardTextFontSize,
            },
            cardTextMinimized: {
                position: 'absolute',
                wordWrap: 'break-word',
                width: '100%',
                backgroundColor: '#f7f8f8',
                zIndex: 2,
                padding: '0px 10px 5px',
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                textOverflow: 'ellipsis',
                WebkitLineClamp: 3,
                height: window.innerWidth < 768 ? '47px' : '56px',
            },
            cardText: {
                position: 'absolute',
                wordWrap: 'break-word',
                width: '100%',
                backgroundColor: '#f7f8f8',
                zIndex: 2,
                padding: '0px 10px 5px',
            },
            cardTextContainer: {
                fontSize: cardTextFontSize,
                padding: '0px',
                marginBottom: '10px',
                height: window.innerWidth < 768 ? '42px' : '51px',
                overflow: this.state.overflowText ? 'visible' : 'hidden',
                position: 'relative',
                zIndex: 1000,
            },
            iconMenu: {
                padding: '0px',
                width: '24px',
                height: '24px',
                verticalAlign: 'middle',
            },
        };

        let status = <NavigationCheck style={styles.completeIcon} />;
        if (this.props.run.status === 'SUBMITTED') {
            status = <NotificationSync style={styles.runningIcon} />;
        } else if (this.props.run.status === 'INCOMPLETE') {
            status = <AlertError style={styles.errorIcon} />;
        }

        return (
            <Card
                className="qa-DataPackGridItem-Card"
                style={styles.card}
                key={this.props.run.uid}
                expanded={this.state.expanded}
                onExpandChange={this.handleExpandChange}
            >
                <FeaturedFlag show={this.props.showFeaturedFlag && this.props.run.job.featured} />
                <CardTitle
                    className="qa-DataPackGridItem-CardTitle"
                    titleColor="#4598bf"
                    style={styles.cardTitle}
                    titleStyle={styles.title}
                    subtitleStyle={styles.cardSubtitle}
                    title={
                        <div style={styles.titleInnerDiv}>
                            <div
                                className="qa-DataPackGridItem-name"
                                style={styles.name}
                                onMouseEnter={() => { this.setState({ overflowTitle: true }); }}
                                onMouseLeave={() => { this.setState({ overflowTitle: false }); }}
                            >
                                <Link
                                    className="qa-DataPackGridItem-Link"
                                    to={`/status/${this.props.run.job.uid}`}
                                    href={`/status/${this.props.run.job.uid}`}
                                    style={this.state.overflowTitle ? styles.titleLinkExpanded : styles.titleLink}
                                >
                                    {this.props.run.job.name}
                                </Link>
                            </div>
                            <IconMenu
                                className="qa-DataPackGridItem-IconMenu"
                                style={{ float: 'right', width: '24px', height: '36px' }}
                                open={this.state.menuOpen}
                                iconButtonElement={
                                    <IconButton
                                        style={styles.iconMenu}
                                        iconStyle={{ color: '#4598bf' }}
                                        onClick={this.handleMenuButtonClick}
                                    >
                                        <NavigationMoreVert />
                                    </IconButton>}
                                anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
                                targetOrigin={{ horizontal: 'right', vertical: 'top' }}
                                onRequestChange={this.handleMenuChange}
                            >
                                <MenuItem
                                    className="qa-DataPackGridItem-MenuItem-showHideMap"
                                    style={{ fontSize: cardTextFontSize }}
                                    primaryText={this.state.expanded ? 'Hide Map' : 'Show Map'}
                                    onClick={this.toggleExpanded}
                                />
                                <MenuItem
                                    className="qa-DataPackGridItem-MenuItem-goToStatus"
                                    style={{ fontSize: cardTextFontSize }}
                                    primaryText="Status & Download"
                                    onClick={() => { browserHistory.push(`/status/${this.props.run.job.uid}`); }}
                                />
                                <MenuItem
                                    className="qa-DataPackGridItem-MenuItem-viewProviders"
                                    style={{ fontSize: cardTextFontSize }}
                                    primaryText="View Data Sources"
                                    onClick={this.handleProviderOpen}
                                />
                                {this.props.adminPermission ?
                                    [
                                        <MenuItem
                                            key="delete"
                                            className="qa-DataPackGridItem-MenuItem-delete"
                                            style={{ fontSize: cardTextFontSize }}
                                            primaryText="Delete Export"
                                            onClick={this.showDeleteDialog}
                                        />,
                                        <MenuItem
                                            key="share"
                                            className="qa-DataPackGridItem-MenuItem-share"
                                            style={{ fontSize: cardTextFontSize }}
                                            primaryText="Share"
                                            onClick={this.handleShareOpen}
                                        />,
                                    ]
                                    :
                                    null
                                }
                            </IconMenu>
                            <BaseDialog
                                className="qa-DataPackGridItem-BaseDialog"
                                show={this.state.providerDialogOpen}
                                title="DATA SOURCES"
                                onClose={this.handleProviderClose}
                            >
                                <List>{providersList}</List>
                            </BaseDialog>
                            <DeleteDataPackDialog
                                className="qa-DataPackGridItem-DeleteDialog"
                                show={this.state.deleteDialogOpen}
                                onCancel={this.hideDeleteDialog}
                                onDelete={this.handleDelete}
                            />
                        </div>
                    }
                    subtitle={
                        <div className="qa-DataPackGridItem-div-subtitle">
                            <div
                                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            >
                                {`Event: ${this.props.run.job.event}`}
                            </div>
                            <span>{`Added: ${moment(this.props.run.started_at).format('M/D/YY')}`}</span><br />
                            <span>{`Expires: ${moment(this.props.run.expiration).format('M/D/YY')}`}</span><br />
                        </div>
                    }
                />
                <CardText
                    className="qa-DataPackGridItem-CardText"
                    style={styles.cardTextContainer}
                    onMouseEnter={() => { this.setState({ overflowText: true }); }}
                    onMouseLeave={() => { this.setState({ overflowText: false }); }}
                    onClick={() => { this.setState({ overflowText: !this.state.overflowText }); }}
                >
                    <span
                        className="qa-DataPackGridItem-span-description"
                        style={this.state.overflowText ? styles.cardText : styles.cardTextMinimized}
                    >
                        {this.props.run.job.description}
                    </span>
                </CardText>
                <CardMedia className="qa-DataPackGridItem-CardMedia" expandable>
                    <div
                        id={this.getMapId()}
                        style={{ padding: '0px 2px', backgroundColor: 'none', maxHeight: '200px' }}
                        ref={this.mapContainerRef}
                    />
                </CardMedia>
                <CardActions className="qa-DataPackGridItem-CardActions" style={{ height: '45px' }}>
                    <span>
                        {status}
                        {this.props.run.user === this.props.user.data.user.username ?
                            <p style={styles.ownerLabel}>My DataPack</p>
                            :
                            <p style={styles.ownerLabel}>{this.props.run.user}</p>
                        }
                        {this.props.run.job.permissions.value !== 'PRIVATE' ?
                            <SocialGroup style={styles.publishedIcon} />
                            :
                            <Lock style={styles.unpublishedIcon} />
                        }
                    </span>
                </CardActions>
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

DataPackGridItem.contextTypes = {
    config: PropTypes.object,
};

DataPackGridItem.propTypes = {
    run: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired,
    onRunDelete: PropTypes.func.isRequired,
    onRunShare: PropTypes.func.isRequired,
    providers: PropTypes.arrayOf(PropTypes.object).isRequired,
    gridName: PropTypes.string.isRequired,
    index: PropTypes.number.isRequired,
    showFeaturedFlag: PropTypes.bool,
    adminPermission: PropTypes.bool.isRequired,
    users: PropTypes.arrayOf(PropTypes.object).isRequired,
    groups: PropTypes.arrayOf(PropTypes.object).isRequired,
};

DataPackGridItem.defaultProps = {
    showFeaturedFlag: true,
};

export default DataPackGridItem;
