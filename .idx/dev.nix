# Firebase Studio (Project IDX) Workspace Configuration for CoThread
{ pkgs, ... }: {
  channel = "stable-24.05";

  packages = [
    pkgs.nodejs_22
    pkgs.firebase-tools
    pkgs.google-cloud-sdk
  ];

  env = {
    PORT = "8080";
    NODE_ENV = "development";
    GOOGLE_CLOUD_LOCATION = "us-central1";
  };

  idx = {
    extensions = [
      "google.gemini-cli-vscode-ide-companion"
    ];

    workspace = {
      onCreate = {
        npm-install = "npm install";
      };
      onStart = {
        cothread-server = "npm run start";
      };
    };

    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm" "run" "start" "--" "--port" "$PORT"];
          manager = "web";
        };
      };
    };
  };
}
