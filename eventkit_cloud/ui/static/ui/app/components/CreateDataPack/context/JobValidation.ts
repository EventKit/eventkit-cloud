import React, {
    createContext,
    useContext,
} from 'react'
import {ProviderLimits} from "../EstimateContainer";

export interface JobValidationContext {
    providerLimits: ProviderLimits[];
    aoiHasArea: boolean;
    dataSizeInfo: {
        areEstimatesAvailable: boolean;
        providerEstimates: Eventkit.Map<Eventkit.Store.Estimates>;
        exceedingSize: string[];
    }
}

const appContext = createContext<JobValidationContext>({} as JobValidationContext);

export const useJobValidationContext = (): JobValidationContext => useContext(appContext);
export const JobValidationConsumer = appContext.Consumer;
export const JobValidationProvider = appContext.Provider;

