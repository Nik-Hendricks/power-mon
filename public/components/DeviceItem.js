import {Container, Text} from './Common.js';
import Theme from '../Theme.js';

class DeviceItem extends Container{
    constructor(props){
        var props = props || {}
        super({
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
                if(window.toggled == this){
                    window.toggled.style.backgroundColor = Theme.dark_grey;
                    window.toggled = null;
                    return;
                }else{
                    if(window.toggled !== null){
                        window.toggled.style.backgroundColor = Theme.dark_grey;
                    }
                    this.style.backgroundColor = Theme.dark_cyan;
                    window.toggled = this;

                    var map = window.app.views.home[1].getElementsByTagName('map-element')[0];

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
                        window.app.steal_click((ev) => {
                            if(ev.target == map.Map._canvas){
                                new mapboxgl.Marker({ element: waypoint }).setLngLat(map.lngLat).addTo(map.Map);
                            }
                        })
                    }, 50);

                }
            }
        });




        this.Append(new Container({
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
        ...this.create_device_info())
    }

    create_device_info(){
        var ret = [];

        for(var i = 0; i < 3; i++){
            ret.push(new Text({
                text:'asdf',
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

}

window.customElements.define('device-item', DeviceItem);
export default DeviceItem;