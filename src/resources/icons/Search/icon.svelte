<script>
    export let width;
    export let height;
    export let color;
    export let scale;
    export let style;
</script>

<svg
    xmlns="http://www.w3.org/2000/svg"
    style={`width: ${width};height: ${height};${style ? style : ""}`}
    viewBox="0 0 19.9 19.7"
>
    <g class="search-path" fill="none" stroke={color} stroke-width={scale}>
        <path stroke-linecap="square" d="M18.5 18.3l-5.4-5.4" /><circle
            cx="8"
            cy="8"
            r="7"
        />
    </g>
</svg>
