import React, { useEffect, useState } from 'react';
import RegionalJustificationDialog from '../Dialog/RegionalJustification/RegionalJustificationDialog';
import { useRegionContext } from '../common/context/RegionContext';
import { DepsHashers, useEffectOnMount, useProviderIdentity } from '../../utils/hooks/hooks';
import history from '../../utils/history';
import { convertGeoJSONtoJSTS, covers } from '../../utils/mapUtils';
import ZoomOutAtZoomLevel from './OpenLayers/ZoomOutAtZoomLevel';
import { renderIf } from '../../utils/renderIf';
import {arrayHasValue} from "../../utils/generic";

interface Props {
    providers: Eventkit.Provider[];
    extent?: GeoJSON.Feature;
}

export function MapJustification(props: React.PropsWithChildren<Props>) {
    const {providers, extent} = props;
    const {policies, getPolicies, submittedPolicies, submitPolicy} = useRegionContext();
    const [justificationSubmitted, setJustificationSubmitted] = useState<{ [uid: string]: boolean }>(undefined);
    const [policyIntersected, setPolicyIntersected] = useState<{ [uid: string]: boolean }>(undefined);

    useEffect(() => {
        if (extent && policies) {
            const extentAsJsts = convertGeoJSONtoJSTS(extent, 1, false);
            const policyIntersectedMap = {};
            policies.forEach((_policy) => {
                const policyRegion = convertGeoJSONtoJSTS(_policy.region, 1, false);
                if (covers(extentAsJsts, policyRegion)) {
                    policyIntersectedMap[_policy.uid] = true;
                }
            });
            setPolicyIntersected(policyIntersectedMap);
        }
    }, [extent?.id, policies]);

    function submitJustification(policyUid: string) {
        setJustificationSubmitted((prevState) => ({
            ...prevState,
            [policyUid]: true,
        }));
        submitPolicy(policyUid);
    }

    useEffectOnMount(() => {
        getPolicies();
    });

    useEffect(() => {
        if (!!policies && policies.length) {
            const policySubmittedMap = {};
            policies.forEach((_policy) => {
                policySubmittedMap[_policy.uid] = arrayHasValue(submittedPolicies, _policy.uid);
            });
            setJustificationSubmitted(policySubmittedMap);
        }
    }, [policies]);

    useProviderIdentity(() => {

    }, providers);

    const [forceZoomOut, setForceZoomOut] = useState(false);

    if (!forceZoomOut && justificationSubmitted && policyIntersected) {
        const entries = Object.entries(justificationSubmitted);
        const intersectionEntries = Object.entries(policyIntersected);
        const policiesNotSubmitted = !Object.values(entries).every(([, isSubmitted]) => isSubmitted);
        const restrictedRegionsPresent = intersectionEntries.length && Object.values(intersectionEntries).every(
            ([, hasIntersection]) => hasIntersection,
        );
        if (policiesNotSubmitted && restrictedRegionsPresent) {
            // Grab the first provider that hasn't been submitted.
            const [policyUid] = entries.find(([, value]) => !value);
            const policy = policies.find((_policy) => _policy.uid === policyUid);
            return (
                <RegionalJustificationDialog
                    isOpen
                    onClose={() => setForceZoomOut(true)}
                    onSubmit={() => submitJustification(policyUid)}
                    policy={policy}
                />
            );
        }
    } else if (forceZoomOut) {
        return (<ZoomOutAtZoomLevel zoomLevel={14} />);
    }
    return null;
}
