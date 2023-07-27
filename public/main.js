import {Text, Header, MainContent, Container} from './components/Common.js'

import DeviceItem from './components/DeviceItem.js'

import Theme from './Theme.js'
import API from './API.js'




class Map extends Container{
    constructor(props){
        super(props);
        this.lngLat = null;
        mapboxgl.accessToken = 'pk.eyJ1Ijoic3VjdXJyZW50IiwiYSI6ImNqcTdkd2xyZjAzZWU0M2p3ZTZydTZnYnIifQ.MYH4o_kfvsSfdVLHOzyibg';

        this.Map = new mapboxgl.Map({
            container: this, // container id
            style: 'mapbox://styles/mapbox/navigation-night-v1', // map style URL
            center: [-91.8708613, 36.7242055], // starting position [lng, lat]
            zoom: 9 // starting zoom
        });   
        
        this.Map.on('load', () => {
            this.Map.resize();
        });

        this.Map.on('mousemove', (e) => {
            this.lngLat = e.lngLat;
        });
    }
}
window.customElements.define('map-element', Map);

class APP{
    constructor(){
        this.clickListener = null;
        this.Header = new Header({title: "Power Mon"})
        this.MainContent = new MainContent()

        document.body.style.margin = "0px"
        document.body.append(this.Header, this.MainContent)

        this.views = {
            "home":[
                new Container({
                    style:{
                        display:'block',
                        position: "absolute",
                        height: "100%",
                        width: "400px",
                    }
                }),
                new Container({
                    style:{
                        display:'block',
                        position: "absolute",
                        height: "100%",
                        width: "calc(100% - 400px)",
                        marginLeft: "400px",
                    }
                }).Append(new Map({
                    style:{
                        display:'block',
                        height: "calc(100% - 20px)",
                        width: "calc(100% - 10px)",
                        margin:"10px 10px 10px 0px",
                        borderRadius: "10px",
                    }
                }))
            ]
        }
    }

    render(view){
        this.MainContent.innerHTML = ''
        this.views[view].forEach(el => {
            this.MainContent.Append(el)
        })
    }


    steal_click(func) {
        this.clickListener = (ev) => {
            ev.stopPropagation();
            func(ev);
        };
        document.addEventListener('click', this.clickListener);
    }
    
    remove_steal_click() {
        if (this.clickListener) {
            document.removeEventListener('click', this.clickListener);
            this.clickListener = null;
        }
    }
}







window.onload = () => {
    window.app = new APP()
    window.app.render("home")
    var route = window.location.href.split('/')[3]
    window.toggled = null;
    if(route == ''){
        fetch('/devices').then(res => res.json()).then(data => {
            data.forEach(device => {
                window.app.views.home[0].Append(new DeviceItem(device))
            })
        })
    }
}