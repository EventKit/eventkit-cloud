import * as React from 'react';
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import {CreateDataPackButton} from "../../components/StatusDownloadPage/CreateDataPackButton";
import {render, waitFor, screen, getByText} from '@testing-library/react';
import {useRunContext} from "../../components/StatusDownloadPage/context/RunFile";
import '@testing-library/jest-dom/extend-expect'


jest.mock('../../components/StatusDownloadPage/context/RunFile', () => {
    return {
        useRunContext: jest.fn(),
    }
});

jest.mock('../../components/Dialog/BaseDialog', () => 'dialog');
jest.mock('../../components/common/CenteredPopup', () => 'centeredPopup');


describe('CreateDataPackButton component', () => {
    const defaultProps = () => ({
        fontSize: '12px',
        providerTaskUids: ['thisistotallyauid'],
        classes: {},
        theme: {eventkit: {
                images: {},
                colors: {}
            }},
        ...(global as any).eventkit_test_props,
    });

    const server = setupServer(
        rest.get('/api/runs/zipfiles?:data_provider_task_record_uids', (req, res, ctx) => {
            const dataProviderTaskRecords = req.url.searchParams.getAll('data_provider_task_record_uids')
            return res(ctx.json([{
                "data_provider_task_records": dataProviderTaskRecords,
                "message": "Completed",
                "status": "SUCCESS"
            }]))
        })
    )


    const setup = (propsOverride = {}) => {
        (useRunContext as any).mockImplementation(() => {
            return {run: {status: 'COMPLETED'}}
        })
        const props = {
            ...defaultProps(),
            ...propsOverride,
        };
        return render(<CreateDataPackButton {...props} />);
    };

    beforeEach(setup);
    beforeAll(() => server.listen())
    afterEach(() => server.resetHandlers())
    afterAll(() => server.close())

    it('should say job processing when job is not complete.', () => {
        const {container, rerender} = setup();
        (useRunContext as any).mockImplementation(() => {
            return {run: {status: 'a not correct value'}}
        })
        rerender(<CreateDataPackButton {...defaultProps()}/>)
        expect(getByText(container,/Job Processing.../)).toBeInTheDocument();
    });

    it('should display processing zip when in progress.', () => {
        expect(screen.getByText(/Processing Zip.../)).toBeInTheDocument();
    });

    it('should display download datapack when zip is successful.', async () => {
        await waitFor(() => screen.getByText('DOWNLOAD DATAPACK'))
        expect(screen.getByText(/DOWNLOAD DATAPACK/)).toBeInTheDocument();
    });

    it('should display Zip Error when zip failed.', async () => {
        server.use(
            // override the initial "GET /greeting" request handler
            // to return a 500 Server Error
            rest.get('/api/runs/zipfiles', (req, res, ctx) => {
                return res(ctx.json([{
                    "message": "Completed",
                    "status": "FAILED"
                }]))
            })
        )
        render(<CreateDataPackButton {...defaultProps()} />);
        await waitFor(() => screen.getByText('Zip Error'))
        expect(screen.getByText(/Zip Error/)).toBeInTheDocument();
    });

});
