import {Header, MainContent, Container} from './components/Common.js'

var dark_grey = "#212121"
var light_grey = "#323232"
var dark_cyan = "#0D7377"
var light_cyan = "#14FFEC"




class Map extends Container{
    constructor(props){
        super(props);
        mapboxgl.accessToken = 'pk.eyJ1Ijoic3VjdXJyZW50IiwiYSI6ImNqcTdkd2xyZjAzZWU0M2p3ZTZydTZnYnIifQ.MYH4o_kfvsSfdVLHOzyibg';

        var map = new mapboxgl.Map({
            container: this, // container id
            style: 'mapbox://styles/mapbox/navigation-night-v1', // map style URL
            center: [-91.8708613, 36.7242055], // starting position [lng, lat]
            zoom: 9 // starting zoom
        });   
        
        map.on('load', function () {
            map.resize();
        });
    }
}




window.customElements.define('main-content', MainContent);
window.customElements.define('app-header', Header);
window.customElements.define('container-element', Container);
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

window.onload = () => {
    const app = new APP()
    app.render("home")
    var route = window.location.href.split('/')[3]
    if(route == ''){
        fetch('/devices').then(res => res.json()).then(data => {
            data.forEach(device => {
                console.log(device);

                var c = new Container({style:{
                    display: "block",
                    position: "relative",
                    width:"calc(100% - 20px)",
                    height: "100px",
                    backgroundColor: dark_grey,
                    color: light_cyan,
                    margin: "10px",
                    borderRadius: "10px",
                }}).Append(new Container({style:{
                    display: "block",
                    position: "absolute",
                    width:"calc(100px - 20px)",
                    height: "calc(100% - 20px)",
                    backgroundColor: light_grey,
                    margin: "10px",
                    borderRadius: "5px",
                }}), new Container({style:{
                    display: "block",
                    position: "absolute",
                    width:"calc(100% - 110px)",
                    height: "calc(100% - 20px)",
                    backgroundColor: light_grey,
                    margin: "10px",
                    marginLeft: "calc(100px)",
                    borderRadius: "5px",
                }}))

                app.views.home[0].Append(c)
            })
        })
    }
}