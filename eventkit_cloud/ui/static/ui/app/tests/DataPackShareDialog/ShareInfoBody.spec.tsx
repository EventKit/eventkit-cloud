import * as React from 'react';
import * as sinon from 'sinon';
import { shallow } from 'enzyme';
import ButtonBase from '@material-ui/core/ButtonBase';
import { ShareInfoBody } from '../../components/DataPackShareDialog/ShareInfoBody';

describe('MembersHeaderRow component', () => {
    const getProps = () => ({
        view: 'groups',
        onReturn: sinon.spy(),
        ...(global as any).eventkit_test_props,
    });

    const getWrapper = props => (
        shallow(<ShareInfoBody {...props} />)
    );

    it('should render the basic components', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-ShareInfoBody-body')).toHaveLength(1);
        expect(wrapper.find(ButtonBase)).toHaveLength(1);
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
