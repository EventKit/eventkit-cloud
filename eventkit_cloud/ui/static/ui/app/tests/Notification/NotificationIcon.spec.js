import { shallow } from 'enzyme';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import { NotificationIcon } from '../../components/Notification/NotificationIcon';

describe('NotificationIcon component', () => {
    const run = {
        job: {
            name: 'Test',
        },
    };

    const group = {
        name: 'Test',
    };

    const getWrapper = (props) => (
        shallow(<NotificationIcon {...props} {...global.eventkit_test_props} />)
    );

    it('should correctly handle "run_started" notification', () => {
        const notification = {
            id: '1',
            verb: 'run_started',
            actor: {
                details: run,
            },
        };

        const wrapper = getWrapper({ notification });
        expect(wrapper.find(InfoIcon)).toHaveLength(1);
    });

    it('should correctly handle "run_canceled" notification', () => {
        const notification = {
            id: '1',
            verb: 'run_canceled',
            actor: {
                details: run,
            },
        };

        const wrapper = getWrapper({ notification });
        expect(wrapper.find(WarningIcon)).toHaveLength(1);
    });

    it('should correctly handle "run_completed" notification', () => {
        const notification = {
            id: '1',
            verb: 'run_completed',
            actor: {
                details: run,
            },
        };

        const wrapper = getWrapper({ notification });
        expect(wrapper.find(CheckCircleIcon)).toHaveLength(1);
    });

    it('should correctly handle "run_failed" notification', () => {
        const notification = {
            id: '1',
            verb: 'run_failed',
            actor: {
                details: run,
            },
        };

        const wrapper = getWrapper({ notification });
        expect(wrapper.find(ErrorIcon)).toHaveLength(1);
    });

    it('should correctly handle "run_deleted" notification', () => {
        const notification = {
            id: '1',
            verb: 'run_deleted',
            actor: {
                details: run,
            },
        };

        const wrapper = getWrapper({ notification });
        expect(wrapper.find(RemoveCircleIcon)).toHaveLength(1);
    });

    it('should correctly handle "added_to_group" notification', () => {
        const notification = {
            id: '1',
            verb: 'added_to_group',
            actor: {},
            action_object: {
                details: group,
            },
        };

        const wrapper = getWrapper({ notification });
        expect(wrapper.find(AddCircleIcon)).toHaveLength(1);
    });

    it('should correctly handle "removed_from_group" notification', () => {
        const notification = {
            id: '1',
            verb: 'removed_from_group',
            actor: {},
            action_object: {
                details: group,
            },
        };

        const wrapper = getWrapper({ notification });
        expect(wrapper.find(RemoveCircleIcon)).toHaveLength(1);
    });

    it('should correctly handle "set_as_group_admin" notification', () => {
        const notification = {
            id: '1',
            verb: 'set_as_group_admin',
            actor: {},
            action_object: {
                details: group,
            },
        };

        const wrapper = getWrapper({ notification });
        expect(wrapper.find(AddCircleIcon)).toHaveLength(1);
    });

    it('should correctly handle "removed_as_group_admin" notification', () => {
        const notification = {
            id: '1',
            verb: 'removed_as_group_admin',
            actor: {},
            action_object: {
                details: group,
            },
        };

        const wrapper = getWrapper({ notification });
        expect(wrapper.find(RemoveCircleIcon)).toHaveLength(1);
    });

    it('should correctly handle unsupported notification verbs', () => {
        const notification = {
            id: '1',
            actor: {},
            action_object: { details: 'something' },
            verb: 'some_unsupported_verb',
        };

        expect(getWrapper({ notification }).get(0)).toBe(null);
    });
});
