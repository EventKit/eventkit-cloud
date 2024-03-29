import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from "axios";
import { getCookie, getHeaderPageInfo } from "../utils/generic";

interface UsersState {
    users: [],
    error: string,
    total: number,
    range: string,
    nextPage: boolean,
    fetching: boolean,
    fetched: boolean,
    currentRequestId: string,
}

export const initialState = {
    users: [],
    fetching: null,
    fetched: null,
    error: null,
    total: 0,
    range: '',
    nextPage: false,
    currentRequestId: undefined,
} as UsersState;

export const getUsers = createAsyncThunk(
    'users/getUsers',
    async (params: {append?: boolean}, thunkAPI) => {
        const csrftoken = getCookie('csrftoken');
        const append = params.append || false;
        const response = await axios.get('/api/users', {
            params,
            headers: {'X-CSRFToken': csrftoken,},
        });
        const totalUsers = Number(response.headers['total-users']);
        const {nextPage, range} = getHeaderPageInfo(response);
        return {
            users: response.data,
            append,
            total: totalUsers,
            range,
            nextPage,
        };
    }
);

export const getPermissionUsers = createAsyncThunk(
    'users/getPermissionsUsers',
    async (params: {jobUid: string, append?: boolean}, thunkAPI) => {
        const csrftoken = getCookie('csrftoken');
        const append = params.append || false;
        const response = await axios.get(`/api/users?job_uid=${params.jobUid}`, {
            params,
            headers: { 'X-CSRFToken': csrftoken, },
        });
        const totalUsers = Number(response.headers['total-users']);
        const { nextPage, range } = getHeaderPageInfo(response);
        return {
            users: response.data,
            append,
            total: totalUsers,
            range,
            nextPage,
        };
    }
);

export const usersSlice = createSlice({
    name: 'users',
    initialState,
    reducers: {
        // standard reducer logic, with auto-generated action types per reducer
        clearUsers(state) {
            return {
                ...initialState,
            };
        },
    },
    extraReducers: (builder) => {
        builder.addCase(getUsers.fulfilled, (state, action) => {
            // Only handle changes from request if it is coming from current request id
            if (state.currentRequestId !== action.meta.requestId) {
                return {
                    ...state,
                };
            }

            return {
                ...state,
                fetching: false,
                fetched: true,
                users: action.payload.append ? [...state.users, ...action.payload.users] : action.payload.users,
                total: action.payload.total,
                range: action.payload.range,
                nextPage: action.payload.nextPage,
                currentRequestId: undefined,
            };
        }).addCase(getUsers.pending, (state, action) => {
            return {
                ...state,
                error: null,
                fetching: true,
                fetched: false,
                currentRequestId: action.meta.requestId,
            };
        }).addCase(getUsers.rejected, (state, action) => {
            return {
                ...state,
                fetching: false,
                fetched: false,
                error: action.error.message,
                total: 0,
                range: '',
                nextPage: false,
                currentRequestId: undefined,
            };
        }).addCase(getPermissionUsers.fulfilled, (state, action) => {
            if (state.currentRequestId !== action.meta.requestId) {
                return {
                    ...state,
                };
            }
            return {
                ...state,
                fetching: false,
                fetched: true,
                users: action.payload.append ? [...state.users, ...action.payload.users] : action.payload.users,
                total: action.payload.total,
                range: action.payload.range,
                nextPage: action.payload.nextPage,
                currentRequestId: undefined,
            };
        }).addCase(getPermissionUsers.pending, (state, action) => {
            return {
                ...state,
                error: null,
                fetching: true,
                fetched: false,
                currentRequestId: action.meta.requestId,
            };
        }).addCase(getPermissionUsers.rejected, (state, action) => {
            return {
                ...state,
                fetching: false,
                fetched: false,
                error: action.error.message,
                total: 0,
                range: '',
                nextPage: false,
                currentRequestId: undefined,
            };
        });
    },
});
