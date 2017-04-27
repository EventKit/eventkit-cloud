import React from 'react';
import sinon from 'sinon';
import {mount} from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import injectTapEventPlugin from 'react-tap-event-plugin';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import FilterHeader from '../../components/DataPackPage/FilterHeader';

describe('FilterHeader component', () => {
    injectTapEventPlugin();
    const muiTheme = getMuiTheme();
    const getProps = () => {
        return {
            onApply: () => {},
            onClear: () => {},
        }
    }

    it('should render a RaisedButton and a FlatButton', () => {
        const props = getProps();
        const wrapper = mount(<FilterHeader {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find(RaisedButton)).toHaveLength(1);
        expect(wrapper.find(RaisedButton).text()).toEqual('Apply');
        expect(wrapper.find(RaisedButton).props().onClick).toEqual(props.onApply);
        expect(wrapper.find(FlatButton)).toHaveLength(1);
        expect(wrapper.find(FlatButton).text()).toEqual('Clear All');
        expect(wrapper.find(FlatButton).props().onClick).toEqual(props.onClear);
    });

    it('should call onApply when RaisedButton is clicked', () => {
        let props = getProps();
        props.onApply = new sinon.spy();
        const wrapper = mount(<FilterHeader {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        wrapper.find(RaisedButton).find('button').simulate('click');
        expect(props.onApply.calledOnce).toBe(true);
    });

    it('should call onClear when FlatButton is clicked', () => {
        let props = getProps();
        props.onClear = new sinon.spy();
        const wrapper = mount(<FilterHeader {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        wrapper.find(FlatButton).find('button').simulate('click');
        expect(props.onClear.calledOnce).toBe(true);
    });
});
