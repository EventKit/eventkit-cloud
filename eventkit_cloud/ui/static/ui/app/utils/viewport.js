//
// Define what our break points should be to maintain consistency across the application
// Using the bootstrap guidelines found here: https://getbootstrap.com/docs/4.1/layout/overview/
//
export const XS_MAX_WIDTH = 576;
export const S_MAX_WIDTH = 768;
export const M_MAX_WIDTH = 992;
export const L_MAX_WIDTH = 1200;
//
//
// define testers to check viewport size
//
export function isViewportXS() {
    return window.innerWidth < XS_MAX_WIDTH;
}

export function isViewportS() {
    return window.innerWidth < S_MAX_WIDTH;
}

export function isViewportM() {
    return window.innerWidth < M_MAX_WIDTH;
}

export function isViewportL() {
    return window.innerWidth < L_MAX_WIDTH;
}

export function isViewportXL() {
    return window.innerWidth >= L_MAX_WIDTH;
}
