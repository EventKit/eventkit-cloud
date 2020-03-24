import React, {useEffect} from 'react';
import { useOlZoom} from "../MapTools/context/OpenLayersContext";

interface Props {
    setZoom: (minZoom: number, maxZoom: number) => void;
}

function ZoomUpdater(props: Props) {
    const zoomContext = useOlZoom();

    useEffect(() => {
        props.setZoom(null, zoomContext.zoomLevel);
    }, [zoomContext.zoomLevel, props.setZoom]);

    return null;
}

export default ZoomUpdater;
