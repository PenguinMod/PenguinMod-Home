<script>
    export let link;
    export let label;
</script>

<a href={link} target="_blank">
    <button class="button">
        {@html label}
    </button>
</a>

<style>
    .button {
        margin-left: 0.1rem;
        margin-right: 0.1rem;
        padding: 0.75rem;
        font-weight: 600;
        font-size: 0.85rem;
        border: 0px;
        border-radius: 4px;
        outline: 0px;
        color: white;
        background-color: transparent;
        cursor: pointer;
    }
    .button:hover {
        background-color: rgba(0, 0, 0, 0.1);
    }
</style>
