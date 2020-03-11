import * as React from 'react';
import {getResolutions, getTileCoordinateFromClick} from "../../utils/mapUtils";
import TileGrid from "ol/tilegrid/tilegrid";
import MapQueryDisplay from "../CreateDataPack/MapQueryDisplay";
import {MapLayer} from "../CreateDataPack/CreateExport";
import {MapContainer} from "../../utils/mapBuilder";

export interface Props {
    geojson: object;
    selectedBaseMap: MapLayer | string;
    zoom?: number;
    copyright?: string;
    setZoom?: (from: number, to: number) => void;
    minZoom?: number;
    maxZoom?: number;
    id?: string;
    moveable?: boolean;
}

export interface State {
    selectedBaseMap: MapLayer;
}

export class MapView extends React.Component<Props, State> {

    private mapContainer: MapContainer;
    private layer: any;
    private mapDiv: string;
    private minZoom: number;
    private maxZoom: number;
    private ref: (element: HTMLElement)=>void;
    private displayBoxRef;

    constructor(props: Props) {
        let selectedBaseMap = props.selectedBaseMap;
        if (typeof selectedBaseMap === 'string' || selectedBaseMap instanceof String) {
            selectedBaseMap = { mapUrl: props.selectedBaseMap } as MapLayer;
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
        const { zoom, minZoom, maxZoom } = this.props;
        this.mapContainer = new MapContainer(zoom, minZoom, maxZoom);
        
        const map = this.mapContainer.getMap();

        this.mapContainer.addRasterTileLayer(this.state.selectedBaseMap.mapUrl, this.props.copyright);
        const geojsonLayer = this.mapContainer.addFeatureLayer(this.props.geojson);
        map.getView().fit(geojsonLayer.getSource().getExtent(), map.getSize());

        if (this.props.zoom) {
            map.getView().setZoom(this.props.zoom);
        }

        map.on('moveend', () => {
            if (this.props.setZoom) {
                this.props.setZoom(null, map.getView().getZoom());
            }
        });


        if (!this.props.moveable) {
            this.ref = this.mapContainerRef;
        }

        map.setTarget(this.mapDiv);
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<{}>, snapshot?: any): void {
        if (this.props.zoom) {
            this.mapContainer.getMap().getView().setZoom(this.props.zoom);
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
        this.mapContainer.getMap().setTarget(null);
        this.mapContainer = null;
    }

    private initializeOpenLayers() {
        const zoomLevels = 20;
        const resolutions = getResolutions(zoomLevels, null);
        let tileGrid = new TileGrid({
            extent: [-180, -90, 180, 90],
            resolutions: resolutions
        });
        
        //
        // this.map.on('moveend', () => {
        //     if (this.props.setZoom) {
        //         this.props.setZoom(null, this.map.getView().getZoom());
        //     }
        // });
        // this.layer = base;
        // // Hook up the click to query feature data
        // this.map.on('click', (event) => {
        //         this.displayBoxRef.handleMapClick(getTileCoordinateFromClick(event, this.layer, this.map))
        //     }
        // );
    }

    render() {
        return (
            <div style={{ height: '100%', width: '100%' }} id={this.mapDiv} ref={this.mapContainerRef}>
                <div
                    style={{
                        position: 'absolute',
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                    }}
                >
                    <MapQueryDisplay
                        ref={child => {
                            this.displayBoxRef = child
                        }}
                        selectedLayer={this.state.selectedBaseMap}
                    />
                </div>
            </div>
        );
    }
}
