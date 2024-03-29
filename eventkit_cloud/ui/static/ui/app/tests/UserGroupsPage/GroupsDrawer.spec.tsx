import * as sinon from 'sinon';
import {render, screen, fireEvent} from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect'

jest.doMock('../../components/UserGroupsPage/SearchGroupsToolbar', () => {
    return (props) => (
        <button onClick={() => props.setQuery('query')}>SearchGroupsToolbar</button>
    );
});

jest.doMock('../../components/UserGroupsPage/GroupPanelBody', () => {
    return (props) => (<button onClick={props.onLeaveGroupClick}>GroupsPanelBody</button>);
});

jest.doMock('../../components/UserGroupsPage/GroupsHeaderTabs', () => {
    return () => (<div>GroupsHeaderTabs</div>);
});

jest.doMock('../../components/Dialog/ProviderDialog', () => {
    return () => (<div>ProviderDialog</div>);
});

const {GroupsDrawer} = require('../../components/UserGroupsPage/GroupsDrawer');

describe('GroupsDrawer component', () => {
    const getProps = () => ({
        selectedValue: '',
        onSelectionChange: sinon.spy(),
        handleChange: sinon.spy(),
        makePartialGroupsRequest: sinon.spy(),
        getOneGroup: sinon.spy(),
        loadNext: sinon.spy(),
        loadPrevious: sinon.spy(),
        handlePage: sinon.spy(),
        open: true,
        nextPage: true,
        groups: {
            groups: [
                {
                    name: 'group1',
                    id: 1,
                    administrators: ['user_one'],
                    members: ['user_one', 'user_two'],
                },
                {
                    name: 'group2',
                    id: 2,
                    administrators: ['user_two'],
                    members: ['user_one', 'user_two'],
                },
                {
                    name: 'group3',
                    id: 3,
                    administrators: ['user_two'],
                    members: ['user_two'],
                },
            ],
            cancelSource: null,
            fetching: false,
            fetched: false,
            creating: false,
            created: false,
            deleting: false,
            deleted: false,
            updating: false,
            updated: false,
            error: null,
        },
        ownedGroups: [{
            id: 1,
            name: 'group1',
            members: ['user1', 'user2'],
            administrators: ['user1'],
        }],
        sharedGroups: [{
            id: 2,
            name: 'group2',
            members: ['user2', 'user1'],
            administrators: ['user2'],
        }],
        otherGroups: [{
            id: 3,
            name: 'group3',
            members: ['user3', 'user2'],
            administrators: ['user3'],
        }],
        user: {},
        usersCount: 2,
        onNewGroupClick: sinon.spy(),
        onSharedInfoClick: sinon.spy(),
        onLeaveGroupClick: sinon.spy(),
        onDeleteGroupClick: sinon.spy(),
        onRenameGroupClick: sinon.spy(),
        getGroups: sinon.spy(),
        classes: {},
        theme: {eventkit:{colors:{}}},
        ...(global as any).eventkit_test_props,
    });

    let props;
    const setup = (propsOverride = {}) => {
        props = {
            ...getProps(),
            ...propsOverride,
        };
        return render(<GroupsDrawer {...props} />);
    };

    it('should render something', () => {
        setup();
        expect(screen.getByText('MEMBERS')).toBeInTheDocument();
    });

    it('it should call onNewGroupClick', () => {
        setup();
        expect(props.onNewGroupClick.calledOnce).toBe(false);
        fireEvent.click(screen.getByText(/NEW GROUP/));
        expect(props.onNewGroupClick.calledOnce).toBe(true);
    });

    it('should display the correct userCount data', () => {
        setup();
        expect(screen.getByText('All (2)'))
    });

    it('should render the key components', () => {
        setup();
        expect(screen.getByText('GroupsPanelBody'))
        expect(screen.getByText('GroupsHeaderTabs'))
        expect(screen.getByText('SearchGroupsToolbar'))
    });


    it('it should call onNewGroupClick', () => {
        setup();
        expect(props.getGroups.called).toBe(true);
        fireEvent.click(screen.getByText(/SearchGroupsToolbar/));
        fireEvent.click(screen.getByText('PREVIOUS'));
        expect(props.getGroups.calledOnce).toBe(false);
    });
});
