import React from 'react';
import sinon from 'sinon';
import { mount, shallow } from 'enzyme';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import BaseDialog from '../../components/Dialog/BaseDialog';
import LicenseRow from '../../components/StatusDownloadPage/LicenseRow';

describe('LicenseRow component', () => {
    const getProps = () => ({
        name: 'test name',
        text: 'test text',
    });

    const getWrapper = props => mount(<LicenseRow {...props} />);

    it('should render elements', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(TableRow)).toHaveLength(1);
        expect(wrapper.find(TableCell)).toHaveLength(6);
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
        expect(wrapper.find('i')).toHaveLength(1);
        expect(wrapper.find('i').text()).toEqual('Use of this data is governed by\u00a0test name');
    });

    it('getTextFontSize should return the font string for table text based on window width', () => {
        const props = getProps();
        const wrapper = getWrapper(props);

        window.resizeTo(500, 600);
        expect(window.innerWidth).toEqual(500);
        expect(wrapper.instance().getTextFontSize()).toEqual('10px');

        window.resizeTo(700, 800);
        expect(window.innerWidth).toEqual(700);
        expect(wrapper.instance().getTextFontSize()).toEqual('11px');

        window.resizeTo(800, 900);
        expect(window.innerWidth).toEqual(800);
        expect(wrapper.instance().getTextFontSize()).toEqual('12px');

        window.resizeTo(1000, 600);
        expect(window.innerWidth).toEqual(1000);
        expect(wrapper.instance().getTextFontSize()).toEqual('13px');

        window.resizeTo(1200, 600);
        expect(window.innerWidth).toEqual(1200);
        expect(wrapper.instance().getTextFontSize()).toEqual('14px');
    });

    it('getTableCellWidth should return the pixel string for table width based on window width', () => {
        const props = getProps();
        const wrapper = getWrapper(props);

        window.resizeTo(700, 800);
        expect(window.innerWidth).toEqual(700);
        expect(wrapper.instance().getTableCellWidth()).toEqual('80px');

        window.resizeTo(800, 900);
        expect(window.innerWidth).toEqual(800);
        expect(wrapper.instance().getTableCellWidth()).toEqual('120px');

        window.resizeTo(1000, 600);
        expect(window.innerWidth).toEqual(1000);
        expect(wrapper.instance().getTableCellWidth()).toEqual('120px');

        window.resizeTo(1200, 600);
        expect(window.innerWidth).toEqual(1200);
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
