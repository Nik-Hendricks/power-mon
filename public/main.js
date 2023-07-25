var dark_grey = "#212121"
var light_grey = "#323232"
var dark_cyan = "#0D7377"
var light_cyan = "#14FFEC"


function Style(el, styles){
    Object.keys(styles).forEach(key => {
        el.style[key] = styles[key]
    })
}

class Header extends HTMLElement{
    constructor(props){
        props = props || {}
        super()

        this.title = props.title || "Title"
        this.title_el = document.createElement("h1")

        this.title_el.innerHTML = this.title

        this.append(this.title_el)

        Style(this.title_el, {
            margin: "0px",
            padding: "0px",
            textAlign: "center",
            lineHeight: "50px",
        })

        Style(this, {
            position:'absolute',
            height: "50px",
            width: "100%",
            backgroundColor: dark_grey,
            color: light_cyan,
        })
    }
}

class MainContent extends HTMLElement{
    constructor(props){
        props = props || {}
        super()
        Style(this, {
            position:'absolute',
            top: "50px",
            height: "calc(100% - 50px)",
            width: "100%",
            backgroundColor: light_grey,
        })
        return this;
    }
}


window.customElements.define('main-content', MainContent);
window.customElements.define('app-header', Header);

class APP{
    constructor(){
        this.Header = new Header({title: "Power Man"})
        this.MainContent = new MainContent()

        document.body.style.margin = "0px"
        document.body.append(this.Header, this.MainContent)

        this.views = {
            "home":[
            ]
        }
    }

    render(view){
        this.MainContent.innerHTML = ''
        this.views[view].forEach(el => {
            this.MainContent.append(el)
        })
    }
}

window.onload = () => {
    const app = new APP()
    app.render("home")
}