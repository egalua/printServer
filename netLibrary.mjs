/**
 * Класс для работы с разными API
 * некоторые методы асинхронны
 */
class Net{
    /**
     * @param {String} apiName используемое API ('baseApi'||'diadokApi'). В зависимости от API выбираются нужные методы: 
     */
    constructor(apiName){
        this.apiName = null;
        this.cache = new Cache();
        this.setOptions();
        this.setApiName(apiName);
        // this.init(apiName);
    }
    // --- параметры и инициализация---
    setOptions(){
        this.options = {
        authentication:{
            email: 'an.i.bakaev@gmail.com',
            password: '959899',
            token: null,
            route: 'http://80.78.251.53:5000/api/v1/auth/token'
        },
        diadokApi:{
            url: 'http://89.108.77.101:3002/',
            calculationModelRoute: 'api/getCalculationModel/'
        },
        baseApi:{
            url: 'http://80.78.251.53:5000/',
            root: 'api/v1/',
            act: 'clc/production/special/act_print',
            clc: 'clc/production/special/clc_print',
            est: 'clc/production/special/est_print',
            spc: 'clc/production/special/spc_print'
        },
        useCache: true,
        validApiNames: ['baseApi'], // исх: ['baseApi','diadokApi']
        numberTypeFields: ['"cost":','"materials_cost":','"consumption_rate":','"price":', '"volume":', '"works_cost":','"works_price":'],
        }
        return this.options;
    }
    switchUseChache(newValue){
        this.options.useCache = !!newValue;
    }
    setApiName(apiName){
        if(this.options.validApiNames.some(vn=>vn==apiName)) this.apiName = apiName;
        else throw(new Error(`Недопустимое имя API. Доступные значения для apiName: ${this.options.validApiNames.join(', ')}`));
    }
    // --- общие методы для работы с API ---
    /**
     * Возвращает промис с токеном или ошибкой получения токена
     * т.е. ошибки во внешнем коде обрабатываем через try{}catch(e){}
     * @returns {Promise} промис с токеном
     */
    async getToken(){
        console.log('----- start get token -----',(new Date()).toLocaleString("ru-RU",{year:'numeric',month:"2-digit",day:'2-digit',hour:'numeric',minute:'numeric',second :'numeric',fractionalSecondDigits:3}))
        if(this.options.authentication.token) {
            console.log('----- end get token -----',(new Date()).toLocaleString("ru-RU",{year:'numeric',month:"2-digit",day:'2-digit',hour:'numeric',minute:'numeric',second :'numeric',fractionalSecondDigits:3}))
            return this.options.authentication.token;
        }

        const url = this.options.authentication.route;

        const formData = new URLSearchParams();
        formData.append('email', this.options.authentication.email);
        formData.append('password', this.options.authentication.password);

        const options = {
            "method": "POST",
            "body": formData,
            "headers": new Headers({
                'Content-Type': 'application/x-www-form-urlencoded'
            }) 
        }
        try{ 
            const response = await fetch(url, options);
            const statusText = response.statusText;
            
            // нужно ли тут проверять код ошибки? и если да, то где посмотреть статус 
            const json = await response.json();

            if(response.status<200 || response.status>299){
                throw(new Error('статус '+response.status+'; '+ statusText));
            }
            if(json.message){
                throw(new Error(json.message))
            }
            if(json.token) this.options.authentication.token = json.token;
            console.log('----- end get token -----',(new Date()).toLocaleString("ru-RU",{year:'numeric',month:"2-digit",day:'2-digit',hour:'numeric',minute:'numeric',second :'numeric',fractionalSecondDigits:3}))
            return json.token;

        }catch(e){ 
            throw(new Error('При получении токена возникла ошибка: '+ e.message));
        }
    }
    async getRoute(route, params){
        console.log('----- start getRout -----',(new Date()).toLocaleString("ru-RU",{year:'numeric',month:"2-digit",day:'2-digit',hour:'numeric',minute:'numeric',second :'numeric',fractionalSecondDigits:3}))
        let url = '';
        const options = {
            method: 'GET',
            headers:null
        }
        const token = await this.getToken();
        // 'baseApi'||'diadokApi'
        if(this.apiName=='baseApi'){
            url = `${this.options.baseApi.url}${this.options.baseApi.root}${route}?${!params? '': params}`;
            options.headers = new Headers({Token: token})
        }
        if(this.apiName=='diadokApi'){
            url = `${this.options.diadokApi.url}${route}?${params}`;
            options.headers = new Headers({authorization: token});
        }
        if(!this.apiName) throw(new Error('Не выбран API для выполнения запроса. this.apiName не установлен'))

        try{
            if(this.options.useCache){
                const res = this.cache.getresponse(url);
                if(res){
                    console.log('getRout: cache hit. url=',url)
                    console.log('----- end getRout -----',(new Date()).toLocaleString("ru-RU",{year:'numeric',month:"2-digit",day:'2-digit',hour:'numeric',minute:'numeric',second :'numeric',fractionalSecondDigits:3}))
                    return await res;
                }
                
            }
            const response = await fetch(url, options);
            const statusText = response.statusText;
            const status = response.status;
            if(status<200 || status>299){
                const errJson = await response.text();
                let err = null;
                try{err = JSON.parse(errJson)}catch(e){} 
                const errMessage = err&&err.message?err.message:`статус ${response.status}; ${statusText}`;

                throw(new Error(errMessage));
            }
            const jsonResponse = await response.text()
            this.cache.update({url:url,response:jsonResponse})
            console.log('----- end getRout -----',(new Date()).toLocaleString("ru-RU",{year:'numeric',month:"2-digit",day:'2-digit',hour:'numeric',minute:'numeric',second :'numeric',fractionalSecondDigits:3}))
            return jsonResponse;

        }catch(e){
            throw(new Error(e.message))
        }

    }
    // --- Получение акта ---
    /**
     * В зависимости от this.apiName выбирает нужный метод получения акта
     * если this.apiName невалидный - генерирует ошибку
     * @param {Number} actId ID акта
     * @returns {Act} объект с параметрами акта
     */
    async getAct(actId){
        if(this.apiName=='baseApi') return await this.getActFromBaseApi(actId);
        // if(this.apiName=='diadokApi') return await this.getActFromDiadokApi(actId);
        throw(new Error('Неизвестное имя API: ', this.apiName));
    }
    /**
     * Возвращает акт по его id используя API Игоря (baseApi)
     * @param {Number} actId ид акта
     */
    async getActFromBaseApi(actId){
        const response = await this.getRoute(this.options.baseApi.act,`act_id=${actId}`);
        return JSON.parse(response);
    }
    // --- Получение калькуляции ---
    async getClc(clcId){
        if(this.apiName=='baseApi') return await this.getClcFromBaseApi(clcId);
        throw(new Error('Неизвестное имя API: ', this.apiName));
    }
    async getClcFromBaseApi(clcId){
        const response = await this.getRoute(this.options.baseApi.clc,`clc_id=${clcId}`);
        return JSON.parse(response);
    }
    // --- Получение расчета ---
    async getEst(estId){
        if(this.apiName=='baseApi') return await this.getEstFromBaseApi(estId);
        throw(new Error('Неизвестное имя API: ', this.apiName));
    }
    async getEstFromBaseApi(estId){
        const response = await this.getRoute(this.options.baseApi.est,`est_id=${estId}`);
        return JSON.parse(response);
    }
    // --- Получение наборов работ ---
    async getWst(wstId){
        if(this.apiName=='baseApi') {
            console.warn('Эта функция пока не реализована');
            return null;
        }
        throw(new Error('Неизвестное имя API: ', this.apiName));
    }
    // --- Получение спецификации ---
    async getSpc(spcId){
        if(this.apiName=='baseApi') {
            console.warn('Эта функция пока не реализована');
            return null;
        }
        throw(new Error('Неизвестное имя API: ', this.apiName));
    }
}

class Cache{
    constructor(){
      this.storage = [];
    }
    clear(){
      this.storage = [];
    }
    /**
     * Ищет запрос среди закешированных, если находит - обновляет, если нет, то добавляет
     * @param{Object} req - url запроса и результат выполнения в виде {url:'', response:JSON}
     */
    update(req){
      const index = this.storage.findIndex(r=>r.url==req.url);
      if(index<0){
        this.storage.push(req)
        return req.response; 
      }
      this.storage[index].response = req.response;
      return req.response;
    }
    getresponse(url){
      const req = this.storage.find(r=>r.url==url)
      const res = req? req.response: null;
      return res;
    }
  }


  export {Net}
