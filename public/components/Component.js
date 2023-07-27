
class Component extends HTMLElement{
    constructor(props){
        props = props || {}
        super();
        this.Style(this, props.style || {})
        this.onclick = props.onclick || function(){}
    }

    Style(el, styles){
        Object.keys(styles).forEach(key => {
            el.style[key] = styles[key]
        })
    }
    
    Append(...children){
        if(!Array.isArray(children)){
            children = [children]
        }
        children.forEach(child => {
            this.appendChild(child)
        })
        return this;
    }
    
}

export default Component;