import * as React from 'react';
import * as sinon from 'sinon';
import {GroupsDrawer} from '../../components/UserGroupsPage/GroupsDrawer';
import {render, screen, fireEvent} from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect'
import {ProviderPreview} from "../../components/StatusDownloadPage/ProviderPreview";


jest.mock('react-swipeable-views', () => {
    const React = require('react');
    return (props) => (
        <div>
            <span>{props.children}</span>
            <button>SwipeableView</button>
        </div>
    );
});

jest.mock('@mui/icons-material/KeyboardArrowRight', () => {
    const React = require('react');
    return (props) => (
        <button>rightarrow</button>
    );
})

jest.mock('@mui/icons-material/KeyboardArrowLeft', () => {
    const React = require('react');
    return (props) => (
        <button>leftarrow</button>
    );
})

describe('GroupsDrawer component', () => {
    const getProps = () => ({
        providerTasks: [{
            display: true,
            slug: 'slug1',
            uid: '1',
            name: '1',
            preview_url: 'thisisaurl',
            tasks: [
                {
                    uid: '1',
                    name: 'task 1',
                    status: 'SUCCESS',
                    display: true,
                    errors: [],
                },
                {
                    uid: '2',
                    name: 'task 2',
                    status: 'SUCCESS',
                    display: false,
                    errors: [],
                },
            ],
            status: 'COMPLETED',
        }],
        selectedProvider: 'slug1',
        selectProvider: sinon.spy(),
        classes: {},
        theme: {eventkit: {colors: {}}},
        ...(global as any).eventkit_test_props,
    });

    let props;
    const setup = (propsOverride = {}) => {
        props = {
            ...getProps(),
            ...propsOverride,
        };
        return render(<ProviderPreview {...props} />);
    };

    it('should render a swipeable view', () => {
        setup();
        expect(screen.getByText('SwipeableView')).toBeInTheDocument();
    });

    it('it should call onNewGroupClick', () => {
        setup();
        fireEvent.click(screen.getByText('rightarrow'));
        fireEvent.click(screen.getByText('leftarrow'));
        fireEvent.mouseEnter(screen.getByText('rightarrow'));
        expect(document.querySelector('#preview0')).toBeInTheDocument();
    });
});
