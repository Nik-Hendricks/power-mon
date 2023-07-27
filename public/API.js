const API = {
    //functions that communicate with the server
    
    update_device_db: () => {
        return fetch("/update_device_db").then(res => res.text());
    },


    //function that actually gets data or commands the device

    getDevices: () => {
        return fetch("/devices").then(res => res.json());
    },
}

export default API;