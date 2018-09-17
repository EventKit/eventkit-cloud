import React from 'react';
import sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import BaseDialog from '../../components/Dialog/BaseDialog';
import { LicenseRow } from '../../components/StatusDownloadPage/LicenseRow';

describe('LicenseRow component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const getProps = () => ({
        name: 'test name',
        text: 'test text',
        ...global.eventkit_test_props,
    });

    const getWrapper = props => shallow(<LicenseRow {...props} />);

    it('should render elements', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(TableRow)).toHaveLength(1);
        expect(wrapper.find(TableCell)).toHaveLength(6);
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
        expect(wrapper.find('i')).toHaveLength(1);
        expect(wrapper.find('i').text()).toEqual('Use of this data is governed by\u00a0test name');
    });

    it('getTableCellWidth should return the pixel string for table width based on window width', () => {
        const props = getProps();
        props.width = 'sm';
        const wrapper = getWrapper(props);
        expect(wrapper.instance().getTableCellWidth()).toEqual('80px');

        wrapper.setProps({ width: 'md' });
        expect(wrapper.instance().getTableCellWidth()).toEqual('120px');
    });

    it('setLicenseOpen should set license dialog to open', () => {
        const props = getProps();
        const stateSpy = sinon.spy(LicenseRow.prototype, 'setState');
        const wrapper = shallow(<LicenseRow {...props} />);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().setLicenseOpen();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ licenseDialogOpen: true })).toBe(true);
        stateSpy.restore();
    });

    it('handleProviderClose should set the provider dialog to closed', () => {
        const props = getProps();
        const stateSpy = sinon.spy(LicenseRow.prototype, 'setState');
        const wrapper = shallow(<LicenseRow {...props} />);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleLicenseClose();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ licenseDialogOpen: false })).toBe(true);
        stateSpy.restore();
    });
});
