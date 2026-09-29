import Clutter from 'gi://Clutter';
import Graphene from 'gi://Graphene';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Workspace} from 'resource:///org/gnome/shell/ui/workspace.js';
import {Extension, InjectionManager} from 'resource:///org/gnome/shell/extensions/extension.js';

export default class MoveToNewWorkspaceExtension extends Extension {
    enable() {
        this._injections = new InjectionManager();
        this._buttons = new Set();

        // Private shell API: if a future GNOME drops it, do nothing rather than break the overview.
        if (typeof Workspace.prototype._addWindowClone !== 'function') {
            console.warn('[move-to-new-workspace] Workspace._addWindowClone not found; extension inactive');
            return;
        }

        const ext = this;
        // Every window thumbnail in the overview is created by Workspace._addWindowClone().
        // We wrap it so each new thumbnail gets our button.
        this._injections.overrideMethod(Workspace.prototype, '_addWindowClone',
            original => function (...args) {
                const clone = original.apply(this, args);
                try {
                    ext._addButton(clone);
                } catch (e) {
                    console.error(`[move-to-new-workspace] ${e}`);
                }
                return clone;
            });
    }

    disable() {
        this._injections?.clear();
        this._injections = null;

        for (const button of [...(this._buttons ?? [])])
            button.destroy();
        this._buttons = null;
    }

    _addButton(clone) {
        const metaWindow = clone?.metaWindow;
        if (!metaWindow || metaWindow.is_on_all_workspaces())
            return;

        const button = new St.Button({
            style_class: 'mtnw-button',
            reactive: true,
            can_focus: true,
            track_hover: true,
            child: new St.Icon({
                icon_name: 'list-add-symbolic',
                style_class: 'mtnw-icon',
            }),
        });

        // Pin the button to the top-centre edge of the window thumbnail.
        const source = clone.windowContainer ?? clone;
        button.add_constraint(new Clutter.AlignConstraint({
            source,
            align_axis: Clutter.AlignAxis.X_AXIS,
            factor: 0.5,
            pivot_point: new Graphene.Point({x: 0.5, y: 0.5}),
        }));
        button.add_constraint(new Clutter.AlignConstraint({
            source,
            align_axis: Clutter.AlignAxis.Y_AXIS,
            factor: 0,
            pivot_point: new Graphene.Point({x: 0.5, y: 0.5}),
        }));

        button.connect('clicked', () => this._moveToNewWorkspace(metaWindow));
        button.connect('destroy', () => this._buttons?.delete(button));

        clone.add_child(button);
        this._buttons.add(button);
    }

    _moveToNewWorkspace(metaWindow) {
        const wm = global.workspace_manager;
        const time = global.get_current_time();

        // Put the new workspace right after the window's current one.
        const current = metaWindow.get_workspace();
        const pos = current ? current.index() + 1 : wm.get_n_workspaces();

        const newWs = wm.append_new_workspace(false, time);
        wm.reorder_workspace(newWs, pos);

        metaWindow.change_workspace(newWs);

        // Switch to that workspace, focus the window and close the overview.
        Main.activateWindow(metaWindow, time);
    }
}
