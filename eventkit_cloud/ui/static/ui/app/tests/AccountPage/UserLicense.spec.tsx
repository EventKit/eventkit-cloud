import * as React from 'react';
import { mount } from 'enzyme';
import * as sinon from 'sinon';
import CheckBox from '@material-ui/core/Checkbox';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import CustomScrollbar from '../../components/CustomScrollbar';
import UserLicense from '../../components/AccountPage/UserLicense';

describe('User License component', () => {
    const getProps = () => ({
        ...(global as any).eventkit_test_props,
        license: { slug: 'test-license', name: 'license name', text: 'license text' },
        checked: false,
        onCheck: sinon.spy(),
        disabled: false,
    });

    const getMountedWrapper = props => mount(<UserLicense {...props} />);

    it('should render a card with the license information', () => {
        const props = getProps();
        const wrapper = getMountedWrapper(props);
        expect(wrapper.find(Card)).toHaveLength(1);
        expect(wrapper.find(CardHeader)).toHaveLength(1);
        expect(wrapper.find(CardHeader).text()).toEqual('I agree to the license name');
        expect(wrapper.find(CheckBox)).toHaveLength(1);
        expect(wrapper.find(ExpandMoreIcon)).toHaveLength(1);
        expect(wrapper.find(CardContent)).toHaveLength(1);
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
    });

    it('should expand the card on click', () => {
        const props = getProps();
        const wrapper = getMountedWrapper(props);
        expect(wrapper.find(CardContent)).toHaveLength(1);
        wrapper.find('button').simulate('click');
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
        expect(wrapper.find('a')).toHaveLength(1);
        expect(wrapper.find('a').props().href).toEqual('/api/licenses/test-license/download');
        expect(wrapper.find('a').text()).toEqual('- Download this license text -');
        expect(wrapper.find(CardContent).text()).toEqual('- Download this license text -license text');
    });

    it('should call onCheck function when checkbox is checked', () => {
        const props = getProps();
        props.onCheck = sinon.spy();
        const wrapper = getMountedWrapper(props);
        expect(props.onCheck.notCalled).toBe(true);
        wrapper.find(CheckBox).find('input').simulate('change');
        expect(props.onCheck.calledOnce).toBe(true);
    });

    it('should make checkbox disabled', () => {
        const props = getProps();
        props.disabled = true;
        const wrapper = getMountedWrapper(props);
        expect(wrapper.find(CheckBox).props().disabled).toBe(true);
    });
});
