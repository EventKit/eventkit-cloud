import React, {
    createContext,
    useContext,
} from 'react'
import {ProviderLimits} from "../EstimateContainer";

// TODO: refactor app to remove all legacy context references -- switch to this
export interface JobValidationContext {
    providerLimits: ProviderLimits[];
    aoiHasArea: boolean;
}

const appContext = createContext<JobValidationContext>({} as JobValidationContext);

export const useJobValidationContext = (): JobValidationContext => useContext(appContext);
export const JobValidationConsumer = appContext.Consumer;
export const JobValidationProvider = appContext.Provider;

