{ pkgs }: {
  deps = [
    # Core development tools
    pkgs.nodejs-18_x
    pkgs.nodePackages.npm
    pkgs.git
    
    # Chromium for Puppeteer
    pkgs.chromium
    
    # SQLite for database
    pkgs.sqlite
    
    # Python (if needed for alternative scripts)
    pkgs.python3
    pkgs.python3Packages.pip
    
    # Build tools for native modules
    pkgs.gcc
    pkgs.gnumake
    pkgs.python3
    
    # System dependencies for Puppeteer
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
  ];
  
  env = {
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = "true";
    PUPPETEER_EXECUTABLE_PATH = "${pkgs.chromium}/bin/chromium";
  };
}
