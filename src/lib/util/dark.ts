export function isDark() {
    return (
        typeof localStorage !== 'undefined' &&
        localStorage.getItem('dark') !== 'false' &&
        (localStorage.getItem('dark') === 'true' || // A previous setting
            window.matchMedia('(prefers-color-scheme: dark)').matches)
    ); // Operating system is set to dark
}

export function setDark(dark: boolean) {
    if (typeof document !== 'undefined') {
        if (dark) document.body.classList.add('dark');
        else document.body.classList.remove('dark');
        if (typeof localStorage !== 'undefined')
            localStorage.setItem('dark', dark ? 'true' : 'false');
    }
}
