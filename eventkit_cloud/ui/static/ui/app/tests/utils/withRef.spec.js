import * as React from 'react';
import { mount } from 'enzyme';
import withRef from '../../utils/withRef';

/* eslint-disable react/no-multi-comp */

describe('withRef Higher Order Component (HOC)', () => {
    it('should return the base component ref using custom ref key', () => {
        class Header extends React.Component {
            constructor(props) {
                super(props);
                this.data = 'find me';
            }

            render() {
                return (
                    <h1>I have your data</h1>
                );
            }
        }

        const WrappedHeader = withRef()(Header);

        class Component extends React.Component {
            constructor(props) {
                super(props);
                this.header = null;
            }

            render() {
                return (
                    <div>
                        <WrappedHeader customRef={(instance) => { this.header = instance; }} />
                    </div>
                );
            }
        }

        const wrapper = mount(<Component />);
        const elem = wrapper.find(Component);
        expect(elem.instance().header.data).toEqual('find me');
    });
});
