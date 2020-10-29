import React, {
    createContext,
    useContext,
} from 'react'
import {ProviderLimits} from "../EstimateContainer";

export interface FormatContext {

}

const appContext = createContext<FormatContext>({} as FormatContext);

export const useFormatContext = (): FormatContext => useContext(appContext);
export const FormatConsumer = appContext.Consumer;
export const FormatProvider = appContext.Provider;

