import * as React from 'react';
import * as sinon from 'sinon';
import {ProviderRow} from '../../components/StatusDownloadPage/ProviderRow';
import {fireEvent, render, screen} from "@testing-library/react";
import '@testing-library/jest-dom/extend-expect'
import ProviderTaskErrorDialog from "../../components/StatusDownloadPage/ProviderTaskErrorDialog";
import {useRunContext} from "../../components/StatusDownloadPage/context/RunFile";
import {useAsyncRequest} from "../../utils/hooks/api";
import {useDataCartContext} from "../../components/StatusDownloadPage/context/DataCart";


jest.mock('../../components/Dialog/BaseDialog', () => {
    // eslint-disable-next-line global-require,no-shadow
    const React = require('react');
    // eslint-disable-next-line react/prop-types
    return (props) => (
        <div className="basedialog">
            <span>basedialog in test</span>
            {props.children}
        </div>);
});

jest.mock('@material-ui/icons/KeyboardArrowUp', () => {
    // eslint-disable-next-line global-require,no-shadow
    const React = require('react');
    // eslint-disable-next-line react/prop-types
    return (props) => (<div>arrow up</div>)
});

jest.mock('@material-ui/icons/KeyboardArrowDown', () => {
    // eslint-disable-next-line global-require,no-shadow
    const React = require('react');
    // eslint-disable-next-line react/prop-types
    return (props) => (<div>arrow down</div>)
});

jest.mock('../../components/StatusDownloadPage/LicenseRow', () => {
    // eslint-disable-next-line global-require,no-shadow
    const React = require('react');
    // eslint-disable-next-line react/prop-types
    return (props) => (<div>license row</div>)
});

jest.mock('../../components/StatusDownloadPage/ProviderTaskErrorDialog', () => jest.fn())

jest.mock('../../utils/hooks/api', () => {
    return {
        useAsyncRequest: jest.fn(),
    }
})


jest.mock('../../components/StatusDownloadPage/context/RunFile', () => {
    return {
        useRunContext: jest.fn(),
    }
});

jest.mock('../../components/StatusDownloadPage/context/DataCart', () => {
    return {
        useDataCartContext: jest.fn(),
    }
});

