import * as PropTypes from 'prop-types';
import * as React from 'react';
import { connect } from 'react-redux';
import { withTheme, Theme, withStyles, createStyles, StyledComponentProps } from '@material-ui/core/styles';
import withWidth from '@material-ui/core/withWidth';
import { Link } from 'react-router';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import * as moment from 'moment';
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
import ol3mapCss from '../../styles/ol3map.css';
import { makeFullRunSelector } from '../../selectors/runSelector';
import { Breakpoint } from '@material-ui/core/styles/createBreakpoints';

const jss = (theme: Eventkit.Theme & Theme) => createStyles({
    card: {
        backgroundColor: theme.eventkit.colors.secondary,
        position: 'relative',
        height: 'auto',
    },
    content: {
        display: 'flex',
        flexWrap: 'nowrap',
        height: 'auto',
        flexDirection: 'column',
        [theme.breakpoints.up('md')]: {
            flexDirection: 'row',
        },
    },
    map: {
        flex: '67',
        boxSizing: 'border-box',
        backgroundColor: 'none',
        order: 2,
        [theme.breakpoints.up('md')]: {
            maxWidth: '67%',
            order: 1,
        },
        [theme.breakpoints.down('sm')]: {
            maxHeight: '67%',
        },
    },
    info: {
        flex: '33',
        maxWidth: '100%',
        boxSizing: 'border-box',
        padding: '12px 16px 14px',
        order: 1,
        [theme.breakpoints.up('md')]: {
            maxWidth: '33%',
            padding: '17px 24px 20px',
            order: 2,
        },
        [theme.breakpoints.down('sm')]: {
            maxHeight: '33%',
        },
    },
    cardHeader: {
        wordWrap: 'break-word',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        boxSizing: 'border-box',
        maxWidth: '100%',
        padding: '0',
    },
    cardTitle: {
        display: 'inline-block',
        width: '100%',
        color: theme.eventkit.colors.primary,
        fontSize: '22px',
    },
    titleLink: {
        color: 'inherit',
        width: '100%',
        margin: '0px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        WebkitLineClamp: 2,
        display: '-webkit-box',
        WebkitBoxOrient: 'vertical',
        wordWrap: 'break-word',
    },
    cardSubtitle: {
        fontSize: '10px',
        fontWeight: 'normal',
        color: theme.eventkit.colors.text_primary,
        marginBottom: '16px',
        [theme.breakpoints.up('md')]: {
            fontSize: '12px',
        },
        [theme.breakpoints.down('sm')]: {
            display: 'none',
        },
    },
    cardTextContainer: {
        padding: '0px',
        position: 'relative',
        boxSizing: 'border-box',
        overflow: 'hidden',
    },
    cardText: {
        color: theme.eventkit.colors.black,
        wordWrap: 'break-word',
        width: '100%',
        backgroundColor: theme.eventkit.colors.secondary,
        zIndex: 2,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        WebkitLineClamp: 2,
        display: '-webkit-box',
        WebkitBoxOrient: 'vertical',
        fontSize: '14px',
        lineHeight: 'inherit',
        [theme.breakpoints.up('md')]: {
            WebkitLineClamp: 7,
        },
        [theme.breakpoints.up('lg')]: {
            WebkitLineClamp: 6,
            fontSize: '16px',
            lineHeight: '1.5',
        }
    },
});

interface OwnProps {
    className?: string;
    // RunID is not used directly by the component but it is needs for the state selector
    runId: string;
    gridName: string;
    index: number;
    height?: string;
    theme: Eventkit.Theme & Theme;
    width: Breakpoint;
}

interface StateProps {
    run: Eventkit.Run;
}

export type Props = StyledComponentProps & OwnProps & StateProps;

export class DataPackFeaturedItem extends React.Component<Props, {}> {
    static contextTypes = {
        config: PropTypes.object,
    };

    private map: any;
    constructor(props: Props) {
        super(props);
        this.initMap = this.initMap.bind(this);
        this.getMapId = this.getMapId.bind(this);
        this.mapContainerRef = this.mapContainerRef.bind(this);
    }

    componentDidMount() {
        this.initMap();
    }

    componentDidUpdate(prevProps: Props) {
        if (prevProps.width !== this.props.width || prevProps.height !== this.props.height) {
            this.map.updateSize();
        }
    }

    private getMapId() {
        let mapId = '';
        if (this.props.gridName !== undefined) {
            mapId += `${this.props.gridName}_`;
        }
        mapId += `${this.props.run.uid}_`;
        if (this.props.index !== undefined) {
            mapId += `${this.props.index}_`;
        }
        mapId += 'map';

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

    private mapContainerRef(element: HTMLElement) {
        if (!element) {
            return;
        }

        // Absorb touch move events.
        element.addEventListener('touchmove', (e: TouchEvent) => {
            e.stopPropagation();
        });
    }

    render() {
        const { classes } = this.props;

        return (
            <Card
                className={classes.card}
                style={{ height: this.props.height }}
                key={this.props.run.uid}
            >
                <div className={classes.content} style={{ height: this.props.height }}>
                    <div
                        id={this.getMapId()}
                        className={classes.map}
                        ref={this.mapContainerRef}
                    />
                    <div className={classes.info}>
                        <CardHeader
                            className={classes.cardHeader}
                            title={
                                <div>
                                    <div className={classes.cardTitle}>
                                        <Link
                                            to={`/status/${this.props.run.job.uid}`}
                                            href={`/status/${this.props.run.job.uid}`}
                                            className={classes.titleLink}
                                        >
                                            {this.props.run.job.name}
                                        </Link>
                                    </div>
                                </div>
                            }
                            subheader={
                                <div className={classes.cardSubtitle}>
                                    <div
                                        className="qa-DataPackFeaturedItem-Subtitle-Event"
                                        style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                    >
                                        {`Event: ${this.props.run.job.event}`}
                                    </div>
                                    <span className="qa-DataPackFeaturedItem-Subtitle-Added">
                                        {`Added: ${moment(this.props.run.started_at).format('M/D/YY')}`}
                                    </span>
                                    <br />
                                    <span className="qa-DataPackFeaturedItem-Subtitle-Expires">
                                        {`Expires: ${moment(this.props.run.expiration).format('M/D/YY')}`}
                                    </span>
                                    <br />
                                </div>
                            }
                        />
                        <CardContent
                            className={classes.cardTextContainer}
                        >
                            <span className={classes.cardText}>
                                {this.props.run.job.description}
                            </span>
                        </CardContent>
                    </div>
                </div>
            </Card>
        );
    }
}

const makeMapStateToProps = () => {
    const getFullRun = makeFullRunSelector();
    const mapStateToProps = (state: {}, props: OwnProps) => (
        {
            run: getFullRun(state, props),
        }
    );
    return mapStateToProps;
};

export default withWidth()(
    withTheme()(
        withStyles(jss)(
            connect(makeMapStateToProps)(DataPackFeaturedItem))));
