import * as React from 'react';
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
import ol3mapCss from '../../styles/ol3map.css';
import {getResolutions, getTileCoordinateFromClick} from "../../utils/mapUtils";
import TileGrid from "ol/tilegrid/tilegrid";
import {MapQueryDisplay} from "../CreateDataPack/MapQueryDisplay";
import {SelectedBaseMap} from "../CreateDataPack/CreateExport";

export interface Props {
    geojson: object;
    selectedBaseMap: SelectedBaseMap | string;
    zoom?: number;
    copyright?: string;
    setZoom?: (from: number, to: number) => void;
    minZoom?: number;
    maxZoom?: number;
    id?: string;
    moveable?: boolean;
}

export interface State {
    selectedBaseMap: SelectedBaseMap;
}

export class MapView extends React.Component<Props, State> {

    private map: any;
    private layer: any;
    private mapDiv: string;
    private minZoom: number;
    private maxZoom: number;
    private ref: (element: HTMLElement)=>void;
    private displayBoxRef;

    constructor(props: Props) {
        let selectedBaseMap = props.selectedBaseMap;
        if (typeof selectedBaseMap === 'string' || selectedBaseMap instanceof String) {
            selectedBaseMap = { baseMapUrl: props.selectedBaseMap } as SelectedBaseMap;
        }
        super(props);
        this.state = {
            selectedBaseMap,
        };
        this.minZoom = this.props.minZoom || 0;
        this.maxZoom = this.props.maxZoom || 20;
        this.mapDiv = this.props.id || "ProviderMap";
    }

    componentDidMount() {
        if (!this.map) {
            this.initializeOpenLayers();
        }

        if (!this.props.moveable) {
            this.ref = this.mapContainerRef;
        }
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<{}>, snapshot?: any): void {
        if (this.props.zoom) {
            this.map.getView().setZoom(this.props.zoom);
        }
    }

    mapContainerRef(element: HTMLElement) {
        if (!element) {
            return;
        }
        // Absorb touch move events.
        element.addEventListener('touchmove', (e: TouchEvent) => {
            e.stopPropagation();
        });
    }

    componentWillUnmount() {
        this.map.setTarget(null);
        this.map = null;
    }

    private initializeOpenLayers() {
        const zoomLevels = 20;
        const resolutions = getResolutions(zoomLevels, null);
        let tileGrid = new TileGrid({
            extent: [-180, -90, 180, 90],
            resolutions: resolutions
        });
        const base = new Tile({
            source: new XYZ({
                projection: 'EPSG:4326',
                url: this.state.selectedBaseMap.baseMapUrl,
                wrapX: true,
                attributions: this.props.copyright,
                tileGrid: tileGrid,
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
                projection: 'EPSG:4326',
                center: [0, 0],
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
                    className: [ol3mapCss.olZoom].join(' '),
                }),
            ],
        });

        const source = new VectorSource();
        const geojson = new GeoJSON();
        const features = geojson.readFeatures(this.props.geojson, {
            featureProjection: 'EPSG:4326',
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
        this.layer = base;
        // Hook up the click to query feature data
        this.map.on('click', (event) => {
                this.displayBoxRef.handleMapClick(getTileCoordinateFromClick(event, this.layer, this.map))
            }
        );
    }

    render() {
        return (
            <div style={{ height: '100%', width: '100%' }} id={this.mapDiv} ref={this.mapContainerRef}>
                <div
                    style={{
                        position: 'absolute',
                        width: '100%',
                        bottom: '40px',
                        display: 'flex',
                        justifyContent: 'center',
                    }}
                >
                    <MapQueryDisplay
                        ref={child => {
                            this.displayBoxRef = child
                        }}
                        selectedBaseMap={this.state.selectedBaseMap}
                    />
                </div>
            </div>
        );
    }
}
