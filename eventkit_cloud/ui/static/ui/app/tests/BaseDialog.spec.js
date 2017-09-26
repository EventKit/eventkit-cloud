import React from 'react';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import RaisedButton from 'material-ui/RaisedButton';
import Dialog from 'material-ui/Dialog';
import BaseDialog from '../components/BaseDialog';
import injectTapEventPlugin from 'react-tap-event-plugin';

describe('BaseDialog component', () => {
    const getProps = () => {
        return {
            show: true,
            onClose: () => {},
            title: '',
        }
    };
    const muiTheme = getMuiTheme();
    injectTapEventPlugin();

    const getWrapper = (props) => {
        return mount(<BaseDialog {...props}/>, {
            context: {muiTheme},
            childContextTypes: {
                muiTheme: React.PropTypes.object
            }
        });
    };

    it('should render a Dialog', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(Dialog)).toHaveLength(1);
    });

    it('should give the dialog the passed in actions', () => {
        const actions = [
            <RaisedButton
                className={'qa-BaseDialog-RasiedButton'}
                style={{margin: '0px'}}
                disableTouchRipple={true}
                label={"One"}
                primary={false}
                onClick={() => {}}
            />,,
            <RaisedButton
                className={'qa-BaseDialog-RasiedButton'}
                style={{margin: '0px'}}
                disableTouchRipple={true}
                label={"Two"}
                primary={false}
                onClick={() => {}}
            />,
        ];
        const props = getProps();
        props['actions'] = actions;
        const wrapper = getWrapper(props);
        expect(wrapper.find(Dialog).props().actions).toEqual(actions);
    });
});
