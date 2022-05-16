import { createContext, useContext } from 'react';

export interface RunContext {
    run: Eventkit.FullRun;
}

const runContext = createContext<RunContext>({} as RunContext);

export const useRunContext = (): RunContext => useContext(runContext);
export const RunProvider = runContext.Provider;
