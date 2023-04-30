<script>
    import { page } from "$app/stores";
</script>

<head>
    <title>PenguinMod - {$page.status}</title>
</head>

<h1>Whoops!</h1>
<p>Something's not quite right. Maybe you should <a href="../">go back?</a></p>

<p>Error: {$page.status} - {$page.error.message}</p>
