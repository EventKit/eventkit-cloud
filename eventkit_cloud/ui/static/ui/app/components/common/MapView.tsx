import * as PropTypes from 'prop-types';
import * as React from 'react';
import {withTheme, Theme} from '@material-ui/core/styles';
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
import {MapCard} from "./MapCard";

export interface Props {
    geojson: object;
    url: string;
    zoom?: number;
    copyright?: string;
    setZoom?: (from: number, to: number) => void;
    minZoom?: number;
    maxZoom?: number;
    id?: string;
}

export class MapView extends React.Component<Props> {

    private map: any;
    private mapDiv: string;
    private minZoom: number;
    private maxZoom: number;

    constructor(props: Props) {
        super(props);
        this.minZoom = this.props.minZoom || 0;
        this.maxZoom = this.props.maxZoom || 20;
        this.mapDiv = this.props.id || "ProviderMap";
    }

    componentDidMount() {
        if (!this.map) {
            this.initializeOpenLayers();
        }
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<{}>, snapshot?: any): void {
        if (this.props.zoom) {
            this.map.getView().setZoom(this.props.zoom);
        }
    }

    componentWillUnmount() {
        this.map.setTarget(null);
        this.map = null;
    }

    private initializeOpenLayers() {
        const base = new Tile({
            source: new XYZ({
                url: this.props.url,
                wrapX: true,
                attributions: this.props.copyright,
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
            target: this.mapDiv,
            view: new View({
                projection: 'EPSG:3857',
                center: [110, 0],
                zoom: this.props.zoom || this.maxZoom,
                minZoom: this.minZoom,
                maxZoom: this.maxZoom,
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
        if (this.props.zoom) {
            this.map.getView().setZoom(this.props.zoom);
        }

        this.map.on('moveend', () => {
            if (this.props.setZoom) {
                this.props.setZoom(null, this.map.getView().getZoom());
            }
        });
    }

    render() {
        return (
            <div id={this.mapDiv} style={{width: '100%'}}/>
        );
    }
}
