import React from 'react';
import {MapLayer} from "../../CreateDataPack/CreateExport";
import {useOlMapContainer} from "../context/OpenLayersContext";
import {useEffectOnMount} from "../../../utils/hooks";

interface Props {
    mapLayer: MapLayer;
    zIndex?: number;
    copyright?: string;
}

function OlRasterTileLayer(props: Props) {
    const olMapContext = useOlMapContainer();
    const mapContainer = olMapContext.mapContainer;


    const { mapLayer, zIndex, copyright } = props;

    useEffectOnMount(() => {
        mapContainer.addRasterTileLayer(mapLayer.mapUrl, copyright, zIndex);
    });

    return null;
}

export default OlRasterTileLayer;