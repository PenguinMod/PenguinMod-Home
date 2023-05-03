<img alt="Loading" src="/loading.png" class="spinner-load" />

<style>
    @keyframes spinning_basic {
        0% {
            rotate: 0deg;
        }
        50% {
            rotate: 180deg;
        }
        100% {
            rotate: 360deg;
        }
    }
    .spinner-load {
        animation-name: spinning_basic;
        animation-delay: 0s;
        animation-duration: 1s;
        animation-iteration-count: infinite;
        animation-timing-function: linear;

        width: 64px;
        height: 64px;
    }
</style>
