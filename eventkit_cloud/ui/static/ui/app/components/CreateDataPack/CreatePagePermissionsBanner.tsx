import * as React from 'react';
import { useEffectOnMount } from '../../utils/hooks';
import PermissionsBanner from '../PermissionsBanner';
import {useState} from "react";

export function CreatePagePermissionsBanner(props: {
    providers: Eventkit.Provider[],
    step: number,
    setBannerOpen: (val: boolean) => void;
}) {
    function areProvidersHidden(): boolean {
        return props.providers.some(provider => provider.hidden === true);
    }

    useEffectOnMount(() => {
        if (areProvidersHidden()) {
            props.setBannerOpen(true);
        }
    });

    const [shouldDisplay, setShouldDisplay] = useState(() => areProvidersHidden());

    function handleClose() {
        setShouldDisplay(false);
        props.setBannerOpen(false);
    }

    if (props.step === 3 || !shouldDisplay) {
        return null;
    }

    return (
        <PermissionsBanner handleClosedPermissionsBanner={handleClose} />
    );
}
