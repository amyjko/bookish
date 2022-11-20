<div class={"bookish bookish-loading" + (typeof localStorage !== "undefined" && localStorage.getItem("bookish-dark") === "true" ? " bookish-dark" : "")}>
        <div class="bookish-loading-animation">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
    </div>
</div>

<style>

    .bookish-loading {
        width: 100vw;
        height: 100vh;
    }

    .bookish-loading-animation {
        position: fixed;
        width: 80px;
        height: 80px;
        left: 50%;
        top: 50%;
        margin-left: -40px;
        margin-top: -40px;
        z-index: 2;
    }

    .bookish-loading-animation div {
        position: absolute;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var(--bookish-muted-color);
        animation: bookish-loading 1.2s linear infinite;
    }

    .bookish-loading-animation div:nth-child(1) {
        top: 8px;
        left: 8px;
        animation-delay: 0s;
    }
    .bookish-loading-animation div:nth-child(2) {
        top: 8px;
        left: 32px;
        animation-delay: -0.4s;
    }
    .bookish-loading-animation div:nth-child(3) {
        top: 8px;
        left: 56px;
        animation-delay: -0.8s;
    }
    .bookish-loading-animation div:nth-child(4) {
        top: 32px;
        left: 8px;
        animation-delay: -0.4s;
    }
    .bookish-loading-animation div:nth-child(5) {
        top: 32px;
        left: 32px;
        animation-delay: -0.8s;
    }
    .bookish-loading-animation div:nth-child(6) {
        top: 32px;
        left: 56px;
        animation-delay: -1.2s;
    }
    .bookish-loading-animation div:nth-child(7) {
        top: 56px;
        left: 8px;
        animation-delay: -0.8s;
    }
    .bookish-loading-animation div:nth-child(8) {
        top: 56px;
        left: 32px;
        animation-delay: -1.2s;
    }
    .bookish-loading-animation div:nth-child(9) {
        top: 56px;
        left: 56px;
        animation-delay: -1.6s;
    }

    @keyframes bookish-loading {
        0%, 100% {
            opacity: 1;
        }
        50% {
            opacity: 0.5;
        }
    }


</style>