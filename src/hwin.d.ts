export interface MenuItem {
    create(parent: MenuInstance): ElementInstance;
}
export interface NamedMenuItem extends MenuItem {
    get name(): string;
}
export interface ElementInstance {
    get element(): HTMLElement;
}
export declare class MenuCommand implements NamedMenuItem {
    private _name;
    private action;
    constructor(name: string, action: (inst: HWindowInstance | PageInstance) => void);
    get name(): string;
    invoke(on: HWindowInstance | PageInstance): void;
    create(parent: MenuInstance): MenuCommandInstance;
}
export declare class MenuCommandInstance implements ElementInstance {
    private _command;
    private button;
    constructor(cmd: MenuCommand, btn: HTMLButtonElement);
    get command(): MenuCommand;
    get element(): HTMLButtonElement;
}
export declare class MenuSeparatorInstance implements ElementInstance {
    private sep;
    constructor(sep: HTMLHRElement);
    get element(): HTMLHRElement;
}
export declare class Separator implements MenuItem {
    create(parent: MenuInstance): MenuSeparatorInstance;
}
export declare enum MenuFloat {
    AUTO = 0,
    DOWN = 1,
    RIGHT = 2
}
declare class MenuInstance implements ElementInstance {
    private _menu;
    private contents;
    private container;
    private opened;
    private _floating;
    private _root;
    constructor(menu: Menu, floating: boolean, container: HTMLMenuElement);
    get root(): HWindowInstance | PageInstance;
    get menu(): Menu;
    get element(): HTMLMenuElement;
    get floating(): boolean;
    _attach(root: HWindowInstance | PageInstance): void;
    add(item: ElementInstance): void;
    close(): void;
    open(submenu: MenuInstance): void;
    toggle(submenu: MenuInstance): void;
}
declare class MenuButtonInstance implements ElementInstance {
    private button;
    private menu;
    constructor(menu: Menu, button: HTMLButtonElement);
    get element(): HTMLButtonElement;
}
export declare class Menu implements NamedMenuItem {
    static SEPARATOR: Separator;
    private _name;
    private _items;
    private _float;
    constructor(name: string | null, items: MenuItem[] | (() => MenuItem[]), float?: MenuFloat);
    get name(): string;
    get float(): MenuFloat;
    get items(): MenuItem[];
    private create_submenu;
    create_bar(): MenuInstance;
    create: (parent: MenuInstance) => MenuButtonInstance;
    create_collapsed(parent: MenuInstance): MenuButtonInstance;
}
export declare class PlaygroundInstance implements ElementInstance {
    private _space;
    private _windows;
    private _hold;
    constructor(space: HTMLDivElement);
    get element(): HTMLDivElement;
    get held_window(): HWindowInstance | null;
    get hold_x(): number | null;
    get hold_y(): number | null;
    hold(win: HWindowInstance, offset: [number, number]): void;
    release(): void;
    send_to_front(win: HWindowInstance): void;
    add(win: HWindowInstance): void;
    detach(win: HWindowInstance): void;
}
export declare class HWindowControls {
    create(): HWindowControlsInstance;
}
export declare class HWindowControlsInstance {
    private bar;
    constructor(controls: HTMLMenuElement);
    get element(): HTMLMenuElement;
    _attach(win: HWindowInstance): void;
}
export declare class HWindow {
    private _resizable;
    private _controls;
    private _menu;
    private content;
    constructor(controls: HWindowControls | null, menu: Menu | null, content: () => HTMLElement, config?: {
        resizable?: boolean;
    });
    get controls(): HWindowControls | null;
    get menu(): Menu | null;
    get resizable(): boolean;
    create(name: string): HWindowInstance;
}
export declare class HWindowInstance implements ElementInstance {
    private _parent;
    private _name;
    private _window;
    private _content;
    private container;
    private _controls;
    private _menu;
    constructor(name: string, window: HWindow, content: HTMLElement, controls: HWindowControlsInstance | null, menu: MenuInstance | null, container: HTMLDivElement);
    get playground(): PlaygroundInstance | null;
    get name(): string;
    get window(): HWindow;
    get controls(): HWindowControlsInstance | null;
    get menu(): MenuInstance | null;
    get content(): HTMLElement;
    get element(): HTMLDivElement;
    get held(): boolean;
    move(x: number, y: number): void;
    resize(w: number, h: number): void;
    resize_raw(w: string, h: string): void;
    unsize(): void;
    _set_parent(page: PlaygroundInstance | null): void;
    close(): void;
}
export declare class PageInstance implements ElementInstance {
    private _page;
    private container;
    private _playground;
    private _menu;
    constructor(page: Page, playground: PlaygroundInstance, menu: MenuInstance | null, container: HTMLDivElement);
    get page(): Page;
    get playground(): PlaygroundInstance;
    get menu(): MenuInstance | null;
    get element(): HTMLDivElement;
    add(win: HWindowInstance): void;
}
export declare class Page {
    menu: Menu | null;
    constructor(menu: Menu | null);
    private create_menu;
    private create_playground;
    create(): PageInstance;
}
export declare const VERSION = "0.1";
export {};
