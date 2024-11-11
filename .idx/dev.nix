{pkgs}: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs_20
  ];
  env = {
    PUBLIC_API_URL="https://projects.penguinmod.com";
    PUBLIC_STUDIO_URL="https://studio.penguinmod.com";
  };
  idx.extensions = [
    "svelte.svelte-vscode"
    "vue.volar"
  ];
  idx.previews = {
    previews = {
      web = {
        command = [
          "npm"
          "run"
          "dev"
          "--"
          "--port"
          "$PORT"
          "--host"
          "0.0.0.0"
        ];
        manager = "web";
      };
    };
  };
  idx.workspace.onCreate = {
    npm-install = "npm i --force";
  };
}