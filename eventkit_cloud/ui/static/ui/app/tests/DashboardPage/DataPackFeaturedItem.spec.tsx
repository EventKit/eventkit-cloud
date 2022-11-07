import { screen } from '@testing-library/react';
import "@testing-library/jest-dom/extend-expect";
import * as TestUtils from '../test-utils';
import moment from 'moment';

import DataPackFeaturedItem  from '../../components/DashboardPage/DataPackFeaturedItem';

describe('DataPackFeaturedItem component', () => {
    function defaultProps() {
        return {
            run: {
                uid: '6870234f-d876-467c-a332-65fdf0399a0d',
                created_at: '2017-03-10T15:52:35.637331Z',
                job: {
                    uid: '7643f806-1484-4446-b498-7ddaa65d011a',
                    name: 'Test1',
                    event: 'Test1 event',
                    description: 'Test1 description',
                },
                expiration: '2017-03-24T15:52:35.637258Z',
                extent: { type: 'FeatureCollection', features: [] }
            },
            gridName: 'test',
            index: 0,
            ...(global as any).eventkit_test_props,
            width: {},
            height: 'xl',
            runId: '6870234f-d876-467c-a332-65fdf0399a0d'
        };
    }

    function getInitialState(defaultState) {
        return {
            ...defaultState,
            exports: {
                data: {
                    runs: {
                        '6870234f-d876-467c-a332-65fdf0399a0d': {
                            uid: '6870234f-d876-467c-a332-65fdf0399a0d',
                            created_at: '2017-03-10T15:52:35.637331Z',
                            job: '7643f806-1484-4446-b498-7ddaa65d011a',
                            expiration: '2017-03-24T15:52:35.637258Z',
                            extent: {type: 'FeatureCollection', features: []}
                        }
                    },
                    jobs: {
                        '7643f806-1484-4446-b498-7ddaa65d011a': {
                            uid: '7643f806-1484-4446-b498-7ddaa65d011a',
                            name: 'Test1',
                            event: 'Test1 event',
                            description: 'Test1 description',
                            extent: {type: 'FeatureCollection', features: []}
                        }
                    }
                }
            }
        }
    }

    it('renders card title with correct text and props', () => {
        const props = {
            ...defaultProps(),
        };
        const defaultState = TestUtils.getDefaultTestState();
        const initialState = getInitialState(defaultState);
        TestUtils.renderComponent(<DataPackFeaturedItem {...props} />, {
            appContextConfig: {
                BASEMAP_URL: 'some url',
            },
            initialState
        });
        const titleComp = screen.getByText(props.run.job.name);
        const link = titleComp.closest('a');
        expect(titleComp).toBeInTheDocument();
        expect(link).toHaveAttribute('href', `/status/${props.run.job.uid}`);
    });

    it('renders card subtitle with correct text', () => {
        const props = {
            ...defaultProps(),
        };
        const defaultState = TestUtils.getDefaultTestState();
        const initialState = getInitialState(defaultState);
        TestUtils.renderComponent(<DataPackFeaturedItem {...props} />, {
            appContextConfig: {
                BASEMAP_URL: 'some url',
            },
            initialState
        });
        expect(screen.getByText(`Event: ${props.run.job.event}`));
        expect(screen.getByText(`Added: ${moment(props.run.created_at).format('M/D/YY')}`));
        expect(screen.getByText(`Expires: ${moment(props.run.expiration).format('M/D/YY')}`));
    });

    it('renders card text with the job description', () => {
        const props = {
            ...defaultProps(),
        };
        const defaultState = TestUtils.getDefaultTestState();
        const initialState = getInitialState(defaultState);
        TestUtils.renderComponent(<DataPackFeaturedItem {...props} />, {
            appContextConfig: {
                BASEMAP_URL: 'some url',
            },
            initialState
        });
        expect(screen.getByText(props.run.job.description));
    });
});
