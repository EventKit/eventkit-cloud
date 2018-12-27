
import * as PropTypes from 'prop-types';
import * as React from 'react';
import { connect } from 'react-redux';
import { withTheme, withStyles, createStyles, StyledComponentProps } from '@material-ui/core/styles';
import { Link, browserHistory } from 'react-router';
import Collapse from '@material-ui/core/Collapse';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import MenuItem from '@material-ui/core/MenuItem';
import SocialGroup from '@material-ui/icons/Group';
import Lock from '@material-ui/icons/LockOutlined';
import NotificationSync from '@material-ui/icons/Sync';
import NavigationCheck from '@material-ui/icons/Check';
import AlertError from '@material-ui/icons/Error';
import * as isUndefined from 'lodash/isUndefined';
import * as moment from 'moment';

import Map from 'ol/map';
import View from 'ol/view';
import interaction from 'ol/interaction';
import VectorSource from 'ol/source/vector';
import XYZ from 'ol/source/xyz';
import GeoJSONFormat from 'ol/format/geojson';
import VectorLayer from 'ol/layer/vector';
import Tile from 'ol/layer/tile';
import Attribution from 'ol/control/attribution';
import Zoom from 'ol/control/zoom';
import ScaleLine from 'ol/control/scaleline';

import IconMenu from '../common/IconMenu';
import DeleteDataPackDialog from '../Dialog/DeleteDataPackDialog';
import FeaturedFlag from './FeaturedFlag';
import ol3mapCss from '../../styles/ol3map.css';
import DataPackShareDialog from '../DataPackShareDialog/DataPackShareDialog';
import { makeFullRunSelector } from '../../selectors/runSelector';
import ProviderDialog from '../Dialog/ProviderDialog';

const jss = (theme: any) => createStyles({
    cardTitle: {
        backgroundColor: theme.eventkit.colors.secondary,
        color: theme.eventkit.colors.primary,
        display: 'flex',
        width: '100%',
        position: 'absolute',
        zIndex: 15,
    },
    name: {
        color: theme.eventkit.colors.primary,
        display: 'block',
        width: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        margin: '0px',
        '&:hover': {
            color: theme.eventkit.colors.primary,
            overflow: 'visible',
            wordWrap: 'break-word',
            whiteSpace: 'normal',
            padding: '5px',
            backgroundColor: theme.eventkit.colors.secondary,
        },
    },
    nameContainer: {
        fontSize: '22px',
        display: 'flex',
        width: 'calc(100% - 36px)',
        lineHeight: '36px',
    },
    title: {
        minHeight: '36px',
    },
    header: {
        padding: '15px 10px 10px',
        position: 'relative',
        wordWrap: 'break-word',
    },
    headerContent: {
        width: '100%',
        position: 'relative',
    },
    textContainer: {
        backgroundColor: theme.eventkit.colors.secondary,
        fontSize: '12px',
        padding: '0px',
        marginBottom: '10px',
        height: '51px',
        overflow: 'hidden',
        position: 'relative' as 'relative',
        zIndex: 10,
        '&:hover': {
            overflow: 'visible',
        },
    },
    text: {
        wordWrap: 'break-word',
        width: '100%',
        backgroundColor: theme.eventkit.colors.secondary,
        padding: '0px 10px 5px',
        position: 'absolute',
        '&:not(:hover)': {
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            textOverflow: 'ellipsis',
            height: '56px',
        }
    }
});

interface OwnProps {
    className: string | undefined;
    userData: any;
    onRunDelete: (uid) => void;
    onRunShare: (uid, permissions) => void;
    providers: Eventkit.Provider[];
    gridName: string;
    index: number;
    showFeaturedFlag: boolean;
    style: object | undefined;
    theme: Eventkit.Theme;
    runId: string;
}

interface State {
    expanded: boolean;
    providerDescs: object;
    providerDialogOpen: boolean;
    deleteDialogOpen: boolean;
    shareDialogOpen: boolean;
}

interface StateProps {
    run: Eventkit.Run;
}

type Props = StyledComponentProps & StateProps & OwnProps;

export class DataPackGridItem extends React.Component<Props, State> {
    static defaultProps = {
        showFeaturedFlag: false,
    };

    static contextTypes = {
        config: PropTypes.shape({
            BASEMAP_URL: PropTypes.string,
            BASEMAP_COPYRIGHT: PropTypes.string,
        }),
    };

    private map;
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

