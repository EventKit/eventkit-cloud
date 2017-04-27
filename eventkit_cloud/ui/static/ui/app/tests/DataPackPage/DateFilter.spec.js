import React from 'react';
import sinon from 'sinon';
import {mount} from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import injectTapEventPlugin from 'react-tap-event-plugin';
import TextField from 'material-ui/TextField'
import DatePicker from 'material-ui/DatePicker';
import DateFilter from '../../components/DataPackPage/DateFilter';

describe('DateFilter component', () => {
    injectTapEventPlugin();
    const muiTheme = getMuiTheme();
    const getProps = () => {
        return {
            onMinChange: () => {},
            onMaxChange: () => {},
            minDate: null,
            maxDate: null,
        }
    }

    it('should render a title and two date pickers', () => {
        const props = getProps();
        const wrapper = mount(<DateFilter {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find('p').text()).toEqual('Date Added');
        expect(wrapper.find(DatePicker)).toHaveLength(2);
        expect(wrapper.find(DatePicker).first().text()).toEqual('From');
        expect(wrapper.find(DatePicker).first().props().onChange).toEqual(props.onMinChange);
        expect(wrapper.find(DatePicker).first().props().value).toEqual(null);
        expect(wrapper.find(DatePicker).last().text()).toEqual('To');
        expect(wrapper.find(DatePicker).last().props().onChange).toEqual(props.onMaxChange);
        expect(wrapper.find(DatePicker).last().props().value).toEqual(null);
    });

    it('should handle minDate update', () => {
        let props = getProps();
        const wrapper = mount(<DateFilter {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        let nextProps = getProps();
        nextProps.minDate = new Date(1448967059892);
        wrapper.setProps(nextProps);
        expect(wrapper.find(DatePicker).first().find(TextField).props().value).toEqual('2015-12-01');
    });

    it('should handle maxDate update', () => {
        let props = getProps();
        const wrapper = mount(<DateFilter {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        let nextProps = getProps();
        nextProps.maxDate = new Date(1448967059892);
        wrapper.setProps(nextProps);
        expect(wrapper.find(DatePicker).last().find(TextField).props().value).toEqual('2015-12-01');
    });
});
