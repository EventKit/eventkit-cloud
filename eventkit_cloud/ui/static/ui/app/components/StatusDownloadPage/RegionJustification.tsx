import React, {useEffect, useState} from 'react';
import RegionalJustificationDialog from '../Dialog/RegionalJustification/RegionalJustificationDialog';
import {useRegionContext} from '../common/context/RegionContext';
import {DepsHashers, useEffectOnMount, useProviderIdentity} from '../../utils/hooks/hooks';
import {convertGeoJSONtoJSTS, covers} from '../../utils/mapUtils';
import {arrayHasValue} from '../../utils/generic';
import {object} from "prop-types";

interface Props {
    providers: Eventkit.Provider[];
    extents?: GeoJSON.Feature[];
    onClose?: (...args: any) => void;
    onBlockSignal?: () => void;
    onUnblockSignal?: () => void;
    display: boolean;
}

RegionJustification.defaultProps = {
    display: true,
    onBlockSignal: () => undefined,
    onUnblockSignal: () => undefined,
    onClose: () => undefined,
} as Props;

export function RegionJustification(props: React.PropsWithChildren<Props>) {
    const {providers, extents, display} = props;
    const {
        policies = [], getPolicies, submittedPolicies, submitPolicy,
    } = useRegionContext();

    useEffectOnMount(() => {
        getPolicies();
    });

    const [justificationSubmitted, setJustificationSubmitted] = useState<{ [uid: string]: boolean }>();
    const [policyExtents, setPolicyExtents] = useState<[string, boolean][]>();
    const [policyIntersections, setPolicyHasIntersection] = useState<[string, boolean][]>();
    const [policyProviders, setPolicyProviders] = useState<[string, boolean][]>();

    // This effect grabs policies once they're loaded and converts their region extent to JSTS
    useEffect(() => {
        if (policies && policies.length) {
            const policySubmittedMap = {};
            policies.forEach((_policy) => {
                policySubmittedMap[_policy.uid] = arrayHasValue(submittedPolicies, _policy.uid);
            });
            setJustificationSubmitted(policySubmittedMap);

            setPolicyExtents(policies.map(_policy => (
                [_policy.uid, convertGeoJSONtoJSTS(_policy.region, 1, false)]
            )));
        } else {
            setPolicyExtents(undefined);
        }
    }, [DepsHashers.uidHash(policies), DepsHashers.arrayHash(submittedPolicies)])

    useProviderIdentity(() => {
        const policyProviderSet = [];
        const providerSlugs = providers.map(_provider => _provider.slug);
        policies.forEach((_policy) => {
            const affectedProviders = [];
            _policy.providers.forEach(_provider => {
                if (arrayHasValue(providerSlugs, _provider.slug)) {
                    affectedProviders.push(_provider);
                }
            })
            if (affectedProviders.length) {
                policyProviderSet.push([_policy.uid, affectedProviders]);
            }
        })
        setPolicyProviders(policyProviderSet.length ? policyProviderSet : undefined);
    }, providers, [policies])

    // This effect checks for changes in policy extents and the extents we are checking against
    // It builds an array indicating which policies do intersect with the checked extents
    useEffect(() => {
        if (extents && extents.length && policyExtents) {
            setPolicyHasIntersection(
                policyExtents.map(([_policyUid, _policyExtent]) => (
                        [_policyUid, extents.some(_extent => {
                            return covers(convertGeoJSONtoJSTS(_extent, 1, false), _policyExtent)
                        })]
                    )
                )
            )
        } else {
            setPolicyHasIntersection(undefined);
        }
    }, [policyExtents, extents])

    const [policyToRender, setPolicyToRender] = useState(undefined);
    useEffect(() => {
        if (policyProviders && policyIntersections) {
            // Finds any policy where the region intersects with one of the specified extents
            // AND it has an affected provider AND no justification is submitted for that policy
            const foundPolicyPair = policyProviders.find(([_policyA,]) => {
                    if (justificationSubmitted[_policyA]) {
                        return false;
                    }
                    let policyFound = false;
                    let policyB, hasIntersection;
                    for (let _index = 0; _index < policyIntersections.length; _index = _index + 1) {
                        [policyB, hasIntersection] = policyIntersections[_index];
                        if (policyB === _policyA && hasIntersection) {
                            policyFound = true;
                            break;
                        }
                    }
                    return policyFound;
                }
            );
            if (foundPolicyPair) {
                // Policy not being found at this point should be considered a serious error
                const policy = policies.find(_policy => _policy.uid === foundPolicyPair[0]);
                setPolicyToRender(policy);
                props.onBlockSignal();
            } else {
                props.onUnblockSignal();
                setPolicyToRender(undefined)
            }
        }
    }, [policyIntersections, policyProviders, justificationSubmitted]);

    function submitJustification(policyUid: string) {
        setJustificationSubmitted((prevState) => ({
            ...prevState,
            [policyUid]: true,
        }));
        submitPolicy(policyUid);
    }

    if (policyToRender && display) {
        return (
            <>
                <RegionalJustificationDialog
                    isOpen
                    onClose={props.onClose}
                    onSubmit={() => submitJustification(policyToRender.uid)}
                    policy={policyToRender}
                />
                {props.children}
            </>
        );
    }
    return null;
}
