import Map from "ol/map";
import TileGrid from "ol/tilegrid/tilegrid";
import View from "ol/view";
import interaction from "ol/interaction";
import ScaleLine from "ol/control/scaleline";
import ol3mapCss from "../styles/ol3map.css";
import Attribution from "ol/control/attribution";
import Zoom from "ol/control/zoom";
import {getResolutions} from "./mapUtils";
import VectorSource from "ol/source/vector";
import GeoJSON from "ol/format/geojson";
import VectorLayer from "ol/layer/vector";
import Layer from "ol/layer/layer";
import Tile from "ol/layer/tile";
import XYZ from "ol/source/xyz";
import Observable from "ol/observable";

const DEFAULT_EPSG_CODE = 4326;

export class MapContainer {
    private readonly mapEpsgCode;
    getEpsg = () => `EPSG:${this.mapEpsgCode}`;

    private readonly olMap: Map;
    getMap = () => { return this.olMap; };

    private readonly tileGrid: TileGrid;
    getTileGrid = () => { return this.tileGrid; };

    layerCount = () => this.olMap.getLayers().length;

    private readonly clickEvents: { [key: string]: () => void; } = {};

    // Construct an openLayers Map object and housing container
    // Map will not render until a target and at least one layer is specified.
    constructor(currentZoom: number, minZoom: number, maxZoom: number, epsgCode?: number) {
        if (!epsgCode) {
            this.mapEpsgCode = DEFAULT_EPSG_CODE;
        }
        const zoomLevels = maxZoom;
        const resolutions = getResolutions(zoomLevels, null);
        this.tileGrid = new TileGrid({
            extent: [-180, -90, 180, 90],
            resolutions,
        });

        this.olMap = new Map({
            view: new View({
                projection: this.getEpsg(),
                center: [0, 0],
                zoom: currentZoom,
                minZoom: minZoom,
                maxZoom: zoomLevels,
            }),
            interactions: interaction.defaults({
                keyboard: false,
                altShiftDragRotate: false,
                pinchRotate: false,
                mouseWheelZoom: true,
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

        this.olMap.on('click', this.onClick);
    }

    // Define as an arrow function to ensure `this` is captured correctly.
    private readonly onClick = () => {
        Object.values(this.clickEvents).map((event: () => void) => event());
    };

    addLayer(layer: Layer, zIndex?: number) : Layer {
        if (!zIndex && zIndex !== 0) {
            zIndex = this.layerCount();
        }
        layer.setZIndex(zIndex);
        this.olMap.addLayer(layer);
        return layer;
    }

    addFeatureLayer(geojson: any, zIndex?: number, epsgCode?: number) : VectorLayer {
        if (!epsgCode) {
            // if epsgCode is not passed, default to 4326
            epsgCode = this.mapEpsgCode;
        }
        if (!zIndex && zIndex !== 0) {
            zIndex = this.layerCount();
        }
        const source = new VectorSource();
        const features = new GeoJSON().readFeatures(geojson, {
            featureProjection: this.getEpsg(),  // Output SRS, should match Map SRS
            dataProjection: `EPSG:${epsgCode}`,  // Source SRS, i.e. the srs of the features being added to the map.
        } as any);
        source.addFeatures(features);
        const layer = new VectorLayer({
            source,
        });
        return this.addLayer(layer, zIndex) as VectorLayer;
    }

    addRasterTileLayer(tiledUrl: string, attributions?: string, zIndex?: number) : Tile {
        const layer = new Tile({
            source: new XYZ({
                projection: this.getEpsg(),
                url: tiledUrl,
                wrapX: true,
                attributions: attributions,
                tileGrid: this.tileGrid,
            }),
        });
        return this.addLayer(layer, zIndex) as Tile;
    }

    getInteraction(interactionType: typeof interaction.Interaction) : interaction.Interaction {
        // Returns a specific Interaction from the map by type, may return undefined if not added to the collection.
        return this.olMap.getInteractions().find(i => i instanceof interactionType);
    }

    addListener(eventTypeKey: string, callback: () => void) {
        // Wrapper of Map.on that returns a key that can be used with Observable.unByKey to remove an event
        return this.olMap.on(eventTypeKey, callback);
    }

    removeListener(listenerKey) {
        Observable.unByKey(listenerKey);
    }
}