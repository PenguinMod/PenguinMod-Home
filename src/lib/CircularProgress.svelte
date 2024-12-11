<script>

	/**
	 * @typedef {Object} Props
	 * @property {number} [progress]
	 * @property {string} [style]
	 * @property {boolean} [leftToRight]
	 * @property {number} [holeSize]
	 * @property {string} [holeColor]
	 * @property {string} [emptyColor]
	 * @property {string} [fillColor]
	 */

	/** @type {Props} */
	let {
		progress = 0.5,
		style = "",
		leftToRight = true,
		holeSize = 50,
		holeColor = "white",
		emptyColor = "gainsboro",
		fillColor = "orange 0deg, yellow 90deg, lightgreen 180deg, green"
	} = $props();

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
	
	let cssVarStyles = $derived(`--background: ${background}; ${style}`);
</script>

<style>
    #progress-circle {
        background: var(--background);
        border-radius: 50%;
    }
</style>

<div id="progress-circle" style={cssVarStyles}></div>