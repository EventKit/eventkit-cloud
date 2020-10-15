import React, {useEffect, useState} from 'react';
import {useOlMapContainer, useOlZoom} from '../context/OpenLayersContext';
import { ReceivesVectorLayer } from './OlFeatureLayer';
import {useEffectOnMount} from "../../../utils/hooks/hooks";

interface Props extends ReceivesVectorLayer {
    zoomLevel?: number; // If specified, zoom to this level after fitting extent.
}

function ZoomOutAtZoomLevel(props: Props) {
    const { vectorLayer, zoomLevel } = props;

    const olMapContext = useOlMapContainer();
    const { mapContainer } = olMapContext;
    const zoomContext = useOlZoom();
    useEffectOnMount(() => {
        const noop = 0;
        return function cleanup() {
            const olMap = mapContainer.getMap();
            olMap.getView().setZoom(zoomLevel);
        };
    });

    useEffect(() => {
        const olMap = mapContainer.getMap();
        // olMap.getView().fit(vectorLayer.getSource().getExtent(), olMap.getSize());
        if ((!!zoomLevel || zoomLevel === 0) && zoomContext.zoomLevel > zoomLevel) {
            olMap.getView().setZoom(2);
        }
    }, [zoomContext.zoomLevel]);

    return null;
}

export default ZoomOutAtZoomLevel;
