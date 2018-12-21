import * as React from 'react';
import { mount } from 'enzyme';
import * as sinon from 'sinon';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import { DropDownMenu, Props } from '../../components/common/DropDownMenu';

describe('DropDownMenu component', () => {
    let wrapper;

    const defaultProps = (): Props => (
        {
            value: 'test',
            children: [<span key="test" className="test-child">hello</span>],
        }
    );

    const setup = (propsOverride = {}) => {
        const props = {
            ...defaultProps(),
            ...propsOverride,
        };
        wrapper = mount(<DropDownMenu {...props} />);
    };

    beforeEach(setup);

    it('should render a button and menu', () => {
        expect(wrapper.find(Button)).toHaveLength(1);
        expect(wrapper.find(Menu)).toHaveLength(1);
    });

    it('handleOpen should set anchor to current target', () => {
        expect(wrapper.state('anchor')).toBe(null);
        const e = { currentTarget: <p>hi</p> };
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
