import React, { useEffect, useState } from 'react';
import { useOlMapContainer, useOlZoom } from '../context/OpenLayersContext';

interface Props {
    zoomLevel?: number; // If specified, zoom to this level after fitting extent.
}

function ZoomOutAtZoomLevel(props: Props) {
    const { zoomLevel } = props;

    const olMapContext = useOlMapContainer();
    const { mapContainer } = olMapContext;
    const zoomContext = useOlZoom();

    // We first check to see if the zoom level should be updated, then set a flag if so
    // We update the zoom level through open layers on the next render to avoid issues where the previous
    // zoom update doesn't finish until after we try to update the zoom in this component.
    const [updateZoom, setUpdateZoom] = useState(false);

    useEffect(() => {
        if ((!!zoomLevel || zoomLevel === 0) && zoomContext.zoomLevel > zoomLevel) {
            setUpdateZoom(true);
        }
    }, [zoomContext.zoomLevel]);

    useEffect(() => {
        setUpdateZoom(false);
        mapContainer.getMap().getView().setZoom(2);
    }, [updateZoom]);

    return null;
}

export default ZoomOutAtZoomLevel;
