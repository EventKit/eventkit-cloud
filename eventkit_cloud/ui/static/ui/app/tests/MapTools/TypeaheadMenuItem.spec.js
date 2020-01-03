import PropTypes from 'prop-types';
import React from 'react';
import sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import ActionRoom from '@material-ui/icons/Room';
import IrregularPolygon from '../../components/icons/IrregularPolygon';
import { TypeaheadMenuItem } from '../../components/MapTools/TypeaheadMenuItem';


describe('TypeaheadMenuItem component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const getProps = () => ({
        index: 1,
        result: {},
        ...global.eventkit_test_props,
    });

    const getContext = () => ({
        activeIndex: -1,
        onActiveItemChange: sinon.spy(),
        onInitialItemChange: sinon.spy(),
        onMenuItemClick: sinon.spy(),
    });

    it('should return a MenuItem with proper child components', () => {
        const props = getProps();
        const context = getContext();
        const wrapper = shallow(<TypeaheadMenuItem {...props} />, {
            childContextTypes: {
                activeIndex: PropTypes.number.isRequired,
                onActiveItemChange: PropTypes.func.isRequired,
                onInitialItemChange: PropTypes.func.isRequired,
                onMenuItemClick: PropTypes.func.isRequired,
            },
            context,
        });
        expect(wrapper.find('div')).toHaveLength(6);
        expect(wrapper.find('.menuItem')).toHaveLength(1);
        expect(wrapper.find('.qa-TypeaheadMenuItem-icon-div')).toHaveLength(1);
        expect(wrapper.find(ActionRoom)).toHaveLength(0);
        expect(wrapper.find('.qa-TypeaheadMenuItem-name')).toHaveLength(1);
        expect(wrapper.find('.qa-TypeaheadMenuItem-description')).toHaveLength(1);
        expect(wrapper.find('.qa-TypeaheadMenuItem-source')).toHaveLength(1);
    });

    it('createDescription should return the proper description', () => {
        const result = {
            country: 'country name',
            name: 'test name',
            province: 'province',
            region: 'region',
        };
        const props = getProps();
        const context = getContext();
        const wrapper = shallow(<TypeaheadMenuItem {...props} />, {
            childContextTypes: {
                activeIndex: PropTypes.number.isRequired,
                muiTheme: PropTypes.object,
                onActiveItemChange: PropTypes.func.isRequired,
                onInitialItemChange: PropTypes.func.isRequired,
                onMenuItemClick: PropTypes.func.isRequired,
            },
            context,
        });
        const description = wrapper.instance().createDescription(result);
        expect(description).toEqual('province, region, country name');
    });

    it('should have the proper text and icon', () => {
        const props = getProps();
        const context = getContext();
        props.result = { geometry: { type: 'Polygon' } };
        props.result.name = 'test name';
        props.result.province = 'province';
        props.result.region = 'region';
        props.result.country = 'country name';
        const wrapper = shallow(<TypeaheadMenuItem {...props} />, {
            childContextTypes: {
                activeIndex: PropTypes.number.isRequired,
                muiTheme: PropTypes.object,
                onActiveItemChange: PropTypes.func.isRequired,
                onInitialItemChange: PropTypes.func.isRequired,
                onMenuItemClick: PropTypes.func.isRequired,
            },
            context,
        });
        expect(wrapper.find(IrregularPolygon)).toHaveLength(1);
        expect(wrapper.find('.qa-TypeaheadMenuItem-name').text()).toEqual('test name');
        expect(wrapper.find('.qa-TypeaheadMenuItem-description').text()).toEqual('province, region, country name');
    });
});
