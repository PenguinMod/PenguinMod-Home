<script>
    import { onMount } from "svelte";

    export let data = [];

    const WIDTH = 800;
    const HEIGHT = 320;
    const PAD = { top: 16, right: 16, bottom: 32, left: 56 };

    let mode = "total";
    let hoverIndex = null;

    let values = [];
    let niceMax = 1;
    let line = "";
    let area = "";
    let yTicks = [];
    let xLabels = [];

    onMount(() => {
        updateChart();
    });

    function niceCeil(n) {
        const power = 10 ** Math.floor(Math.log10(n));
        const fraction = n / power;
        if (fraction <= 1) return power;
        if (fraction <= 2) return 2 * power;
        if (fraction <= 5) return 5 * power;
        return 10 * power;
    }

    function x(i) {
        if (data.length <= 1) return PAD.left;
        const usableWidth = WIDTH - PAD.left - PAD.right;
        return PAD.left + (i / (data.length - 1)) * usableWidth;
    }

    function y(value) {
        const usableHeight = HEIGHT - PAD.top - PAD.bottom;
        return PAD.top + (1 - value / niceMax) * usableHeight;
    }

    function updateChart() {
        values = data.map((d) => (mode === "total" ? d.total : d.count));
        niceMax = niceCeil(Math.max(1, ...values));

        line = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
        area = values.length
            ? `${x(0)},${y(0)} ${line} ${x(values.length - 1)},${y(0)}`
            : "";

        yTicks = [0, 1, 2, 3, 4].map((k) => (niceMax * k) / 4);

        xLabels = [];
        data.forEach((d, i) => {
            if (d.month.endsWith("-01")) {
                xLabels.push({ index: i, text: d.month.slice(0, 4) });
            }
        });
    }

    function setMode(newMode) {
        mode = newMode;
        updateChart();
    }

    function handleMouseMove(event) {
        if (data.length === 0) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const pixelX = ((event.clientX - rect.left) / rect.width) * WIDTH;
        const fraction = (pixelX - PAD.left) / (WIDTH - PAD.left - PAD.right);
        const index = Math.round(fraction * (data.length - 1));
        hoverIndex = Math.max(0, Math.min(data.length - 1, index));
    }

    function handleMouseLeave() {
        hoverIndex = null;
    }

    function formatNumber(n) {
        return n.toLocaleString();
    }
</script>

<div class="account-graph">
    <div class="controls">
        <button
            class:active={mode === "total"}
            on:click={() => setMode("total")}
        >
            Total accounts
        </button>
        <button
            class:active={mode === "count"}
            on:click={() => setMode("count")}
        >
            New per month
        </button>
    </div>

    {#if data.length === 0}
        <p>No data.</p>
    {:else}
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <svg
            viewBox="0 0 {WIDTH} {HEIGHT}"
            on:mousemove={handleMouseMove}
            on:mouseleave={handleMouseLeave}
        >
            {#each yTicks as tick}
                <line
                    class="grid"
                    x1={PAD.left}
                    x2={WIDTH - PAD.right}
                    y1={y(tick)}
                    y2={y(tick)}
                />
                <text
                    class="label"
                    x={PAD.left - 8}
                    y={y(tick) + 4}
                    text-anchor="end"
                >
                    {formatNumber(tick)}
                </text>
            {/each}

            {#each xLabels as label}
                <text
                    class="label"
                    x={x(label.index)}
                    y={HEIGHT - 10}
                    text-anchor="middle"
                >
                    {label.text}
                </text>
            {/each}

            <polygon class="area" points={area} />
            <polyline class="line" points={line} />

            {#if hoverIndex !== null}
                <line
                    class="hover"
                    x1={x(hoverIndex)}
                    x2={x(hoverIndex)}
                    y1={PAD.top}
                    y2={HEIGHT - PAD.bottom}
                />
                <circle
                    class="dot"
                    cx={x(hoverIndex)}
                    cy={y(values[hoverIndex])}
                    r="4"
                />
            {/if}
        </svg>

        <div class="tooltip">
            {#if hoverIndex !== null}
                <b>{data[hoverIndex].month}</b>:
                {formatNumber(data[hoverIndex].total)} total (+{formatNumber(
                    data[hoverIndex].count,
                )} that month)
            {:else}
                Hover over the graph for details
            {/if}
        </div>
    {/if}
</div>

<style>
    .account-graph {
        width: 100%;
        max-width: 900px;
    }

    svg {
        width: 100%;
        height: auto;
        display: block;
    }

    .controls {
        display: flex;
        gap: 8px;
        margin-bottom: 8px;
    }

    .controls button {
        padding: 4px 12px;
        border-radius: 6px;
        border: 1px solid rgba(128, 128, 128, 0.5);
        background: transparent;
        color: inherit;
        cursor: pointer;
    }

    .controls button.active {
        background: #00c3ff;
        color: #000;
        border-color: #00c3ff;
    }

    .grid {
        stroke: rgba(128, 128, 128, 0.25);
        stroke-width: 1;
    }

    .label {
        fill: currentColor;
        font-size: 11px;
        opacity: 0.7;
    }

    .line {
        fill: none;
        stroke: #00c3ff;
        stroke-width: 2;
        stroke-linejoin: round;
    }

    .area {
        fill: rgba(0, 195, 255, 0.15);
    }

    .hover {
        stroke: rgba(128, 128, 128, 0.6);
        stroke-dasharray: 4;
    }

    .dot {
        fill: #00c3ff;
    }

    .tooltip {
        min-height: 1.5em;
        margin-top: 6px;
        font-size: 14px;
    }
</style>
