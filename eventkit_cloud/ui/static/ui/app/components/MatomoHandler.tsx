import {useEffectOnCondition} from "../utils/hooks/hooks";
import {connect} from "react-redux";
import {useCallback, useEffect, useRef, useState} from "react";
const _paq = (window as any)._paq = (window as any)._paq || [];

function pushData(referrerUrl: string, setUrl: (url: string) => void,
                  userInfo: any, matomoUrl: string, siteId: string, appName: string,
                  customDimensionId: number, customVarInfo: any) {
    if (!matomoUrl) {
        return;
    }
    _paq.push(['setReferrerUrl', referrerUrl]);
    const currentUrl = window.location.href;
    setUrl(currentUrl)
    _paq.push(['setCustomUrl', currentUrl]);
    _paq.push(['setDocumentTitle', appName]);
    /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
    const userOauthId = userInfo.identification || 'undefined';
    _paq.push(['setCustomDimension', customDimensionId, userOauthId]);
    _paq.push(['setCustomVariable', customVarInfo.id, customVarInfo.name, userOauthId, customVarInfo.scope]);
    _paq.push(['setUserId', userInfo.username])
    _paq.push(['trackPageView']);
    _paq.push(['enableLinkTracking']);

    _paq.push(['setTrackerUrl', matomoUrl + 'matomo.php']);
    _paq.push(['setSiteId', siteId]);

    const g = document.createElement('script')
    const s = document.getElementsByTagName('script')[0];
    g.type = 'text/javascript';
    g.async = true;
    g.src = matomoUrl + 'matomo.js';
    s.parentNode.insertBefore(g, s);
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

export function MatomoHandler(props: MatomoProps) {
    const { SITE_ID, APPNAME, URL, CUSTOM_DIM_ID, CUSTOM_VAR_ID, CUSTOM_VAR_NAME, CUSTOM_VAR_SCOPE } = props;
    const { user = undefined } = props.userData || {};
    const [trackedUrl, setTrackedUrl] = useState<string>(window.location.href);

    const matomoCallback = useCallback(() => {
        pushData(
            trackedUrl, setTrackedUrl,
            {username: user.username, identification: user.identification},
            URL, SITE_ID, APPNAME, CUSTOM_DIM_ID,
            {id: CUSTOM_VAR_ID, name: CUSTOM_VAR_NAME, scope: CUSTOM_VAR_SCOPE }
        )
        // #TODO: replace with optional chaining once we update TypeScript
    }, [(user || {}).username , (user || []).identification])

    useEffectOnCondition(() => {
        if (SITE_ID && SITE_ID.length && !! URL) {
            document.addEventListener('click', matomoCallback);
        }
        matomoCallback();
    }, !!user)

    return null;
}

function mapStateToProps(state) {
    return {
        userData: state.user.data,
    };
}


export default connect(mapStateToProps, null)(MatomoHandler);