import React, {
    createContext,
    useContext,
} from 'react'
import {ProviderLimits} from "../EstimateContainer";

export interface JobValidationContext {
    providerLimits: ProviderLimits[];
    aoiHasArea: boolean;
    aoiArea: number;
    aoiBboxArea: number;
    dataSizeInfo: {
        haveAvailableEstimates: string[];
        providerEstimates: Eventkit.Map<Eventkit.Store.Estimates>;
        exceedingSize: string[];
        noMaxDataSize: string[];
    },
    areEstimatesLoading: boolean,
}

const appContext = createContext<JobValidationContext>({} as JobValidationContext);

export const useJobValidationContext = (): JobValidationContext => useContext(appContext);
export const JobValidationConsumer = appContext.Consumer;
export const JobValidationProvider = appContext.Provider;

