import Account from '../../components/AccountPage/Account';
import { screen, fireEvent, within } from '@testing-library/react';
import "@testing-library/jest-dom/extend-expect";
import * as TestUtils from '../test-utils';
import {getDefaultTestState} from "../test-utils";
import createTestStore from "../test-utils/createTestStore";

describe('Account Component', () => {
    const getInitialState = (defaultState) => {
        return {
            ...defaultState,
            user: {
                data: {
                    user: {
                        username: 'admin',
                        email: 'admin@admin.com',
                        date_joined: '2016-06-15T14:25:19Z',
                        last_login: '2016-06-15T14:25:19Z',
                    },
                    accepted_licenses: {
                        test1: false,
                        test2: false,
                    },
                },
                status: {
                    isLoading: false,
                    patched: false,
                    patching: false,
                    error: null,
                },
            },
            licenses: {
                error: null,
                fetched: false,
                fetching: false,
                licenses: [
                    { slug: 'test1', name: 'testname1', text: 'testtext1' },
                    { slug: 'test2', name: 'testname2', text: 'textext2' },
                ],
            },
        }
    }

    it('should render an header with save button, and body with license info and user info', () => {
        const testState = getInitialState(getDefaultTestState());
        TestUtils.renderComponent(<Account />, {
            initialState: testState,
        });
        expect(screen.getByText('Account'));
        expect(screen.getByText('Save Changes'));
        expect(screen.getByText('testtext1'));
        expect(screen.getByText('admin'));
    });

    it('should not render license info or or user info',() => {
        const testState = getInitialState(getDefaultTestState());
        testState.user.data.user = {};
        TestUtils.renderComponent(<Account />, {
            initialState: testState,
        });
        expect(screen.queryByTestId('userInfo')).toBeNull();
    });

    it('handleCheck should marked the license as checked/unchecked and update state', () => {
        const testState = getInitialState(getDefaultTestState());
        TestUtils.renderComponent(<Account />, {
            initialState: testState,
        });

        const test1Checkbox = within(screen.getByTestId('testname1-checkbox')).getByRole('checkbox');
        fireEvent.click(test1Checkbox);
        expect(test1Checkbox).toBeChecked();
    });

    it('handleAll should check all as checked/unchecked', () => {
        const testState = getInitialState(getDefaultTestState());
        TestUtils.renderComponent(<Account />, {
            initialState: testState,
        });

        const allCheckbox = within(screen.getByTestId('allCheckbox')).getByRole('checkbox');
        fireEvent.click(allCheckbox);

        const test1Checkbox = within(screen.getByTestId('testname1-checkbox')).getByRole('checkbox');
        const test2Checkbox = within(screen.getByTestId('testname2-checkbox')).getByRole('checkbox');
        expect(test1Checkbox).toBeChecked();
        expect(test2Checkbox).toBeChecked();
    });

    it('handleAll should not uncheck already agreed licenses', () => {
        const testState = getInitialState(getDefaultTestState());
        testState.user.data.accepted_licenses = {
            test1: true,
            test2: false,
        };
        TestUtils.renderComponent(<Account />, {
            initialState: testState,
        });

        const allCheckbox = within(screen.getByTestId('allCheckbox')).getByRole('checkbox');
        fireEvent.click(allCheckbox);

        const test1Checkbox = within(screen.getByTestId('testname1-checkbox')).getByRole('checkbox');
        expect(test1Checkbox).toBeChecked();
    });

    it('handleSubmit should call patchUser', () => {
        const testState = getInitialState(getDefaultTestState());
        TestUtils.renderComponent(<Account />, {
            initialState: testState,
            store: createTestStore(testState)
        });

        const allCheckbox = within(screen.getByTestId('allCheckbox')).getByRole('checkbox');
        fireEvent.click(allCheckbox);

        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);
    });
});
