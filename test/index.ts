import {HWindow, HWindowControls, HWindowInstance, Menu, MenuCommand, Page, PageInstance, VERSION} from "../src/hwin.js";
const message_menu = new Menu(null,[
    new MenuCommand("Fire message",(win: HWindowInstance | PageInstance) => {
        const iframe = (win as HWindowInstance).content as HTMLIFrameElement;
        iframe.contentWindow!.postMessage("hello",new URL(iframe.src).origin);
    })
])
const menu_with_close = new Menu(null,[
    new MenuCommand("Close",(win: HWindowInstance | PageInstance) => {
        (win as HWindowInstance).close();
    })
])
const win1 = new HWindow(new HWindowControls(),message_menu,()=>{
    let ifr = document.createElement("iframe");
    ifr.src = location.href;
    return ifr;
});
const win2 = new HWindow(new HWindowControls(),menu_with_close,()=>{
    let ifr = document.createElement("div");
    ifr.style.setProperty("background-color","goldenrod");
    return ifr;
});
const menu = new Menu(null,[
    new Menu("File",[
        new Menu("Recent",[
            new MenuCommand("example.txt",()=>{})
        ]),
        new MenuCommand("Exit",()=>{})
    ]),
    new Menu("Edit",[
        new MenuCommand("Cut",()=>{}),
        new MenuCommand("Copy",()=>{}),
        new MenuCommand("Paste",()=>{}),
        Menu.SEPARATOR,
        new MenuCommand("Find...",()=>{})
    ]),
    new Menu("Window",[
        new Menu("New...",[
            new MenuCommand("Recursive",()=>{
                page.add(win1.create("Test window"));
                page.menu!.close();
            }),
            new MenuCommand("Blank",()=>{
                page.add(win2.create("Test window 2"));
                page.menu!.close();
            })
        ])
    ]),
    Menu.SEPARATOR,
    new Menu("Help",[
        new MenuCommand("About",()=>{alert(`Test page for HWin ${VERSION}`);})
    ])
]);
let page: PageInstance;
addEventListener("load",()=>{
    page = new Page(menu).create();
    page.element.id = "page";
    document.body.append(page.element);
    addEventListener("message",(msg) => {
        if(msg.data === "hello"){
            page.menu!.close();
        }
    });
});