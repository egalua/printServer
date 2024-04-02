import { createClient } from "webdav";

class YandexDisk{
    constructor(user){
        this.auth = {
            url: "https://webdav.yandex.ru",
            user :   user
        }
        this.client = createClient(this.auth.url, this.auth.user);


    }
}

export {YandexDisk};

