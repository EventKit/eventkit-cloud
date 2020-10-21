import * as React from 'react';
import { useEffect, useState } from 'react';
import { RegionJustification } from '../StatusDownloadPage/RegionJustification';

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

    const [forceZoomOut, setForceZoomOut] = useState(false);
    const [updateZoom, setUpdateZoom] = useState(false);
    const [displayDialog, setDisplayDialog] = useState(true);
    useEffect(() => {
        if (forceZoomOut && !displayDialog) {
            if ((!!zoomLevel || zoomLevel === 0) && olZoom > zoomLevel) {
                setUpdateZoom(true);
            }
        }
    }, [olZoom, forceZoomOut]);

    useEffect(() => {
        if (map) {
            setUpdateZoom(false);
            map.getView().setZoom(zoomLevel - 1);
        }
    }, [updateZoom]);

    useEffect(() => {
        setDisplayDialog(true);
        setForceZoomOut(true);
    }, [provider?.slug]);

    if (displayDialog && (!!zoomLevel || zoomLevel === 0) && olZoom > zoomLevel) {
        return (
            <RegionJustification
                providers={[provider]}
                extents={extent}
                onClose={() => { setForceZoomOut(true); setDisplayDialog(false); }}
                onBlockSignal={() => setForceZoomOut(true)}
                onUnblockSignal={() => setForceZoomOut(false)}
            />
        );
    }
    return null;
}