    private getMapId() {
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

    private initMap() {
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

        const geojson = new GeoJSONFormat();
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

    private handleProviderClose() {
        this.setState({ providerDialogOpen: false });
    }

    private handleProviderOpen() {
        this.setState({
            providerDialogOpen: true,
        });
    }

    private toggleExpanded() {
        this.setState({ expanded: !this.state.expanded });
    }

    private showDeleteDialog() {
        this.setState({ deleteDialogOpen: true });
    }

    private hideDeleteDialog() {
        this.setState({ deleteDialogOpen: false });
    }

    private handleDelete() {
        this.hideDeleteDialog();
        this.props.onRunDelete(this.props.run.uid);
    }

    private mapContainerRef(element) {
        if (!element) {
            return;
        }

        // Absorb touch move events.
        element.addEventListener('touchmove', e => {
            e.stopPropagation();
        });
    }

    private handleShareOpen() {
        this.setState({ shareDialogOpen: true });
    }

    private handleShareClose() {
        this.setState({ shareDialogOpen: false });
    }

    private handleShareSave(perms) {
        this.handleShareClose();
        const permissions = { ...perms };
        this.props.onRunShare(this.props.run.job.uid, permissions);
    }

    render() {
        const { colors } = this.props.theme.eventkit;
        const cardTextFontSize = 12;

        const styles: { [s: string]: React.CSSProperties } = {
            gridItem: {
                position: 'relative',
                ...this.props.style,
            },
            completeIcon: {
                float: 'left',
                color: colors.success,
                fontSize: '20px',
            },
            errorIcon: {
                float: 'left',
                color: colors.warning,
                fontSize: '20px',
                opacity: 0.6,
            },
            runningIcon: {
                float: 'left',
                color: colors.running,
                fontSize: '22px',
            },
            unpublishedIcon: {
                float: 'right',
                color: colors.grey,
                fontSize: '18px',
                marginRight: '5px',
            },
            publishedIcon: {
                float: 'right',
                color: colors.grey,
                fontSize: '20px',
                marginRight: '5px',
            },
            ownerLabel: {
                float: 'right',
                color: colors.grey,
                margin: '0px',
                fontSize: cardTextFontSize,
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
                    style={{ backgroundColor: colors.secondary }}
                >
                    <CardHeader
                        className="qa-DataPackGridItem-CardTitle"
                        classes={{
                            root: this.props.classes.header,
                            title: this.props.classes.title,
                            content: this.props.classes.headerContent,
                        }}
                        title={
                            <div className={this.props.classes.cardTitle}>
                                <FeaturedFlag show={this.props.showFeaturedFlag && this.props.run.job.featured} />
                                <div
                                    className={`${this.props.classes.nameContainer} qa-DataPackGridItem-name`}
                                >
                                    <Link
                                        className={`${this.props.classes.name} qa-DataPackGridItem-Link`}
                                        to={`/status/${this.props.run.job.uid}`}
                                        href={`/status/${this.props.run.job.uid}`}
                                    >
                                        {this.props.run.job.name}
                                    </Link>
                                </div>
                                <IconMenu
                                    className="qa-DataPackGridItem-IconMenu tour-datapack-options"
                                    style={styles.iconMenu}
                                >
                                    <MenuItem
                                        key="map"
                                        className="qa-DataPackGridItem-MenuItem-showHideMap"
                                        style={{ fontSize: cardTextFontSize }}
                                        onClick={this.toggleExpanded}
                                    >
                                        {this.state.expanded ? 'Hide Map' : 'Show Map'}
                                    </MenuItem>
                                    <MenuItem
                                        key="status"
                                        className="qa-DataPackGridItem-MenuItem-goToStatus"
                                        style={{ fontSize: cardTextFontSize }}
                                        onClick={() => { browserHistory.push(`/status/${this.props.run.job.uid}`); }}
                                    >
                                        Status & Download
                                    </MenuItem>
                                    <MenuItem
                                        key="providers"
                                        className="qa-DataPackGridItem-MenuItem-viewProviders"
                                        style={{ fontSize: cardTextFontSize }}
                                        onClick={this.handleProviderOpen}
                                    >
                                        View Data Sources
                                    </MenuItem>
                                    {this.props.run.job.relationship === 'ADMIN' ?
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
                                    {this.props.run.job.relationship === 'ADMIN' ?
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
                                <ProviderDialog
                                    uids={this.props.run.provider_tasks}
                                    open={this.state.providerDialogOpen}
                                    onClose={this.handleProviderClose}
                                    providers={this.props.providers}
                                />
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
                        className={`${this.props.classes.textContainer} qa-DataPackGridItem-CardText`}
                    >
                        <span
                            className={`${this.props.classes.text} qa-DataPackGridItem-span-description`}
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
                            {this.props.run.user === this.props.userData.user.username ?
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
                        user={this.props.userData}
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

const makeMapStateToProps = () => {
    const getFullRun = makeFullRunSelector();
    const mapStateToProps = (state, props) => (
        {
            run: getFullRun(state, props),
        }
    );
    return mapStateToProps;
};

export default
    withTheme()(
        withStyles(jss)(
            connect(makeMapStateToProps)(DataPackGridItem)));
