import React, { PropTypes } from 'react';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import EnhancedButton from 'material-ui/internal/EnhancedButton';
import ShareInfoBody from '../../components/DataPackShareDialog/ShareInfoBody';


describe('MembersHeaderRow component', () => {
    const muiTheme = getMuiTheme();
    const getProps = () => (
        {
            view: 'groups',
            onReturn: () => {},
        }
    );

    const getWrapper = props => (
        mount(<ShareInfoBody {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: PropTypes.object },
        })
    );

    it('should render the basic components', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-ShareInfoBody-body')).toHaveLength(1);
        expect(wrapper.find(EnhancedButton)).toHaveLength(1);
        expect(wrapper.find('.qa-ShareInfoBody-text')).toHaveLength(1);
        expect(wrapper.find('.qa-ShareInfoBody-title')).toHaveLength(1);
        expect(wrapper.find('.qa-ShareInfoBody-rightsTitle')).toHaveLength(1);
        expect(wrapper.find('.qa-ShareInfoBody-rights')).toHaveLength(1);
        expect(wrapper.find('.qa-ShareInfoBody-rightsList')).toHaveLength(1);
        expect(wrapper.find('.qa-ShareInfoBody-adminRightsTitle')).toHaveLength(1);
        expect(wrapper.find('.qa-ShareInfoBody-adminRights')).toHaveLength(1);
        expect(wrapper.find('.qa-ShareInfoBody-adminRightsList')).toHaveLength(1);
    });

    it('should render the groups text', () => {
        const props = getProps();
        props.view = 'groups';
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-ShareInfoBody-title').text()).toEqual('DataPack Share Rights for Groups');
    });

    it('should render the members text', () => {
        const props = getProps();
        props.view = 'members';
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-ShareInfoBody-title').text()).toEqual('DataPack Share Rights for Members');
    });
});
