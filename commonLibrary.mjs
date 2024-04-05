class Lib{
    constructor(){

    }
    /**
     * Замена переменных в шаблоне их значениями 
     */
    replaceFromDictionary(string, act){
        let replacementString = string;
        // Подстановки:
        //   тех заказчика - props.tech_customer_
        //   подрядчик - props.contractor_
        //   заказчик - props.customer_
        
        const dictionary = [
          {
            str: '{{objects_full_name}}', 
            act: act.props.objects_full_name?
              act.props.objects_full_name:'{{objects_full_name}}'
          },
          {
            str: '{{clc_doc_name}}', 
            act: act.props.clc_doc_name? act.props.clc_doc_name:'{{clc_doc_name}}'
          },
          {
            str: '{{entity_inn}}', 
            act: act.props.entity_inn? act.props.entity_inn:'{{entity_inn}}'
          },
          {
            str: '{{tech_customer_inn}}', 
            act: act.props.tech_customer_inn? act.props.tech_customer_inn:'{{tech_customer_inn}}'
          },
          {
            str: '{{contractors_inn}}', 
            act: act.props.contractors_inn? act.props.contractors_inn:'{{contractors_inn}}'
          },
          {
            str: '{{entity_full_name}}', 
            act: act.props.entity_full_name? act.props.entity_full_name:'{{entity_full_name}}'
          },
          {
            str: '{{tech_customer}}', 
            act: act.props.tech_customer_name? act.props.tech_customer_name:'{{tech_customer}}'
          },
          {
            str: '{{tech_customer_post}}', 
            act: act.props.tech_customer_post? act.props.tech_customer_post:'{{tech_customer_post}}'
          },
          {
            str: '{{tech_customer_agent}}', 
            act: act.props.tech_customer_agent? act.props.tech_customer_agent:'{{tech_customer_agent}}'
          },
          {
            str: '{{contract_name}}', 
            act: act.props.contract_name? act.props.contract_name:'{{contract_name}}'
          }, // нет
          {
            str: '{{item_clc_code}}', 
            act: act.props.items_clc_code?act.props.items_clc_code:'{{item_clc_code}}'
          }, 
          {
            str: '{{item_name}}', 
            act: act.props.items_name?act.props.items_name:'{{item_name}}'
          },
          {
            str: '{{clc_name}}', 
            act: act.props.clc_name?act.props.clc_name:'{{clc_name}}'
          },
          {
            str: '{{clc_id}}', 
            act: act.props.clc_id?act.props.clc_id:'{{clc_id}}'
          },
          {
            str: '{{entity_contract_id}}', 
            act: act.props.entity_contract_id?act.props.entity_contract_id:'{{entity_contract_id}}'
          },    
          {
            str: '{{start_date}}', 
            act: act.props.start_date?
              (new Date(act.props.start_date)).toLocaleString("ru-RU",{year:'numeric',month:"2-digit",day:'2-digit'}):
              '{{start_date}}'
          }, // нет
          {
            str: '{{end_date}}', 
            act: act.props.end_date?
              (new Date(act.props.end_date)).toLocaleString("ru-RU",{year:'numeric',month:"2-digit",day:'2-digit'}):
              '{{end_date}}'
          }, // нет
          {
            str: '{{contract_prepayment}}', 
            act: act.props.contracts_prepayment? act.props.contracts_prepayment:'{{contract_prepayment}}' 
          }, //нет
          {
            str: '{{work_types.description}}', 
            act: act.props.work_types_description? act.props.work_types_description:
                                                  '{{work_types.description}}' 
          }, // нет
          {
            str: '{{propse.items_clc_code}}', 
            act: act.props.items_clc_code? act.props.items_clc_code:
                                          '{{propse.items_clc_code}}' 
          }, // нет
          {
            str: '{{propse.items_name}}', 
            act: act.props.items_name? act.props.items_name:
                                      '{{propse.items_name}}' 
          }, // нет
          {
            str: '{{propse.volume}}', 
            act: act.props.volume!==undefined? act.props.volume:
                                  '{{propse.volume}}' 
          }, // нет
          {
            str: '{{propse.ed_izm}}', 
            act: act.props.ed_izm? act.props.ed_izm:
                                  '{{propse.ed_izm}}' 
          }, // нет
          {
            str: '{{act_id}}', 
            act: act.act_id? act.act_id:
                                  '{{act_id}}' 
          }, 
          {
            str: '{{act_number}}', 
            act: act.props.number? act.props.number:
                                  '{{act_number}}' 
          },
          {
            str: '{{contractor_name}}', 
            act: act.props.contractors_name? act.props.contractors_name:
                                  '{{contractor_name}}' 
          },
          {
            str: '{{contractor_sig_fio}}', // нет такого поля в актах
            act: act.props.contractor_sig_fio? act.props.contractor_sig_fio:
                                  '{{contractor_sig_fio}}' 
          },
          {
            str: '{{contractor_agent}}', 
            act: act.props.contractor_agent? act.props.contractor_agent:
                                  '{{contractor_agent}}' 
          },
          {
            str: '{{customer_post}}', 
            act: act.props.customer_post? act.props.customer_post:
                                  '{{customer_post}}' 
          },
          {
            str: '{{customer_agent}}', 
            act: act.props.customer_agent? act.props.customer_agent:
                                  '{{customer_agent}}' 
          },
          {
            str: '{{contractor_post}}', 
            act: act.props.contractor_post? (act.props.contractor_post=='-'? '': act.props.contractor_post+' '):
                                  '{{contractor_post}}' 
          },
          {
            str: '{{client_name}}', 
            act: act.props.client_name? act.props.client_name:
                                  '{{client_name}}' 
          },
          {
            str: '{{client_sig_fio}}', 
            act: act.props.client_sig_fio? act.props.client_sig_fio:
                                  '{{client_sig_fio}}' 
          },
          {
            str: '{{act_date}}', 
            act: act.props.date? (new Date(act.props.date)).toLocaleString("ru-RU",{year:'numeric',month:"2-digit",day:'2-digit'}): '{{act_date}}' 
          },
          {
            str: '{{author}}', 
            act: act.props.author? act.props.author: '{{author}}' 
          },
          {
            str: '{{entity_short_name}}', 
            act: act.props.entity_short_name? act.props.entity_short_name: '{{entity_short_name}}' 
          },
          {
            str: '{{entity_name}}', 
            act: act.props.entity_name? act.props.entity_name: '{{entity_name}}' 
          },
          {str: '{{end_of_header}}', act: ''},
          {str: '{{begin_of_footer}}', act: ''},
          {str: '{{end_of_footer}}', act: ''}
        ];
      
        dictionary.forEach(d=>{
          if(d.str!=d.act){
            // заменяем точку на запятую в объеме для правильной вставки в таблицу
            if(typeof(d.act)=='number'){ // смягчить условие
              d.act = d.act.toString().replaceAll('.', ',');
            }
    
            replacementString = (replacementString?replacementString+'':'').replaceAll(d.str, d.act);
          }
            
        })
    
        return replacementString;
      
    }
    /**
     * Конвертирует дату в национальный формат
     * @param {String} dateString строка с датой
     * @returns String строка с датой в ru формате 
     */
    convertToDate(dateString){
        if(dateString && !isNaN(Date.parse(dateString)))  
            return (new Date(dateString)).toLocaleString("ru-RU",{year:'numeric',month:"2-digit",day:'2-digit'})
        return null;
    };
    /**
     * Округляет num до decimals знаков после запятой
     * @param{Number} num число
     * @param{Number} decimals количество знаков после запятой
     * @return{Number} результат округления
     */
    roundToX(num,decimals){
      return +(Math.round(num + "e" + decimals) + "e-" + decimals)
    }
}
export {Lib}
// exports.Lib = Lib;