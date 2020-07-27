import React, {useEffect, useRef, useState} from 'react';
import {MapLayer} from "../../CreateDataPack/CreateExport";
import {useOlMapContainer} from "../context/OpenLayersContext";
import {useEffectOnMount} from "../../../utils/hooks/hooks";
import set = Reflect.set;

interface Props {
    mapLayer: MapLayer;
    zIndex?: number;
    copyright?: string;
}

function OlRasterTileLayer(props: Props) {
    const olMapContext = useOlMapContainer();
    const mapContainer = olMapContext.mapContainer;
    const layerRef = useRef(null);

    const { mapLayer, zIndex, copyright } = props;
    useEffect(() => {
        layerRef.current = (mapContainer.addRasterTileLayer(mapLayer.mapUrl, copyright, zIndex));
        return () => mapContainer.removeLayer(layerRef.current);
    }, [mapLayer.mapUrl, copyright, zIndex]);

    return null;
}

export default OlRasterTileLayer;
