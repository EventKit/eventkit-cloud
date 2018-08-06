import PropTypes from 'prop-types';
import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import RaisedButton from 'material-ui/RaisedButton';
import ReactDOM from 'react-dom';
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUp from '@material-ui/icons/KeyboardArrowUp';
import LoadButtons from '../../components/DataPackPage/LoadButtons';

describe('LoadButtons component', () => {
    const muiTheme = getMuiTheme();
    const getProps = () => ({
        range: '12/26',
        handleLoadLess: () => {},
        handleLoadMore: () => {},
        loadLessDisabled: true,
        loadMoreDisabled: false,
    });
    const getWrapper = props => mount(<LoadButtons {...props} />, {
        context: { muiTheme },
        childContextTypes: {
            muiTheme: PropTypes.object,
        },
    });

    it('should render all the basic components', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(RaisedButton)).toHaveLength(2);
        expect(wrapper.find(RaisedButton).first().text()).toEqual('Show Less');
        expect(wrapper.find(RaisedButton).last().text()).toEqual('Show More');
        expect(wrapper.find(KeyboardArrowDown)).toHaveLength(1);
        expect(wrapper.find(KeyboardArrowUp)).toHaveLength(1);
        expect(wrapper.find('#range')).toHaveLength(1);
        expect(wrapper.find('#range').text()).toEqual('12 of 26');
    });

    it('should enable or disable buttons based on props', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(RaisedButton).first().props().disabled).toEqual(true);
        expect(wrapper.find(RaisedButton).last().props().disabled).toEqual(false);
    });

    it('Load less should call handleLoadLess', () => {
        const props = getProps();
        props.loadLessDisabled = false;
        props.handleLoadLess = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.find(RaisedButton).first().find('button').simulate('click');
        expect(props.handleLoadLess.calledOnce).toBe(true);
    });

    it('Load more should call handleLoadMore', () => {
        const props = getProps();
        props.loadMoreDisabled = false;
        props.handleLoadMore = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.find(RaisedButton).last().find('button').simulate('click');
        expect(props.handleLoadMore.calledOnce).toBe(true);
    });

    it('should set width in state on mount', () => {
        const mountSpy = sinon.spy(LoadButtons.prototype, 'componentDidMount');
        const stateSpy = sinon.spy(LoadButtons.prototype, 'setState');
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(mountSpy.calledOnce).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        // eslint-disable-next-line react/no-find-dom-node
        expect(stateSpy.calledWith({ width: ReactDOM.findDOMNode(wrapper.instance()).offsetWidth })).toBe(true);
        mountSpy.restore();
        stateSpy.restore();
    });

    it('should update width in state if component updates with new width', () => {
        const updateSpy = sinon.spy(LoadButtons.prototype, 'componentDidUpdate');
        const stateSpy = sinon.spy(LoadButtons.prototype, 'setState');
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(stateSpy.calledOnce).toBe(true);
        ReactDOM.findDOMNode = () => ({ offsetWidth: 12 });
        wrapper.instance().forceUpdate();
        wrapper.update();
        expect(stateSpy.calledTwice);
        expect(stateSpy.calledWith({ width: 12 })).toBe(true);
        updateSpy.restore();
        stateSpy.restore();
    });
});

