import React, {useEffect, useState} from 'react';
import {hasOwnProperty} from 'tslint/lib/utils';
import RegionalJustificationDialog from '../Dialog/RegionalJustification/RegionalJustificationDialog';
import {useRegionContext} from '../common/context/RegionContext';
import {DepsHashers, useEffectOnMount, useProviderIdentity} from '../../utils/hooks/hooks';
import {convertGeoJSONtoJSTS, covers} from '../../utils/mapUtils';
import {arrayHasValue} from '../../utils/generic';

interface Props {
    providers: Eventkit.Provider[];
    extent?: GeoJSON.Feature;
    onClose?: (...args: any) => void;
    onBlockSignal?: () => void;
    onUnblockSignal?: () => void;
}

RegionJustification.defaultProps = {
    onBlockSignal: () => undefined,
    onUnblockSignal: () => undefined,
    onClose: () => undefined,
} as Props;

export function RegionJustification(props: React.PropsWithChildren<Props>) {
    const {providers, extent} = props;
    const {
        policies, getPolicies, submittedPolicies, submitPolicy,
    } = useRegionContext();
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

    const [providerPolicyMap, setProviderPolicyMap] = useState(undefined);
    useProviderIdentity(() => {
        const policyMap = {};
        const providerSlugs = providers.map((_provider) => _provider.slug);
        policies.forEach((_policy) => {
            _policy.providers.forEach((_provider) => {
                if (arrayHasValue(providerSlugs, _provider.slug)) {
                    if (!hasOwnProperty(policyMap, _policy.uid)) {
                        policyMap[_policy.uid] = [];
                    }
                    policyMap[_policy.uid].append(_provider.slug);
                }
            });
        });

        setProviderPolicyMap((Object.keys(policyMap).length) ? policyMap : undefined);
    }, providers, [policies]);

    const [isBlocked, setIsBlocked] = useState(false);

    function blockSignal() {
        setIsBlocked(true);
        props.onBlockSignal();
    }

    function unblockSignal() {
        setIsBlocked(false);
        props.onUnblockSignal();
    }

    if (justificationSubmitted && policyIntersected && providerPolicyMap) {
        const entries = Object.entries(justificationSubmitted);
        const intersectionEntries = Object.entries(policyIntersected);

        const policiesNotSubmitted = !Object.values(entries).every(([, isSubmitted]) => isSubmitted);
        const restrictedRegionsPresent = intersectionEntries.length && Object.values(intersectionEntries).every(
            ([, hasIntersection]) => hasIntersection,
        );

        if (policiesNotSubmitted && restrictedRegionsPresent) {
            // Grab the first policy that hasn't been submitted.
            const [policyUid] = entries.find(([, value]) => !value);
            const policy = policies.find((_policy) => _policy.uid === policyUid);
            if (!isBlocked) {
                blockSignal();
            }
            return (
                <>
                    <RegionalJustificationDialog
                        isOpen
                        onClose={props.onClose}
                        onSubmit={() => submitJustification(policyUid)}
                        policy={policy}
                    />
                    {props.children}
                </>
            );
        }
    }
    if (isBlocked) {
        unblockSignal();
    }
    return null;
}
