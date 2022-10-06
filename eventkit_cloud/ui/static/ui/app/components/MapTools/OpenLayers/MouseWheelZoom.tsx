import { useEffect } from 'react';
import {useOlMapContainer} from "../context/OpenLayersContext";
import MouseWheelZoom from "ol/interaction/MouseWheelZoom";


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
        mapContainer.getInteraction(MouseWheelZoom as any).setActive(props.enabled);
    }, [props.enabled]);

    return null;
}

export default OlMouseWheelZoom;
