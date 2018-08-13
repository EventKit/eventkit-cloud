import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Link, browserHistory } from 'react-router';
import Collapse from '@material-ui/core/Collapse';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import MenuItem from '@material-ui/core/MenuItem';
import List from '@material-ui/core/List';
import SocialGroup from '@material-ui/icons/Group';
import Lock from '@material-ui/icons/LockOutlined';
import NotificationSync from '@material-ui/icons/Sync';
import NavigationCheck from '@material-ui/icons/Check';
import AlertError from '@material-ui/icons/Error';
import isUndefined from 'lodash/isUndefined';
import moment from 'moment';

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

import IconMenu from '../common/IconMenu';
import BaseDialog from '../Dialog/BaseDialog';
import DeleteDataPackDialog from '../Dialog/DeleteDataPackDialog';
import FeaturedFlag from './FeaturedFlag';
import ol3mapCss from '../../styles/ol3map.css';
import DropDownListItem from '../common/DropDownListItem';
import DataPackShareDialog from '../DataPackShareDialog/DataPackShareDialog';

export class DataPackGridItem extends Component {
    constructor(props) {
        super(props);
        this.initMap = this.initMap.bind(this);
        this.toggleExpanded = this.toggleExpanded.bind(this);
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
        };
    }

    componentDidMount() {
        this.initMap();
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.expanded !== this.state.expanded) {
            if (this.state.expanded) {
                this.initMap();
            } else {
                this.map.setTarget(null);
                this.map = null;
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
        this.map = new Map({
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
        this.map.addLayer(layer);
        this.map.getView().fit(source.getExtent(), this.map.getSize());
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
            providerDescs,
            providerDialogOpen: true,
        });
    }

    toggleExpanded() {
        this.setState({ expanded: !this.state.expanded });
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
        const cardTextFontSize = window.innerWidth < 768 ? 10 : 12;
        const titleFontSize = 22;
        const styles = {
            gridItem: {
                position: 'relative',
                ...this.props.style,
            },
            cardTitle: {
                backgroundColor: '#f7f8f8',
                color: '#4598bf',
                display: 'flex',
                width: '100%',
                height: '36px',
                position: 'relative',
            },
            titleName: {
                fontSize: titleFontSize,
                display: 'inline-block',
                width: 'calc(100% - 24px)',
                position: 'absolute',
                lineHeight: '24px',
                backgroundColor: '#f7f8f8',
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
                margin: '0px',
                fontSize: cardTextFontSize,
            },
            cardTextMinimized: {
                wordWrap: 'break-word',
                width: '100%',
                backgroundColor: '#f7f8f8',
                padding: '0px 10px 5px',
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                textOverflow: 'ellipsis',
                WebkitLineClamp: 3,
                height: window.innerWidth < 768 ? '47px' : '56px',
                position: 'absolute',
            },
            cardText: {
                wordWrap: 'break-word',
                width: '100%',
                backgroundColor: '#f7f8f8',
                padding: '0px 10px 5px',
                position: 'absolute',
            },
            cardTextContainer: {
                backgroundColor: '#f7f8f8',
                fontSize: cardTextFontSize,
                padding: '0px',
                marginBottom: '10px',
                height: window.innerWidth < 768 ? '42px' : '51px',
                overflow: this.state.overflowText ? 'visible' : 'hidden',
                position: 'relative',
                zIndex: 10,
            },
            iconMenu: {
                position: 'absolute',
                right: '0px',
            },
        };

        let status = <NavigationCheck style={styles.completeIcon} />;
        if (this.props.run.status === 'SUBMITTED') {
            status = <NotificationSync style={styles.runningIcon} />;
        } else if (this.props.run.status === 'INCOMPLETE') {
            status = <AlertError style={styles.errorIcon} />;
        }

        return (
            <div style={styles.gridItem} key={this.props.run.uid}>
                <Card
                    className="qa-DataPackGridItem-Card"
                    style={{ backgroundColor: '#f7f8f8' }}
                >
                    <CardHeader
                        className="qa-DataPackGridItem-CardTitle"
                        style={{ padding: '15px 10px 10px', position: 'relative', wordWrap: 'break-word' }}
                        title={
                            <div style={styles.cardTitle}>
                                <FeaturedFlag show={this.props.showFeaturedFlag && this.props.run.job.featured} />
                                <div
                                    className="qa-DataPackGridItem-name"
                                    style={styles.titleName}
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
                                <IconMenu className="qa-DataPackGridItem-IconMenu" style={styles.iconMenu}>
                                    <MenuItem
                                        className="qa-DataPackGridItem-MenuItem-showHideMap"
                                        style={{ fontSize: cardTextFontSize }}
                                        onClick={this.toggleExpanded}
                                    >
                                        {this.state.expanded ? 'Hide Map' : 'Show Map'}
                                    </MenuItem>
                                    <MenuItem
                                        className="qa-DataPackGridItem-MenuItem-goToStatus"
                                        style={{ fontSize: cardTextFontSize }}
                                        onClick={() => { browserHistory.push(`/status/${this.props.run.job.uid}`); }}
                                    >
                                        Status & Download
                                    </MenuItem>
                                    <MenuItem
                                        className="qa-DataPackGridItem-MenuItem-viewProviders"
                                        style={{ fontSize: cardTextFontSize }}
                                        onClick={this.handleProviderOpen}
                                    >
                                        View Data Sources
                                    </MenuItem>
                                    {this.props.adminPermission ?
                                        <MenuItem
                                            key="delete"
                                            className="qa-DataPackGridItem-MenuItem-delete"
                                            style={{ fontSize: cardTextFontSize }}
                                            onClick={this.showDeleteDialog}
                                        >
                                            Delete Export
                                        </MenuItem>
                                        : null
                                    }
                                    {this.props.adminPermission ?
                                        <MenuItem
                                            key="share"
                                            className="qa-DataPackGridItem-MenuItem-share"
                                            style={{ fontSize: cardTextFontSize }}
                                            onClick={this.handleShareOpen}
                                        >
                                            Share
                                        </MenuItem>
                                        : null
                                    }
                                </IconMenu>
                                <BaseDialog
                                    className="qa-DataPackGridItem-BaseDialog"
                                    show={this.state.providerDialogOpen}
                                    title="DATA SOURCES"
                                    onClose={this.handleProviderClose}
                                >
                                    <List>
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
                                    className="qa-DataPackGridItem-DeleteDialog"
                                    show={this.state.deleteDialogOpen}
                                    onCancel={this.hideDeleteDialog}
                                    onDelete={this.handleDelete}
                                />
                            </div>
                        }
                        subheader={
                            <div className="qa-DataPackGridItem-div-subtitle" style={{ fontSize: cardTextFontSize }}>
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
                    <CardContent
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
                    </CardContent>
                    <Collapse in={this.state.expanded}>
                        <CardContent className="qa-DataPackGridItem-CardMedia" style={{ padding: '0px' }}>
                            <div
                                id={this.getMapId()}
                                style={{ padding: '0px 2px', backgroundColor: 'none', maxHeight: '200px' }}
                                ref={this.mapContainerRef}
                            />
                        </CardContent>
                    </Collapse>
                    <CardActions className="qa-DataPackGridItem-CardActions" style={{ height: '45px', padding: '8px' }}>
                        <div style={{ width: '100%' }}>
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
                        </div>
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
            </div>
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
    style: PropTypes.object,
};

DataPackGridItem.defaultProps = {
    showFeaturedFlag: true,
    style: {},
};

export default DataPackGridItem;
