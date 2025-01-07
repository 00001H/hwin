export interface MenuItem{
    create(parent: MenuInstance): ElementInstance;
}
export interface NamedMenuItem extends MenuItem{
    get name(): string;
}
export interface ElementInstance{
    get element(): HTMLElement;
}
export class MenuCommand implements NamedMenuItem{
    private _name: string;
    private action: (inst: HWindowInstance | PageInstance) => void;
    constructor(name: string,action: (inst: HWindowInstance | PageInstance) => void){
        this._name = name;
        this.action = action;
    }
    get name(){
        return this._name;
    }
    invoke(on: HWindowInstance | PageInstance){
        this.action(on);
    }
    create(parent: MenuInstance){
        const btn = document.createElement("button");
        btn.classList.add("hwin-button");
        btn.classList.add("hwin-menu-button");
        btn.textContent = this.name;
        btn.addEventListener("click",()=>{
            this.invoke(parent.root);
        });
        return new MenuCommandInstance(this,btn);
    }
}
export class MenuCommandInstance implements ElementInstance{
    private _command: MenuCommand;
    private button: HTMLButtonElement;
    constructor(cmd: MenuCommand,btn: HTMLButtonElement){
        this._command = cmd;
        this.button = btn;
    }
    get command(){
        return this._command;
    }
    get element(){
        return this.button;
    }
}
export class MenuSeparatorInstance implements ElementInstance{
    private sep: HTMLHRElement;
    constructor(sep: HTMLHRElement){
        this.sep = sep;
    }
    get element(){
        return this.sep;
    }
}
export class Separator implements MenuItem{
    create(parent: MenuInstance){
        const sep = document.createElement("hr");
        sep.classList.add("hwin-separator");
        return new MenuSeparatorInstance(sep);
    }
}
export enum MenuFloat{
    AUTO,DOWN,RIGHT
}
class MenuInstance implements ElementInstance{
    private _menu: Menu;
    private contents: ElementInstance[] = [];
    private container: HTMLMenuElement;
    private opened: MenuInstance | null = null;
    private _floating: boolean;
    private _root: HWindowInstance | PageInstance | null = null;
    constructor(menu: Menu,floating: boolean,container: HTMLMenuElement){
        this._menu = menu;
        this._floating = floating;
        this.container = container;
    }
    get root(){
        return this._root!;
    }
    get menu(){
        return this._menu;
    }
    get element(){
        return this.container;
    }
    get floating(){
        return this._floating;
    }
    _attach(root: HWindowInstance | PageInstance){
        this._root = root;
    }
    add(item: ElementInstance){
        this.container.append(item.element);
        this.contents.push(item);
    }
    close(){
        if(this.opened !== null){
            this.opened.element.remove();
            this.opened = null;
        }
    }
    open(submenu: MenuInstance){
        if(this.opened === null){
            this.container.append((this.opened = submenu).element);
        }else if(this.opened.menu !== submenu.menu){
            this.opened.element.replaceWith(submenu.element);
            this.opened = submenu;
        }
    }
    toggle(submenu: MenuInstance){
        if(this.opened !== null && this.opened.menu === submenu.menu){
            this.close();
        }else{
            this.open(submenu);
        }
    }
}
class MenuButtonInstance implements ElementInstance{
    private button: HTMLButtonElement;
    private menu: Menu;
    constructor(menu: Menu,button: HTMLButtonElement){
        this.button = button;
        this.menu = menu;
    }
    get element(){
        return this.button;
    }
};
export class Menu implements NamedMenuItem{
    public static SEPARATOR = new Separator();
    private _name: string | null;
    private _items: MenuItem[] | (() => MenuItem[]);
    private _float: MenuFloat;
    constructor(name: string | null,items: MenuItem[] | (() => MenuItem[]),float: MenuFloat = MenuFloat.AUTO){
        this._name = name;
        this._items = items;
        this._float = float;
    }
    get name(){
        return this._name ?? "<Toplevel>";
    }
    get float(){
        return this._float;
    }
    get items(){
        if(this._items instanceof Array){
            return this._items;
        }
        return this._items();
    }
    private create_submenu(floating: boolean): MenuInstance{
        const submenu = document.createElement("menu");
        submenu.classList.add("hwin-menu");
        if(floating){
            submenu.classList.add("hwin-floating-menu");
        }else{
            submenu.classList.add("hwin-bar-menu");
        }
        const instance = new MenuInstance(this,floating,submenu);
        for(const item of this.items){
            instance.add(item.create(instance));
        }
        return instance;
    }
    create_bar(): MenuInstance{
        return this.create_submenu(false);
    }
    create = this.create_collapsed;
    create_collapsed(parent: MenuInstance): MenuButtonInstance{
        const button = document.createElement("button");
        button.classList.add("hwin-button");
        button.classList.add("hwin-menu-button");
        button.classList.add("hwin-submenu-button");
        button.textContent = this.name;
        button.addEventListener("click",()=>{
            const subm = this.create_submenu(true);
            const button_bounds = button.getBoundingClientRect();
            let float = this.float;
            if(float === MenuFloat.AUTO){
                float = parent.floating ? MenuFloat.RIGHT : MenuFloat.DOWN
            }
            if(float === MenuFloat.DOWN){
                subm.element.style.left = button_bounds.left+"px";
                subm.element.style.top = button_bounds.bottom+"px";
            }else{
                subm.element.style.left = button_bounds.right+"px";
                subm.element.style.top = button_bounds.top+"px";
            }
            parent.toggle(subm);
        });
        return new MenuButtonInstance(this,button);
    }
}
function remove<T>(a: T[],v: T){
    let i = 0;
    while(a[i] !== v)++i;
    while(++i<a.length)a[i-1] = a[i];
    a.pop();
}
export class PlaygroundInstance implements ElementInstance{
    private _space: HTMLDivElement;
    private _windows: HWindowInstance[] = [];
    private _hold: [HWindowInstance,[number,number]] | null = null;
    constructor(space: HTMLDivElement){
        this._space = space;
    }
    get element(){
        return this._space;
    }
    get held_window(): HWindowInstance | null{
        if(this._hold === null)return null;
        return this._hold[0];
    }
    get hold_x(): number | null{
        if(this._hold === null)return null;
        return this._hold[1][0];
    }
    get hold_y(): number | null{
        if(this._hold === null)return null;
        return this._hold[1][1];
    }
    hold(win: HWindowInstance,offset: [number,number]){
        this._hold = [win,offset];
        win.element.style.setProperty("pointer-events","none");
    }
    release(){
        this._hold?.[0].element.style.removeProperty("pointer-events");
        this._hold = null;
    }
    send_to_front(win: HWindowInstance){
        if(this._windows[this._windows.length-1] !== win){
            remove(this._windows,win);
            this._windows.push(win);
            this.element.append(win.element);
        }
    }
    add(win: HWindowInstance){
        win._set_parent(this);
        this._windows.push(win);
        this.element.append(win.element);
    }
    detach(win: HWindowInstance){
        win._set_parent(null);
        remove(this._windows,win);
    }
};
export class HWindowControls{
    //TODO
    create(): HWindowControlsInstance{
        const controls = document.createElement("menu");
        controls.classList.add("hwin-window-controls");
        return new HWindowControlsInstance(controls);
    }
};
export class HWindowControlsInstance{
    //TODO
    private bar: HTMLMenuElement;
    constructor(controls: HTMLMenuElement){
        this.bar = controls;
    }
    get element(){
        return this.bar;
    }
    _attach(win: HWindowInstance){
        this.bar.addEventListener("mousedown",(e)=>{
            if(e.buttons&1){
                const winpos = win.element.getBoundingClientRect();
                win.playground?.hold(win,[e.x-winpos.x,e.y-winpos.y]);
            }
        });
        const title = document.createElement("label");
        title.textContent = win.name;
        this.bar.append(title);
        const minimize = document.createElement("button");
        minimize.classList.add("hwin-button");
        minimize.classList.add("hwin-window-minimize-control");
        minimize.textContent = "(Minimize)";
        minimize.addEventListener("mousedown",(e)=>{
            e.stopPropagation();
        });
        function onminimize(){
            minimize.textContent = "(Restore)";
            win.menu?.element.style.setProperty("display","none");
            win.content.style.setProperty("display","none");
            const w = win.element.style.getPropertyValue("width");
            const h = win.element.style.getPropertyValue("height");
            win.unsize();
            function onrestore(){
                win.element.style.setProperty("width",w);
                win.element.style.setProperty("height",h);
                win.menu?.element.style.removeProperty("display");
                win.content.style.removeProperty("display");
                minimize.textContent = "(Minimize)";
                minimize.removeEventListener("click",onrestore);
                minimize.addEventListener("click",onminimize);
            }
            minimize.removeEventListener("click",onminimize);
            minimize.addEventListener("click",onrestore);
        };
        minimize.addEventListener("click",onminimize);
        this.bar.append(minimize);
        const close = document.createElement("button");
        close.classList.add("hwin-button");
        close.classList.add("hwin-window-close-control");
        close.textContent = "(Close)";
        close.addEventListener("mousedown",(e)=>{
            e.stopPropagation();
        });
        close.addEventListener("click",()=>{
            win.close();
        });
        this.bar.append(close);
    }
};
export class HWindow{
    private _resizable: boolean;
    private _controls: HWindowControls | null;
    private _menu: Menu | null;
    private content: () => HTMLElement;
    constructor(controls: HWindowControls | null,menu: Menu | null,content: () => HTMLElement,config: {resizable?: boolean}={}){
        this._controls = controls;
        this._menu = menu;
        this.content = content;
        this._resizable = config.resizable ?? true;
    }
    get controls(){
        return this._controls;
    }
    get menu(){
        return this._menu;
    }
    get resizable(){
        return this._resizable;
    }
    create(name: string): HWindowInstance{
        const div = document.createElement("div");
        div.classList.add("hwin-window");
        if(this.resizable){
            div.classList.add("hwin-resizable");
        }
        let controls: HWindowControlsInstance | null;
        if(this.controls === null){
            controls = null;
        }else{
            controls = this.controls.create();
            div.append(controls.element);
        }
        let menu: MenuInstance | null;
        if(this.menu === null){
            menu = null;
        }else{
            menu = this.menu.create_bar();
            div.append(menu.element);
        }
        const content = this.content();
        div.append(content);
        const win = new HWindowInstance(name,this,content,controls,menu,div);
        controls?._attach(win);
        menu?._attach(win);
        return win;
    }
};
export class HWindowInstance implements ElementInstance{
    private _parent: PlaygroundInstance | null = null;
    private _name: string;
    private _window: HWindow;
    private _content: HTMLElement;
    private container: HTMLDivElement;
    private _controls: HWindowControlsInstance | null;
    private _menu: MenuInstance | null;
    constructor(name: string,window: HWindow,content: HTMLElement,controls: HWindowControlsInstance | null,menu: MenuInstance | null,container: HTMLDivElement){
        this._name = name;
        this._window = window;
        this._content = content;
        this._controls = controls;
        this._menu = menu;
        this.container = container;
    }
    get playground(){
        return this._parent;
    }
    get name(){
        return this._name;
    }
    get window(){
        return this._window;
    }
    get controls(){
        return this._controls;
    }
    get menu(){
        return this._menu;
    }
    get content(){
        return this._content;
    }
    get element(){
        return this.container;
    }
    get held(){
        return this.playground !== null && this.playground.held_window === this;
    }
    move(x: number,y: number){
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
    }
    resize(w: number,h: number){
        this.element.style.width = `${w}px`;
        this.element.style.height = `${h}px`;
    }
    resize_raw(w: string,h: string){
        this.element.style.width = w;
        this.element.style.height = w;
    }
    unsize(){
        this.element.style.removeProperty("width");
        this.element.style.removeProperty("height");
    }
    _set_parent(page: PlaygroundInstance|null){
        this._parent = page;
    }
    close(){
        this._parent?.detach(this);
        this.element.remove();
    }
};
export class PageInstance implements ElementInstance{
    private _page: Page;
    private container: HTMLDivElement;
    private _playground: PlaygroundInstance;
    private _menu: MenuInstance | null;
    constructor(page: Page,playground: PlaygroundInstance,menu: MenuInstance | null,container: HTMLDivElement){
        this._page = page;
        this._playground = playground;
        this._menu = menu;
        this.container = container;
    }
    get page(){
        return this._page;
    }
    get playground(){
        return this._playground;
    }
    get menu(){
        return this._menu;
    }
    get element(){
        return this.container;
    }
    add(win: HWindowInstance){
        this.playground.add(win);
    }
};
export class Page{
    menu: Menu | null;
    constructor(menu: Menu | null){
        this.menu = menu;
    }
    private create_menu(): MenuInstance{
        const bar = this.menu!.create_bar();
        bar.element.classList.add("hwin-menu-bar");
        return bar;
    }
    private create_playground(): PlaygroundInstance{
        const div = document.createElement("div");
        const playground = new PlaygroundInstance(div);
        div.classList.add("hwin-playground");
        div.addEventListener("mouseup",()=>{
            playground.release();
        });
        div.addEventListener("mousemove",(e)=>{
            if(playground.held_window !== null){
                playground.held_window!.move(e.x-playground.hold_x!,e.y-playground.hold_y!);
                playground.send_to_front(playground.held_window!);
            }
        });
        return playground;
    }
    create(): PageInstance{
        const page = document.createElement("div");
        page.classList.add("hwin-page");
        const pg = this.create_playground();
        let menu: MenuInstance | null;
        if(this.menu === null){
            menu = null;
        }else{
            menu = this.create_menu();
            page.append(menu.element);
            pg.element.addEventListener("click",() => {
                menu!.close();
            });
        }
        page.append(pg.element);
        return new PageInstance(this,pg,menu,page);
    }
}
export const VERSION = "0.1";