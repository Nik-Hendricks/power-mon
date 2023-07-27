
class Component extends HTMLElement{
    constructor(props){
        props = props || {}
        super();
        this.Style(this, props.style || {})
    }

    Style(el, styles){
        Object.keys(styles).forEach(key => {
            el.style[key] = styles[key]
        })
    }
    
    Append(children){
        if(children instanceof Array){
            children.forEach(child => {
                this.appendChild(child)
            })
        }else{
            this.appendChild(children)
        }
        return this;
    }
    
}

export default Component;