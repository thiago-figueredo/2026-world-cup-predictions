{
  description = "Node.js 22 + TensorFlow.js dev environment (no Python)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };

      in {
        devShells.default = pkgs.mkShell {
          buildInputs = [
            pkgs.nodejs_22
          ];

          shellHook = ''
            echo "🚀 Node 22 environment ready"
            echo "Node: $(node -v)"
            echo "NPM: $(npm -v)"
          '';
        };
      });
}