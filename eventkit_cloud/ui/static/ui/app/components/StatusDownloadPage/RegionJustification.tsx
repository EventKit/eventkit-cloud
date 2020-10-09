import React, { useEffect, useState } from 'react';
import RegionalJustificationDialog from '../Dialog/RegionalJustification/RegionalJustificationDialog';
import { useRegionContext } from '../common/context/RegionContext';
import { useEffectOnMount } from '../../utils/hooks/hooks';

interface Props {
    providers: Eventkit.Provider[];
}

export function RegionJustification(props: React.PropsWithChildren<any>) {
    const { providers } = props;
    const { policies, getPolicies } = useRegionContext();
    const [justificationSubmitted, setJustificationSubmitted] = useState<{ [uid: string]: boolean }>(undefined);

    function submitJustification(policyUid: string) {
        setJustificationSubmitted((prevState) => ({
            ...prevState,
            [policyUid]: true,
        }));
    }

    useEffectOnMount(async () => {
        getPolicies();
    });

    useEffect(() => {
        if (!!policies && policies.length) {
            const policySubmittedMap = {};
            policies.forEach((_policy) => {
                policySubmittedMap[_policy.uid] = false;
            });
            setJustificationSubmitted(policySubmittedMap);
        }
    }, [policies]);

    const entries = Object.entries(justificationSubmitted);
    if (!Object.values(entries).every(([, value]) => value)) {
        // Grab the first provider that hasn't been submitted.
        const [policyUid] = entries.find(([, value]) => !value);
        const policy = policies.find((_policy) => _policy.uid === policyUid);
        return (
            <RegionalJustificationDialog
                isOpen
                onClose={() => console.log('leave page')}
                onSubmit={() => submitJustification(policyUid)}
                policy={policy}
            />
        );
    }
    return (
        <div>hello</div>
    );
}
