import React, {
    createContext,
    useContext,
} from 'react'
import {MapContainer} from "../../../utils/mapBuilder";

export interface OlContext {
    mapContainer: MapContainer
}

const openLayersContext = createContext<OlContext>({} as OlContext);
export const useOlMapContainer = (): OlContext => useContext(openLayersContext);
export const OlMapProvider = openLayersContext.Provider;


interface ZoomContext {
    zoomLevel: number;  // The floored version of the openlayers zoom
    olZoomLevel: number; // The current real floating value of zoomLevel according to openlayers.
    setZoom: (zoomLevel: number) => void;
}

const zoomContext = createContext<ZoomContext>(null);
export const useOlZoom = (): ZoomContext => useContext(zoomContext);
export const OlZoomProvider = zoomContext.Provider;
