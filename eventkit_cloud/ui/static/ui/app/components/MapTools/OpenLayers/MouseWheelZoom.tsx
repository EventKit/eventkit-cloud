import React, {useEffect} from 'react';
import {useOlMapContainer, useOlZoom} from "../context/OpenLayersContext";
import {useEffectOnMount} from "../../../utils/hooks/hooks";
import MouseWheelZoom from "ol/interaction/mousewheelzoom";


interface Props {
    enabled?: boolean;
}

OlMouseWheelZoom.defaultProps = {
    enabled: true,
} as Props;


function OlMouseWheelZoom(props: Props) {

    const olMapContext = useOlMapContainer();
    const mapContainer = olMapContext.mapContainer;

    useEffect(() => {
        mapContainer.getInteraction(MouseWheelZoom).setActive(props.enabled);
    }, [props.enabled]);

    return null;
}

export default OlMouseWheelZoom;
