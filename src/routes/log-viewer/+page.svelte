<script>
    import { onMount } from "svelte";

    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import Button from "$lib/Button/Button.svelte";
    
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import TranslationHandler from "../../resources/translations.js";
    import Language from "../../resources/language";
    import beautify from "js-beautify";
    import JSZip from 'jszip';

    let codeArea;
    /** @type {import('brace').Editor} */
    let editor;
    let ace;
    /** @type {HTMLSelectElement} */
    let selector;
    let selectedLog = null;
    let message = null;
    let subMessage = '';
    let loading = true;
    let logs = [];
    let sources = {};
    let currentLang = "en";
    onMount(async () => {
        Language.forceUpdate();
    });
    Language.onChange((lang) => {
        currentLang = lang;
        let lastDarkMode = null;
        const loop = () => {
            const darkmode = isEmbed ?
                location.hash.replace(/#/gmi, "") === "dark=true"
                : String(localStorage.getItem('darkmode') || prefersDarkMode) === 'true';
            if (darkmode === lastDarkMode) return;
            lastDarkMode = darkmode;
            onThemeChange(darkmode);
        }
        setInterval(loop, 100);
    });
    $: onCodeAreaChanged(codeArea);
    async function onCodeAreaChanged(codeArea) {
        if (!globalThis.window) return;
        ace = await import('brace');
        await import('brace/mode/javascript');
        await import('brace/theme/twilight');
        await import('brace/theme/dawn'); 
        if (editor) editor.destroy();
        queueMicrotask(() => {
            editor = ace.edit(codeArea);
            editor.setOptions({
                fontSize: "15px", showPrintMargin: false,
                highlightActiveLine: true, useWorker: false
            });
            editor.session.setMode('ace/mode/javascript');
            onThemeChange(String(localStorage.getItem('darkmode') || prefersDarkMode) === 'true');
            editor.setValue('// code will appear here when a log is selected');
            editor.setReadOnly(true);
        });
    }
    function onThemeChange(dark) {
        if (!editor) return;
        if (dark)
            editor.setTheme('ace/theme/twilight');
        else
            editor.setTheme('ace/theme/dawn');
    }

    function xmlEscape(str) {
        return str
            .replaceAll('&', '&amp;')
            .replaceAll('>', '&gt;')
            .replaceAll('<', '&lt;')
            .replaceAll("'", '&apos;')
            .replaceAll('"', '&quot;')
            .replaceAll('\n', '<br>');
    }
    const matchSubstitute = /%((?<type>[oOdisfc])|\.(?<precision>[0-9]+)f)/g;
    function formatMessage(args) {
        if (!Array.isArray(args)) args = [args];
        if (matchSubstitute.test(args[0])) {
            let idx = 1;
            let off = 0;
            let out = xmlEscape(args[0]);
            matchSubstitute.lastIndex = -1;
            for (const match of out.matchAll(matchSubstitute)) {
                if (!(idx in args)) continue;
                const item = args[idx++];
                const len = match[0].length;
                const left = out.slice(0, match.index + off);
                const right = out.slice(match.index + len + off);
                off -= len;
                if (match.groups.precision) {
                    const val = Number(item).toFixed(Number((match.groups.precision)));
                    off += val.length;
                    out = left + val + right;
                    continue;
                }
                switch (match.groups.type) {
                case 'o':
                case 'O':
                    out = left + JSON.stringify(item) + right;
                    break;
                case 'd':
                case 'i':
                    out = left + Math.floor(Number(item)) + right;
                    break;
                case 's':
                    out = left + item + right;
                    break;
                case 'f':
                    out = left + Number(item) + right;
                    break;
                case 'c':
                    out = left + `<span style="${xmlEscape(String(item))}">` + right + '</span>';
                    break;
                }
            }
            if (idx < (args.length -1)) out += formatMessage(args.slice(idx));
            return out;
        }
        if (args.every(arg => typeof arg !== 'object'))
            return args
                .map(arg => (arg = xmlEscape(String(arg)).length > 400 
                    ? arg.slice(0, 400) + '...' 
                    : arg)).join(' ');
        return xmlEscape(args.map(arg => JSON.stringify(arg)).join(' '));
    }
    function renderCode(url) {
        const source = sources[url];
        editor.session.setValue(source);
    }
    function selectTrace(id) {
        const log = logs.find(log => log.id === selectedLog);
        const trace = log.trace.find(trace => trace.id === id);
        renderCode(trace.url);
        editor.moveCursorTo(trace.origin[0], trace.origin[1]);
    }
    function selectLog(id) {
        selectedLog = id;
        const log = logs.find(log => log.id === id);
        selector.innerHTML = '';
        for (const trace of log.trace) {
            /** @type {HTMLOptionElement} */
            const option = document.createElement('option');
            option.text = trace.text;
            option.value = trace.id;
            selector.add(option);
        }
        selectTrace(log.trace[0].id);
    }
</script>

<svelte:head>
    <title>PenguinMod - Log Viewer</title>
    <meta name="title" content="PenguinMod - Log Viewer" />
    <meta property="og:title" content="PenguinMod - Log Viewer" />
    <meta property="twitter:title" content="PenguinMod - Log Viewer">
    <meta name="description" content="A utility for viewing the contents of a PenguinMod log file, and browsing the code that made those logs.">
    <meta property="twitter:description" content="A utility for viewing the contents of a PenguinMod log file, and browsing the code that made those logs.">
    <meta property="og:url" content="https://penguinmod.com/log-viewer">
    <meta property="twitter:url" content="https://penguinmod.com/log-viewer">
</svelte:head>

<NavigationBar />
<NavigationMargin />

{#if !loading}
    <div class="rizz-grid">
        <div class="code-pane">
            <select class="trace-selector" bind:this={selector} on:change={e => selectTrace(e.target.value)}></select>
            <div class="code-block" bind:this={codeArea}></div>
        </div>
        <div class="log-messages">
            {#each logs as log}
                <button class={`log-message ${log.type}`} id={log.id} bind:this={log.element} on:click={function() {
                    logs.forEach(log => log.element.classList.remove('selected'));
                    this.classList.add('selected');
                    selectLog(this.getAttribute('id'));
                }}>
                    {@html log.message}
                </button>
            {/each}
        </div>
    </div>
{:else}
    <div class="center-div">
        <div class="card">
            {#if !message}
                <h1>Provide a log file</h1>
                <div class="card-content">
                    <input class="file-area" type="file" accept=".pml" on:change={function() {
                        message = 'Loading file';
                        subMessage = '';
                        const loader = new FileReader();
                        loader.onload = async () => {
                            message = 'Parsing file';
                            subMessage = '';
                            try {
                                const files = await JSZip.loadAsync(loader.result);
                                const index = JSON.parse(await files.file('index.json').async('text'));
                                logs = JSON.parse(await files.file('logs.json').async('text'));
                                for (const log of logs) {
                                    message = 'Formating log contents';
                                    subMessage = `Rendering format of log ${log.message}`;
                                    log.message = formatMessage(log.message);
                                    log.id = ((Math.random() * 0xFFFFFFFF) & 0xFFFFFFFF).toString(16);
                                    for (const trace of log.trace) {
                                        message = 'Loading trace contents';
                                        if (!(trace.url in sources)) {
                                            subMessage = `Fetching source ${trace.url}`;
                                            // check if the log file provided the file
                                            sources[trace.url] = ((await files.file(index[trace.url])?.async?.('text')) ?? (await fetch(trace.url)
                                                .then(async res => [!res.ok, await res.text()])
                                                .catch(() => [true, ''])
                                                .then(([bad, text]) => bad ? '/*!*!*/' + text : text)))
                                                .split('\n')
                                                .map(line => line.split(''));
                                        }
                                        subMessage = `Adding beautifier marker for ${trace.url}`;
                                        const origin = [trace.origin[0] -1, trace.origin[1] -1];
                                        trace.id = ((Math.random() * 0xFFFFFFFF) & 0xFFFFFFFF).toString(16);
                                        const char = sources[trace.url]?.[origin[0]]?.[origin[1]];
                                        if (char?.length <= 1)
                                            sources[trace.url][origin[0]][origin[1]] = `/*! line,column/${trace.origin} !*/` + char;
                                        subMessage = `Creating trace name`;
                                        const traceType = trace.url.startsWith('webpack')
                                            ? 'Webpack'
                                            : sources[trace.url][0].slice(0, 7).join('') === '/*!*!*/'
                                                ? 'NotLoaded'
                                                : 'External';
                                        trace.text = `${trace.name} (<${traceType}> ${trace.origin[0]}:${trace.origin[1]})`;
                                        if (trace.evalType)
                                            trace.text += ` <${trace.evalType}> ${trace.evalOrigin[0]}:${trace.evalOrigin[1]}`;
                                    }
                                }
                                message = 'Beautifying code chunks';
                                for (const url in sources) {
                                    subMessage = `Beautifying ${url}`;
                                    sources[url] = beautify.js(sources[url].map(line => line.join('')).join('\n'));
                                    subMessage = `Updating trace references for ${url}`;
                                    const lines = sources[url].split('\n');
                                    for (const log of logs) {
                                        for (const trace of log.trace) {
                                            if (trace.url !== url) continue;
                                            const id = `/*! line,column/${trace.origin} !*/`;
                                            const row = lines.findIndex(line => line.includes(id));
                                            if (row === -1) continue;
                                            const column = lines[row].indexOf(id);
                                            trace.origin[0] = row;
                                            trace.origin[1] = column;
                                        }
                                    }
                                }
                            } catch (err) {
                                message = 'Error while parsing file data';
                                subMessage = err;
                                throw err;
                            }
                            loading = false;
                        }
                        loader.onerror = () => {};
                        loader.readAsArrayBuffer(this.files[0]);
                    }}>
                </div>
            {:else}
                <h1>{message}</h1>
                <div class="card-content">
                    {subMessage}
                </div>
            {/if}
        </div>
    </div>
{/if}

<style>
    * {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    }

    .text-container {
        width: 50%;
    }
    .image-container {
        position: absolute;
        right: 0;
        top: 0;
        width: 40%;
        height: 100%;
        padding-right: 24px;
        overflow: hidden;
        
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        justify-content: center;
    }
    :global(html[dir="rtl"]) .image-container {
        padding-right: initial;
        right: initial;
        padding-left: 12px;
        left: 0;
        align-items: flex-start;
    }
    .image-button {
        padding: 0;
        margin: 0;
        border: 0;
        background: transparent;

        width: 100%;
        height: 60%;
    }
    .vignette {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 50%);
        z-index: 999999;

        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    h1 {
        font-size: 45px;
        margin-block: 0;
    }

    .code-pane {
        border-right: 1px solid grey;
        display: grid;
        grid-template-rows: max-content 1fr;
    }
    .code-block {
        white-space: preserve nowrap;
    }
    .file-area {
        border-radius: 20px;
        padding: 20px;
        border: 2px dashed #00c3ff;
        stroke-dasharray: 4px 4px;
    }
    .rizz-grid {
        position: absolute;
        left: 0;
        top: 3rem;
        width: 100%;
        height: calc(100% - 3rem);
        display: grid;
        grid-template-columns: 1fr 20rem;
        overflow: hidden;
    }
    .log-messages {
        height: 100%;
        overflow: scroll;
    }
    .trace-selector {
        margin: 5px;
        width: calc(100% - 10px);
        box-sizing: border-box;
        border: 1px solid grey;
        border-radius: 5px;
        color: black;
        background-color: #ddd;
    }
    :global(body.dark-mode) .trace-selector {
        border: 1px solid rgba(255, 255, 255, 35%);
        border-radius: 5px;
        color: white;
        background-color: #222;
    }
    
    :global(body.dark-mode) .log-message {
        color: white;
    }
    .log-message {
        color: black;
        margin-bottom: 2px;
        width: 100%;
        border: none;
        text-align: left;
        cursor: pointer;
    }
    .log-message.selected { filter: brightness(.5); }
    .log-message:hover { filter: brightness(.75); }
    .log-message.log.selected { background-color: #18171738; }
    .log-message.log:hover { background-color: #18171721; }
    .log-message.log { background-color: #18171718; }
    .log-message.warn { background-color: #efb9484d; }
    .log-message.promiseError,
    .log-message.error { background-color: #ef48484d; }
    .log-message.info { background-color: #486def4d; }
    .log-message.debug { background-color: #48ef5f4d; }
    .center-div {
        position: absolute;
        left: 0;
        top: 3rem;
        width: 100%;
        height: calc(100% - 3rem);

        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
    .card-content {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
    }
    .card {
        position: relative;
        width: 70%;
        height: 60%;
        border-radius: 8px;
        padding: 24px 16px;

        border: 1px solid rgba(0, 0, 0, 35%);
        overflow: auto;
        text-align: center;

        display: grid;
        grid-template-rows: max-content 1fr;
    }
    :global(body.dark-mode) .card {
        border-color: rgba(255, 255, 255, 35%);
    }
    :global(body.dark-mode) {
        color: white;
    }
</style>
