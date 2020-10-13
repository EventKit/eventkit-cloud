import React, {
    createContext, useCallback,
    useContext, useEffect, useState,
} from 'react'
import {ApiStatuses, useAsyncRequest} from "../../../utils/hooks/api";
import {arrayHasValue, getCookie} from "../../../utils/generic";
import set = Reflect.set;

export interface RegionContext {
    getPolicies: () => void;
    isFetching: boolean;
    hasError: boolean;
    policies: Eventkit.RegionPolicy[];
    submittedPolicies: string[];
    submitPolicy: (uid: string) => void;
}

const regionContext = createContext<RegionContext>({} as RegionContext);

export const useRegionContext = (): RegionContext => useContext(regionContext);
export const RegionConsumer = regionContext.Consumer;
export const _RegionProvider = regionContext.Provider;


export function RegionsProvider(props: React.PropsWithChildren<any>) {
    const [{status, response}, requestCall] = useAsyncRequest();
    const makeRequest = () => {
        requestCall({
            url: '/api/regions/policies',
            method: 'get',
            headers: {'X-CSRFToken': getCookie('csrftoken')},
        }).then(() => undefined);
    };

    const [submittedSet, setSubmittedSet] = useState([]);
    const [isFetching, setIsFetching] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [responseData, setResponseData] = useState();
    useEffect(() => {
        setIsFetching(ApiStatuses.isFetching(status));
        setHasError(ApiStatuses.isError(status));
        if (ApiStatuses.isSuccess(status)) {
            const policies = response.data;
            setResponseData(policies);
        }
    }, [status]);

    function submitPolicy(uid: string) {
        if (!arrayHasValue(submittedSet, uid)) {
            submittedSet.push(uid);
        }
    }

    return (
        <_RegionProvider value={{
            getPolicies: makeRequest,
            isFetching,
            hasError,
            policies: responseData,
            submitPolicy,
            submittedPolicies: submittedSet
        }}>
            {props.children}
        </_RegionProvider>
    );
}