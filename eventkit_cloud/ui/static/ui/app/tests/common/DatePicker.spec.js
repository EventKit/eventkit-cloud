import React from 'react';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import TextField from '@material-ui/core/TextField';
import DatePicker from '../../components/common/DatePicker';


describe('DatePicker component', () => {
    let wrapper;

    const defaultProps = () => (
        {
            value: '2015-12-01',
            onChange: sinon.spy(),
        }
    );

    const setup = (propsOverride = {}) => {
        const props = {
            ...defaultProps(),
            ...propsOverride,
        };
        wrapper = shallow(<DatePicker {...props} />);
    };

    beforeEach(setup);

    it('should display a textfield', () => {
        expect(wrapper.find(TextField)).toHaveLength(1);
        expect(wrapper.find(TextField).props().type).toEqual('date');
        expect(wrapper.find(TextField).props().value).toEqual('2015-12-01');
    });
});
