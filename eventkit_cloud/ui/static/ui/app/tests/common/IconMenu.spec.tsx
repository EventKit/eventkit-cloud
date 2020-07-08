import * as React from 'react';
import { mount } from 'enzyme';
import * as sinon from 'sinon';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import IconMenu from '../../components/common/IconMenu';

describe('IconMenu component', () => {
    let wrapper;

    const defaultProps = () => (
        {
            children: [<span key="test" className="test-child">hello</span>],
        }
    );

    const setup = (propsOverride = {}) => {
        const props = {
            ...defaultProps(),
            ...propsOverride,
        };
        wrapper = mount(<IconMenu {...props} />);
    };

    beforeEach(setup);

    it('should render a button and menu', () => {
        expect(wrapper.find(IconButton)).toHaveLength(1);
        expect(wrapper.find(Menu)).toHaveLength(1);
    });

    it('handleOpen should set anchor to current target', () => {
        expect(wrapper.state('anchor')).toBe(null);
        const e = { currentTarget: <p>hi</p>, stopPropagation: sinon.spy() };
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleOpen(e);
        wrapper.update();
        expect(stateStub.calledWith({ anchor: e.currentTarget })).toBe(true);
    });

    it('handleClose should set anchor to null', () => {
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleClose();
        wrapper.update();
        expect(stateStub.calledWith({ anchor: null })).toBe(true);
    });
});
