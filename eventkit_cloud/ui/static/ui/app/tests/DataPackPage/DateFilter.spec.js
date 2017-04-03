import React from 'react';
import sinon from 'sinon';
import {expect} from 'chai';
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
        expect(wrapper.find('p').text()).to.equal('Date Added');
        expect(wrapper.find(DatePicker)).to.have.length(2);
        expect(wrapper.find(DatePicker).first().text()).to.equal('Min Date');
        expect(wrapper.find(DatePicker).first().props().onChange).to.equal(props.onMinChange);
        expect(wrapper.find(DatePicker).first().props().value).to.equal(null);
        expect(wrapper.find(DatePicker).last().text()).to.equal('Max Date');
        expect(wrapper.find(DatePicker).last().props().onChange).to.equal(props.onMaxChange);
        expect(wrapper.find(DatePicker).last().props().value).to.equal(null);
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
        expect(wrapper.find(DatePicker).first().find(TextField).props().value).to.equal('2015-12-01');
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
        expect(wrapper.find(DatePicker).last().find(TextField).props().value).to.equal('2015-12-01');
    });
});
