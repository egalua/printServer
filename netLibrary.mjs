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
    // стоит ли делать init асинхронным, ведь тогда и конструктор будет асинхронным
    // пусть при первом же выполнении getToken() значение токена сохраняется
    // async init(apiName){
    //     const token = await this.getToken();
    //     if(!token) throw(new Error('Не удалось получить токен'))
    //     this.setApiName(apiName);
        
    //     // если что-то пойдет не так при инициализации можно выкинуть исключение или вернуть сообщение
    // }
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
        if(this.options.authentication.token) this.options.authentication.token;

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
            // по хорошему нужно еще проверить существование json.token !!!
            if(json.token) this.options.authentication.token = json.token;
            return json.token;

        }catch(e){ // в случае ошибки return не нужен. если возникает ошибка промис запустит reject и передаст ошибку в него
            // console.log('getToken: e = ', e)
            throw(new Error('При получении токена возникла ошибка: '+ e.message));
        }
    }
    async getRoute(route, params){
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

        // url и options сформированы, можно делать запрос
        try{
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
            return await response.text()

        }catch(e){
            throw(new Error(e.message))
        }

    }
    // --- Получение акта ---
    async getAct(actId){
        // в зависимости от this.apiName выбирает нужный метод получения акта
        // если this.apiName невалидный - генерирует ошибку
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
        // в зависимости от this.apiName выбирает нужный метод получения акта
        if(this.apiName=='baseApi') return await this.getClcFromBaseApi(clcId);
        throw(new Error('Неизвестное имя API: ', this.apiName));
    }
    async getClcFromBaseApi(clcId){
        const response = await this.getRoute(this.options.baseApi.clc,`clc_id=${clcId}`);
        return JSON.parse(response);
    }
    // --- Получение расчета ---
    async getEst(estId){
        // в зависимости от this.apiName выбирает нужный метод получения акта
        if(this.apiName=='baseApi') return await this.getEstFromBaseApi(estId);
        throw(new Error('Неизвестное имя API: ', this.apiName));
    }
    async getEstFromBaseApi(estId){
        const response = await this.getRoute(this.options.baseApi.est,`est_id=${estId}`);
        return JSON.parse(response);
    }
    // --- Получение наборов работ ---
    async getWst(wstId){
        // в зависимости от this.apiName выбирает нужный метод получения акта
        if(this.apiName=='baseApi') {
            console.warn('Эта функция пока не реализована');
            return null;
        }
        throw(new Error('Неизвестное имя API: ', this.apiName));
    }
    // --- Получение спецификации ---
    async getSpc(spcId){
        // в зависимости от this.apiName выбирает нужный метод получения акта
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
     * @param{Object} req - url запроса и результат выполнения в виде {url:'', responce:Object}
     */
    update(req){
      const index = this.storage.findIndex(r=>r.url==req.url);
      if(index<0){
        this.storage.push(req)
        return req.responce; 
      }
      this.storage[index].responce = req.responce;
      return req.responce;
    }
    getResponce(url){
      const req = this.storage.find(r=>r.url==url)
      const res = req? req.responce: null;
      return res;
    }
  }


  export {Net}