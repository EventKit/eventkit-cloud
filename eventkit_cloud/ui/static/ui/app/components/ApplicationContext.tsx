import { createContext, useContext } from 'react';

// TODO: refactor app to remove all legacy context references -- switch to this
export interface ApplicationContext {
    BANNER_BACKGROUND_COLOR?: string;
    BANNER_TEXT?: string;
    BANNER_TEXT_COLOR?: string;
    BASEMAP_COPYRIGHT?: string;
    BASEMAP_URL?: string;
    LOGIN_DISCLAIMER?: string;
    MAX_DATAPACK_EXPIRATION_DAYS?: string;
    USER_GROUPS_PAGE_SIZE?: string;
    DATAPACK_PAGE_SIZE?: string;
    NOTIFICATIONS_PAGE_SIZE?: string;
    VERSION?: string;
    CONTACT_URL?: string;
    SERVE_ESTIMATES?: boolean
    DATAPACKS_DEFAULT_SHARED?: boolean;
    DATA_PROVIDER_WINDOW?: number;
}

const appContext = createContext<ApplicationContext>({} as ApplicationContext);

export const useAppContext = (): ApplicationContext => useContext(appContext);
export const AppConfigConsumer = appContext.Consumer;
export const AppConfigProvider = appContext.Provider;

