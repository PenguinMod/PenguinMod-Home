<script>
    import { onMount } from "svelte";

    export let placeholder;
    export let text = "";

    let searchBar;

    // Icons
    import SearchSVG from "../../resources/icons/Search/icon.svelte";

    // Functions
    function search(query) {
        if (typeof query !== "string") {
            query = searchBar.value;
        }
        if (query === "") {
            location.href = location.origin;
            return;
        }
        location.href =
            location.origin + `/search?q=${encodeURIComponent(query)}`;
    }
    function enterCheck(event) {
        if (event.key === "Enter") {
            search(searchBar.value);
        }
    }

    onMount(() => {
        const params = new URLSearchParams(location.search);
        const searchQuery = params.get("q");
        if (searchBar && searchQuery) {
            searchBar.value = searchQuery;
        }
    });
</script>

<div class="search">
    <button class="search-button" on:click={search}>
        <SearchSVG
            width="30px"
            height="20px"
            color="#ffffff"
            scale="2px"
            style="margin-bottom:5px; margin-top: 5px;"
        />
    </button>
    <input
        bind:this={searchBar}
        class="search-bar"
        value={text}
        {placeholder}
        name="search"
        on:keypress={enterCheck}
    />
</div>

<style>
    .search {
        margin-left: 0.25rem;
        margin-right: 0.25rem;
        padding: 0px 0.25rem;
        font-weight: 600;
        font-size: 0.85rem;
        border: 0px;
        border-radius: 4px;
        outline: 0px;
        background-color: rgba(0, 0, 0, 0.15);
        color: white;
        display: flex;
        flex-direction: row;
        align-items: center;
    }
    .search-button {
        cursor: pointer;
        height: 100%;
        background: transparent;
        border: 0;
        padding: 0.2rem;
        display: flex;
        align-items: center;
        flex-direction: row;
    }
    .search-bar {
        cursor: text;
        width: 16rem;
        height: 30px;
        background: transparent;
        border: 0;
        color: white;
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        outline: 0;
    }

    /* dont use <selector>, because browsers will ignore it if one of the selectors is unknown */
    ::placeholder {
        color: white;
        opacity: 0.75;
    }
    :-ms-input-placeholder {
        color: white;
        opacity: 0.75;
    }
    ::-ms-input-placeholder {
        color: white;
        opacity: 0.75;
    }
</style>
