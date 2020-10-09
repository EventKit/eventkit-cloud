import React, {
    createContext, useCallback,
    useContext, useEffect, useState,
} from 'react'
import {ApiStatuses, useAsyncRequest} from "../../../utils/hooks/api";
import {getCookie} from "../../../utils/generic";

export interface RegionContext {
    getPolicies: () => void;
    isFetching: boolean;
    hasError: boolean;
    policies: Eventkit.RegionPolicy[];
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

    const [isFetching, setIsFetching] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [ responseData, setResponseData ] = useState();
    useEffect(() => {
        setIsFetching(ApiStatuses.isFetching(status));
        setHasError(ApiStatuses.isError(status));
        if (ApiStatuses.isSuccessful(status)) {
            setResponseData(response.data);
        }
    }, [status]);

    return (
        <_RegionProvider value={{
            getPolicies: makeRequest,
            isFetching,
            hasError,
            policies: responseData,
        }}>
            {props.children}
        </_RegionProvider>
    );
}