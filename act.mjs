import {Net} from './netLibrary.mjs'
import {Lib} from "./commonLibrary.mjs";
import fs from "fs";
import PdfPrinter from "pdfmake"
import {YandexDisk} from './yandexDisk.mjs';
import {XMLParser} from 'fast-xml-parser';

class Act{
  constructor(actId){
    this.actId = actId;
    this.printOptions = {
      fonts: {
        Verdana: {
          normal: 'fonts/Verdana.ttf',
          bold: 'fonts/Verdana-Bold.ttf',
          italics: 'fonts/Verdana-Italic.ttf',
          bolditalics: 'fonts/Verdana-BoldItalic.ttf'
        }
      }
    }
    this.fsOptions = {
      localPath:'acts'
    }
    this.yandexOptions = {
      user:{
        username: "ay.bakaev", // yandex ID
        password: "gqiezviqkfzwztuy" // пароль для приложений
      },
      basePath: '/Тестирование распечаток/'
    }
    this.lib = new Lib();
    this.net = new Net('baseApi');
    this.printer = new PdfPrinter(this.printOptions.fonts);
    this._act = null;
    const yd = new YandexDisk(this.yandexOptions.user);
    this.yandexClient = yd.client;
    this.xmlParser = new XMLParser();

  }
  async print(){
    let act = null;
    try{
      act = await this.net.getAct(this.actId);
    }catch(e){
      return {error: e.message}
    }
    
    this._act = act;
    const filename = `Акт №${act.props.number} от ${this.lib.convertToDate(act.props.date)} -ID ${act.act_id}.pdf`
    const actFileName = `${this.fsOptions.localPath}/${filename}`;

    const docDefinition = {
      pageSize: 'A4',
      pageOrientation: 'landscape',
      defaultStyle: {
        font: 'Verdana'
      },
      content: [ // массив строк
        {
          layout: 'lightBorders',
          table: {
            widths: [ (203/1643)*100+'%', (422/1643)*100+'%',(102/1643)*100+'%',(105/1643)*100+'%',(131/1643)*100+'%',(130/1643)*100+'%',(126/1643)*100+'%',(138/1643)*100+'%',(142/1643)*100+'%',(142/1643)*100+'%'],
            body: [
              ...this.getActHeader(),
            ]
          }
        },
        {text:'_',fontSize:7,style:{color:'white'}},
        {
          layout: 'lightBorders',
          table: {
            headerRows: 1,
            widths: [ (203/1643)*100+'%', (422/1643)*100+'%',(102/1643)*100+'%',(105/1643)*100+'%',(131/1643)*100+'%',(130/1643)*100+'%',(126/1643)*100+'%',(138/1643)*100+'%',(142/1643)*100+'%',(142/1643)*100+'%'],
            body: [
              ...this.getActBody(),
            ]
          }
        }
      ]
    }
    const options = {
      tableLayouts: {
        blackBorders: {
          hLineColor: 'black',
          vLineColor: 'black'
        },        
        lightBorders: {
          hLineWidth: function (i) {
            return 1;
          },
          vLineWidth:function (i) {
            return 1;
          },
          hLineColor: 'lightgray',
          vLineColor: 'lightgray'
        }
      }
    }
    try{
      const pdfDoc = this.printer.createPdfKitDocument(docDefinition, options);
      pdfDoc.pipe(fs.createWriteStream(actFileName));
      pdfDoc.end();
    }catch(e){
      return {error:e.message}
    }


    const yandexFileName = this.yandexOptions.basePath + filename;
    
    try{
      const url = await this.saveFileToYandex(yandexFileName, actFileName);
      // можно удалить actFileName
      fs.unlink(actFileName, err=>{if(err) console.warn('Не удалось удалить файл '+ actFileName)})
      return {actPrintUrl:url}
    }catch(e){
      // можно удалить actFileName
      fs.unlink(actFileName, err=>{if(err) console.warn('Не удалось удалить файл '+ actFileName)})
      return {error:e.message}
    }  
    

  }
  /**
   * Сохраняет файл на Яндекс диске
   * @param {String} remoteFilename 
   * @param {String} sourceFilename 
   */
  async saveFileToYandex(remoteFilename, sourceFilename){
    const client = this.yandexClient;
    const stream = fs.createReadStream(sourceFilename)
    const isPut= await client.putFileContents(remoteFilename, stream, { overwrite: true })

    console.log('act print: isPut = ', isPut)
    // Публикация файла (https://yandex.ru/dev/disk/doc/ru/reference/publish)
    const publicResponse = await client.customRequest(remoteFilename, {
      method: "PROPPATCH",
      data:`<propertyupdate xmlns="DAV:">
              <set>
                <prop>
                  <public_url xmlns="urn:yandex:disk:meta">true</public_url>
                </prop>
              </set>
            </propertyupdate>`
    });
    

    
    if(publicResponse&&publicResponse.url){
      // url на сервисе webdav yandex: publicResponse.url;
      const xmlResponse = await publicResponse.text(); 
      const response = this.xmlParser.parse(xmlResponse)
      return response['d:multistatus']['d:response']['d:propstat']['d:prop']['public_url'];
    } 
    return null;
    
  }
  /**
   * Возвращает шапку распечатки акта в табличном формате
   */
  getActHeader(){
    const act = this._act;
    const baseFonSize = 7;
    const altFontSize = 6;
    return [ // массив строк (каждый подмассив - строка)
      [ 
        {/*border: [false, false, false, false],*/ text:'Заказчик', bold:true, fontSize:altFontSize},
        {text:`${act.props.entity_name? act.props.entity_name: '{{entity_name}}'} (ИНН ${act.props.entity_inn? act.props.entity_inn:'{{entity_inn}}'})`,fontSize:baseFonSize,colSpan:3} , 
        '','','', 
        {text:`${act.props.customer_post? act.props.customer_post:'{{customer_post}}'} ${act.props.customer_agent? act.props.customer_agent:'{{customer_agent}}'}`,fontSize:baseFonSize,colSpan:5},
        '','','',''
      ],
      [ 
        {text:'Техзаказчик', bold:true, fontSize:altFontSize}, 
        {text:`${act.props.tech_customer_name? act.props.tech_customer_name:'{{tech_customer}}'} (ИНН ${act.props.tech_customer_inn? act.props.tech_customer_inn:'{{tech_customer_inn}}'})`,fontSize:baseFonSize,colSpan:3}, 
        '','','',
        {text:`${act.props.tech_customer_post? act.props.tech_customer_post:'{{tech_customer_post}}'} ${act.props.tech_customer_agent? act.props.tech_customer_agent:'{{tech_customer_agent}}'}`,fontSize:baseFonSize,colSpan:5},
        '','','',''
      ],
      [ 
        {text:'Подрядчик',bold:true, fontSize:altFontSize}, 
        {text:`${act.props.contractors_name? act.props.contractors_name:'{{contractor_name}}'} (ИНН ${act.props.contractors_inn? act.props.contractors_inn:'{{contractors_inn}}'})`,fontSize:baseFonSize,colSpan:3}, 
        '','','', 
        {text:`${act.props.contractor_post? (act.props.contractor_post=='-'? '': act.props.contractor_post+' '):'{{contractor_post}}'} ${act.props.contractor_agent? act.props.contractor_agent:'{{contractor_agent}}'}`,fontSize:baseFonSize,colSpan:5},
        '','','','' 
      ],
      [
        {text:'Объект',bold:true, fontSize:altFontSize},
        {text:`${act.props.objects_full_name?act.props.objects_full_name:'{{objects_full_name}}'}`,fontSize:baseFonSize,colSpan:9},
        '','','','','','','',''
      ],
      [{text:'_',fontSize:baseFonSize,colSpan:10,style:{color:'white'}},'','','','','','','','',''],
      [
        '',
        {text:'АКТ О ПРИЕМКЕ ВЫПОЛНЕННЫХ РАБОТ',bold:true,fontSize:altFontSize,colSpan:3,style:{alignment:'right'}},
        '','',
        {text:`${act.props.number? act.props.number:'{{act_number}}'}`,fontSize:baseFonSize,style:{alignment:'right'}},
        {text:`от ${act.props.date? (new Date(act.props.date)).toLocaleString("ru-RU",{year:'numeric',month:"2-digit",day:'2-digit'}): '{{act_date}}'}`,fontSize:baseFonSize,colSpan:2},
        '','',
        {text:'Отчетный период',fontSize:baseFonSize,colSpan:2},
        ''
      ],
      [
        {text:'Айди Акта / Клк / Дог',fontSize:baseFonSize},
        {text:`${act.act_id? act.act_id:'{{act_id}}'} / ${act.props.clc_id?act.props.clc_id:'{{clc_id}}'} / ${act.props.entity_contract_id?act.props.entity_contract_id:'{{entity_contract_id}}'}`,fontSize:baseFonSize,colSpan:6},
        '','','','','','',
        {text:`с ${act.props.start_date?(new Date(act.props.start_date)).toLocaleString("ru-RU",{year:'numeric',month:"2-digit",day:'2-digit'}):'{{start_date}}'}`,fontSize:baseFonSize},
        {text:`по ${act.props.end_date?(new Date(act.props.end_date)).toLocaleString("ru-RU",{year:'numeric',month:"2-digit",day:'2-digit'}):'{{end_date}}'}`,fontSize:baseFonSize}
      ],
      [
        {text:'Статья',fontSize:baseFonSize},
        {text:`${act.props.items_clc_code?act.props.items_clc_code:'{{item_clc_code}}'} ${act.props.items_name?act.props.items_name:'{{item_name}}'}`,fontSize:baseFonSize,bold:true,colSpan:6},
        '','','','','','','',''
      ],
      [
        {text:'Договор',fontSize:baseFonSize},
        {text:`${act.props.contract_name? act.props.contract_name:'{{contract_name}}'}`,fontSize:baseFonSize,colSpan:6},
        '','','','','','','',''
      ],
      [
        {text:'Клк',fontSize:baseFonSize},
        {text:`${act.props.clc_name?act.props.clc_name:'{{clc_name}}'}`,bold:true,fontSize:baseFonSize,colSpan:6},
        '','','','','','','',''
      ],
      [
        {text:'Акт создал',fontSize:baseFonSize},
        {text:`${act.props.author? act.props.author: '{{author}}'}`,fontSize:baseFonSize,colSpan:6},
        '','','','','','','',''
      ]
    ];
  }
  getActBody(){
    const act = this._act;
    const baseFonSize = 7;
    const altFontSize = 6;
    const headerTableBackground='#1155CC';
    const epsHeaderBackground = '#6D9EEB';
    const actBody = [
      [ // заголовок таблицы
        {text:'№ п.п.', bold:true, style:{color:'white', alignment:'center'}, fontSize:baseFonSize, fillColor:headerTableBackground},    
        {text:'Наименование работ', bold:true, style:{color:'white', alignment:'left'}, fontSize:baseFonSize, fillColor:headerTableBackground},    
        {text:'Расход', bold:true, style:{color:'white', alignment:'center'}, fontSize:baseFonSize, fillColor:headerTableBackground},    
        {text:'Ед. изм.', bold:true, style:{color:'white', alignment:'center'}, fontSize:baseFonSize, fillColor:headerTableBackground},    
        {text:'Объем', bold:true, style:{color:'white', alignment:'center'}, fontSize:baseFonSize, fillColor:headerTableBackground},    
        {text:'Стоимость за единицу', bold:true, style:{color:'white', alignment:'center'}, fontSize:baseFonSize, fillColor:headerTableBackground},    
        {text:'Итого, руб', bold:true, style:{color:'white', alignment:'center'}, fontSize:baseFonSize, fillColor:headerTableBackground},    
        {text:'Комментарий', bold:true, style:{color:'white', alignment:'center'}, fontSize:baseFonSize, fillColor:headerTableBackground},    
        {text:'Дата\nНачало', bold:true, style:{color:'white', alignment:'center'}, fontSize:baseFonSize, fillColor:headerTableBackground},    
        {text:'Дата\nЗавершение', bold:true, style:{color:'white', alignment:'center'}, fontSize:baseFonSize, fillColor:headerTableBackground},    
      ],
      [
        {text:'Всего', bold:true, style:{color:'white', alignment:'center'}, fontSize:baseFonSize, fillColor:headerTableBackground},  
        {text:`${act.props.items_clc_code? act.props.items_clc_code:'{{propse.items_clc_code}}'} ${act.props.items_name? act.props.items_name:'{{propse.items_name}}'}`, bold:true, style:{color:'white', alignment:'left'}, fontSize:baseFonSize, fillColor:headerTableBackground},  
        {text:'', fillColor:headerTableBackground},
        {text:'', fillColor:headerTableBackground},
        {text:'', fillColor:headerTableBackground},
        {text:'', fillColor:headerTableBackground},
        // итого: сумма всех материалов и работ
        {text:'{{общая сумма}}', bold:true, style:{color:'white', alignment:'center'}, fontSize:baseFonSize, fillColor:headerTableBackground},
        {text:'', fillColor:headerTableBackground},{text:'', fillColor:headerTableBackground},{text:'', fillColor:headerTableBackground}
      ],
      [
        '',
        {text:'Работа и механизмы', bold:false, style:{color:'black', alignment:'left'}, fontSize:baseFonSize},
        '','','','',
        // итого: сумма работ
        {text:'{{сумма работ}}', bold:false, style:{color:'black', alignment:'left'}, fontSize:baseFonSize},
        '','',''
      ],
      [
        '',
        {text:'Материалы', bold:false, style:{color:'black', alignment:'left'}, fontSize:baseFonSize},
        '','','','',
        // итого: сумма материалов
        {text:'{{сумма материалов}}', bold:false, style:{color:'black', alignment:'left'}, fontSize:baseFonSize},
        '','',''
      ]
    ]
    
    // общий план
    // ... цикл по act.eps
    // ... цикл по act.eps[i].eks
    // ... цикл по act.eps[i].eks[j].mats для act.eps[i].eks[j].mats[k].basic!=0
    // ... цикл по act.eps[i].eks[j].mats для act.eps[i].eks[j].mats[k].basic==0

    // формируем "тело" таблицы: перебираем еп; ек внутри еп; материалы внутри ек
    act.eps.forEach(ep => {
      // const factVolume = act.eps[i].eks.reduce((all,e)=>{ all+=parseFloat(e.fact_volume?e.fact_volume:0); return all},0);
      const factVolume = ep.eks.reduce((acc,ek)=>{
        const factVolume = ek.fact_volume? this.lib.roundToX(parseFloat(ek.fact_volume), 4) :0;
        acc = this.lib.roundToX(((this.lib.roundToX((acc*1000),0) + this.lib.roundToX(factVolume*10000,0)) /10000), 4);
        return acc;
      },0);
      const price = this.lib.roundToX(ep.price?ep.price:0, 2);
      const cost =  this.lib.roundToX((this.lib.roundToX(factVolume*10000,0) * this.lib.roundToX(price*100,0)) / 1000000, 2);
      // строка для eps
      actBody.push([
        {text:ep.order_num,fontSize:baseFonSize,fillColor:epsHeaderBackground,bold:true,style:{alignment:'center'}}, // № п.п.
        {text:ep.name,fontSize:baseFonSize,fillColor:epsHeaderBackground,bold:true},// Наименование работ
        {text:'',fontSize:baseFonSize,fillColor:epsHeaderBackground,bold:true}, // расход
        {text:'',fontSize:baseFonSize,fillColor:epsHeaderBackground,bold:true}, // ед.изм.
        {text:factVolume,fontSize:baseFonSize,fillColor:epsHeaderBackground,bold:true}, // Объем
        {text:price,fontSize:baseFonSize,fillColor:epsHeaderBackground,bold:true}, // Стоимость за единицу
        {text:cost,fontSize:baseFonSize,fillColor:epsHeaderBackground,bold:true}, // Итого, руб. - замена на прямой подсчет price*volume
        {text:'',fontSize:baseFonSize,fillColor:epsHeaderBackground,bold:true}, // Комментарий
        {text:'',fontSize:baseFonSize,fillColor:epsHeaderBackground,bold:true}, // Дата Начало
        {text:'',fontSize:baseFonSize,fillColor:epsHeaderBackground,bold:true} // Дата Завершение
      ])
      // ep.eks.forEach(ek=>{
      //   actBody.push([])  
      // })
    });
    return actBody;
  }

}



// **************************************************************************************************
// тест класса Act
// **************************************************************************************************

// async function testAtc(){
//   const actId = 549;
//   const act = new Act(actId);
//   const resp = await act.print();
//   console.log(resp)
// }

// testAtc()

export {Act};