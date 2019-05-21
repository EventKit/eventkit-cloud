import * as React from 'react';
import * as sinon from 'sinon';
import { shallow } from 'enzyme';
import Checkbox from '@material-ui/core/Checkbox';
import { LicenseInfo, Props } from '../../components/AccountPage/LicenseInfo';
import Warning from '../../components/AccountPage/Warning';
import UserLicense from '../../components/AccountPage/UserLicense';

describe('LicenseInfo component', () => {
    const getProps = (): Props => (
        {
            ...(global as any).eventkit_test_props,
            user: { data: { accepted_licenses: { test1: false, test2: false } } },
            licenses: {
                licenses: [
                    { slug: 'test1', name: 'testname1', text: 'testtext1' },
                    { slug: 'test2', name: 'testname2', text: 'testtext2' },
                ],
            },
            acceptedLicenses: { test1: false, test2: false },
            onLicenseCheck: sinon.spy(),
            onAllCheck: sinon.spy(),
        }
    );

    let props;
    let wrapper;
    const setup = (customProps = {}) => {
        props = { ...getProps(), ...customProps };
        wrapper = shallow(<LicenseInfo {...props} />);
    };

    beforeEach(setup);

    it('should render a title, subtitle, all checkboxes, two UserLicenses, and the agreement warning', () => {
        expect(wrapper.find('h4')).toHaveLength(1);
        expect(wrapper.find('h4').text()).toEqual('Licenses and Terms of Use');
        expect(wrapper.find('div').at(1).text())
            .toEqual('Usage of this product and all assets requires agreement to the following legalities:');
        expect(wrapper.find(Warning)).toHaveLength(1);
        expect(wrapper.find(Checkbox)).toHaveLength(1);
        expect(wrapper.find(Checkbox).at(0).props().checked).toBe(false);
        expect(wrapper.find('.qa-LicenseInfo-All').text()).toEqual('ALL');
        expect(wrapper.find(UserLicense)).toHaveLength(2);
    });

    it('one of the UserLicenses should be checked and disabled', () => {
        const nextProps = getProps();
        nextProps.user.data.accepted_licenses.test1 = true;
        nextProps.acceptedLicenses.test1 = true;
        wrapper.setProps(nextProps);
        const userOne = wrapper.find(UserLicense).at(0).shallow();
        const userTwo = wrapper.find(UserLicense).at(1).shallow();
        expect(userOne.props().checked).toBe(true);
        expect(userOne.props().disabled).toBe(true);
        expect(userTwo.props().checked).toBe(false);
        expect(userTwo.props().disabled).toBe(false);
    });

    it('one of the UserLicenses should be checked but not disabled', () => {
        const nextProps = getProps();
        nextProps.acceptedLicenses.test1 = true;
        wrapper.setProps(nextProps);
        const userOne = wrapper.find(UserLicense).at(0).shallow();
        const userTwo = wrapper.find(UserLicense).at(1).shallow();
        expect(userOne.props().checked).toBe(true);
        expect(userOne.props().disabled).toBe(false);
        expect(userTwo.props().checked).toBe(false);
        expect(userTwo.props().disabled).toBe(false);
    });

    it('should have all checkboxes checked but not disabled', () => {
        const nextProps = getProps();
        nextProps.acceptedLicenses.test1 = true;
        nextProps.acceptedLicenses.test2 = true;
        wrapper.setProps(nextProps);
        const userOne = wrapper.find(UserLicense).at(0).shallow();
        const userTwo = wrapper.find(UserLicense).at(1).shallow();
        expect(wrapper.find(Checkbox).props().checked).toBe(true);
        expect(wrapper.find(Checkbox).props().disabled).toBe(false);
        expect(userOne.props().checked).toBe(true);
        expect(userOne.props().disabled).toBe(false);
        expect(userTwo.props().checked).toBe(true);
        expect(userTwo.props().disabled).toBe(false);
    });

    it('should have all checkboxes checked and disabled and not show the usage warning', () => {
        const nextProps = getProps();
        nextProps.acceptedLicenses.test1 = true;
        nextProps.acceptedLicenses.test2 = true;
        nextProps.user.data.accepted_licenses.test1 = true;
        nextProps.user.data.accepted_licenses.test2 = true;
        wrapper.setProps(nextProps);
        const userOne = wrapper.find(UserLicense).at(0).shallow();
        const userTwo = wrapper.find(UserLicense).at(1).shallow();
        expect(wrapper.find(Warning)).toHaveLength(0);
        expect(wrapper.find(Checkbox).at(0).props().checked).toBe(true);
        expect(wrapper.find(Checkbox).at(0).props().disabled).toBe(true);
        expect(userOne.props().checked).toBe(true);
        expect(userOne.props().disabled).toBe(true);
        expect(userTwo.props().checked).toBe(true);
        expect(userTwo.props().disabled).toBe(true);
    });

    it('allTrue should return false', () => {
        const nextProps = getProps();
        nextProps.acceptedLicenses.test1 = true;
        nextProps.acceptedLicenses.tes2 = false;
        wrapper.setProps(nextProps);
        expect(wrapper.instance().allTrue(nextProps.acceptedLicenses)).toBe(false);
    });

    it('allTrue should return true', () => {
        const nextProps = getProps();
        nextProps.acceptedLicenses.test1 = true;
        nextProps.acceptedLicenses.test2 = true;
        wrapper.setProps(nextProps);
        expect(wrapper.instance().allTrue(nextProps.acceptedLicenses)).toBe(true);
    });
});
