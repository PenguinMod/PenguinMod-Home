<script>
	export let progress = 0.5;
	export let style = "";

	export let leftToRight = true;
	export let holeSize = 50;
	export let holeColor = "white";
	export let emptyColor = "gainsboro";
	export let fillColor = "orange 0deg, yellow 90deg, lightgreen 180deg, green";

	let angle = 360 * progress;
    if (leftToRight) {
        angle = 360 * (1 - progress);
    }
	
	// Adapt the logic according to the approach
	const background = `radial-gradient(${holeColor} ${holeSize}%, transparent ${holeSize + 0.001}%),
        ${leftToRight ?
        `conic-gradient(${emptyColor} 0deg ${angle}deg, transparent ${angle}deg 360deg),`
        :
        `conic-gradient(transparent 0deg ${angle}deg, ${emptyColor} ${angle}deg 360deg),`
        }
        conic-gradient(${fillColor});`;
	
	$: cssVarStyles = `--background: ${background}; ${style}`;
</script>

<style>
    #progress-circle {
        background: var(--background);
        border-radius: 50%;
    }
</style>

<div id="progress-circle" style={cssVarStyles} />