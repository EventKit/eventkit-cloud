import * as React from 'react';
import {CreateDataPackButton} from "../../components/StatusDownloadPage/CreateDataPackButton";
import {render, screen, getByText} from '@testing-library/react';
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

    it('should say job processing when job is not complete.', () => {
        const {container, rerender} = setup();
        (useRunContext as any).mockImplementation(() => {
            return {run: {status: 'a not correct value'}}
        })
        rerender(<CreateDataPackButton {...defaultProps()}/>)
        expect(getByText(container,/Job Processing.../)).toBeInTheDocument();
    });

    it('should display create text by default when job is done.', () => {
        expect(screen.getByText(/CREATE DATAPACK/)).toBeInTheDocument();
    });
    //
    // it('should disable button after click and render fake button.', async () => {
    //     const {container} = setup();
    //     expect(container.querySelector('#qa-CreateDataPackButton-fakeButton')).toBeNull();
    //     screen.getByText('CREATE DATAPACK (.ZIP)').click()
    //     await waitFor(() =>
    //         expect(container.querySelector(
    //             '#qa-CreateDataPackButton-fakeButton')
    //         ).toHaveLength(1)
    //     )
    // });
});
