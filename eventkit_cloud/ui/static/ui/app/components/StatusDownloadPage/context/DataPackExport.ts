import {
    createContext,
    useContext,
} from 'react'

export interface ExportContext {
    setFetching: () => void;
}

const exportContext = createContext<ExportContext>({} as ExportContext);

export const useExportContext = (): ExportContext => useContext(exportContext);
export const ExportConsumer = exportContext.Consumer;
export const ExportProvider = exportContext.Provider;

