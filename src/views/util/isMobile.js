export function isMobile() {

    return watchMobile().matches

}

export function watchMobile() {
    return window.matchMedia("screen and (max-width: 1200px)")
}