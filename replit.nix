{ pkgs }: {
  deps = [
    pkgs.nodejs-18_x
    pkgs.nodePackages.npm
    pkgs.chromium
    pkgs.glib
    pkgs.nss
    pkgs.nspr
    pkgs.atk
    pkgs.cups
    pkgs.dbus
    pkgs.expat
    pkgs.libdrm
    pkgs.xorg.libX11
    pkgs.xorg.libXcomposite
    pkgs.xorg.libXdamage
    pkgs.xorg.libXext
    pkgs.xorg.libXfixes
    pkgs.xorg.libXrandr
    pkgs.xorg.libxcb
    pkgs.pango
    pkgs.cairo
    pkgs.alsa-lib
    pkgs.at-spi2-atk
    pkgs.gtk3
    pkgs.libxkbcommon
    pkgs.xorg.xorgproto
    pkgs.libGL
    pkgs.libglvnd
    pkgs.mesa
    pkgs.vulkan-loader
    pkgs.fontconfig
    pkgs.freetype
    pkgs.wayland
    pkgs.libxshmfence
  ];
  
  env = {
    LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [
      pkgs.glib
      pkgs.nss
      pkgs.nspr
      pkgs.atk
      pkgs.cups
      pkgs.dbus
      pkgs.libdrm
      pkgs.xorg.libX11
      pkgs.xorg.libXcomposite
      pkgs.xorg.libXdamage
      pkgs.xorg.libXext
      pkgs.xorg.libXfixes
      pkgs.xorg.libXrandr
      pkgs.xorg.libxcb
      pkgs.pango
      pkgs.cairo
      pkgs.alsa-lib
      pkgs.at-spi2-atk
      pkgs.gtk3
      pkgs.libxkbcommon
      pkgs.mesa
      pkgs.fontconfig
      pkgs.freetype
      pkgs.wayland
    ];
    PLAYWRIGHT_BROWSERS_PATH = "/tmp/playwright-browsers";
    PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = "true";
  };
}