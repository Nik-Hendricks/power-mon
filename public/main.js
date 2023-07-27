import {Text, Header, MainContent, Container} from './components/Common.js'
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
}


function create_device_info(device){
    var ret = []
    
    for(var key in device){
        var t = document.createElement('p')
        t.innerHTML = key + ": " + device[key]
        ret.push(new Text({
            text: key + ": " + device[key],
            style:{
                display: "block",
                position: "relative",
                width:"calc(100% - 110px)",
                height: "20px",
                backgroundColor: Theme.light_grey,
                color: Theme.light_cyan,
                marginTop: "10px",
                marginRight: "10px",
                borderRadius: "5px",
                float:'right'
            }
        }))
    }

    return ret;
}


let clickListener = null;

function steal_click(func) {
    clickListener = (ev) => {
        ev.stopPropagation();
        func(ev);
    };
    document.addEventListener('click', clickListener);
}

function remove_steal_click() {
    if (clickListener) {
        document.removeEventListener('click', clickListener);
        clickListener = null;
    }
}

window.onload = () => {
    const app = new APP()
    app.render("home")
    var route = window.location.href.split('/')[3]
    var toggled;
    if(route == ''){
        fetch('/devices').then(res => res.json()).then(data => {
            data.forEach(device => {
                console.log(device);
                var els = [
                    new Container({
                        style:{
                            display: "block",
                            position: "relative",
                            width:"calc(100% - 20px)",
                            height: "100px",
                            backgroundColor: Theme.dark_grey,
                            color: Theme.light_cyan,
                            margin: "10px",
                            borderRadius: "10px",
                        },
                        onclick: (ev) => {
                            var self = els[0];
                            if(toggled == self){
                                toggled = null;
                                self.style.backgroundColor = Theme.dark_grey;
                                return;
                            }else{
                                if(toggled != null){
                                    toggled.style.backgroundColor = Theme.dark_grey;
                                }
                                self.style.backgroundColor = '#1dd1a1'
                                toggled = self;

                                var map = app.views.home[1].getElementsByTagName('map-element')[0];

                                setTimeout(() => {
                                    var waypoint = new Container({
                                        style:{
                                            display: "block",
                                            position: "absolute",
                                            width:"20px",
                                            height: "20px",
                                            backgroundColor: Theme.light_grey,
                                            borderRadius: "5px",
                                        }
                                    })
                                    steal_click((ev) => {
                                        if(ev.target == map.Map._canvas){
                                            new mapboxgl.Marker({ element: waypoint }).setLngLat(map.lngLat).addTo(map.Map);
                                        }
                                    })
                                }, 50);
                                
                            }
                        }
                    }).Append(new Container({
                        style:{
                            display: "block",
                            position: "relative",
                            width:"80px",
                            height: "80px",
                            backgroundColor: Theme.light_grey,
                            top: "10px",
                            left:"10px",
                            borderRadius: "5px",
                            float:'left'
                        },
                        onclick: () => {
                            API.update_device_db().then(res => {
                                console.log(res)
                            })
                        }
                    }),
                    ...create_device_info(device)
                )]
                app.views.home[0].Append(...els)
            })
        })
    }
}