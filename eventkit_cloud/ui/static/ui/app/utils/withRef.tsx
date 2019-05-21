import * as React from 'react';

// withRef is a HOC that allows a customRef property to be passed as a prop
// and then forwarded to the base component.
// This HOC solves issues with other HOCs not correctly passing along the ref.
// If you have a component wrapped in multiple HOCs and cannot access the base component
// with the 'ref' prop, you will want to use this withRef HOC.

interface BaseProps {
    customRef: React.RefObject<any>;
}

const withRef = () =>
    <T extends React.Component, OriginalProps extends {}>(
        Component: React.ComponentClass<OriginalProps>
    ) => {

    interface PrivateProps { forwardedRef: React.RefObject<T>; }
    type Props = OriginalProps & PrivateProps & BaseProps;

    class WithRef extends React.Component<Props> {
        render() {
            const { forwardedRef, ...restTmp } = this.props as PrivateProps;

            const rest = restTmp as OriginalProps;

            return <Component ref={forwardedRef} {...rest} />;
        }
    }

    const forwardRef = (props: Props) => {
        const { customRef } = props;
        return <WithRef {...props} forwardedRef={customRef} />;
    };

    const name = Component.displayName || React.Component.name;
    (forwardRef as any).displayName = `withRef(${name})`;

    return React.forwardRef<T, OriginalProps>(forwardRef);
};

export default withRef;
