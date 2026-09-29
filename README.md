# Move to New Workspace

A GNOME Shell extension that adds a **+** button to every window in the Activities overview.
Click it and the window moves to a brand-new workspace, inserted right after the window's current one,
and you land on it with the window focused.

Supports GNOME Shell 45–50 (tested on 46).

## Install

From [extensions.gnome.org](https://extensions.gnome.org) (search "Move to New Workspace"), or from a release zip:

```bash
gnome-extensions install --force move-to-new-workspace@skander2905.github.io.shell-extension.zip
```

Then log out and back in (Wayland) and enable it:

```bash
gnome-extensions enable move-to-new-workspace@skander2905.github.io
```

## Build the zip

```bash
gnome-extensions pack --force --extra-source=LICENSE
```

## License

GPL-2.0-or-later. See [LICENSE](LICENSE).
