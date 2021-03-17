import * as React from 'react';
import {useEffectOnCondition} from "../utils/hooks/hooks";
import {connect} from "react-redux";
import {createContext, useCallback, useContext, useEffect, useState} from "react";

interface MatomoContext {
    pushClick: (event: MatomoEvent) => void;
}

const matomoContext = createContext<MatomoContext>({} as MatomoContext);

export const useMatomoContext = (): MatomoContext => useContext(matomoContext);
export const MatomoConsumer = matomoContext.Consumer;
export const MatomoProvider = matomoContext.Provider;

function pushData(userInfo: any, matomoUrl: string, siteId: string, appName: string,
                  customDimensionId: number, customVarInfo: any) {
    // If Matomo isn't setup, exit early.
    if (!matomoUrl || !siteId) {
        return;
    }
    // Add a trailing slash if not present
    const matomoJsUrl = !matomoUrl.endsWith('/') ? matomoUrl + '/' : matomoUrl + 'matomo.js';
    try {
        // Validate the URL.
        new URL(matomoJsUrl);
    } catch (_) {
        console.error('Invalid Matomo URL specified -- aborting push.');
        return;
    }
    const g = document.createElement('script');
    const s = document.getElementById('matomo');
    const _paq = (window as any)._paq = (window as any)._paq || [];
    if (!s) {
        g.type = 'text/javascript';
        g.async = true;
        g.src = matomoJsUrl;
        g.id = 'matomo';
        document.getElementsByTagName('script')[0].parentNode.insertBefore(g, s);

        if (appName) {

            _paq.push(['setDocumentTitle', appName]);
        }
        /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
        const userOauthId = userInfo.identification || 'undefined';
        if (customDimensionId && customVarInfo.id && customVarInfo.name) {
            _paq.push(['setCustomDimension', customDimensionId, userOauthId]);
            _paq.push(['setCustomVariable', customVarInfo.id, customVarInfo.name, userOauthId, customVarInfo.scope]);
        }
        _paq.push(['setUserId', userInfo.username])
        _paq.push(['enableLinkTracking']);

        _paq.push(['setTrackerUrl', matomoJsUrl + 'matomo.php']);
        _paq.push(['setSiteId', siteId]);
    }
    if ((window as any)._url !== window.location.href) {
        _paq.push(['setCustomUrl', window.location.href]);
        _paq.push(['trackPageView']);
        (window as any)._url = window.location.href;
    }
}

interface MatomoProps {
    SITE_ID: string;
    APPNAME: string;
    URL: string;
    CUSTOM_DIM_ID: number;
    CUSTOM_VAR_ID: number;
    CUSTOM_VAR_NAME: string;
    CUSTOM_VAR_SCOPE: string;
    userData: any;
}

export function MatomoHandler(props: React.PropsWithChildren<MatomoProps>) {
    const {SITE_ID, APPNAME, URL, CUSTOM_DIM_ID, CUSTOM_VAR_ID, CUSTOM_VAR_NAME, CUSTOM_VAR_SCOPE} = props;
    const {user = undefined} = props.userData || {};

    const pushClick = useCallback((event: MatomoEvent) => {
        // _paq must access the instance attached to window, otherwise a local capture will be used and matomo
        // won't register the function call (trackEvent).
        // Don't call this if _paq doesn't exist (if window doesn't exist, nothing exists so don't bother checking).
        // This shouldn't run when Matomo isn't setup
        if (!!((window as any)._paq)) {
            (window as any)._paq.push([
                'trackEvent',
                event.eventCategory || window.location.pathname,
                event.eventAction,
                event.eventName,
                event.eventValue
            ]);
        }
    }, []);

    const matomoCallback = useCallback((event: any) => {
        function getDivToString(targetDiv: any) {
            // classList is not an array, but can be spread into one.
            const {id, localName, classList} = targetDiv;
            return `${[localName, id, [...classList].join(' ')].filter(_string => _string).join(':')}`
        }
        if (!!user) {
            pushData(
                {username: user.username, identification: user.identification},
                URL, SITE_ID, APPNAME, CUSTOM_DIM_ID,
                {id: CUSTOM_VAR_ID, name: CUSTOM_VAR_NAME, scope: CUSTOM_VAR_SCOPE}
            );
            pushClick({
                eventCategory: `${window.location.pathname}`,
                eventAction: `click:${window.location.pathname}`,
                eventName: `target:${getDivToString(event.target)}`
            })
        }
    }, [
        user?.username, user?.identification,
        SITE_ID, APPNAME, URL, CUSTOM_DIM_ID, CUSTOM_VAR_ID, CUSTOM_VAR_NAME, CUSTOM_VAR_SCOPE,
        pushClick,
    ]);

    useEffect(() => {
        let _tag;
        if (SITE_ID && SITE_ID.length && !!URL) {
            _tag = document.addEventListener('click', matomoCallback);
        }
        return function cleanup() {
            document.removeEventListener('click', _tag);
        }
    }, [user, SITE_ID, URL, matomoCallback]);


    return (
        <MatomoProvider
            value={{
                pushClick
            }}
        >
            {props.children}
        </MatomoProvider>
    );
}

function mapStateToProps(state) {
    return {
        userData: state.user.data,
    };
}

interface MatomoEvent {
    eventCategory?: string;
    eventAction: string;
    eventName: string;
    eventValue?: number | string;
}

export function MatomoClickTracker(props: React.PropsWithChildren<MatomoEvent>) {
    const {pushClick} = useMatomoContext();
    if (!pushClick) {
        return (<>{props.children}</>);
    }
    return (
        <span className={`qa-MatomoClick-${props.eventName}`}>
            {
                React.Children.map(props.children, (_child) => {
                    // This maps over all top level children and adds/modifies the onClick prop
                    // Ignoring all non-valid elements (null)
                    if (!React.isValidElement(_child)) return;
                    const {onClick, ...originalProps} = _child.props;
                    // We replace the child components onClick property with this function.
                    // It will push the click event to Matomo, then call the original onClick prop if it was defined.
                    function _onClick(...args: any) {
                        pushClick({...props});
                        if (onClick) {
                            // Make sure to pass along any arguments, typically just an input event
                            onClick(...args);
                        }
                    }
                    // Clone the child and replace the onClick
                    // If the child component is disabled (i.e. MUI button disabled prop), the onClick won't be called,
                    // this is probably desired behavior, but should be noted.
                    return React.cloneElement(_child, {
                        ...originalProps,
                        onClick: _onClick,

                    })
                })
            }
        </span>
    );
}


export default connect(mapStateToProps, null)(MatomoHandler);