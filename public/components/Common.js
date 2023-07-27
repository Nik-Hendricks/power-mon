import Component from './Component.js';
import Theme from '../Theme.js';

class Header extends Component{
    constructor(props){
        props = props || {}
        super(props)

        this.title = props.title || "Title"
        this.title_el = document.createElement("h1")

        this.title_el.innerHTML = this.title

        this.Append(this.title_el)

        this.Style(this.title_el, {
            margin: "0px",
            padding: "0px",
            textAlign: "center",
            lineHeight: "50px",
        })

        this.Style(this, {
            position:'absolute',
            height: "50px",
            width: "100%",
            backgroundColor: Theme.dark_grey,
            color: Theme.light_cyan,
        })
    }
}

class MainContent extends Component{
    constructor(props){
        props = props || {}
        super(props)
        this.Style(this, {
            position:'absolute',
            top: "50px",
            height: "calc(100% - 50px)",
            width: "100%",
            backgroundColor: Theme.light_grey,
        })
        return this;
    }
}

class Container extends Component{
    constructor(props){
        super(props);
    }
}

class Text extends Component{
    constructor(props){
        super(props);
        this.innerHTML = props.text || "Text"
    }
}


window.customElements.define('main-content', MainContent);
window.customElements.define('app-header', Header);
window.customElements.define('container-element', Container);
window.customElements.define('text-element', Text);
export {Text, Header, MainContent, Container};