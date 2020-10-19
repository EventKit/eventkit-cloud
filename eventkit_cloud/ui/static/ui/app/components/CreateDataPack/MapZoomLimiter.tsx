import * as React from 'react';
import { useEffect, useState } from 'react';
import { RegionJustification } from '../StatusDownloadPage/RegionJustification';
import { useEffectOnMount, useProviderIdentity } from '../../utils/hooks/hooks';

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
    useEffect(() => {
        if (forceZoomOut) {
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

    const [displayDialog, setDisplayDialog] = useState(true);

    useEffect(() => {
        setDisplayDialog(true);
        setForceZoomOut(true);
    }, [provider?.slug]);

    if (displayDialog) {
        return (
            <RegionJustification
                providers={[provider]}
                extent={extent}
                onClose={() => { setForceZoomOut(true); setDisplayDialog(false); }}
                onBlockSignal={() => setForceZoomOut(true)}
                onUnblockSignal={() => setForceZoomOut(false)}
            />
        );
    }
    return null;
}
