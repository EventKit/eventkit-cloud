import { connectRouter } from 'connected-react-router';
import { initialState as authState } from '../../reducers/authReducer';
import { initialState as dataCartState } from '../../reducers/datacartReducer';
import { initialState as geocodeState } from '../../reducers/geocodeReducer';
import { initialState as fileState } from '../../reducers/fileReducer';
import { user as userState } from '../../reducers/userReducer';
import { initialState as uiState } from '../../reducers/uiReducer';
import { initialStateProviders, initialStateProviderTasks } from '../../reducers/providerReducer';
import { initialState as licenseState } from '../../reducers/licenseReducer';
import { initialState as formatState } from '../../reducers/formatReducer';
import { initialState as usersState } from '../../reducers/usersReducer';
import { initialState as groupState } from '../../reducers/groupReducer';
import { initialState as notificationState } from '../../reducers/notificationsReducer';
import { initialState as projectionState } from '../../reducers/projectionReducer';
import { initialState as topicsState } from '../../reducers/topicsReducer';
import { initialState as datapackState, exports as runsState } from '../../reducers/datapackReducer';
import history from '../../utils/history';

const initialTestState = {
    auth: authState,
    aoiInfo: dataCartState.aoiInfo,
    exportInfo: dataCartState.exportInfo,
    geocode: geocodeState,
    importGeom: fileState,
    user: userState.status,
    router: connectRouter(history),
    drawer: uiState.drawer,
    providers: initialStateProviders,
    stepperNextEnabled: uiState.stepperNextEnabled,
    submitJob: dataCartState.submitJob,
    datacartDetails: datapackState.datacartDetails,
    runDeletion: datapackState.runDeletion,
    exportReRun: dataCartState.exportReRun,
    licenses: licenseState,
    updateExpiration: datapackState.updateExpiration,
    updatePermission: dataCartState.updatePermission,
    formats: formatState,
    groups: groupState,
    users: usersState,
    notifications: notificationState,
    exports: runsState,
    providerTasks: initialStateProviderTasks,
    projections: projectionState,
    topics: topicsState,
};

export const getDefaultTestState = () => {
    return { ...initialTestState };
}
