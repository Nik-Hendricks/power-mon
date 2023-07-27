const API = {
    //functions that communicate with the server
    
    update_device_db: () => {
        return fetch("/update_device_db").then(res => res.text());
    },

    update_db: (db, id, data) => {
        return fetch("/update_db", {
            method: "POST",
            body: JSON.stringify({
                db: db,
                id: id,
                data: data
            }),
            headers: {
                "Content-Type": "application/json"
            }
        }).then(res => res.text());
    },

    //function that actually gets data or commands the device

    getDevices: () => {
        return fetch("/devices").then(res => res.json());
    },
}

export default API;