describe('ProviderRow component', () => {
    const selectedProviders = {
        123: true,
        456: false,
    };

    const tasks = [
        {
            duration: '0:00:15.317672',
            errors: [],
            estimated_finish: '',
            finished_at: '2017-05-15T15:29:04.356182Z',
            name: 'OverpassQuery',
            progress: 100,
            started_at: '2017-05-15T15:28:49.038510Z',
            status: 'SUCCESS',
            uid: '123',
            result: {
                file: 'osm.pkg',
                size: '1.234 MB',
                url: 'http://cloud.eventkit.test/api/tasks/123',
            },
            display: true,
        },
    ];

    const providers = [
        {
            id: 2,
            model_url: 'http://cloud.eventkit.test/api/providers/osm',
            type: 'osm',
            license: {
                slug: 'osm',
                name: 'Open Database License (ODbL) v1.0',
                text: 'ODC Open Database License (ODbL).',
            },
            created_at: '2017-08-15T19:25:10.844911Z',
            updated_at: '2017-08-15T19:25:10.844919Z',
            uid: 'bc9a834a-727a-4779-8679-2500880a8526',
            name: 'OpenStreetMap Data (Themes)',
            slug: 'osm',
            service_copyright: '',
            service_description: 'provider description',
            layer: null,
            level_from: 0,
            level_to: 10,
            zip: false,
            display: true,
            export_provider_type: 2,
            preview_url: 'non empty string',
        },
    ];

    const getProps = () => ({
        providerTask: {
            name: 'OpenStreetMap Data (Themes)',
            status: 'COMPLETED',
            tasks,
            uid: '123',
            url: 'http://cloud.eventkit.test/api/provider_tasks/123',
            display: true,
            slug: 'osm',
            provider: providers[0],
            preview_url: 'non empty string',
        },
        selectedProviders,
        providers,
        backgroundColor: 'white',
        onSelectionToggle: sinon.spy(),
        onProviderCancel: sinon.spy(),
        classes: {},
        selectProvider: sinon.spy(),
        ...(global as any).eventkit_test_props,
    });
    let providerTaskErrorDialogPropsContainer = {} as any;

    const setup = (propsOverride = {}) => {
        (ProviderTaskErrorDialog as any).mockImplementation((props) => {
            providerTaskErrorDialogPropsContainer.props = props;
            return (<div className="providerTaskErrorDialog"/>);
        });
        (useRunContext as any).mockImplementation(() => {
            return {run: {status: 'COMPLETED'}};
        });
        const requestCall = jest.fn();
        requestCall.mockImplementation(async () => Promise.resolve({}));
        (useAsyncRequest as any).mockImplementation(() => {
           return [{}, requestCall];
        });
        (useDataCartContext as any).mockImplementation(() => {
            return {setFetching: jest.fn()};
        });
        const props = {
            ...getProps(),
            ...propsOverride,
        };

        return render(<ProviderRow {...props} />);
    };

    it('should render basic elements', () => {
        setup();
        expect(screen.getByText('OpenStreetMap Data (Themes)')).toBeInTheDocument();
        expect(screen.getByText(/basedialog in test/)).toBeInTheDocument();
        expect(screen.getByText('arrow down')).toBeInTheDocument();
        expect(screen.getByText(/1.234 MB/)).toBeInTheDocument();
    });

    it('should render the cancel menu item if the task is pending', () => {
        const props = {...getProps()};
        props.providerTask.status = 'PENDING';
        setup(props);
        const menuButton = document.querySelector('.qa-ProviderRow-IconMenu');
        expect(menuButton).toBeInTheDocument();
        // open menu
        fireEvent(
            menuButton,
            new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
            })
        );
        expect(screen.getByText('Rerun File(s)')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
        expect(screen.getByText('View Data Source')).toBeInTheDocument();
        expect(screen.getByText('View Data Preview')).toBeInTheDocument();
    });

    it('menu items should call appropriate props', () => {
        const props = {...getProps()};
        props.providerTask.status = 'PENDING';
        props.onProviderCancel = sinon.spy();
        props.selectProvider = sinon.spy();
        setup(props);
        const menuButton = document.querySelector('.qa-ProviderRow-IconMenu');
        expect(menuButton).toBeInTheDocument();
        // open menu
        fireEvent(
            menuButton,
            new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
            })
        );
        // cancel button
        fireEvent(
            screen.getByText('Cancel'),
            new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
            })
        );
        expect(props.onProviderCancel.calledOnce).toBe(true);
        expect(props.onProviderCancel.calledWith(props.providerTask.uid)).toBe(true);

        fireEvent(
            screen.getByText('View Data Preview'),
            new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
            })
        );
        expect(props.selectProvider.callCount).toBe(1);
    });

    it('should render the task rows when the table is open', () => {
        setup();
        expect(screen.queryByText(/OverpassQuery/)).toBe(null);
        const arrowButton = document.querySelector('.qa-open-arrow');
        expect(arrowButton).toBeInTheDocument();
        // open menu
        fireEvent(
            arrowButton,
            new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
            })
        );
        expect(screen.getByText(/OverpassQuery/)).toBeInTheDocument();
        expect(screen.getByText(/license row/)).toBeInTheDocument();
    });

    it('menu items should call appropriate props', () => {
        const props = {...getProps()};
        props.providerTask.status = 'PENDING';
        props.onProviderCancel = sinon.spy();
        props.selectProvider = sinon.spy();
        setup(props);
        const menuButton = document.querySelector('.qa-ProviderRow-IconMenu');
        expect(menuButton).toBeInTheDocument();
        // open menu
        fireEvent(
            menuButton,
            new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
            })
        );
        expect(screen.queryByText('provider description')).toBe(null);
        // Click data source button
        fireEvent(
            screen.getByText('View Data Source'),
            new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
            })
        );
        expect(screen.getByText('provider description')).toBeInTheDocument();
    });

    it('should be able to call make request without failing', () => {
        const props = {...getProps()};
        props.providerTask.status = 'INCOMPLETE';
        props.onProviderCancel = sinon.spy();
        props.selectProvider = sinon.spy();
        setup(props);
        providerTaskErrorDialogPropsContainer.props.onRetryClicked();
    });
});
