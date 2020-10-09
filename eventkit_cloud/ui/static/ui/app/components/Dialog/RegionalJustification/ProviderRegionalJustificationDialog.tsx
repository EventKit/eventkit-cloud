import React, {useEffect, useState} from 'react';
import {ApiStatuses, useAsyncRequest} from '../../../utils/hooks/api';
import { getCookie } from '../../../utils/generic';
import RegionalJustificationDialog, { RegionalJustificationDialogPropsBase, renderIf } from './RegionalJustificationDialog';
import {DepsHashers} from "../../../utils/hooks/hooks";

interface ProviderDialogProps extends RegionalJustificationDialogPropsBase {
    provider?: Eventkit.Provider;
}

export function ProviderRegionJustificationDialog(props: ProviderDialogProps) {
    const {
        onClose, onSubmit,
    } = props;
    const [ policy, setPolicy ] = useState();
    const [{ status, response }, requestCall] = useAsyncRequest();
    const makeRequest = () => {
        requestCall({
            url: '/api/regions/policies',
            method: 'get',
            headers: { 'X-CSRFToken': getCookie('csrftoken') },
        }).then(() => undefined);
    };

    useEffect(() => {
        makeRequest();
    }, [DepsHashers.providerIdentityHash({slug:'osm', name:'osm'} as Eventkit.Provider)]);

    useEffect(() => {
        if (status === ApiStatuses.hookActions.SUCCESS) {
            setPolicy(response.data[0]);
        }
    }, [status])

    return renderIf(() => (
        <RegionalJustificationDialog
            isOpen
            policy={policy}
            onClose={onClose}
            onSubmit={onSubmit}
        />
    ), status !== ApiStatuses.hookActions.NOT_FIRED);
}

export default ProviderRegionJustificationDialog;