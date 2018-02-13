import React from 'react';
import {mount} from 'enzyme';
import sinon from 'sinon';
import Checkbox from 'material-ui/Checkbox';
import ToggleCheckBox from 'material-ui/svg-icons/toggle/check-box';
import ToggleCheckBoxOutlineBlank from 'material-ui/svg-icons/toggle/check-box-outline-blank';
import LicenseInfo from '../../components/AccountPage/LicenseInfo';
import Warning from '../../components/AccountPage/Warning';
import UserLicense from '../../components/AccountPage/UserLicense';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

describe('LicenseInfo component', () => {
    const muiTheme = getMuiTheme();
    const getProps = () => {
        return {
            user: {data: {accepted_licenses: {test1: false, test2: false}}},
            licenses: {licenses: [
                {slug: 'test1', name: 'testname1', text: 'testtext1'},
                {slug: 'test2', name: 'testname2', text: 'testtext2'}
            ]},
            acceptedLicenses: {test1: false, test2: false},
            onLicenseCheck: () => {},
            onAllCheck: () => {},
        }
    }

    const getMountedWrapper = (props) => {
        return mount(<LicenseInfo {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
    }

    it('should render a title and subtitle, the all checkbox (unchecked), two UserLicenses (unchecked), and the agreement warning', () => {
        const props = getProps();
        const wrapper = getMountedWrapper(props);
        expect(wrapper.find('h4')).toHaveLength(1);
        expect(wrapper.find('h4').text()).toEqual('Licenses and Terms of Use');
        expect(wrapper.find('div').at(1).text()).toEqual('Usage of this product and all assets requires agreement to the following legalities:');
        expect(wrapper.find(Warning)).toHaveLength(1);
        expect(wrapper.find(Checkbox)).toHaveLength(3);
        expect(wrapper.find(Checkbox).at(0).props().checked).toBe(false);
        expect(wrapper.find(Checkbox).at(1).props().checked).toBe(false);
        expect(wrapper.find(Checkbox).at(2).props().checked).toBe(false);
        expect(wrapper.find('span').at(0).text()).toEqual('ALL');
        expect(wrapper.find(UserLicense)).toHaveLength(2);
    });

    it('one of the UserLicenses should be checked and disabled', () => {
        let props = getProps();
        props.user.data.accepted_licenses.test1 = true;
        props.acceptedLicenses.test1 = true;
        const wrapper = getMountedWrapper(props);
        expect(wrapper.find(Checkbox).at(0).props().checked).toBe(false);
        expect(wrapper.find(Checkbox).at(0).props().disabled).toBe(false);
        expect(wrapper.find(Checkbox).at(1).props().checked).toBe(true);
        expect(wrapper.find(Checkbox).at(1).props().disabled).toBe(true);
        expect(wrapper.find(Checkbox).at(2).props().checked).toBe(false);
        expect(wrapper.find(Checkbox).at(2).props().disabled).toBe(false);
    });

    it('one of the UserLicenses should be checked but not disabled', () => {
        let props = getProps();
        props.acceptedLicenses.test1 = true;
        const wrapper = getMountedWrapper(props);
        expect(wrapper.find(Checkbox).at(0).props().checked).toBe(false);
        expect(wrapper.find(Checkbox).at(0).props().disabled).toBe(false);
        expect(wrapper.find(Checkbox).at(1).props().checked).toBe(true);
        expect(wrapper.find(Checkbox).at(1).props().disabled).toBe(false);
        expect(wrapper.find(Checkbox).at(2).props().checked).toBe(false);
        expect(wrapper.find(Checkbox).at(2).props().disabled).toBe(false);
    });

    it('should have all checkboxes checked but not disabled', () => {
        let props = getProps();
        props.acceptedLicenses.test1 = true;
        props.acceptedLicenses.test2 = true;
        const wrapper = getMountedWrapper(props);
        expect(wrapper.find(Checkbox).at(0).props().checked).toBe(true);
        expect(wrapper.find(Checkbox).at(0).props().disabled).toBe(false);
        expect(wrapper.find(Checkbox).at(1).props().checked).toBe(true);
        expect(wrapper.find(Checkbox).at(1).props().disabled).toBe(false);
        expect(wrapper.find(Checkbox).at(2).props().checked).toBe(true);
        expect(wrapper.find(Checkbox).at(2).props().disabled).toBe(false);
    });

    it('should have all checkboxes checked and disabled and not show the usage warning', () => {
        let props = getProps();
        props.acceptedLicenses.test1 = true;
        props.acceptedLicenses.test2 = true;
        props.user.data.accepted_licenses.test1 = true;
        props.user.data.accepted_licenses.test2 = true;
        const wrapper = getMountedWrapper(props);
        expect(wrapper.find(Warning)).toHaveLength(0);
        expect(wrapper.find(Checkbox).at(0).props().checked).toBe(true);
        expect(wrapper.find(Checkbox).at(0).props().disabled).toBe(true);
        expect(wrapper.find(Checkbox).at(1).props().checked).toBe(true);
        expect(wrapper.find(Checkbox).at(1).props().disabled).toBe(true);
        expect(wrapper.find(Checkbox).at(2).props().checked).toBe(true);
        expect(wrapper.find(Checkbox).at(2).props().disabled).toBe(true);
    });

    it('should call onLicenseCheck', () => {
        let props = getProps();
        props.onLicenseCheck = new sinon.spy();
        const wrapper = getMountedWrapper(props);
        expect(props.onLicenseCheck.notCalled).toBe(true);
        wrapper.find(Checkbox).at(1).find('input').simulate('change');
        expect(props.onLicenseCheck.calledOnce).toBe(true);
    });

    it('should call onAllCheck', () => {
        let props = getProps();
        props.onAllCheck = new sinon.spy();
        const wrapper = getMountedWrapper(props);
        expect(props.onAllCheck.notCalled).toBe(true);
        wrapper.find(Checkbox).at(0).find('input').simulate('change');
        expect(props.onAllCheck.calledOnce).toBe(true);
    });

    it('allTrue should return false', () => {
        let props = getProps();
        props.acceptedLicenses.test1 = true;
        props.acceptedLicenses.tes2 = false;
        const wrapper = getMountedWrapper(props);
        expect(wrapper.instance().allTrue(props.acceptedLicenses)).toBe(false);
    });

    it('allTrue should return true', () => {
        let props = getProps();
        props.acceptedLicenses.test1 = true;
        props.acceptedLicenses.test2 = true;
        const wrapper = getMountedWrapper(props);
        expect(wrapper.instance().allTrue(props.acceptedLicenses)).toBe(true);
    });
});
