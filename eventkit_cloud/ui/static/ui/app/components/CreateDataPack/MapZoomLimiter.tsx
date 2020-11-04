import * as React from 'react';
import {useEffect, useRef, useState} from 'react';
import {RegionJustification} from '../StatusDownloadPage/RegionJustification';

interface Props {
    map: any;
    provider: Eventkit.Provider;
    extent: any;
    zoomLevel: number;
}

export function MapZoomLimiter(props: Props) {
    const {
        map, provider, extent, zoomLevel,
    } = props;

    const [olZoom, setOlZoom] = useState(2);
    useEffect(() => {
        if (map) {
            map.getView().on('change:resolution', () => setOlZoom(map.getView().getZoom()));
        }
        // Realistically with the current design, map should never change
    }, [map]);

    const [displayDialog, setDisplayDialog] = useState(false);
    useEffect(() => {
        if (!displayDialog) {
            if ((!!zoomLevel || zoomLevel === 0) && olZoom > zoomLevel) {
                setDisplayDialog(true);
            }
        }
    }, [olZoom]);

    if (displayDialog) {
        return (
            <RegionJustification
                providers={[provider]}
                extents={extent}
                onClose={() => {
                    map.getView().setZoom(2);
                    setDisplayDialog(false);
                }}
            />
        );
    }
    return null;
}
