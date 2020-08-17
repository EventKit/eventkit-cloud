import {
    createContext,
    useContext,
} from 'react'

export interface DataCartContext {
    setFetching: () => void;
}

const dataCartContext = createContext<DataCartContext>({} as DataCartContext);

export const useDataCartContext = (): DataCartContext => useContext(dataCartContext);
export const DataCartConsumer = dataCartContext.Consumer;
export const DataCartProvider = dataCartContext.Provider;

