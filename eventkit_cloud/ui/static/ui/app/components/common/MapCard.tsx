import * as PropTypes from 'prop-types';
import * as React from 'react';
import { withTheme, Theme } from '@material-ui/core/styles';
import Map from 'ol/map';
import View from 'ol/view';
import interaction from 'ol/interaction';
import VectorSource from 'ol/source/vector';
import XYZ from 'ol/source/xyz';
import GeoJSON from 'ol/format/geojson';
import VectorLayer from 'ol/layer/vector';
import Tile from 'ol/layer/tile';
import ScaleLine from 'ol/control/scaleline';
import Attribution from 'ol/control/attribution';
import Zoom from 'ol/control/zoom';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Collapse from '@material-ui/core/Collapse';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import ol3mapCss from '../../styles/ol3map.css';

export interface Props {
    children: any;
    geojson: object;
    theme: Eventkit.Theme & Theme;
}

export interface State {
    open: boolean;
}

export class MapCard extends React.Component<Props, State> {
    private map: any;

    static contextTypes = {
        config: PropTypes.object,
    };

    constructor(props: Props) {
        super(props);
        this.handleExpand = this.handleExpand.bind(this);
        this.state = {
            open: false,
        };
    }

    componentDidUpdate(prevProps: Props, prevState: State) {
        // if the user expaned the AOI section mount the map
        if (prevState.open !== this.state.open) {
            if (this.state.open) {
                this.initializeOpenLayers();
            } else {
                this.map.setTarget(null);
                this.map = null;
            }
        }
    }

    private handleExpand() {
        this.setState(state => ({ open: !state.open }));
    }

    private initializeOpenLayers() {
        const base = new Tile({
            source: new XYZ({
                url: this.context.config.BASEMAP_URL,
                wrapX: true,
                attributions: this.context.config.BASEMAP_COPYRIGHT,
            }),
        });

        this.map = new Map({
            interactions: interaction.defaults({
                keyboard: false,
                altShiftDragRotate: false,
                pinchRotate: false,
                mouseWheelZoom: false,
            }),
            layers: [base],
            target: 'infoMap',
            view: new View({
                projection: 'EPSG:3857',
                center: [110, 0],
                zoom: 2,
                minZoom: 2,
                maxZoom: 22,
            }),
            controls: [
                new ScaleLine({
                    className: ol3mapCss.olScaleLine,
                }),
                new Attribution({
                    className: ['ol-attribution', ol3mapCss['ol-attribution']].join(' '),
                    collapsible: false,
                    collapsed: false,
                }),
                new Zoom({
                    className: [ol3mapCss.olZoom, ol3mapCss.olControlTopLeft].join(' '),
                }),
            ],
        });
        const source = new VectorSource();
        const geojson = new GeoJSON();
        const features = geojson.readFeatures(this.props.geojson, {
            featureProjection: 'EPSG:3857',
            dataProjection: 'EPSG:4326',
        });
        source.addFeatures(features);
        const layer = new VectorLayer({
            source,
        });

        this.map.addLayer(layer);
        this.map.getView().fit(source.getExtent(), this.map.getSize());
    }

    render() {
        const { colors } = this.props.theme.eventkit;

        const style = {
            mapCard: {
                padding: '15px 0px 20px',
            },
            map: {
                width: '100%',
            },
            editAoi: {
                fontSize: '15px',
                fontWeight: 'normal',
                verticalAlign: 'top',
                cursor: 'pointer',
                color: colors.primary,
            },
        };

        return (
            <Card
                id="Map"
                className="qa-MapCard-Card-map"
            >
                <CardActions
                    className="qa-MapCard-CardHeader-map"
                    style={{
                        padding: '12px 10px 10px',
                        backgroundColor: colors.secondary,
                        fontWeight: 'bold',
                        fontSize: '16px',
                    }}
                >
                    <div style={{ flex: '1 1 auto' }}>
                        {this.props.children}
                    </div>
                    {this.state.open ?
                        <ExpandLess onClick={this.handleExpand} color="primary" />
                        :
                        <ExpandMore onClick={this.handleExpand} color="primary" />
                    }
                </CardActions>
                <Collapse in={this.state.open}>
                    <CardContent
                        className="qa-MapCard-CardText-map"
                        style={{ padding: '5px', backgroundColor: colors.secondary }}
                    >
                        <div id="infoMap" style={style.map} />
                    </CardContent>
                </Collapse>
            </Card>
        );
    }
}

export default withTheme()(MapCard);
