var main_dev = "";                      // ОСНОВНОЙ ДЕВАЙС
var main_dev_restr_lst = new Map();     // ОГРАНИЧЕНИЯ ОСНОВНОЙ DEVICE
var device_restr_lst = new Map();       // ОГРАНИЧЕНИЯ DEVICE
var approval_restr_lst = new Map();     // ОГРАНИЧЕНИЯ ВЗРЫВОБЕЗОПАСНОСТЬ
var special_restr_lst = new Map();      // ОГРАНИЧЕНИЯ SPECIAL
var electrical_restr_lst = new Map();   // ОГРАНИЧЕНИЯ ELECTRICAL
var thread_restr_lst = new Map();       // ОГРАНИЧЕНИЯ THREAD
var flange_restr_lst = new Map();       // ОГРАНИЧЕНИЯ FLANGE
var hygienic_restr_lst = new Map();     // ОГРАНИЧЕНИЯ HYGIENIC
var restr_conf_lst;                     // МАССИВ ОГРАНИЧЕНИЙ из option_names
var option_names = ["main_dev", "approval", "output", "electrical"]; // НАЗВАНИЯ ОПЦИЙ для проверки доступности
var connection_types = ["thread", "flange", "hygienic"];
var search_names = ["device", "approval", "output", "material", "special", "electrical", "thread", "flange", "hygienic"]; ///ИМЕНА ДЛЯ ИЗВЛЕЧЕНИЯ ПОЛНОГО ОПИСАНИЯ из JSON
var low_press = -101;       // начало диапазона избыт, кПа
var hi_press = 100000;      // конец диапазона избыт, кПа
var min_range = 2.5;        // мин ширина диапазона избыт, кПа
var low_press_abs = 0;      // начало диапазона абс, кПа
var hi_press_abs = 10000;   // конец диапазона абс, кПа
var min_range_abs = 20.0;   // мин ширина диапазона абс, кПа
var low_press_diff = -160; // начало диапазона перепад, кПа
var hi_press_diff = 2500;   // конец диапазона перепад, кПа
var min_range_diff = 1.6;   // мин ширина диапазона перепад, кПа
var ctr_low_temp; //ограничение начала диапазона температуры CTR
var ctr_high_temp;//ограничение конца диапазона температуры CTR
var sensor_names = ["thermocouple", "thermoresistor", "material", "cabel", "ctr-electrical"];///СПИСОК ОГРАНИЧЕНИЙ ДЛЯ ТЕМПЕРАТУРЫ
var thermocouple_restr_lst = new Map();     // ОГРАНИЧЕНИЯ ТЕРМОПАР
var thermoresistor_restr_lst = new Map();   // ОГРАНИЧЕНИЯ ТЕРМОРЕЗИСТОРОВ
var material_restr_lst = new Map();   // ОГРАНИЧЕНИЯ МАТЕРИАЛОВ (для температуры)
var cabel_restr_lst = new Map();   // ОГРАНИЧЕНИЯ КАБЕЛЯ (для температуры)
var ctr_min_length = 20; // Минимальная длина L для CTR;
var ctr_max_length = 10000; // Максимальная длина L для CTR;
var ctr_min_outlength = 0; // Минимальный вынос S для CTR;
var ctr_max_outlength = 500; // Максимальный вынос S для CTR;
var ctr_rec_outlength = 0; // Рекомендуемая мин длина S для CTR





async function fetchRestrictions() { /// ПОЛУЧЕНИЕ СПИСКА ОГРАНИЧЕНИЙ option_names (ЭЛЕКТРИКА)
    const data = await Promise.all(option_names.map(async url => {
        const resp = await fetch("/json/"+ url +".json", {cache: "no-store"});
        return resp.json();
    }));
    return data;
}

async function fetchConnectRestrictions() { /// ПОЛУЧЕНИЕ СПИСКА ОГРАНИЧЕНИЙ ДЛЯ connection_types
    const data = await Promise.all(search_names.map(async url => {
        const resp = await fetch("/json/"+ url +".json", {cache: "no-store"});
        return resp.json();
    }));
    return data;
}

async function fetchSensorRestrictions() { /// ПОЛУЧЕНИЕ СПИСКА ОГРАНИЧЕНИЙ ДЛЯ сенсоров CTR
    const data = await Promise.all(sensor_names.map(async url => {
        const resp = await fetch("/json/"+ url +".json", {cache: "no-store"});
        return resp.json();
    }));
    return data;
}

fetchSensorRestrictions().then((data) => { //СОБИРАЕМ ОГРАНИЧЕНИЯ температуры ПО СЕНСОРАМ CTR и МАТЕРИАЛАМ
    for (let el in sensor_names){
        let arr = new Map();
        data[el].forEach(obj => {
            let dat = new Map(Object.entries(obj));
            arr.set(obj["name"], dat);
        });;
        window[sensor_names[el] + "_restr_lst"] = arr;
        // console.log(sensor_names[el] + "_restr_lst", window[sensor_names[el] + "_restr_lst"]);
    }
}).catch(error => {console.log(error);
})

fetchConnectRestrictions().then((data) => { //СОБИРАЕМ ОГРАНИЧЕНИЯ ПО ПРИСОЕДИЕНИЯМ
    for (let el in search_names){
        let arr = new Map();
        data[el].forEach(obj => {
            let dat = new Map(Object.entries(obj));
            arr.set(obj["name"], dat);
        });;
        window[search_names[el] + "_restr_lst"] = arr;
        // console.log(search_names[el] + "_restr_lst", window[search_names[el] + "_restr_lst"]);
    }
}).catch(error => {console.log(error);
})

fetchRestrictions().then((data) => {///СОЗДАЕМ МАССИВ ОГРАНИЧЕНИЙ (ЭЛЕКТРИКА)
    let restr_conf_list = new Map([]);
    let restr_option_list = new Map([]);
    for (el in data){
        for (let value of Object.values(data[el])){
            let my_lst = new Map([]);
            for (let opt in option_names){
                if (option_names[opt]!=option_names[el]){
                    if (value.hasOwnProperty(option_names[opt])){               //// УЗНАЁМ ОПРЕДЕЛЕНО ли свойство option option_names[opt] в позиции объекте из массива json
                        my_lst.set(option_names[opt], value[option_names[opt]]);
                    }
                }
            }
            restr_option_list.set(value["name"], my_lst);
        }
       restr_conf_list.set(option_names[el], restr_option_list);
    }
    restr_conf_lst = restr_conf_list;
    console.log("Массив ограничений: ", restr_conf_lst);
}).catch(error => {console.log(error);
})

$(function(){        ///////////////ИЗМЕНЯЕМЫЕ ПАНЕЛИ
    $(".panel-left").resizable({
        handleSelector: ".splitter",
        handles: "e",
        resizeHeight: false
    })
})

$(function(){         /////////// ИЗМЕНЯЕМАЯ ДЛИНА ПОЛЯ ВВОДА КОДА
    $('#code').autoGrowInput({
        minWidth: 200,
        maxWidth: function(){return $('.code-input-container').width()-8; },
        comfortZone: 5
    })
    $(window).resize(function(){
        $('#code').trigger('autogrow');
    })
})

$(function(){  /////  РАСКРЫТЬ-СКРЫТЬ СПИСОК ПРИ ЩЕЛЧКЕ НА ЗАГОЛОВОК
    var toDisplay = 0;
    $(".option-to-select").click(function(){
        $("div[id^='err_']").each(function(){  ////ПРЯЧЕМ ВСЕ ERR_CANCEL ЧЕКБОКСЫ
            if (($(this).find("input[name=err_cancel]:checked").length==0) || ($(this).closest("div.active-option-to-select-list").css("display")!="block")){
                $(this).prop("style", "display:none");
            }
        })
        var $this = $(this);
        $this
        .next("div.option-to-select-list")
        .slideToggle("slow")
        .siblings("div.option-to-select-list:visible")
        .slideUp("slow");
        $this.toggleClass("active");
        $this.siblings(".option-to-select").removeClass("active");
    })
    .eq(toDisplay).addClass("active")
    .next().show();
})

function addDescription() {  // СОЗДАЕМ ТАБЛИЦУ С ОПИСАНИЕМ КОДА
    try{
        document.querySelector("table").remove();
    }catch (err){console.log(err);}
    let code = $("#code").val().replace(/ /g, '');  /// С УДАЛЕНИЕМ ПРОБЕЛОВ
    document.getElementById("code").value = code;
    try{
        code = code.split("/").filter(Boolean);
    }catch (err){console.log(err);}
    for (let i=0; i<code.length; i++){

        if (typeof code[i+1]!='undefined'){
            if ((code[i].slice(-5)=="CG1.1" && code[i+1].slice(0,1)=="2") || (code[i].slice(-1)=="1" && (code[i+1].slice(0,4)=="2NPT" || code[i+1].slice(0,4)=="4NPT")) || (code[i].slice(-2)=="G1" && (code[i+1].slice(0,1)=="4" || code[i+1].slice(0,1)=="8")) || (code[i].slice(-2)=="G1" && code[i+1].slice(0,1)=="2") || (code[i].slice(-2)=="G3" && code[i+1].slice(0,1)=="4") || (code[i]=="C7" && code[i+1]=="16") || (code[i].slice(-3)=="кгс" && code[i+1]=="см2") || ((code[i]=="LI-24G" || code[i]=="AT"|| code[i].startsWith("GI-22")) && code[i+1]=="Ex")){
                code.splice(i, 2, code[i] + "/" + code[i+1]);
            }
        }
    }
    if (!code[0].startsWith("CT")){
        for (let i=0; i<code.length; i++){
            if (code[i].toLowerCase().startsWith("s-") || (code[i].startsWith("(+)") && code[i]!="P") || (code[i].startsWith("(-)") && code[i]!="P")){
                let temp = code[i].split("-");
                code[i]= temp[0];
                let x=i+1;
                for (let j=1; j<temp.length; j++){
                    code.splice(x, 0, temp[j]);
                    x+=1;
                }
                if (typeof code[i+1]!='undefined' && code[i]=="(" && code[i+1].startsWith(")")){
                    code.splice(i, 2, "(-)", code[i+1].slice(1,));
                }
                if (code[i]=="(+)S" || code[i]=="(+)P" || code[i]=="(+)1/4NPT(F)" || code[i]=="(+)M12x1"){
                    code.splice(i, 1, "(+)", code[i].slice(3,));
                }
            }
        }
    }
    // console.log(code);

    let full_description = new Map([]);

    for (el of window["device_restr_lst"].values()){
        if (el.get("name")==code[0] || el.get("code_name")==code[0]){
            full_description.set(code[0], el.get("description"));
            break;
        }
    }
    for (let i=1; i<code.length; i++){// ЗДЕСЬ ПОИСК ОПИСАНИЯ И ДОБАВЛЕНИЕ В MAP name + description
        let condition1 = (code[i].includes("...") && (code[i].endsWith("Па") || code[i].endsWith("кПа") || code[i].endsWith("бар") || code[i].endsWith("МПа") || code[i].endsWith("мH2O") || code[i].endsWith("ммH2O") || code[i].endsWith("кгс/см2") || code[i].endsWith("psi")  || code[i].endsWith("ABS")));
        let condition2 = (i>0 && code[i-1].includes("...") && (code[i-1].endsWith("Па") || code[i-1].endsWith("кПа") || code[i-1].endsWith("бар") || code[i-1].endsWith("МПа") || code[i-1].endsWith("мH2O") || code[i-1].endsWith("ммH2O") || code[i-1].endsWith("кгс/см2") || code[i-1].endsWith("psi")  || code[i-1].endsWith("ABS")));
        let condition3 = (i<code.length-1 && code[i+1].includes("...") && (code[i+1].endsWith("Па") || code[i+1].endsWith("кПа") || code[i+1].endsWith("бар") || code[i+1].endsWith("МПа") || code[i+1].endsWith("мH2O") || code[i+1].endsWith("ммH2O") || code[i+1].endsWith("кгс/см2") || code[i+1].endsWith("psi")  || code[i+1].endsWith("ABS")));
        var plus_minus = "";

        if (condition1 && !condition2 && !condition3){
            if (code[i].split("...")[1].match(/[a-zA-Zа-яА-я]+/g)[0].endsWith("ABS")){
                full_description.set(code[i], "Диапазон измерения абсолютного давления."); // от " + code[i].split("...")[0] + " до " + code[i].split("...")[1].match(/\d+(\,\d+)?/g)[0] + " " + code[i].split("...")[1].match(/[a-zA-Zа-яА-я]+/g)[0].slice(0,-3) + "
            }else{
                let units = code[i].split("...")[1].match(/[a-zA-Zа-яА-я]+/g)[0]=="мH" ? "мH2O" : code[i].split("...")[1].match(/[a-zA-Zа-яА-я]+/g)[0]=="ммH" ? "ммH2O" : code[i].split("...")[1].match(/[a-zA-Zа-яА-я]+/g)[0]=="ммH" ? "ммH2O" : code[i].split("...")[1].match(/[a-zA-Zа-яА-я]+/g)[0];
                full_description.set(code[i], "Диапазон измерения."); // от " + code[i].split("...")[0] + " до " + code[i].split("...")[1].match(/\d+(\,\d+)?/g)[0] + " " + units + "
            }
        }

        if (condition1 && condition3){
            if (code[i].split("...")[1].match(/[a-zA-Zа-яА-я]+/g)[0].endsWith("ABS")){
                full_description.set(code[i], "Основной диапазон измерения абсолютного давления."); // от " + code[i].split("...")[0] + " до " + code[i].split("...")[1].match(/\d+(\,\d+)?/g)[0] + " " + code[i].split("...")[1].match(/[a-zA-Zа-яА-я]+/g)[0].slice(0,-3) + "
                full_description.set(code[i+1], "Установленный диапазон измерения абсолютного давления."); // от " + code[i+1].split("...")[0] + " до " + code[i+1].split("...")[1].match(/\d+(\,\d+)?/g)[0] + " " + code[i+1].split("...")[1].match(/[a-zA-Zа-яА-я]+/g)[0].slice(0,-3) + "
            }else{
                // let units_0 = code[i].split("...")[1].match(/[a-zA-Zа-яА-я]+/g)[0]=="мH" ? "мH2O" : code[i].split("...")[1].match(/[a-zA-Zа-яА-я]+/g)[0]=="ммH" ? "ммH2O" :  code[i].split("...")[1].match(/[a-zA-Zа-яА-я]+/g)[0];
                // let units = code[i+1].split("...")[1].match(/[a-zA-Zа-яА-я]+/g)[0]=="мH" ? "мH2O" : code[i+1].split("...")[1].match(/[a-zA-Zа-яА-я]+/g)[0]=="ммH" ? "ммH2O" :  code[i+1].split("...")[1].match(/[a-zA-Zа-яА-я]+/g)[0];
                full_description.set(code[i], "Основной диапазон измерения."); //  от " + code[i].split("...")[0] + " до " + code[i].split("...")[1].match(/\d+(\,\d+)?/g)[0] + " " + units_0 + "
                full_description.set(code[i+1], "Установленный диапазон измерения."); // от " + code[i+1].split("...")[0] + " до " + code[i+1].split("...")[1].match(/\d+(\,\d+)?/g)[0] + " " + units + "
            }
        }

        if (code[0].startsWith("CT")){
            let ctr_unit = (typeof code[i].split("=")[1]=="undefined" || code[i].split("=")[1].match(/[a-zA-Zа-яА-я]+/g)==null) ? "." : " " + code[i].split("=")[1].match(/[a-zA-Zа-яА-я]+/g)[0];
            if (code[i].includes("...") && code[i].endsWith("C")){
                full_description.set(code[i], "Диапазон измерения температуры от " + code[i].split("...")[0] + " до " + code[i].split("...")[1].match(/\d+(\,\d+)?/g)[0] + "°C.");
            }
            if (code[i]=="23мА" || code[i]=="21,5мА" || code[i]=="3,8мА" || code[i]=="3,75мА"){
                full_description.set(code[i], "Сигнал обрыва цепи сенсора " + code[i] + ".");
            }
            if (code[i]=="-"){
                full_description.set(code[i], "Без специального исполнения.");
            }
            if (code[i].startsWith("d=")){
                full_description.set(code[i], "Диаметр защитного корпуса " + code[i].split("=")[1].match(/\d+(\,\d+)?/g)[0] + ctr_unit + ".");
            }
            if (code[i].startsWith("dvk=")){
                full_description.set(code[i], "Диаметр термометрической (измерительной) вставки " + code[i].split("=")[1].match(/\d+(\,\d+)?/g)[0] + ctr_unit + "."); //<br><span style='color: red'>Монтаж ТОЛЬКО в защитную гильзу!</span>
            }
            if (code[i].startsWith("L=")){
                full_description.set(code[i], "Длина защитного корпуса " + code[i].split("=")[1].match(/\d+(\,\d+)?/g)[0] + ctr_unit + ".");
            }
            if (code[i].startsWith("Lvk=")){
                full_description.set(code[i], "Длина термометрической (измерительной) вставки " + code[i].split("=")[1].match(/\d+(\,\d+)?/g)[0] + ctr_unit + ".<br><span style='color: red'>Монтаж ТОЛЬКО в защитную гильзу!</span>");
            }
            if (code[i].startsWith("S=")){
                full_description.set(code[i], "Длина наружной (выносной) части " + code[i].split("=")[1].match(/\d+(\,\d+)?/g)[0] + ctr_unit + ".");
            }
        }

        if (code[i].slice(0,2) == "K="){
            full_description.set(code[i], "Длина капилляра разделителя " + code[i].match(/\d+(\,\d+)?/g) + " м.");
        }

        if (code[i].slice(0,2) == "T="){
            full_description.set(code[i], "Длина цилиндрической части разделителя " + code[i].match(/\d+(\,\d+)?/g) + " мм.");
        }

        if ((code[i].toLowerCase()=="s" && !code[0].startsWith("CT")) || (typeof code[i-1]!='undefined' && (code[i-1]=="(-)") && (code[i]=="P" || code[i]=="1/4NPT(F)" || code[i]=="M12x1"))  || (typeof code[i-1]!='undefined' && (code[i-1]=="(+)") && (code[i]=="P" || code[i]=="1/4NPT(F)" || code[i]=="M12x1"))){             //КОНСТРУКТОР ОПИСАНИЯ РАЗДЕЛИТЕЛЯ
            let add_descr = "<br>В сборе с разделителем.";
            if (code[i-1]=="(+)"){
                plus_minus = "(+)";
                add_descr = "<br>Со стороны высокого давления.";
            }
            if (code[i-1]=="(-)"){
                plus_minus = "(-)";
                add_descr = "<br>Со стороны низкого давления.";
            }
            let temp_code_i1 = typeof (code[i+1])!='undefined' ? code[i+1] : "";
            let add_letter = "";
            if (temp_code_i1.endsWith("K")){
                add_descr += "<br>Соединение разделителя через капилляр.";
                temp_code_i1 = temp_code_i1.slice(0,-1);
                add_letter = "K";
            }
            if (temp_code_i1.endsWith("R") && temp_code_i1.length>1){
                add_descr += "<br>С радиатором для сред измерения до 200°С.";
                temp_code_i1 = temp_code_i1.slice(0,-1);
                add_letter = "R";
            }
            if (temp_code_i1.endsWith("R2") && temp_code_i1.length>2){
                add_descr += "<br>С радиатором для сред измерения до 250°С.";
                temp_code_i1 = temp_code_i1.slice(0,-2);
                add_letter = "R2";
            }
            if (temp_code_i1.endsWith("R3") && temp_code_i1.length>2){
                add_descr += "<br>С радиатором для сред измерения до 310°С.";
                temp_code_i1 = temp_code_i1.slice(0,-2);
                add_letter = "R3";
            }

            let temp_code_v1 = code[i]+ "-" + temp_code_i1 + "-" + code[i+2] + "-" + code[i+3];
            let temp_code_v2 = code[i]+ "-" + temp_code_i1 + "-" + code[i+2];
            let temp_code_v3 = code[i]+ "-" + temp_code_i1;
            let temp_codes =[temp_code_v1, temp_code_v2, temp_code_v3];
            // console.log(code[i-1]);
            // console.log(code[i]);
            if  ((code[i-1]=="(+)" && code[i]=="P") || (code[i-1]=="(-)" && code[i]=="P")){
                // temp_codes=["P"];
                for (el of window["thread_restr_lst"].values()){
                    if (el.get("code_name")==code[i]){
                        let temp_desc = el.get("description") + add_descr;
                        full_description.set(plus_minus + code[i], temp_desc);
                        // console.log("228 СРАБОТАЛО: "+ plus_minus + code[i], " Описание для full_description: " + temp_desc);
                        break;
                    }
                }
            }
            if ((code[i-1]=="(+)" && code[i]=="1/4NPT(F)") || (code[i-1]=="(-)" && code[i]=="1/4NPT(F)")){
                // temp_codes=["1/4NPT(F)"];
                for (el of window["thread_restr_lst"].values()){
                    if (el.get("code_name")==code[i]){
                        let temp_desc = el.get("description") + add_descr;
                        full_description.set(plus_minus + code[i], temp_desc);
                        // console.log("239 СРАБОТАЛО: "+ plus_minus + code[i], " Описание для full_description: " + temp_desc);
                        break;
                    }
                }
            }
            if ((code[i-1]=="(+)" && code[i]=="M12x1") || (code[i-1]=="(-)" && code[i]=="M12x1")){
                // temp_codes=["M12x1"];
                for (el of window["thread_restr_lst"].values()){
                    if (el.get("code_name")==code[i]){
                        let temp_desc = el.get("description") + add_descr;
                        full_description.set(plus_minus + code[i], temp_desc);
                        // console.log("239 СРАБОТАЛО: "+ plus_minus + code[i], " Описание для full_description: " + temp_desc);
                        break;
                    }
                }
            }
            // console.log(temp_codes);
            let repeat_cycle = true;
            let num_cut = 4;
            for (els of temp_codes){
                if (els.endsWith("-")){els=els.slice(0,-1)};
                // console.log(els);
                for (item of search_names){
                    for (el of window[item + "_restr_lst"].values()){
                        if (repeat_cycle === true && el.get("code_name") === els){
                            code.splice(i, num_cut, els);
                            let temp_desc = el.get("description") + add_descr;
                            let arr = code[i].split("-");
                            if (typeof arr[1]!='undefined'){
                                arr[1] = arr[1] + add_letter;
                            }
                            code[i] = arr.join("-");
                            full_description.set(plus_minus + code[i], temp_desc);
                            // console.log("СРАБОТАЛО: "+ plus_minus + code[i], " Описание для full_description: " + temp_desc, " Разделитель: " + els);
                            repeat_cycle = false;
                            break;
                        }
                    }
                }
                num_cut-=1;
            }
            code[i]=plus_minus + code[i];
            // console.log(code[i]);
            // console.log(code);
        }

        if(!code[0].startsWith("CT")){
            for (item of search_names){
                for (el of window[item + "_restr_lst"].values()){
                    if (el.get("name")==code[i] || el.get("code_name")==code[i]){
                        if (code[i].includes("PC-28") && !(code[i]=="PC-28.Modbus" || code[i]=="PC-28.Smart") && !(code.includes("0...10В") || code.includes("0,4...2В") || code.includes("0...2В"))){
                            full_description.set(code[i], el.get("description") + "<br>Выходной сигнал 4...20мА.");
                            break;
                        }
                        if (code[i].includes("PR-28") && !(code[i]=="PR-28.Modbus" || code[i]=="PR-28.Smart") && !(code.includes("0...10В") || code.includes("0,4...2В") || code.includes("0...2В"))){
                            full_description.set(code[i], el.get("description") + "<br>Выходной сигнал 4...20мА.");
                            break;
                        }
                        full_description.set(code[i], el.get("description"));
                    }
                }
            }
        }
        if(code[0].startsWith("CT")){
            let t_code = (code[i].startsWith("2x")) ? code[i].slice(2,) : code[i];
            let ad_descr = (code[i].startsWith("2x")) ? "<br>Количество сенсоров: 2шт." : "";
            for (item of ["device", "approval", "output", "material", "special", "ctr-electrical", "thread", "flange", "hygienic", "cabel", "thermoresistor", "thermocouple"]){
                let prev_descr = item=="material" ? "Материал измерительной части:<br>" : "";
                for (el of window[item + "_restr_lst"].values()){
                    if (el.get("name")==t_code || el.get("code_name")==t_code){
                        full_description.set(code[i], prev_descr + el.get("description") + ad_descr);
                        break;
                    }
                }
            }

            if (i-1>=2 && (code[i]=="A" || code[i]=="B" || code[i]=="C") && (['Pt100', 'Pt1000', '100П', '1000П', '100М', '50М'].includes(code[i-1]) || code[i-1].startsWith("2x"))){
                full_description.set(code[i], "Класс точности сенсора \"" + code[i] + "\".");
            }
            if (i-1>=2 && (code[i]=="2" || code[i]=="3" || code[i]=="4") && ['A', 'B', 'C'].includes(code[i-1])){
                full_description.set(code[i], "Схема соединения сенсора " + code[i] + "-х проводная.");
            }
            if (i-1>=1 && (code[i]=="1" || code[i]=="2" || code[i]=="3") && (['K', 'L', 'J', 'R', 'S', 'B'].includes(code[i-1]) && !code[i-2].startsWith("2x") && !['Pt100', 'Pt1000', '100П', '1000П', '100М', '50М'].includes(code[i-2]) || code[i-1].startsWith("2x"))){
                full_description.set(code[i], "Класс точности сенсора \"" + code[i] + "\".");
            }
            if (code[i]=="I"){
                full_description.set(code[i], "Без монтажного присоединения.");
            }
            if (code[i].startsWith("FH(") || code[i].startsWith("MH(") || code[i].startsWith("MP(") || code[i].startsWith("FP(")){
                const fit_nut = new Map([
                    ["FH", "неподвижная гайка"],
                    ["MH", "неподвижный штуцер"],
                    ["MP", "подвижный штуцер"],
                    ["FP", "подвижная гайка"]
                ]);
                full_description.set(code[i], "Монтажное присоединение: " + fit_nut.get(code[i].slice(0,2)) + " с резьбой " + code[i].slice(3,-1));
            }
            if (code[i].startsWith("DN")){
                full_description.set(code[i], "Монтажное присоединение: фланцевое.<br>Номинальный диаметр: DN" + code[i].match(/\d+(\,\d+)?/g)[0] + "<br>Номинальное давление: PN" + code[i].match(/\d+(\,\d+)?/g)[1] + "<br>Тип уплотнительной поверхности: " + code[i].match(/[a-zA-Zа-яА-я]+/g)[2] + ".");
            }
            if (code[i].startsWith("DIN")){
                full_description.set(code[i], "Монтажное присоединение: гигеническое по DIN 11851.<br>Номинальный диаметр: DN" + code[i].match(/\d+(\,\d+)?/g)[0] + ".");
            }
            if (code[i].startsWith("Tri-")){
                full_description.set(code[i], "Монтажное присоединение: гигеническое по DIN 32676.<br>Номинальный размер: Clamp" + code[i].match(/\d+(\,\d+)?/g)[0] + ".");
            }
            if (code[i].startsWith("K") && code[i].includes("-") && code[i].includes("=")){
                let temp_desc0 = "";
                for (el of window["cabel_restr_lst"].values()){
                    if (el.get("name")==(code[i].split("=")[0].split("-")[1]).toLowerCase() || el.get("code_name")==(code[i].split("=")[0].split("-")[1]).toLowerCase()){
                        temp_desc0 = el.get("description");
                    }
                }
                full_description.set(code[i], "Кабельное исполнение типа " + code[i].split("-")[0] + "<br>" + temp_desc0 + "<br>Длина кабеля " + code[i].split("=")[1].match(/\d+(\,\d+)?/g) + " " + code[i].split("=")[1].match(/[a-zA-Zа-яА-я]+/g)[0] + ".");
            }
            if (code[i].startsWith("C") && code[i].includes("(K") && code[i].includes(")=")){
                let temp_desc0 = "";
                for (el of window["cabel_restr_lst"].values()){
                    if (el.get("name")==(code[i].split("(")[0]).slice(1,).toLowerCase() || el.get("code_name")==(code[i].split("(")[0]).slice(1,).toLowerCase()){
                        temp_desc0 = el.get("description");
                    }
                }
                full_description.set(code[i], "Кабельное исполнение типа " + code[i].split("(")[1].split(")")[0] + "<br>" + temp_desc0 + "<br>Длина кабеля " + code[i].split("=")[1].match(/\d+(\,\d+)?/g) + " " + code[i].split("=")[1].match(/[a-zA-Zа-яА-я]+/g)[0] + ".");
            }
            /////////////////ПРОДОЛЖИТЬ//////////////////////
        }
    }

    //console.log(window["thermoresistor_restr_lst"].values().toArray().map((val)=>val.get("code_name"))); /// получение массива термосопротивлений по code_name
    //console.log(window["thermocouple_restr_lst"].values().toArray().map((val)=>val.get("code_name"))); /// получение массива термопар по code_name
    if (full_description.has("(+)")){full_description.delete("(+)")}
    if (full_description.has("(-)")){full_description.delete("(-)")}
    if (full_description.has("Ex")){
        console.log("Замена описания на EX");
        if (!full_description.has("ALW") && typeof device_restr_lst.get([...full_description][0][0])!="undefined" && typeof device_restr_lst.get([...full_description][0][0]).get("ex_description")!="undefined"){
            full_description.set([...full_description][0][0], device_restr_lst.get([...full_description][0][0]).get("ex_description"));
        }
        if (full_description.has("ALW") && typeof device_restr_lst.get([...full_description][0][0])!="undefined" && typeof device_restr_lst.get([...full_description][0][0]).get("exalw_description")!="undefined"){
            full_description.set([...full_description][0][0], device_restr_lst.get([...full_description][0][0]).get("exalw_description"));
        }
    }

    for (let i=0; i<=code.length; i++){
        if (code[i]=="(+)" || code[i]=="(-)"){
            code.splice(i,1);
        }
    }

    for (let i=0; i<=code.length; i++) {
        if (typeof code[i]!="undefined" && code[i].startsWith("(+)") && typeof code[i+1]!="undefined" && !code[i+1].startsWith("(-)") && !(code[i+1]=="P" || code[i+1]=="1/4NPT(F)")){
            let temp_code = code[i] + "-" + code[i+1];
            let temp_descr = full_description.get(code[i])+ "<br>" + full_description.get(code[i+1]);
            full_description.delete(code[i]);
            full_description.set(temp_code, temp_descr);
            if (code.filter(x => x === code[i+1]).length>1){
                // console.log("Пропустить удаление ", code[i+1]);
            }else{
                // console.log("УДАЛЯЕМ ", code[i+1]);
                full_description.delete(code[i+1]);
            }
            code.splice(i, 2, temp_code);
            i-=1;
        }
        if (typeof code[i]!="undefined" && code[i].startsWith("(-)") && typeof code[i+1]!="undefined"){
            let temp_code = code[i] + "-" + code[i+1];
            let temp_descr = full_description.get(code[i])+ "<br>" + full_description.get(code[i+1]);
            full_description.delete(code[i]);
            full_description.delete(code[i+1]);
            full_description.set(temp_code, temp_descr);
            code.splice(i, 2, temp_code);
            i-=1;
        }
    }

    let success_descr = true;
    let code_descr = [];
    for (let i=0; i<code.length; i++){
        code_descr[i] = [code[i], full_description.get(code[i])];
        if (typeof full_description.get(code[i])=="undefined"){
            success_descr = false;
            break;
        }
    }
    // console.log(full_description);
    console.log(code_descr);
    console.log(code);

    if (code.length>2 && success_descr==true){//  && full_description.size == code.length
        document.getElementById("codeError").innerHTML = "";
        var myTableDiv = document.getElementById("codeDescription");
        let table = document.createElement('table');
        let thead = document.createElement('thead');
        let tbody = document.createElement('tbody');
        table.id = "mytable";
        table.appendChild(thead);
        table.appendChild(tbody);
        var tr = document.createElement('tr');
        thead.appendChild(tr);
        var th1 = document.createElement('th');
        var th2 = document.createElement('th');
        tr.appendChild(th1);
        th1.appendChild(document.createTextNode("Обозначение"));
        tr.appendChild(th2);
        th2.appendChild(document.createTextNode("Расшифровка"));

        for (let i=0; i<code.length; i++) {
            tr = document.createElement('TR');
            tbody.appendChild(tr);
            for (var j = 0; j < 2; j++) {
                var td = document.createElement('TD');
                if (j==0){
                    td.appendChild(document.createTextNode(code[i]));
                    tr.appendChild(td);
                }else{
                    td.width = '600';
                    td.innerHTML = (code_descr[i][1]); //full_description.get(code[i])
                    tr.appendChild(td);
                }
            }
        }
        myTableDiv.appendChild(table);                  // ТАБЛИЦА ГОТОВА
        document.getElementById("mytable").border= "1";
        $("#code-entered-button-ok").prop("style", "display:none");
        $("#reset-config").prop("style", "display:inline-block");
    }else{
        document.getElementById("codeError").innerHTML = "Код заказа некорректный или неполный";
    }
}

$(document).ready(function(){
    $("#code").keypress(function(e){
      if(e.keyCode==13){
        addDescription();
      }
    });
});

function get_full_config(){  ///// ПОЛУЧАЕМ МАССИВ ПОЛНОЙ КОНФИГУРАЦИИ
    let capillary_length = parseInt(document.getElementById("cap-or-not-capillary-length").value);
    let capillary_length_plus = parseInt(document.getElementById("cap-plus-capillary-length").value);
    let capillary_length_minus = parseInt(document.getElementById("cap-minus-capillary-length").value);
    let begin_range = parseFloat(document.querySelector("#begin-range").value);
    let end_range = parseFloat(document.querySelector("#end-range").value);
    let units = document.querySelector("#pressure-unit-select").value;
    let press_type = document.querySelector("#pressure-type").value;
    let max_temp = parseInt(document.querySelector("#cap-or-not-mes-env-temp").value);
    let max_temp_plus = parseInt(document.querySelector("#cap-plus-mes-env-temp").value);
    let max_temp_minus = parseInt(document.querySelector("#cap-minus-mes-env-temp").value);
    let max_static = !Number.isNaN(parseInt($("input[name=max-static]:checked").val())) ? parseInt($("input[name=max-static]:checked").val()) : undefined;
    let sensor_quantity = $("select[name=sensor-quantity]").val()!="not_selected" ? $("select[name=sensor-quantity]").val() : undefined;
    let sensor_accuracy_tr = $("select[name=sensor-accuracy-tr]").val()!="not_selected" ? $("select[name=sensor-accuracy-tr]").val() : undefined;
    let sensor_accuracy_tc = $("select[name=sensor-accuracy-tc]").val()!="not_selected" ? $("select[name=sensor-accuracy-tc]").val() : undefined;
    let sensor_wiring_tr = $("select[name=sensor-wiring-tr]").val()!="not_selected" ? $("select[name=sensor-wiring-tr]").val() : undefined;
    let ctr_begin_range = !Number.isNaN(parseInt(document.querySelector("#ctr-begin-range").value)) ? parseInt(document.querySelector("#ctr-begin-range").value) : undefined;
    let ctr_end_range = !Number.isNaN(parseInt(document.querySelector("#ctr-end-range").value)) ? parseInt(document.querySelector("#ctr-end-range").value) : undefined;
    let ctr_pressure = !Number.isNaN(parseInt(document.querySelector("#ctr-pressure").value)) ? parseInt(document.querySelector("#ctr-pressure").value) : undefined;
    let ctr_diameter = $("select[name=ctr-diameter]").val()!="not_selected" ? $("select[name=ctr-diameter]").val() : undefined;
    let ctr_length = !Number.isNaN(parseInt(document.querySelector("#ctr-length").value)) ? parseInt(document.querySelector("#ctr-length").value) : undefined;
    let ctr_outlength = !Number.isNaN(parseInt(document.querySelector("#ctr-outlength").value)) ? parseInt(document.querySelector("#ctr-outlength").value) : undefined;
    let ctr_cabel_length = !Number.isNaN(parseInt(document.querySelector("#ctr-cabel-length").value)) ? parseInt(document.querySelector("#ctr-cabel-length").value) : undefined;
    let ctr_cabel_type = $("input[name=ctr-cabel-type]:checked").length>0 ? $("input[name=ctr-cabel-type]:checked").val() : undefined;
    let ctr_thread_type = $("select[name=ctr-thread-type]").val()!="not_selected" ? $("select[name=ctr-fm-type]").val() + $("select[name=ctr-ph-type]").val() + "(" + $("select[name=ctr-thread-type]").val() + ")" : undefined;
    let ctr_hygienic_type = $("select[name=ctr-hygienic-type]").val()!="not_selected" ? $("select[name=ctr-hygienic-type]").val() : undefined;
    let ctr_flange_type = ($("select[name=ctr-flange-type]").val()!="not_selected" && $("select[name=ctr-flange-type-pn]").val()!="not_selected" && $("select[name=ctr-flange-type-typ]").val()!="not_selected") ? $("select[name=ctr-flange-type]").val() + $("select[name=ctr-flange-type-pn]").val() + $("select[name=ctr-flange-type-typ]").val() : undefined;


    const koef = new Map([
        ["Па", 0.001],
        ["кПа", 1],
        ["бар", 100],
        ["МПа", 1000],
        ["мH2O", 9.807],
        ["ммH2O", 0.009807],
        ["кгс/см2", 98.7],
        ["psi", 6.895]
    ]);
    let range = Math.abs((end_range-begin_range))*koef.get(units); //ДИАПАЗОН В кПа (НУЖЕН ДЛЯ ПОДБОРА ШТУЦЕРОВ И РАЗДЕЛИТЕЛЕЙ)
    let begin_range_kpa = begin_range*koef.get(units);
    let end_range_kpa = end_range*koef.get(units);
    let full_conf = new Map([]);
    main_dev = $(".main-dev-selected").prop("id").slice(9,);
    full_conf.set("main_dev", main_dev);

    if (main_dev=="pr-28" || main_dev=="apr-2000" || main_dev=="pc-28" || main_dev=="apc-2000"){

        let options = ["approval", "output", "electrical", "cap-or-not", "material", "connection-type"]; //, "display"
        if (main_dev=="pr-28" || main_dev=="apr-2000"){
            full_conf.set("max-static", max_static);
            if (!(max_static==32 || max_static==41 || max_static==70)){
                full_conf.set("cap-plus", $("input[name=cap-plus]:checked").val());
                full_conf.set("cap-minus", $("input[name=cap-minus]:checked").val());
                full_conf.set("capillary_length_plus");
                full_conf.set("capillary_length_minus");
            }
            options.push("minus-connection-type");
            for (let i = options.length - 1; i >= 0; i--) {
                if (options[i] == "cap-or-not") {
                    options.splice(i, 1);
                }
            }
        }else{
            full_conf.delete("max-static");
            full_conf.delete("cap-plus");
            full_conf.delete("cap-minus");
            full_conf.delete("capillary_length_plus");
            full_conf.delete("capillary_length_minus");
            full_conf.delete("minus-connection-type");
            for (let i = options.length - 1; i >= 0; i--) {
                if (options[i] == "minus-connection-type") {
                    options.splice(i, 1);
                    console.log(options[i]);
                }
            }
            options.push("cap-or-not");
        }
        for (let el of options){
            full_conf.set(el, $("input[name="+ el +"]:checked").prop("id"));
        }
        for (itms of ["capillary_length", "capillary_length_plus", "capillary_length_minus"])
        if (!Number.isNaN(eval(itms))){
            full_conf.set(itms, eval(itms));
        }
        if ($("input[name=cap-or-not]:checked").prop("id")=="direct"){
            full_conf.delete("capillary_length");
            if (!Number.isNaN(max_temp)){
                full_conf.set("max_temp", max_temp);
            }else{
                full_conf.set("max_temp");
            }
        }
        for (let plmin of ["plus", "minus"]){
            if (typeof $("input[name=cap-"+plmin+"]:checked").prop("id")!="undefined" && $("input[name=cap-"+plmin+"]:checked").prop("id").startsWith("direct")){
                full_conf.delete("capillary_length_" + plmin);
                if (!Number.isNaN(eval("max_temp_"+ plmin))){
                    full_conf.set("max_temp_" + plmin, eval("max_temp_"+ plmin));
                }else{
                    full_conf.set("max_temp_" + plmin);
                }
            }
        }
        if ($("input[name=cap-or-not]:checked").prop("id")=="capillary"){
            full_conf.delete("max_temp");
        }
        if ($("input[name=cap-plus]:checked").prop("id")=="capillary"){
            full_conf.delete("max_temp_plus");
        }
        if ($("input[name=cap-minus]:checked").prop("id")=="capillary"){
            full_conf.delete("max_temp_minus");
        }
        if (press_type!='not_selected' && units!='not_selected' && !Number.isNaN(begin_range) && !Number.isNaN(end_range) && end_range!=begin_range){
            full_conf.set("begin_range", begin_range);
            full_conf.set("end_range", end_range);
            full_conf.set("units", units);
            full_conf.set("pressure_type", press_type);
            full_conf.set("range", range);
            full_conf.set("begin_range_kpa", begin_range_kpa);
            full_conf.set("end_range_kpa", end_range_kpa);
        }
        if (press_type=='not_selected' || units=='not_selected' || Number.isNaN(begin_range) || Number.isNaN(end_range) || end_range==begin_range){
            full_conf.set("begin_range");
            full_conf.set("end_range");
            full_conf.set("units");
            full_conf.set("pressure_type");
            full_conf.set("range");
            full_conf.delete("begin_range_kpa");
            full_conf.delete("end_range_kpa");
        }

        if (typeof full_conf.get("connection-type")!=='undefined'){
            full_conf.set(full_conf.get("connection-type").slice(0,-5), $("input[name ="+ full_conf.get("connection-type").slice(0,-5) +"]:checked").prop("id"));
            full_conf.delete("connection-type");
        }
        if (typeof full_conf.get("minus-connection-type")!=='undefined'){
            full_conf.set(full_conf.get("minus-connection-type").slice(0,-5), $("input[name ="+ full_conf.get("minus-connection-type").slice(0,-5) +"]:checked").prop("id"));
            full_conf.delete("minus-connection-type");
        }
        if ($("input[name=cap-or-not]:checked").prop("id")=="capillary" && !full_conf.has("capillary_length")){
            full_conf.set("capillary_length");
        }
        if (typeof full_conf.get("flange")!='undefined' && full_conf.get("flange").slice(0,3)=="s_t"){
            let t_length = parseInt($("#" + full_conf.get("flange") + "-cilinder-length").val());
            if (!Number.isNaN(t_length)){
                full_conf.set("cilinder_length", parseInt($("#" + full_conf.get("flange") + "-cilinder-length").val()));
            }else{
                full_conf.set("cilinder_length");
            }
        }else{
            full_conf.delete("cilinder_length");
        }
        if (typeof full_conf.get("minus-flange")!='undefined' && full_conf.get("minus-flange").slice(0,9)=="minus-s_t"){
            let t_length = parseInt($("#" + full_conf.get("minus-flange") + "-cilinder-length").val());
            if (!Number.isNaN(t_length)){
                full_conf.set("minus_cilinder_length", parseInt($("#" + full_conf.get("minus-flange") + "-cilinder-length").val()));
            }else{
                full_conf.set("minus_cilinder_length");
            }
        }else{
            full_conf.delete("minus-cilinder_length");
        }
        if ((full_conf.has("minus-thread") && full_conf.get("minus-thread")=="minus-P") || (full_conf.has("minus-flange") && full_conf.get("minus-flange")=="minus-c-pr")){
            full_conf.delete("max_temp_plus");
            full_conf.delete("max_temp_minus");
            full_conf.delete("capillary_length_plus");
            full_conf.delete("capillary_length_minus");
        }

        if ($("#fluid-select-div").hasClass("active-option-to-select")){
            if ($("input[name=fluid]").is("checked").length==0){
                full_conf.set("fluid");
            }else{
                full_conf.set("fluid", $("input[name=fluid]:checked").val());
            }
        }else{
            full_conf.delete("fluid");
        }
    }
    if (main_dev=="ctr"){///ПОЛУЧАЕМ CTR FULL_CONF
        console.log("ПОЛУЧАЕМ CTR FULL_CONF");
        let options = ["approval", "sensor-type", "output", "ctr-electrical", "material", "ctr-connection-type"];
        for (let el of options){
            full_conf.set(el, $("input[name="+ el +"]:checked").prop("id"));
        }
        for (let el of ["ctr_begin_range", "ctr_end_range", "ctr_pressure", "ctr_diameter", "ctr_length", "ctr_outlength"]){
            full_conf.set(el, eval(el));
        }
        if (typeof full_conf.get("sensor-type")!='undefined'){
            let el = $("input[name=sensor-type]:checked").prop("id").slice(0,-5);
            full_conf.set(el, $("input[name="+ el +"]:checked").prop("id"));
        }else{
            full_conf.delete("thermoresistor");
            full_conf.delete("thermocouple");
        }
        if (full_conf.has("thermoresistor")){
            for (let el of ["sensor_quantity", "sensor_accuracy_tr", "sensor_wiring_tr"]){
                full_conf.set(el, eval(el));
            }
        }else{
            for (let el of ["sensor_quantity", "sensor_accuracy_tr", "sensor_wiring_tr"]){
                full_conf.delete(el);
            }
        }
        if (full_conf.has("thermocouple")){
                full_conf.set("sensor_accuracy_tc", sensor_accuracy_tc);
        }else{
                full_conf.delete("sensor_accuracy_tc");
        }
        if (full_conf.has("thermocouple") || full_conf.has("thermoresistor")){
                full_conf.set("sensor_quantity", sensor_quantity);
        }else{
            full_conf.delete("sensor_quantity");
        }
        if (typeof full_conf.get("ctr-electrical")!='undefined'){
            let el = full_conf.get(("ctr-electrical")).slice(0,-5);
            full_conf.set(el, $("input[name="+ el +"]:checked").prop("id"));
        }else{
            for (let el of ["head", "nohead", "cabel"]){
                full_conf.delete(el);
            }
        }
        if (full_conf.has("cabel")){
            full_conf.set("ctr_cabel_length", ctr_cabel_length);
            full_conf.set("ctr_cabel_type", ctr_cabel_type);
        }else{
            full_conf.delete("ctr_cabel_length");
            full_conf.delete("ctr_cabel_type");
        }
        if (typeof full_conf.get("ctr-connection-type")!="undefined" && full_conf.get("ctr-connection-type")!="ctr-no-connection"){
            let el = "ctr_" + full_conf.get("ctr-connection-type").slice(4, -5) + "_type";
            full_conf.set(el, eval(el));
        }else{
            full_conf.delete("ctr_thread_type");
            full_conf.delete("ctr_flange_type");
            full_conf.delete("ctr_hygienic_type");
        }
    }

    return full_conf;
}

function CorPSelected(c_or_p, state){ /////////////////////////////////////////////// ОДНОВРЕМЕННЫЙ ВЫБОР тип С  ///////////////////////////////////////////////////////////

    let full_configure = get_full_config();
    let connect_1 = c_or_p.startsWith("minus-") ? c_or_p.slice(6,) : c_or_p;
    if (full_configure.get("main_dev")=="pr-28" || full_configure.get("main_dev")=="apr-2000"){
        if (state==true){
            console.log("c_or_p worked check");
            for (let plmin of ["","minus-"]){////////присоединения плюс и минус полностью отметить ТИП С, отключить другие      ////////////////////////////////
                for (let cons of ["thread", "flange", "hygienic", "connection-type"]){
                    $("input[name=" + plmin + cons + "]").each(function(){
                        $("label[for="+ $(this).prop("id") +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ ВАРИАНТЫ THREAD или FLANGE или HYGIENIC
                        $(this).prop('disabled', true);                                     //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                        $(this).prop('checked', false);
                    })
                    $("#"+ plmin + cons + "-select").prev(".option-to-select").find(".color-mark-field").removeClass("unselected").addClass("selected");
                }
                if (connect_1=="c-pr"){
                    $("#" + plmin + "flange-list").prop('checked', true);
                    $("#" + plmin + "thread-list").prop('checked', false);
                    $("#" + plmin + "c-pr").prop('checked', true);
                    $("#" + plmin + "c-pr").prop('disabled', false);
                    $('.' + plmin + 'thread-flange-hygienic').hide(0);
                    $('#' + plmin + 'flange-select').prop('style', "display=block");
                    $("label[for="+ plmin +"c-pr]").removeClass('disabled');
                    $("label[for="+ plmin +"flange-list]").removeClass('disabled');
                }
                if (connect_1=="P"){
                    $("#" + plmin + "thread-list").prop('checked', true);
                    $("#" + plmin + "flange-list").prop('checked', false);
                    $("#" + plmin + "P").prop('checked', true);
                    $("#" + plmin + "P").prop('disabled', false);
                    $('#' + plmin + 'thread-select').prop('style', "display=block");
                    $("label[for="+ plmin +"P]").removeClass('disabled');
                    $("label[for="+ plmin +"thread-list]").removeClass('disabled');
                }
            }
            $("#cap-plus-select").prev(".option-to-select").find(".color-mark-field").removeClass("unselected").addClass("selected");
            $("#cap-minus-select").prev(".option-to-select").find(".color-mark-field").removeClass("unselected").addClass("selected");
            $("#direct-cap-plus").prop('checked', true); //.prop('disabled', true);
            $("#direct-cap-minus").prop('checked', true); //.prop('disabled', true);
            $("#capillary-cap-plus").prop('checked', false).prop('disabled', true);
            $("#capillary-cap-minus").prop('checked', false).prop('disabled', true);
            $("label[for=capillary-cap-plus]").addClass('disabled');
            $("label[for=capillary-cap-minus]").addClass('disabled');
            $("input[name=material]").each(function(){
                if (connect_1=="c-pr" && (!($(this).prop("id")=="aisi316" || $(this).prop("id")=="hastelloy" || $(this).prop("id")=="tantal"))){///ДЕАКТИВАЦИЯ МАТЕРИАЛОВ ДЛЯ типа С
                    $(this).prop("disabled", true);
                    $("label[for="+ $(this).prop("id") +"]").addClass('disabled');
                }
                if (connect_1=="P" && (!($(this).prop("id")=="aisi316"))){///ДЕАКТИВАЦИЯ МАТЕРИАЛОВ ДЛЯ типа P
                    $(this).prop("disabled", true);
                    $("label[for="+ $(this).prop("id") +"]").addClass('disabled');
                }
            })
            let num = $("body .active-option-to-select").index($(".active")) + 1;
            // let next_expand = $("body .active-option-to-select").eq(num);
            var $this = $(document.getElementById(c_or_p).parentElement.parentElement.parentElement).prev();
            $this.removeClass("active");
            $this.next("div.option-to-select-list").slideUp("slow");
            $this.find(".color-mark-field").removeClass("unselected");
            $this.find(".color-mark-field").addClass("selected");
            // next_expand.addClass("active");
            // next_expand.next().slideToggle("slow");
            disable_invalid_options();
            return;
        }else{
            console.log("c_or_p worked uncheck");
            $("input[name=max-static]:checked").prop("checked", false);
            $("#max-static-select").prev(".option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
            for (let plmin of ["","minus-"]){////////присоединения плюс и минус полностью снять отметки, все активировтаь
                for (let cons of ["thread", "flange", "hygienic", "connection-type"]){
                    $("input[name=" + plmin + cons + "]").each(function(){
                        $("label[for="+ $(this).prop("id") +"]").removeClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ ВАРИАНТЫ THREAD или FLANGE или HYGIENIC
                        $(this).prop('disabled', false);                                    //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                    })
                    $("#"+ plmin + cons + "-select").prev(".option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
                }
                if (connect_1=="c-pr"){
                    // $("#" + plmin + "flange-list").prop('checked', true);
                    $("#" + plmin + "c-pr").prop('checked', false);
                    $("#" + plmin + "c-pr").prop('disabled', false);
                    // $('#' + plmin + 'flange-select').prop('style', "display=block");
                    $("label[for="+ plmin +"c-pr]").removeClass('disabled');
                    $("label[for="+ plmin +"flange-list]").removeClass('disabled');
                }
                if (connect_1=="P"){
                    // $("#" + plmin + "thread-list").prop('checked', true);
                    $("#" + plmin + "P").prop('checked', false);
                    $("#" + plmin + "P").prop('disabled', false);
                    // $('#' + plmin + 'thread-select').prop('style', "display=block");
                    $("label[for="+ plmin +"P]").removeClass('disabled');
                    $("label[for="+ plmin +"thread-list]").removeClass('disabled');
                }
            }
            $("#cap-plus-select").prev(".option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
            $("#cap-minus-select").prev(".option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
            $("#direct-cap-plus").prop('checked', false).prop('disabled', false);
            $("#direct-cap-minus").prop('checked', false).prop('disabled', false);
            $("#capillary-cap-plus").prop('checked', false).prop('disabled', false);
            $("#capillary-cap-minus").prop('checked', false).prop('disabled', false);
            $("label[for=capillary-cap-plus]").removeClass('disabled');
            $("label[for=capillary-cap-minus]").removeClass('disabled');
        }
        document.getElementById("cap-plus-length-span-err").hidden = true;
        document.getElementById("cap-plus-length-span").hidden = true;
        document.getElementById("cap-minus-length-span-err").hidden = true;
        document.getElementById("cap-minus-length-span").hidden = true;

        console.log("c_or_p worked");
        disable_invalid_options();
        return;

    }else{
        let add_n = c_or_p.startsWith("minus") ? "minus-" : "";
        let num = $("body .active-option-to-select").index($(".active")) + 1;
        let next_expand = $("body .active-option-to-select").eq(num);
        $("#" + add_n + "flange-select-field > span").each(function(){
            $(this).prop("style", "display:none");
            $(this).find("select option[value='not_selected']").prop('selected', true);
        })
        var $this = $(document.getElementById(c_or_p).parentElement.parentElement.parentElement).prev();
        $this.removeClass("active");
        $this.next("div.option-to-select-list").slideUp("slow");
        $this.find(".color-mark-field").removeClass("unselected");
        $this.find(".color-mark-field").addClass("selected");
        next_expand.addClass("active");
        next_expand.next().slideToggle("slow");
        disable_invalid_options();
        console.log("CorP ELSE worked");
        return;
    }
}

function get_code_info(data){ // ПОЛУЧЕНИЕ КОДА ЗАКАЗА - принимает full_config
    let code = "";
    let special = "";
    let out = data.get("output");
    let appr = data.get("approval");
    let main_dev = data.get("main_dev").toUpperCase();
    let max_static = data.get("max-static");
    let dev_type;
    if (main_dev=="PC-28"){
        dev_type = out == "4_20" ? "PC-28/" : out == "4_20H" ? "PC-28.Smart/" : out == "modbus" ? "PC-28.Modbus/" : out == "0_10" ? "PC-28/" : "PC-28.B/";
    }
    if (main_dev=="PR-28"){
        dev_type = out == "4_20" ? "PR-28/" : out == "4_20H" ? "PR-28.Smart/" : out == "modbus" ? "PR-28.Modbus/" : out == "0_10" ? "PR-28/" : "PR-28.B/";
    }
    let output = out == "0_2" ? "0...2В/" : out == "04_2" ? "0,4...2В/" : out == "0_10" ? "0...10В/" : $("#hart7").is(':checked') ? "Hart7/" : "";
    let approval = appr =="Ex" ? "Ex/" : appr == "Exd" ? "Exd/" : "";
    let connection = data.has("thread") ? $("input[name=thread]:checked").val() : data.has("flange") ? $("input[name=flange]:checked").val() : data.has("hygienic") ? $("input[name=hygienic]:checked").val() : "";
    let minus_connection = data.has("minus-thread") ? $("input[name=minus-thread]:checked").val() : data.has("minus-flange") ? $("input[name=minus-flange]:checked").val() : data.has("minus-hygienic") ? $("input[name=minus-hygienic]:checked").val() : "";
    let material;
    let s_material;
    let main_range;
    let range;
    const main_ranges = [
        [0, 100000, "0...100МПа"],
        [0, 60000, "0...60МПа"],
        [0, 30000, "0...30МПа"],
        [0, 16000, "0...16МПа"],
        [0, 10000, "0...10МПа"],
        [0, 7000, "0...7МПа"],
        [-100, 7000, "-0,1...7МПа"],
        [0, 2500, "0...2,5МПа"],
        [-100, 2500, "-0,1...2,5МПа"],
        [0, 700, "0...0,7МПа"],
        [-100, 150, "-100...150кПа"],
        [-100, 700, "-100...700кПа"],
        [0, 200, "0...200кПа"],
        [0, 100, "0...100кПа"],
        [-50, 50, "-50...50кПа"],
        [0, 25, "0...25кПа"],
        [-10, 10, "-10...10кПа"],
        [-1.5, 7, "-1,5...7кПа"]
    ];
    const main_ranges_abs = [
        [0, 130, "0...130кПаABS"],
        [0, 700, "0...700кПаABS"],
        [0, 2500, "0...2,5МПаABS"],
        [0, 7000, "0...7МПаABS"],
        [0, 10000, "0...10МПаABS"]
    ];
    const main_ranges_diff = [
        [0, 7000, "0...7МПа"],
        [0, 1600, "0...1,6МПа"],
        [0, 250, "0...250кПа"],
        [0, 100, "0...100кПа"],
        [0, 25, "0...25кПа"],
        [-10, 10, "-10...10кПа"],
        [-0.5, 7.0, "-0,5...7кПа"],
        [-16, 16, "-16...16кПа"],
        [-50, 50, "-50...50кПа"],
        [-160, 200, "-160...200кПа"],
        [-160, 1600, "-160...1600кПа"]
    ];
    main_range = "";
    if (dev_type == "PC-28.Smart/" || dev_type == "PC-28.Modbus/" || main_dev == "APC-2000"){
        if (data.get("pressure_type")==""){
            let min_main_range = [-200000, 200000, ""];
            for (el of main_ranges){
                if (data.get("begin_range_kpa")>=el[0] && data.get("begin_range_kpa")<=el[1] && data.get("end_range_kpa")>=el[0] && data.get("end_range_kpa")<=el[1]){
                    if (Math.abs(el[1]-el[0])< Math.abs(min_main_range[1]-min_main_range[0])){
                        min_main_range = el;
                    }
                }
            }
            main_range = min_main_range[2] + "/";
        }
        if (data.get("pressure_type")=="ABS"){
            let min_main_range = [-200000, 200000, ""];
            for (el of main_ranges_abs){
                if (data.get("begin_range_kpa")>=el[0] && data.get("begin_range_kpa")<=el[1] && data.get("end_range_kpa")>=el[0] && data.get("end_range_kpa")<=el[1]){
                    if (Math.abs(el[1]-el[0])< Math.abs(min_main_range[1]-min_main_range[0])){
                        min_main_range = el;
                    }
                }
            }
            main_range = min_main_range[2] + "/";
        }
    }

    if (dev_type == "PR-28.Smart/" || dev_type == "PR-28.Modbus/" || main_dev == "APR-2000"){
        let min_main_range = [-160, 1600, "-160...1600кПа"];
        let begin = data.get("begin_range_kpa");
        if (data.get("cap-minus")=="capillary"){
            begin = -data.get("end_range_kpa");
        }
        for (let el of main_ranges_diff){
            if (begin>=el[0] && data.get("end_range_kpa")<=el[1]){
                if (Math.abs(el[1]-el[0])< Math.abs(min_main_range[1]-min_main_range[0])){
                    min_main_range = el;
                }
            }
        }
        main_range = min_main_range[2] + "/";
    }

    if ((main_dev == "APC-2000" && (data.get("end_range_kpa")<=2.5 && data.get("begin_range_kpa")>=-2.5) && data.get("range")<=5 && data.get("pressure_type")=="" && typeof data.get("thread")!='undefined' && (data.get("thread")=="P" || data.get("thread")=="GP" || data.get("thread")=="1_2NPT") ) || (main_dev == "APR-2000" && ((data.get("end_range_kpa")<=2.5 && data.get("begin_range_kpa")>=-2.5) && data.get("range")<=5))){
        const main_hs_ranges = [
            [-2.5, 2.5, "-2,5...2,5кПа"],
            [-0.7, 0.7, "-0,7...0,7кПа"]
        ]
        let min_main_range = [-200000, 200000, "-200000...20000кПа"];
        for (el of main_hs_ranges){
            if (data.get("begin_range_kpa")>=el[0] && data.get("begin_range_kpa")<=el[1] && data.get("end_range_kpa")>=el[0] && data.get("end_range_kpa")<=el[1]){
                if (Math.abs(el[1]-el[0])< Math.abs(min_main_range[1]-min_main_range[0])){
                    min_main_range = el;
                }
            }
        }
        main_range = min_main_range[2] + "/";
        $("#hs").prop('checked', true);
    }
    range = (!(dev_type=="PC-28.Modbus/" || dev_type=="PR-28.Modbus/")) ? (data.get("begin_range")).toString().split('.').join(',') + "..." + (data.get("end_range")).toString().split('.').join(',') + data.get("units") + data.get("pressure_type") + "/" : "";
    // console.log("range1: " + range);
    range = ((main_dev == "APR-2000" || main_dev == "PR-28") && range!="") ? range.slice(0,-5) + "/" : range;
    // console.log("range2: " + range);
    range = ((dev_type=="PC-28.Smart/" || main_dev == "APC-2000" || main_dev == "APR-2000" || dev_type == "PR-28.Smart/") && range==main_range) ? "" : range;
    // console.log("range3: " + range);

    if (((main_dev=="PR-28" || main_dev=="APR-2000") && ((connection=="P" && minus_connection=="P") || connection=="C")) || !(main_dev=="PR-28" || main_dev=="APR-2000")){///КОРРЕКТИРОВКА CONNECTION для PC, APC, PR/C/P, APR/C/P,
        connection = connection.split("-");
        if (connection[0]=="S"){
            s_material = $("input[name=material]:checked").val() == "" ? "" : "-" + $("input[name=material]:checked").val();
            if (s_material!=""){
                connection[2] = connection[2] + s_material;
            }
        }
        if (data.has("flange") && data.get("flange").slice(0,3) == "s_t"){
            connection.push("T=" + $("#" + data.get("flange") + "-cilinder-length").val() + "мм");
        }
        if (data.get("cap-or-not") == "capillary"){
            if ($("#rad_cap").is(':checked')){
                connection[1] = connection[1] + "K";
                connection.push("R-K=" + data.get("capillary_length") + "м");
            }else{
                connection[1] = connection[1] + "K";
                connection.push("T-K=" + data.get("capillary_length") + "м");
            }
        }
        if (data.get("cap-or-not") == "direct" && typeof connection[1]!="undefined" && !connection[1].startsWith("R")){
            connection[1] = (data.get("max_temp")>150 && data.get("max_temp")<=200) ? connection[1] + "R" : (data.get("max_temp")>200 && data.get("max_temp")<=250) ? connection[1] + "R2" : (data.get("max_temp")>250 && data.get("max_temp")<310) ? connection[1] + "R3" : connection[1];
        }
        connection = connection.join("-");
    }

    if ((main_dev=="PR-28" || main_dev=="APR-2000") && !((connection=="P" && minus_connection=="P") || connection=="C" || connection=="C7/16")){///КОРРЕКТИРОВКА CONNECTION для PR и APR кроме C/P
        // console.log(connection);
        // console.log(minus_connection);
        connection = connection.split("-");
        minus_connection = minus_connection.split("-");
        if (connection[0]=="S"){
            s_material = $("input[name=material]:checked").val() == "" ? "" : "-" + $("input[name=material]:checked").val();
            if (s_material!=""){
                connection[2] = connection[2] + s_material;
            }
        }
        if (minus_connection[0]=="S"){
            s_material = $("input[name=material]:checked").val() == "" ? "" : "-" + $("input[name=material]:checked").val();
            if (s_material!=""){
                minus_connection[2] = minus_connection[2] + s_material;
            }
        }
        if (data.has("flange") && data.get("flange").slice(0,3) == "s_t"){
            connection.push("T=" + $("#" + data.get("flange") + "-cilinder-length").val() + "мм");
        }
        if (data.has("minus-flange") && data.get("minus-flange").slice(0,9) == "minus-s_t"){
            minus_connection.push("T=" + $("#" + data.get("minus-flange") + "-cilinder-length").val() + "мм");
        }
        if (data.get("cap-plus") == "capillary"){
            if ($("#rad_cap").is(':checked')){
                connection[1] = connection[1] + "K";
                connection.push("R-K=" + data.get("capillary_length_plus") + "м");
            }else{
                connection[1] = connection[1] + "K";
                connection.push("T-K=" + data.get("capillary_length_plus") + "м");
            }
        }
        if (data.get("cap-minus") == "capillary"){
            if ($("#rad_cap").is(':checked')){
                minus_connection[1] = minus_connection[1] + "K";
                minus_connection.push("R-K=" + data.get("capillary_length_minus") + "м");
            }else{
                minus_connection[1] = minus_connection[1] + "K";
                minus_connection.push("T-K=" + data.get("capillary_length_minus") + "м");
            }
        }
        if (data.get("cap-plus") == "direct" && typeof connection[1]!="undefined" && !connection[1].startsWith("R")){
            connection[1] = (data.get("max_temp_plus")>150 && data.get("max_temp_plus")<=200) ? connection[1] + "R" : (data.get("max_temp_plus")>200 && data.get("max_temp_plus")<=250) ? connection[1] + "R2" : (data.get("max_temp_plus")>250 && data.get("max_temp_plus")<310) ? connection[1] + "R3" : connection[1];
        }
        if (data.get("cap-minus") == "direct" && typeof minus_connection[1]!="undefined" && !minus_connection[1].startsWith("R")){
            minus_connection[1] = (data.get("max_temp_minus")>150 && data.get("max_temp_minus")<=200) ? minus_connection[1] + "R" : (data.get("max_temp_minus")>200 && data.get("max_temp_minus")<=250) ? minus_connection[1] + "R2" : (data.get("max_temp_minus")>250 && data.get("max_temp_minus")<310) ? minus_connection[1] + "R3" : minus_connection[1];
        }
        connection = connection.join("-");
        minus_connection = minus_connection.join("-");
    }

    if (data.get("thread")== "P" || data.get("thread")== "GP" || data.get("thread") == "CM30_2" || data.get("thread") == "CG1" || data.get("thread") == "CG1_S38" || data.get("thread") == "CG1_2"  || data.get("thread") == "G1_2"){
        material = data.get("material")=="aisi316" ? "" : $("input[name=material]:checked").val()+"/";
    }else{
        material = "";
    }
    $("input[name=special]").each(function() {/// ПЕРЕБИРАЕМ отмеченные SPECIAL, добавляем в код
        if ($(this).is(":checked") && $(this).val()!="rad_cap" && $(this).val()!="Hart7"){
            special = special + $(this).val() + "/";
        }
    })
    let fluid = "";
    let plus_fluid = "";
    let minus_fluid = "";
    if (connection.startsWith("S-") || connection.startsWith("(+)S-") || (typeof minus_connection!='undefined' && minus_connection.startsWith("S-"))){
        fluid = $("input[name=fluid]:checked").val()=="AK" ? "" : "-" + $("input[name=fluid]:checked").val();
        // console.log("Добавляем жижу в код: " + fluid);
    }
    // console.log(connection);
    // console.log(minus_connection);
    plus_fluid = (connection.startsWith("S-") && !minus_connection.startsWith("S-")) ? fluid : "";
    minus_fluid = minus_connection.startsWith("S-") ? fluid : "";



    if (main_dev=="PC-28"){
        console.log("code1");
        code = dev_type + approval + material + special + main_range + range + $("#"+data.get("electrical")).val() + "/" + output + connection + fluid;
    }
    if (main_dev=="APC-2000"){
        console.log("code2");
        code = main_dev + $("#"+data.get("electrical")).val() + "/" + approval + material + special + main_range + range + output + connection + fluid;
    }
    if (main_dev=="PR-28" && ((connection=="P" && minus_connection=="P") || connection=="C")){
        console.log("code PR-28 или С или P");
        material = data.get("material")=="aisi316" ? "" : $("input[name=material]:checked").val()+"/";
        max_static = (connection=="C" && max_static!=25) ? max_static + "МПа/" : "";
        connection = (connection=="C" && (max_static=="41МПа/" || max_static=="70МПа/")) ? "C7/16" : connection;
        code = dev_type + approval + material + special + max_static + main_range + range + $("#"+data.get("electrical")).val() + "/" + output + connection;
    }
    if (main_dev=="PR-28" && !((connection=="P" && minus_connection=="P") || connection=="C" || connection=="C7/16")){
        console.log("code PR-28 КРОМЕ С и КРОМЕ P");
        code =  dev_type + approval + material + special + main_range + range + $("#"+data.get("electrical")).val() + "/" + output + "(+)" + connection + plus_fluid + "/(-)" + minus_connection + minus_fluid;
    }
    if (main_dev=="APR-2000" && ((connection=="P" && minus_connection=="P") || connection=="C")){
        console.log("code APR-2000  или С или P");
        material = data.get("material")=="aisi316" ? "" : $("input[name=material]:checked").val()+"/";
        max_static = (connection=="C" && max_static!=25) ? max_static + "МПа/" : "";
        connection = (connection=="C" && (max_static=="41МПа/" || max_static=="70МПа/")) ? "C7/16" : connection;
        code = main_dev + $("#"+data.get("electrical")).val() + "/" + approval + material + special + max_static + main_range + range + output + connection;
    }
    if (main_dev=="APR-2000" && !((connection=="P" && minus_connection=="P") || connection=="C" || connection=="C7/16")){
        console.log("code APR-2000 КРОМЕ С и КРОМЕ P");
        if (connection.startsWith("S-") && minus_connection.startsWith("S-")){
            main_dev="APR-2200";
        }
        code = main_dev + $("#"+data.get("electrical")).val() + "/" + approval + material + special + main_range + range + output + "(+)" + connection + plus_fluid + "/(-)" + minus_connection + minus_fluid;
    }
    // document.getElementById("code").innerHTML = code;
    if ($("div.color-mark-field.unselected:visible").length==0){
        document.getElementById("code").value = code;
        $('#code').autoGrowInput({ /// ИЗМЕНЯЕМ ДЛИНУ ПОЛЯ ВВОДА
            minWidth: 200,
            maxWidth: function(){return $('.code-input-container').width()-8; },
            comfortZone: 5
        })
        addDescription();
    }
}

function get_ctr_code_info(data){
    console.log("Создаем код заказа CTR");
    let code = "В_РАЗРАБОТКЕ!!!";
    let output = data.get("output");
    let appr = data.get("approval");
    let sensor_quantity = data.get("sensor_quantity")=="1" ? "" : data.get("sensor_quantity")+"x";
    let sensor;
    let approval = appr =="Ex" ? "Ex/" : appr == "Exd" ? "Exd/" : "-/";
    let head_nohead = data.has("head") ? data.get("head").slice(4,) : data.has("nohead") ? data.get("nohead").slice(4,) : data.get("cabel").slice(4,) + "-" + data.get("ctr_cabel_type") + "=" + data.get("ctr_cabel_length") + "м";
    let vk = $("#spec_lvk").is(":checked") ? "vk" : "";
    let connection = data.has("ctr_thread_type") ? data.get("ctr_thread_type") : data.has("ctr_flange_type") ? data.get("ctr_flange_type") : data.has("ctr_hygienic_type") ? data.get("ctr_hygienic_type") : "I";
    let material = window["material_restr_lst"].get(data.get("material")).get("code_name");
    let transducer = (output=="4_20" && data.has("thermoresistor")) ? "AT/" : (output=="4_20" && data.has("thermocouple")) ? "GI-22/" : output=="4_20H" ? "LI-24G/" : "";
    transducer = (approval=="Ex/" && transducer!="") ? transducer + "Ex/" : transducer;
    let range = data.get("ctr_begin_range") + "..." + data.get("ctr_end_range") + "°C";
    let open_circuit = (!$("#spec_38").is(':disabled') && !$("#spec_38").is(":checked")) ? "/23мА" : ($("#spec_38").is(":checked")) ? "/3,8мА" : (!$("#spec_375").is(':disabled') && !$("#spec_375").is(":checked")) ? "/21,5мА" :  (output=="4_20H" && $("#spec_375").is(":checked")) ? "/3,75мА" : "";
    let special = "";
    $("input[name=special]").each(function() {/// ПЕРЕБИРАЕМ отмеченные SPECIAL, добавляем в код
        if ($(this).is(":checked") && $(this).val()!="Lvk"){
            special = special + $(this).val() + "/";
        }
    })


    if (data.has("thermoresistor") && data.get("output")!="no_trand" && (data.has("nohead") || data.has("head") && data.get("head")!="ctr-ALW")){
        console.log("Код CT-R");
        sensor = $("#" + data.get("thermoresistor")).val();
        code = "CT-R/" + head_nohead + "/" + approval + sensor_quantity + sensor + "/" + data.get("sensor_accuracy_tr") + "/" + data.get("sensor_wiring_tr") + "/" + "d" + vk + "=" + data.get("ctr_diameter") + "мм/L" + vk + "=" + data.get("ctr_length") + "мм/S=" + data.get("ctr_outlength") + "мм/" + connection + "/" + material + "/" + transducer + range + open_circuit;
    }
    if (data.has("thermocouple") && data.get("output")!="no_trand" && (data.has("nohead") || data.has("head") && data.get("head")!="ctr-ALW") && data.get("ctr_end_range")<=1100){
        console.log("Код CT-U");
        sensor = $("#" + data.get("thermocouple")).val();
        code = "CT-U/" + head_nohead + "/" + approval + sensor_quantity + sensor + "/" + data.get("sensor_accuracy_tc") + "/" + "d" + vk + "=" + data.get("ctr_diameter") + "мм/L" + vk + "=" + data.get("ctr_length") + "мм/S=" + data.get("ctr_outlength") + "мм/" + connection + "/" + material + "/" + transducer + range + open_circuit;
    }
    if(data.has("thermoresistor") && data.get("output")=="no_trand"){
        console.log("Код CT");
        sensor = $("#" + data.get("thermoresistor")).val();
        transducer = (data.has("head")) ? "KZ/" : "";
        code = "CT/" + head_nohead + "/" + approval + sensor_quantity + sensor + "/" + data.get("sensor_accuracy_tr") + "/" + data.get("sensor_wiring_tr") + "/" + "d" + vk + "=" + data.get("ctr_diameter") + "мм/L" + vk + "=" + data.get("ctr_length") + "мм/S=" + data.get("ctr_outlength") + "мм/" + connection + "/" + material + "/" + transducer + range;
    }
    if((data.has("thermocouple") && data.get("output")=="no_trand") || (data.has("thermocouple") && data.get("output")!="no_trand" && data.get("ctr_end_range")>1100)){
        console.log("Код CTU");
        sensor = $("#" + data.get("thermocouple")).val();
        let s_length =  !data.has("cabel") ? "S=" + data.get("ctr_outlength") + "мм/" : "";
        connection = connection=="I" ? "-" : connection;
        head_nohead = data.has("head") ? data.get("head").slice(4,) : data.has("nohead") ? data.get("nohead").slice(4,) : "C" + data.get("ctr_cabel_type").toLowerCase() + "(" + data.get("cabel").slice(4,) + ")=" + data.get("ctr_cabel_length") + "м";
        code = "CTU/" + sensor_quantity + sensor + "/" + data.get("sensor_accuracy_tc") + "/" + "d" + vk + "=" + data.get("ctr_diameter") + "мм/" + material  + "/" + "L" + vk + "=" + data.get("ctr_length") + "мм/" + s_length + connection + "/" + head_nohead + "/" + transducer + range;
    }
    if (data.has("thermoresistor") && data.get("head")=="ctr-ALW"){
        console.log("Код CTR-ALW");
        approval = approval=="-/" ? "" : approval;
        code = "CTR-ALW/" + $("input[name=ctr-ALW-type]:checked").val() + "/" + approval + special + "d" + "=" + data.get("ctr_diameter") + "мм/L" + "=" + data.get("ctr_length") + "мм/S=" + data.get("ctr_outlength") + "мм/" + connection + "/" + range + open_circuit;
    }
    if (data.has("thermocouple") && data.get("head")=="ctr-ALW"){
        approval = approval=="-/" ? "" : approval;
        console.log("Код CTU-ALW");
        code = "CTU-ALW/" + $("input[name=ctr-ALW-type]:checked").val() + "/" + approval + special + "d" + "=" + data.get("ctr_diameter") + "мм/L" + "=" + data.get("ctr_length") + "мм/S=" + data.get("ctr_outlength") + "мм/" + connection + "/" + range + open_circuit;
    }





                                                                                ////ПРОДОЛЖИТЬ///////////////////////////////////////////////////////////////////
    if ($("div.color-mark-field.unselected:visible").length==0){
        document.getElementById("code").value = code;
        $('#code').autoGrowInput({ /// ИЗМЕНЯЕМ ДЛИНУ ПОЛЯ ВВОДА
            minWidth: 200,
            maxWidth: function(){return $('.code-input-container').width()-8; },
            comfortZone: 5
        })
        addDescription();
    }
}

function disable_invalid_options(){
    let num = 100; // НУЖНО ДЛЯ ДОБАВЛЕНИЯ id CHECKBOX_ERR_CANCEL
    $("div[id^='err_']").each(function(){  ////ПРЯЧЕМ ВСЕ ERR_CANCEL ЧЕКБОКСЫ
        // if (($(this).find("input[name=err_cancel]:checked").length==0) || ($(this).closest("div.active-option-to-select-list").css("display")!="block")){
        //     $(this).prop("style", "display:none");
        // }
        $(this).prop("innerHTML", "&emsp;&nbsp;<img src='images/attention.png' style='width: 1.3em; height: 1.3em'><span style='color: red'>&nbsp;Необходимо отменить: </span>");
    })
    $("#err_ctr-range").prop("innerHTML", "<span style='color: red; margin-left:1.5em'>или отмените: </span>"); // &emsp;&nbsp;<img src='images/attention.png' style='width: 1.3em; height: 1.3em'>

    // async function getErrRangeCount(){
    //     var count = errRangeCount();
    //     let promise = Promise.resolve(count);
    //     const response = await promise;
    //     return response;
    // }
    // getErrRangeCount().then(val => console.log(val));
    // console.log("err_count:", err_count);


    let check_flag = true;
    let full_conf = get_full_config();
    console.log("Выбранная конфигурация ", full_conf);
    let opt_names = ["main_dev", "approval", "output", "electrical", "material", "sensor-type", "cap-or-not", "max-static"];
    for (let opt_name of opt_names){ ///СНЯТИЕ ВСЕХ ОГРАНИЧЕНИЙ
        $("#"+ opt_name + "-select-field").find("label.disabled").removeClass('disabled'); /// СНИМАЕМ ОТМЕТКУ СЕРЫМ со всех чекбоксов
        $("input[name="+ opt_name +"]").each(function() {
            $(this).prop('disabled', false);                                                   /// АКТИВАЦИЯ ВСЕХ ЧЕКБОКСОВ
        })
    }
    $("select option").each(function(){ /// АКТИВАЦИЯ ВСЕХ OPTION
        $(this).removeAttr('disabled');
    })

    if (typeof full_conf.get("minus-flange")!=='undefined' && full_conf.get("minus-flange")=="minus-c-pr"){
        for (let plmin of ["","minus-"]){////////присоединения плюс и минус пометить причину деактивации при включенном C
            for (let cons of ["thread", "flange", "hygienic"]){
                $("input[name=" + plmin + cons + "]").each(function(){
                    if (typeof document.getElementById("err_" + $(this).prop("id"))!="undefined" && document.getElementById("err_" + $(this).prop("id"))!=null){
                        document.getElementById("err_" + $(this).prop("id")).innerHTML += `<input type='checkbox' name='c_err_cancel' value='' id='${plmin}c-pr_err_cancel${num}' checked class='custom-checkbox err-checkbox' onclick='CorPSelected("c-pr", false)'><label for='${plmin}c-pr_err_cancel${num}'>${$('label[for=' + plmin + 'c-pr]').text()}</label>`;
                        num+=1;
                    }
                })
            }
        }
    }

    let condition4 = (full_conf.has("flange") && (full_conf.get("flange")=='c-pr' || full_conf.get("flange")=='minus-c-pr'));
    // console.log(condition4);
    if (((full_conf.get("main_dev")=="pr-28" || full_conf.get("main_dev")=="apr-2000") && condition4==false) || (full_conf.get("main_dev")=="pc-28" || full_conf.get("main_dev")=="apc-2000")){ //ТОЛЬКО ДЛЯ С или P присоединений
        let opt_names2 = ["cap-plus", "cap-minus", "connection-type", "minus-connection-type", "thread", "flange", "hygienic", "minus-thread", "minus-flange", "minus-hygienic"];
        for (let opt_name of opt_names2){ ///СНЯТИЕ ВСЕХ ОГРАНИЧЕНИЙ
            $("#"+ opt_name + "-select-field").find("label.disabled").removeClass('disabled'); /// СНИМАЕМ ОТМЕТКУ СЕРЫМ со всех чекбоксов
            $("input[name="+ opt_name +"]").each(function() {
                $(this).prop('disabled', false);                                                    /// АКТИВАЦИЯ ВСЕХ ЧЕКБОКСОВ
            })
        }
    }

    if (full_conf.get("main_dev")=="ctr"){
        for (let opt_name of ["main_dev", "approval", "output", "ctr-electrical", "ctr-ALW-type", "head", "nohead", "cabel", "ctr-cabel-type", "material", "thermocouple", "thermoresistor"]){ ///СНЯТИЕ ВСЕХ ОГРАНИЧЕНИЙ CTR
            $("#"+ opt_name + "-select-field").find("label.disabled").removeClass('disabled'); /// СНИМАЕМ ОТМЕТКУ СЕРЫМ со всех чекбоксов
            $("input[name="+ opt_name +"]").each(function() {
                $(this).prop('disabled', false);                                                    /// АКТИВАЦИЯ ВСЕХ ЧЕКБОКСОВ
            })
        }
        for (let lst of ["thread", "flange", "hygienic"]){
            $("label[for=ctr-"+lst+"-list]").removeClass('disabled');
            $("#ctr-"+lst+"-list").prop('disabled', false);
        }

    }

    $("input[name=special]").each(function() {/// АКТИВАЦИЯ ВСЕХ ЧЕКБОКСОВ SPECIAL
        $(this).prop('disabled', false);
        $("label[for="+$(this).attr("id")+"]").removeClass('disabled');
    })

    let caps = ["cap-or-not", "cap-plus", "cap-minus"];
    for (let els of caps){
        $("input[name="+ els +"-mes-env-temp]").prop('max', 300);// СНЯТЬ ОГРАНИЧЕНИЕ ТЕМПЕРАТУРЫ
        $("input[name="+ els +"-mes-env-temp]").prop('placeholder', "-40...300");
        document.getElementById(els +"-radiator-select-err").innerHTML = "<br/><img src='images/attention.png' style='width: 1.3em; height: 1.3em'> Введите температуру от -40 до 300°C и нажмите \"OK\"";
    }

    ctr_low_temp = -196;    // СНЯТЬ ОГРАНИЧЕНИЕ ТЕМПЕРАТУРЫ CTR
    ctr_high_temp = 1700;   // СНЯТЬ ОГРАНИЧЕНИЕ ТЕМПЕРАТУРЫ CTR
    $("input[name=ctr-begin-range]").prop('min', ctr_low_temp).prop('max', ctr_high_temp);
    $("input[name=ctr-end-range]").prop('min', ctr_low_temp).prop('max', ctr_high_temp);
    document.getElementById("ctr-range_warning").innerHTML = `<img src='images/attention.png' style='width: 1.3em; height: 1.3em'> <span style='color:red'>Выберите диапазон от ${ctr_low_temp} до ${ctr_high_temp}°C</span>`;

    //СНЯТИЕ ОГРАНИЧЕНИЙ ПО ДАВЛЕНИЮ
    low_press = -101;                               // начало диапазона избыт, кПа
    hi_press = 100000;                              // конец диапазона избыт, кПа
    min_range = full_conf.get("output")=="4_20H" ? 0.1 : 2.5;   // мин ширина диапазона избыт, кПа
    low_press_abs = 0;                              // начало диапазона абс, кПа
    hi_press_abs = 10000;                           // конец диапазона абс, кПа
    min_range_abs = full_conf.get("output")=="4_20H" ? 10 : 20.0;   // мин ширина диапазона абс, кПа
    low_press_diff = -160;                         // начало диапазона перепад, кПа
    hi_press_diff = 2500;                           // конец диапазона перепад, кПа
    min_range_diff = 1.6;                           // мин ширина диапазона перепад, кПа
    if (full_conf.get("main_dev")=='pc-28' || full_conf.get("main_dev")=='apc-2000'){
        document.getElementById("range_warning1").innerHTML = low_press.toLocaleString() + " ... " + hi_press.toLocaleString() + " кПа и минимальная ширина " + min_range + " кПа (избыточное давление).";
        document.getElementById("range_warning2").innerHTML = low_press_abs.toLocaleString() + " ... " + hi_press_abs.toLocaleString() + " кПа и минимальная ширина " + min_range_abs + " кПа (абсолютное давление).";
        document.querySelectorAll("#pressure-type option").forEach(opt => {
            if (opt.value == "diff") {
                opt.disabled = true;
            }else{
                opt.disabled = false;
            }
        })
    }
    if (full_conf.get("main_dev")=='pr-28' || full_conf.get("main_dev")=='apr-2000'){
        document.getElementById("range_warning1").innerHTML = low_press_diff.toLocaleString() + " ... " + hi_press_diff.toLocaleString() + " кПа и минимальная ширина " + min_range_diff + " кПа (перепад давления).";
        document.getElementById("range_warning2").innerHTML = "";
        document.getElementById("pressure-type").value="diff";
        document.querySelectorAll("#pressure-type option").forEach(opt => {
            if (opt.value != "diff") {
                opt.disabled = true;
            }else{
                opt.disabled = false;
            }
        })
    }

    if ((typeof full_conf.get("sensor_accuracy_tr")!="undefined" && full_conf.get("sensor_accuracy_tr")=="A") || (typeof full_conf.get("sensor_accuracy_tc")!="undefined" && full_conf.get("sensor_accuracy_tc")=="1")){
        ctr_min_length = $("#ctr-diameter").val()!="not_selected" ? parseInt($("#ctr-diameter").val())*5+30 : 45; /// МИНИМАЛЬНАЯ ДЛИНА ДЛЯ КЛАССА "A"
    }else{
        ctr_min_length = 20;
    }
    checkCTRDimensions();


    if (full_conf.get("main_dev")=="apc-2000" || full_conf.get("main_dev")=="pc-28" || full_conf.get("main_dev")=="apr-2000" || full_conf.get("main_dev")=="pr-28"){//ПРОВЕРКА ЭЛЕКТРИЧЕСКОЙ ЧАСТИ ДАВЛЕНИЕ
        for (let pair of full_conf.entries()){
            if (typeof pair[1] !== 'undefined'){        /// проверка VALUE(pair[1]) из full_conf на UNDEFINED
                for (let opt in option_names){
                    if (option_names[opt]!=pair[0]){             /// НЕ СРАВНИВАТЬ ОПЦИЮ САМУ С СОБОЙ
                        // console.log(pair[0], " - ", pair[1], " - ", option_names[opt]);
                        let temp;
                        try {
                            temp = restr_conf_lst.get(pair[0]).get(pair[1]).get(option_names[opt]);////ПОЛУЧАЕМ ДОСТУПНЫЕ ВАРИАНТЫ ИЗ МАССИВА ОГРАНИЧЕНИЙ по каждой опции
                        }
                        catch (err){
                            console.log(err);
                        }
                        $("input[name="+ option_names[opt] +"]").each(function() {
                            if (typeof temp !== 'undefined' && !temp.includes($(this).attr("id"))){
                                $("label[for="+$(this).attr("id")+"]").addClass('disabled');    ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ ВАРИАНТЫ
                                $(this).prop('disabled', true);                                 //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ
                                                            // }
                                document.getElementById("err_" + $(this).attr("id")).innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${pair[1]}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${pair[1]}_err_cancel${num}'>${$("label[for="+pair[1]+"]").text()}</label>`;
                                num+=1;
                            }
                        })
                    }
                }
            }
        }
    }

    //СКРЫТЬ ВЫБОР МАНОМЕТРИЧЕСКОЙ ЖИДКОСТИ и снять ее выбор
    let fluid_on = (full_conf.has("thread") && typeof full_conf.get("thread")!="undefined" && full_conf.get("thread").startsWith("s_")) || (full_conf.has("flange") && typeof full_conf.get("flange")!='undefined' && full_conf.get("flange").startsWith("s_")) || (full_conf.has("hygienic") && typeof full_conf.get("hygienic")!='undefined' && full_conf.get("hygienic").startsWith("s_")) || (full_conf.has("minus-thread") && typeof full_conf.get("minus-thread")!='undefined' && full_conf.get("minus-thread").startsWith("minus-s_")) || (full_conf.has("minus-flange") && typeof full_conf.get("minus-flange")!='undefined' && full_conf.get("minus-flange").startsWith("minus-s_")) || (full_conf.has("minus-hygienic") && typeof full_conf.get("minus-hygienic")!='undefined' && full_conf.get("minus-hygienic").startsWith("minus-s_"));
    if (fluid_on===false){
        // console.log("DISABLE INVALID OPTIONS скрыть выбор манометрической жидкости");
        $("div.option-to-select.fluid-select-div").each(function(){
            $(this).prop("style", "display: none").removeClass("active-option-to-select");
            $(this).next("div.option-to-select-list").prop("style", "display: none").removeClass("active-option-to-select-list");
        });
        $("input[name=fluid]").each(function(){
            $(this).prop('checked', false);
        })
        $("div.fluid-select-div").find(".color-mark-field").removeClass("selected").addClass("unselected");
    }else{    ///ПРОВЕРКА МАНОМЕТРИЧЕСКОЙ ЖИДКОСТИ
        if ((typeof full_conf.get("begin_range_kpa")!='undefined' && full_conf.get("begin_range_kpa")<0 && full_conf.get("pressure_type")=="") || (typeof full_conf.get("begin_range_kpa")!='undefined' && full_conf.get("begin_range_kpa")<100 && full_conf.get("pressure_type")=="ABS") || (typeof full_conf.get("max_temp")!='undefined' && full_conf.get("max_temp")>180)  || (typeof full_conf.get("max_temp_plus")!='undefined' && full_conf.get("max_temp_plus")>180)  || (typeof full_conf.get("max_temp_minus")!='undefined' && full_conf.get("max_temp_minus")>180)){
            $("label[for=ak20]").addClass('disabled');
            $("#ak20").prop('disabled', true);
            document.getElementById("err_ak20").innerHTML += `<input type='checkbox' name='range_err_cancel' value='' id='ak20_err_cancel${num}' checked class='custom-checkbox err-checkbox' onclick='uncheckRange()'><label for='ak20_err_cancel${num}'>Выбранный диапазон. Вакуум не допускается!.</label>`;
            num+=1;
        }else{
            $("label[for=ak20]").removeClass('disabled');
            $("#ak20").prop('disabled', false);
        }
    }

    if (full_conf.get("main_dev")=="apc-2000" || full_conf.get("main_dev")=="pc-28"){  /// ПРОВЕРКА PC и APC
        $("input[name=thread]").each(function(){// СКРЫТЬ 1/4NPT(F) и фланец С, показать штуцера PC, APC
            if (this.value=="1/4NPT(F)"){
                // $(this).prop("style", "display:none");
                $("label[for="+$(this).prop('id')+"]").prop("style", "display:none");
            }else{
                // $(this).prop("style", "display:block");
                $("label[for="+$(this).prop('id')+"]").prop("style", "display:block");
            }
        })
        $("#c-pr").prop("style", "display:none");
        $("label[for=c-pr]").prop("style", "display:none");
        for (let con_type of connection_types){
            if (full_conf.has(con_type) && typeof full_conf.get(con_type)!='undefined'){// ОГРАНИЧИТЬ ДИАПАЗОН и МАТЕРИАЛ и ТЕМПЕРАТУРУ ЕСЛИ ВЫБРАНО ПРИСОЕДИНЕНИЕ THREAD или FLANGE или HYGIENIC
                low_press = window[con_type + "_restr_lst"].get(full_conf.get(con_type)).get("begin_range_kpa");
                hi_press = window[con_type + "_restr_lst"].get(full_conf.get(con_type)).get("end_range_kpa");
                if (typeof full_conf.get("cap-or-not")!='undefined' && full_conf.get("cap-or-not")=="capillary"){
                    min_range = typeof window[con_type + "_restr_lst"].get(full_conf.get(con_type)).get("range_c") != 'undefined' ? window[con_type + "_restr_lst"].get(full_conf.get(con_type)).get("range_c") : window[con_type + "_restr_lst"].get(full_conf.get(con_type)).get("range");
                    console.log("min_range capillary ", min_range);
                }
                if (typeof full_conf.get("cap-or-not")!='undefined' && full_conf.get("cap-or-not")=="direct"){
                    min_range = typeof window[con_type + "_restr_lst"].get(full_conf.get(con_type)).get("range") != 'undefined' ? window[con_type + "_restr_lst"].get(full_conf.get(con_type)).get("range") : min_range;
                    console.log("min_range direct ", min_range);
                }

                hi_press_abs = hi_press < hi_press_abs ? hi_press : hi_press_abs;
                min_range_abs = min_range_abs<min_range ? min_range : min_range_abs;

                if (full_conf.get("main_dev")=='pc-28' || full_conf.get("main_dev")=='apc-2000'){
                    document.getElementById("range_warning1").innerHTML = low_press.toLocaleString() + " ... " + hi_press.toLocaleString() + " кПа и минимальная ширина " + min_range + " кПа (избыточное давление).";
                    document.getElementById("range_warning2").innerHTML = low_press_abs.toLocaleString() + " ... " + hi_press_abs.toLocaleString() + " кПа и минимальная ширина " + min_range_abs + " кПа (абсолютное давление).";
                }
                if (full_conf.get("main_dev")=='pr-28' || full_conf.get("main_dev")=='apr-2000'){
                    document.getElementById("range_warning1").innerHTML = low_press_diff.toLocaleString() + " ... " + hi_press_diff.toLocaleString() + " кПа и минимальная ширина " + min_range_diff + " кПа (перепад давления).";
                    document.getElementById("range_warning2").innerHTML = "";
                }
                $("input[name=material]").each(function() {
                    if (!window[con_type + "_restr_lst"].get(full_conf.get(con_type)).get("material").includes($(this).attr("id"))){
                        $("label[for="+$(this).attr("id")+"]").addClass('disabled');  ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ МАТЕРИАЛЫ
                        $(this).prop('disabled', true);                               //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ MATERIAL
                        document.getElementById("err_" + $(this).attr("id")).innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get(con_type)}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get(con_type)}_err_cancel${num}'>${$("label[for="+full_conf.get(con_type)+"]").text()}</label>`;
                        num+=1;
                    }
                })
                if (window[con_type + "_restr_lst"].get(full_conf.get(con_type)).has("cap-or-not") && window[con_type + "_restr_lst"].get(full_conf.get(con_type)).get("cap-or-not") == "direct"){//ОГРАНИЧЕНИЕ  cap-or-not для DIRECT ONLY
                    $("label[for=capillary]").addClass('disabled');  ////ПОМЕЧАЕМ СЕРЫМ capillary
                    $("#capillary").prop('disabled', true);          //// ДЕАКТИВАЦИЯ capillary
                    document.getElementById("err_capillary").innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get(con_type)}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get(con_type)}_err_cancel${num}'>${$("label[for="+full_conf.get(con_type)+"]").text()}</label>`;
                    num+=1;
                }

                let max_temp = window[con_type + "_restr_lst"].get(full_conf.get(con_type)).get("max_temp");
                if (typeof max_temp!='undefined' && !window[con_type + "_restr_lst"].has("radiator")){
                    $("input[name=cap-or-not-mes-env-temp]").prop('max', max_temp);// ОГРАНИЧЕНИЕ ТЕМПЕРАТУРЫ для DIRECT для выбранного присоединения
                    $("input[name=cap-or-not-mes-env-temp]").prop('placeholder', "-40..." + max_temp);
                    document.getElementById("cap-or-not-radiator-select-err").innerHTML = "<br/><img src='images/attention.png' style='width: 1.3em; height: 1.3em'> Введите температуру от -40 до "+ max_temp + "°C и нажмите \"OK\"";
                }
            }

            for (let entr of window[con_type + "_restr_lst"].entries()){   // ДЕКАТИВАЦИЯ THREAD или FLANGE или HYGIENIC ПО ДАВЛЕНИЮ, КАПИЛЛЯРУ и МАТЕРИАЛУ и ТЕМПЕРАТУРЕ
                if (((typeof entr[1].get("range") !== 'undefined' && full_conf.get("range")<entr[1].get("range")) || full_conf.get("begin_range_kpa")<entr[1].get("begin_range_kpa") || full_conf.get("end_range_kpa")>entr[1].get("end_range_kpa")) && typeof full_conf.get("cap-or-not") == "undefined"){
                    $("label[for="+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ по давлению THREAD или FLANGE или HYGIENIC
                    $("#"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                    document.getElementById("err_"+entr[0]).innerHTML += `<input type='checkbox' name='range_err_cancel' value='' id='${full_conf.get("range")}_err_cancel${num}' checked class='custom-checkbox err-checkbox' onclick='uncheckRange()'><label for='${full_conf.get("range")}_err_cancel${num}'>Выбранный диапазон. Допускается ${entr[1].get("begin_range_kpa")}...${entr[1].get("end_range_kpa")} кПа, минимальная ширина ${entr[1].get("range")} кПа.</label>`;
                    num+=1;
                }
                if (typeof full_conf.get("cap-or-not") != 'undefined'){
                    if (typeof entr[1].get("cap-or-not") != 'undefined' && entr[1].get("cap-or-not") != full_conf.get("cap-or-not")){
                        $("label[for="+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ с капилляром ВАРИАНТЫ THREAD или FLANGE или HYGIENIC
                        $("#"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                        document.getElementById("err_"+entr[0]).innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("cap-or-not")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("cap-or-not")}_err_cancel${num}'>${$("label[for="+full_conf.get("cap-or-not")+"]").text()}</label>`;
                        num+=1;
                    }
                }
                if (full_conf.get("cap-or-not") == 'direct' && full_conf.has("max_temp") && !Number.isNaN(full_conf.get("max_temp"))){  //// ДЕАКТИВАЦИЯ DIRECT ПРИСОЕДИНЕНИЙ по ВЫБРАННОЙ ТЕМПЕРАТУРЕ
                    if (entr[1].get("max_temp") !== 'undefined' && entr[1].get("max_temp") < full_conf.get("max_temp")){
                        $("label[for="+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ ПО ТЕМПЕРАТУРЕ ВАРИАНТЫ THREAD или FLANGE или HYGIENIC
                        $("#"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                        document.getElementById("err_"+entr[0]).innerHTML += `<input type='checkbox' name='max_temp_err_cancel' value='' id='${full_conf.get("max_temp")}_err_cancel${num}' checked class='custom-checkbox err-checkbox' onclick='uncheckMaxTemp("cap-or-not")'><label for='${full_conf.get("max_temp")}_err_cancel${num}'>Выбрана температура ${full_conf.get("max_temp")}°C. Допуcкается до ${entr[1].get("max_temp")}°С</label>`;
                        console.log(`<input type='checkbox' name='max_temp_err_cancel' value='' id='${full_conf.get("max_temp")}_err_cancel${num}' checked class='custom-checkbox err-checkbox' onclick='uncheckMaxTemp()><label for='${full_conf.get("max_temp")}_err_cancel${num}'>Выбрана температура ${full_conf.get("max_temp")}°C. Допуcкается до ${entr[1].get("max_temp")}°С</label>`);
                        num+=1;
                    }
                }
                if (typeof full_conf.get("range")!=='undefined' && full_conf.get("cap-or-not") == 'direct'){
                    // console.log("name: ", entr[0], "range: ", entr[1].get("range"), "begin_range_kpa: ", entr[1].get("begin_range_kpa"), "end_range_kpa: ", entr[1].get("end_range_kpa"));
                    if ((typeof entr[1].get("range") !== 'undefined' && full_conf.get("range")<entr[1].get("range")) || full_conf.get("begin_range_kpa")<entr[1].get("begin_range_kpa") || full_conf.get("end_range_kpa")>entr[1].get("end_range_kpa")){
                        $("label[for="+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ по давлению БЕЗ КАПИЛЛЯРА ВАРИАНТЫ THREAD или FLANGE или HYGIENIC
                        $("#"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                        document.getElementById("err_"+entr[0]).innerHTML += `<input type='checkbox' name='range_err_cancel' value='' id='${full_conf.get(con_type)}_err_cancel${num}' checked class='custom-checkbox err-checkbox' onclick='uncheckRange()'><label for='${full_conf.get(con_type)}_err_cancel${num}'>Выбранный диапазон. Допускается ${entr[1].get("begin_range_kpa")}...${entr[1].get("end_range_kpa")} кПа, минимальная ширина для непосредственного соединения ${entr[1].get("range")} кПа.</label>`;
                        num+=1;
                    }
                }
                if (typeof full_conf.get("range")!=='undefined' && full_conf.get("cap-or-not") == 'capillary'){
                    // console.log("name: ", entr[0], "range: ", entr[1].get("range"), "begin_range_kpa: ", entr[1].get("begin_range_kpa"), "end_range_kpa: ", entr[1].get("end_range_kpa"));
                    if ((typeof entr[1].get("range_c") !== 'undefined' && full_conf.get("range")<entr[1].get("range_c")) || full_conf.get("begin_range_kpa")<entr[1].get("begin_range_kpa") || full_conf.get("end_range_kpa")>entr[1].get("end_range_kpa")){
                        $("label[for="+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ по давлению  С КАПИЛЛЯРОМ ВАРИАНТЫ THREAD или FLANGE или HYGIENIC
                        $("#"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                        if (typeof entr[1].get("range_c")!='undefined'){
                            document.getElementById("err_"+entr[0]).innerHTML += `<input type='checkbox' name='range_err_cancel' value='' id='${full_conf.get(con_type)}_err_cancel${num}' checked class='custom-checkbox err-checkbox' onclick='uncheckRange()'><label for='${full_conf.get(con_type)}_err_cancel${num}'>Выбранный диапазон. Допускается ${entr[1].get("begin_range_kpa")}...${entr[1].get("end_range_kpa")} кПа, минимальная ширина для дистанционного соединения ${entr[1].get("range_c")} кПа.</label>`;
                            num+=1;
                        }
                    }
                }
                if (typeof full_conf.get("material")!=='undefined'){
                    if (typeof entr[1].get("material")!='undefined' && !entr[1].get("material").includes(full_conf.get("material"))){
                        $("label[for="+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ по материалу ВАРИАНТЫ THREAD или FLANGE или HYGIENIC
                        $("#"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                        document.getElementById("err_" +entr[0]).innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("material")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("material")}_err_cancel${num}'>${$("label[for="+full_conf.get("material")+"]").text()}</label>`;
                        num+=1;
                    }
                }
            }
        }
    }

    $("input[name=electrical]").each(function(){ /// СКРЫВАЕМ НЕНУЖНЫЕ ЭЛЕКТРИЧЕСКИЕ ПРИСОЕДИНЕНИЯ В ЗАВИСИМОСТИ ОТ MAIN-DEV
        if (full_conf.get("main_dev")=="apc-2000" || full_conf.get("main_dev")=="apr-2000"){
            if ($(this).prop("id")=="PD" || $(this).prop("id")=="PZ" || $(this).prop("id")=="APCALW"){
                // $(this).prop("style", "display:block");
                $("label[for=" + $(this).prop("id") + "]").prop("style", "display:block");
            }else{
                // $(this).prop("style", "display:none");
                $("label[for=" + $(this).prop("id") + "]").prop("style", "display:none");
            }
        }

        if (full_conf.get("main_dev")=="pc-28" || full_conf.get("main_dev")=="pr-28"){
            if (!($(this).prop("id")=="APCALW")){//
                // $(this).prop("style", "display:block");
                $("label[for=" + $(this).prop("id") + "]").prop("style", "display:block");
            }else{
                // $(this).prop("style", "display:none");
                $("label[for=" + $(this).prop("id") + "]").prop("style", "display:none");
            }
        }
    })

    $("input[name=output]").each(function(){ /// СКРЫВАЕМ НЕНУЖНЫЕ ВЫХОДНЫЕ СИГНАЛЫ В ЗАВИСИМОСТИ ОТ MAIN-DEV
        if (full_conf.get("main_dev")=="apc-2000" || full_conf.get("main_dev")=="apr-2000"){
            if ($(this).prop("id")=="4_20H"){
                // $(this).prop("style", "display:block");
                $("label[for=" + $(this).prop("id") + "]").prop("style", "display:block");
            }else{
                // $(this).prop("style", "display:none");
                $("label[for=" + $(this).prop("id") + "]").prop("style", "display:none");
            }
            $("label[for=no_trand]").prop("style", "display:none");
        }

        if (full_conf.get("main_dev")=="pc-28" || full_conf.get("main_dev")=="pr-28"){
            $("label[for=" + $(this).prop("id") + "]").prop("style", "display:block");
            $("label[for=no_trand]").prop("style", "display:none");
        }

        if (full_conf.get("main_dev")=="ctr"){
            if ($(this).prop("id")=="4_20H" || $(this).prop("id")=="4_20" || $(this).prop("id")=="no_trand"){
                $("label[for=" + $(this).prop("id") + "]").prop("style", "display:block");
            }else{
                $("label[for=" + $(this).prop("id") + "]").prop("style", "display:none");
            }
        }
    })

    if (full_conf.get("main_dev")=="apr-2000" || full_conf.get("main_dev")=="pr-28"){   /// ПРОВЕРКА PR и APR

        $("input[name=thread]").each(function(){
            if (this.value=="M12x1" || this.value=="1/4NPT(F)" || this.value=="P" || this.value.startsWith("S-")){// ПОКАЗАТЬ 1/4NPT(F) и фланец С, скрыть штуцера PC, APC
                // $(this).prop("style", "display:block");
                $("label[for="+$(this).prop('id')+"]").prop("style", "display:block");
            }else{
                // $(this).prop("style", "display:none");
                $("label[for="+$(this).prop('id')+"]").prop("style", "display:none");
            }
        })
        // $("#c-pr").prop("style", "display:block");
        $("label[for=c-pr]").prop("style", "display:block");

        if (full_conf.get("range")>1600){       // деактивация MAX-STATIC по выбранному диапазону
            $("input[name=max-static]").each(function(){
                if (($(this).val()!="4")){
                    $(this).prop('disabled', true);
                    $("label[for="+$(this).prop('id')+"]").addClass('disabled');
                    document.getElementById("err_"+$(this).prop('id')).innerHTML += `<input type='checkbox' name='range_err_cancel' value='' id='${full_conf.get("max-static")}_err_cancel${num}' checked class='custom-checkbox err-checkbox' onclick='uncheckRange()'><label for='${full_conf.get("max-static")}_err_cancel${num}'>Выбранный диапазон. Максимальная ширина диапазона 1600 кПа.</label>`;
                    num+=1;
                }
            })
        }
        if (typeof full_conf.get("material")!="undefined" & (full_conf.get("material")=="hastelloy" || full_conf.get("material")=="tantal")){       // деактивация MAX-STATIC>25 для HASTELLOY и TANTAL
            $("input[name=max-static]").each(function(){
                if ((parseInt($(this).val())>25)){
                    $(this).prop('disabled', true);
                    $("label[for="+$(this).prop('id')+"]").addClass('disabled');
                    document.getElementById("err_"+$(this).prop('id')).innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("material")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("material")}_err_cancel${num}'>${$("label[for="+full_conf.get("material")+"]").text()}</label>`;
                    num+=1;
                }
            })
        }
        if ($("input[name=max-static]:checked").length>0 && full_conf.get("max-static")!="4"){// ОГРАНИЧЕНИЕ ДИАПАЗОНА и деактивация P и 1/4NPT елси MAX-STATIC не равно 4
            for (let els of ["1_4npt_f", "P"]){
                for (let plmin of ["","minus-"]){
                    $("label[for="+ plmin + els +"]").addClass('disabled');  ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ штуцера
                    $("#" + plmin + els).prop('disabled', true);             //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ
                    $("#" + plmin + els).prop("checked", false);
                    document.getElementById("err_" + plmin + els).innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("max-static")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("max-static")}_err_cancel${num}'>${$("label[for="+full_conf.get("max-static")+"]").text()}</label>`;
                    num+=1;
                }
            }
            low_press_diff = -160;
            hi_press_diff = 1600;
            document.getElementById("range_warning1").innerHTML = low_press_diff.toLocaleString() + " ... " + hi_press_diff.toLocaleString() + " кПа и минимальная ширина " + min_range_diff + " кПа (перепад давления).";
        }
        if (full_conf.get("max-static")=="4" || full_conf.get("max-static")=="10"){//ЕСЛИ MAX-STATIC равно 4 или 10 - откл. фланец С
            for (let plmin of ["","minus-"]){
                $("label[for="+ plmin + "c-pr]").addClass('disabled');  ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ штуцера
                $("#" + plmin + "c-pr").prop('disabled', true);             //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ
                $("#" + plmin + "c-pr").prop("checked", false);
                document.getElementById("err_" + plmin + "c-pr").innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("max-static")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("max-static")}_err_cancel${num}'>${$("label[for="+full_conf.get("max-static")+"]").text()}</label>`;
                num+=1;
            }

        }
        if ($("input[name=max-static]:checked").length>0 && (full_conf.get("max-static")=="10")){/// ЕСЛИ MAX-STATIC равно 10  - деактивация непосредственного присоединения
            $("label[for=direct-cap-plus]").addClass('disabled');  ////ПОМЕЧАЕМ СЕРЫМ непосредственное присоединение
            $("#direct-cap-plus").prop('disabled', true);             //// ДЕАКТИВАЦИЯ непосредственных присоединений
            document.getElementById("err_direct-cap-plus").innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("max-static")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("max-static")}_err_cancel${num}'>${$("label[for="+full_conf.get("max-static")+"]").text()}</label>`;
            num+=1;
            $("label[for=direct-cap-minus]").addClass('disabled');  ////ПОМЕЧАЕМ СЕРЫМ непосредственное присоединение
            $("#direct-cap-minus").prop('disabled', true);             //// ДЕАКТИВАЦИЯ непосредственных присоединений
            document.getElementById("err_direct-cap-minus").innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("max-static")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("max-static")}_err_cancel${num}'>${$("label[for="+full_conf.get("max-static")+"]").text()}</label>`;
            num+=1;
            if (!$("#capillary-cap-plus").is(":checked")){$("#capillary-cap-plus").trigger("click");}
            if (!$("#capillary-cap-minus").is(":checked")){$("#capillary-cap-minus").trigger("click");}
            $("#capillary-cap-minus").prop('disabled', true);             //// ДЕАКТИВАЦИЯ капилляра (кнопки)
            $("#capillary-cap-plus").prop('disabled', true);             //// ДЕАКТИВАЦИЯ капилляра (кнопки)
        }

        if ($("input[name=max-static]:checked").length>0 && (parseInt(full_conf.get("max-static"))>25)){///ДЕАКТИВАЦИЯ TANTAL и HASTELLOY если MAX STATIC >25
            $("label[for=hastelloy]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ МАТЕРИАЛЫ
            $("#hastelloy").prop('disabled', true);             //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ MATERIAL
            $("label[for=tantal]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ МАТЕРИАЛЫ
            $("#tantal").prop('disabled', true);             //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ MATERIAL
            document.getElementById("err_hastelloy").innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("max-static")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("max-static")}_err_cancel${num}'>${$("label[for="+full_conf.get("max-static")+"]").text()}</label>`;
            document.getElementById("err_tantal").innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("max-static")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("max-static")}_err_cancel${num}'>${$("label[for="+full_conf.get("max-static")+"]").text()}</label>`;
            num+=2;
        }

        for (let con_type of connection_types){
            if (full_conf.has(con_type) && typeof full_conf.get(con_type)!='undefined'){// ОГРАНИЧИТЬ ДИАПАЗОН и МАТЕРИАЛ и ТЕМПЕРАТУРУ ЕСЛИ ВЫБРАНО ПРИСОЕДИНЕНИЕ THREAD или FLANGE или HYGIENIC
                if (typeof full_conf.get("cap-plus")!='undefined' && full_conf.get("cap-plus")=="capillary"){
                    min_range_diff = typeof window[con_type + "_restr_lst"].get(full_conf.get(con_type)).get("range_c") != 'undefined' ? window[con_type + "_restr_lst"].get(full_conf.get(con_type)).get("range_c") : window[con_type + "_restr_lst"].get(full_conf.get(con_type)).get("range");
                    // console.log("min_range capillary ", min_range);
                }
                if (typeof full_conf.get("cap-plus")!='undefined' && full_conf.get("cap-plus")=="direct"){
                    min_range_diff = typeof window[con_type + "_restr_lst"].get(full_conf.get(con_type)).get("range") != 'undefined' ? window[con_type + "_restr_lst"].get(full_conf.get(con_type)).get("range") : min_range;
                    // console.log("min_range direct ", min_range);
                }

                low_press_diff = -160;
                document.getElementById("range_warning1").innerHTML = low_press_diff.toLocaleString() + " ... " + hi_press_diff.toLocaleString() + " кПа и минимальная ширина " + min_range_diff + " кПа (перепад давления).";
                document.getElementById("range_warning2").innerHTML = "";

                $("input[name=material]").each(function() {
                    if (!window[con_type + "_restr_lst"].get(full_conf.get(con_type)).get("material").includes($(this).attr("id"))){
                        $("label[for="+$(this).attr("id")+"]").addClass('disabled');  ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ МАТЕРИАЛЫ
                        $(this).prop('disabled', true);                               //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ MATERIAL
                        document.getElementById("err_" + $(this).attr("id")).innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get(con_type)}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get(con_type)}_err_cancel${num}'>${$("label[for="+full_conf.get(con_type)+"]").text()}</label>`;
                        num+=1;
                    }
                })
                if (window[con_type + "_restr_lst"].get(full_conf.get(con_type)).has("cap-or-not") && window[con_type + "_restr_lst"].get(full_conf.get(con_type)).get("cap-or-not") == "direct"){//ОГРАНИЧЕНИЕ  cap-or-not для DIRECT ONLY
                    $("label[for=capillary-cap-plus]").addClass('disabled');  ////ПОМЕЧАЕМ СЕРЫМ capillary
                    $("#capillary-cap-plus").prop('disabled', true);          //// ДЕАКТИВАЦИЯ capillary
                    document.getElementById("err_capillary-cap-plus").innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get(con_type)}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get(con_type)}_err_cancel${num}'>${$("label[for="+full_conf.get(con_type)+"]").text()}</label>`;
                    num+=1;
                }

                let max_temp = window[con_type + "_restr_lst"].get(full_conf.get(con_type)).get("max_temp");
                if (typeof max_temp!='undefined' && !window[con_type + "_restr_lst"].has("radiator")){
                    $("input[name=cap-plus-mes-env-temp]").prop('max', max_temp);// ОГРАНИЧЕНИЕ ТЕМПЕРАТУРЫ для DIRECT для выбранного присоединения
                    $("input[name=cap-plus-mes-env-temp]").prop('placeholder', "-40..." + max_temp);
                    document.getElementById("cap-plus-radiator-select-err").innerHTML = "<br/><img src='images/attention.png' style='width: 1.3em; height: 1.3em'> Введите температуру от -40 до "+ max_temp + "°C и нажмите \"OK\"";
                }
            }

            if (full_conf.has("minus-" + con_type) && typeof full_conf.get("minus-" + con_type)!='undefined'){// ОГРАНИЧИТЬ ДИАПАЗОН и МАТЕРИАЛ и ТЕМПЕРАТУРУ ЕСЛИ ВЫБРАНО ПРИСОЕДИНЕНИЕ THREAD или FLANGE или HYGIENIC
                if (typeof full_conf.get("cap-minus")!='undefined' && full_conf.get("cap-minus")=="capillary"){
                    min_range_diff = typeof window[con_type + "_restr_lst"].get(full_conf.get("minus-" + con_type).slice(6,)).get("range_c") != 'undefined' ? window[con_type + "_restr_lst"].get(full_conf.get("minus-" + con_type).slice(6,)).get("range_c") : window[con_type + "_restr_lst"].get(full_conf.get("minus-" + con_type).slice(6,)).get("range");
                    console.log("min_range capillary ", min_range);
                }
                if (typeof full_conf.get("cap-minus")!='undefined' && full_conf.get("cap-minus")=="direct"){
                    min_range_diff = typeof window[con_type + "_restr_lst"].get(full_conf.get("minus-" + con_type).slice(6,)).get("range") != 'undefined' ? window[con_type + "_restr_lst"].get(full_conf.get("minus-" + con_type).slice(6,)).get("range") : min_range;
                    console.log("min_range direct ", min_range);
                }

                low_press_diff = -160;
                document.getElementById("range_warning1").innerHTML = low_press_diff.toLocaleString() + " ... " + hi_press_diff.toLocaleString() + " кПа и минимальная ширина " + min_range_diff + " кПа (перепад давления).";
                document.getElementById("range_warning2").innerHTML = "";

                $("input[name=material]").each(function() {
                    if (!window[con_type + "_restr_lst"].get(full_conf.get("minus-" + con_type).slice(6,)).get("material").includes($(this).attr("id"))){
                        $("label[for="+$(this).attr("id")+"]").addClass('disabled');  ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ МАТЕРИАЛЫ
                        $(this).prop('disabled', true);                               //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ MATERIAL
                        document.getElementById("err_" + $(this).attr("id")).innerHTML += `<input type='checkbox' name='err_cancel' value='' id='minus-${full_conf.get("minus-" + con_type).slice(6,)}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='minus-${full_conf.get("minus-" + con_type).slice(6,)}_err_cancel${num}'>${$("label[for="+full_conf.get("minus-" + con_type).slice(6,)+"]").text()}</label>`;
                        num+=1;
                    }
                })
                if (window[con_type + "_restr_lst"].get(full_conf.get("minus-" + con_type).slice(6,)).has("cap-or-not") && window[con_type + "_restr_lst"].get(full_conf.get("minus-" + con_type).slice(6,)).get("cap-or-not") == "direct"){//ОГРАНИЧЕНИЕ  cap-or-not для DIRECT ONLY
                    $("label[for=capillary-cap-minus]").addClass('disabled');  ////ПОМЕЧАЕМ СЕРЫМ capillary
                    $("#capillary-cap-minus").prop('disabled', true);          //// ДЕАКТИВАЦИЯ capillary
                    document.getElementById("err_capillary-cap-minus").innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("minus-" + con_type)}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("minus-" + con_type)}_err_cancel${num}'>${$("label[for="+full_conf.get("minus-" + con_type)+"]").text()}</label>`;
                    num+=1;
                }

                let max_temp = window[con_type + "_restr_lst"].get(full_conf.get("minus-" + con_type).slice(6,)).get("max_temp");
                if (typeof max_temp!='undefined' && !window[con_type + "_restr_lst"].has("radiator")){
                    $("input[name=cap-minus-mes-env-temp]").prop('max', max_temp);// ОГРАНИЧЕНИЕ ТЕМПЕРАТУРЫ для DIRECT для выбранного присоединения
                    $("input[name=cap-minus-mes-env-temp]").prop('placeholder', "-40..." + max_temp);
                    document.getElementById("cap-minus-radiator-select-err").innerHTML = "<br/><img src='images/attention.png' style='width: 1.3em; height: 1.3em'> Введите температуру от -40 до "+ max_temp + "°C и нажмите \"OK\"";
                }
            }

            for (let entr of window[con_type + "_restr_lst"].entries()){   // ДЕКАТИВАЦИЯ THREAD или FLANGE или HYGIENIC по ширине диапазона, КАПИЛЛЯРУ и МАТЕРИАЛУ и ТЕМПЕРАТУРЕ
                // console.log("max static kPa: "+ parseInt(full_conf.get("max-static"))*1000);
                if (typeof entr[1].get("range") !== 'undefined' && full_conf.get("range")<entr[1].get("range")){
                    $("label[for="+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ по ширине диапазона THREAD или FLANGE или HYGIENIC
                    $("#"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                    document.getElementById("err_"+entr[0]).innerHTML += `<input type='checkbox' name='range_err_cancel' value='' id='${full_conf.get(con_type)}_err_cancel${num}' checked class='custom-checkbox err-checkbox' onclick='uncheckRange()'><label for='${full_conf.get(con_type)}_err_cancel${num}'>Выбранный диапазон. Допустимая минимальная ширина ${entr[1].get("range")} кПа.</label>`;
                    num+=1;
                    $("label[for=minus-"+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ по ширине диапазона THREAD или FLANGE или HYGIENIC
                    $("#minus-"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                    if (typeof document.getElementById("err_minus-"+entr[0])!="undefined" && document.getElementById("err_minus-"+entr[0])!=null){
                        document.getElementById("err_minus-"+entr[0]).innerHTML += `<input type='checkbox' name='range_err_cancel' value='' id='${full_conf.get("minus-" + con_type)}_err_cancel${num}' checked class='custom-checkbox err-checkbox' onclick='uncheckRange()'><label for='${full_conf.get("minus-" + con_type)}_err_cancel${num}'>Выбранный диапазон. Допустимая минимальная ширина ${entr[1].get("range")} кПа.</label>`;
                        num+=1;
                    }
                }
                if (typeof full_conf.get("max-static")!='undefined' && parseInt(full_conf.get("max-static"))*1000>entr[1].get("end_range_kpa")){
                    $("label[for="+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ по MAX-STATIC THREAD или FLANGE или HYGIENIC
                    $("#"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                    document.getElementById("err_"+entr[0]).innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("max-static")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("max-static")}_err_cancel${num}'>${$("label[for="+full_conf.get("max-static")+"]").text()}</label>`;
                    num+=1;
                    $("label[for=minus-"+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ по MAX-STATIC THREAD или FLANGE или HYGIENIC
                    $("#minus-"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                    if (typeof document.getElementById("err_minus-"+entr[0])!="undefined" && document.getElementById("err_minus-"+entr[0])!=null){
                        document.getElementById("err_minus-"+entr[0]).innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("max-static")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("max-static")}_err_cancel${num}'>${$("label[for="+full_conf.get("max-static")+"]").text()}</label>`;
                        num+=1;
                    }
                }

                if (typeof full_conf.get("cap-plus") != 'undefined'){
                    if (typeof entr[1].get("cap-or-not") != 'undefined' && entr[1].get("cap-or-not") != full_conf.get("cap-plus")){
                        $("label[for="+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ с капилляром ВАРИАНТЫ THREAD или FLANGE или HYGIENIC
                        $("#"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                        document.getElementById("err_"+entr[0]).innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("cap-plus")}-cap-plus_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("cap-plus")}-cap-plus_err_cancel${num}'>${$("label[for="+full_conf.get("cap-plus")+"-cap-plus]").text()}</label>`;
                        num+=1;
                    }
                }
                if (typeof full_conf.get("cap-minus") != 'undefined'){
                    if (typeof entr[1].get("cap-or-not") != 'undefined' && entr[1].get("cap-or-not") != full_conf.get("cap-minus")){
                        $("label[for=minus-"+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ с капилляром ВАРИАНТЫ THREAD или FLANGE или HYGIENIC
                        $("#minus-"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                        if (typeof document.getElementById("err_minus-"+entr[0])!="undefined" && document.getElementById("err_minus-"+entr[0])!=null){
                            document.getElementById("err_minus-"+entr[0]).innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("cap-minus")}-cap-minus_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("cap-minus")}-cap-minus_err_cancel${num}'>${$("label[for="+full_conf.get("cap-minus")+"-cap-minus]").text()}</label>`;
                            num+=1;
                        }
                    }
                }
                if (full_conf.get("cap-plus") == 'direct' && full_conf.has("max_temp_plus") && !Number.isNaN(full_conf.get("max_temp_plus"))){  //// ДЕАКТИВАЦИЯ DIRECT ПРИСОЕДИНЕНИЙ по ВЫБРАННОЙ ТЕМПЕРАТУРЕ
                    if (entr[1].get("max_temp") !== 'undefined' && entr[1].get("max_temp") < full_conf.get("max_temp_plus")){
                        $("label[for="+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ ПО ТЕМПЕРАТУРЕ ВАРИАНТЫ THREAD или FLANGE или HYGIENIC
                        $("#"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                        document.getElementById("err_"+entr[0]).innerHTML += `<input type='checkbox' name='max_temp_err_cancel' value='' id='${full_conf.get("max_temp_plus")}_err_cancel${num}' checked class='custom-checkbox err-checkbox' onclick='uncheckMaxTemp("cap-plus")'><label for='${full_conf.get("max_temp_plus")}_err_cancel${num}'>Выбрана температура ${full_conf.get("max_temp_plus")}°C. Допуcкается до ${entr[1].get("max_temp")}°С</label>`;
                        num+=1;
                    }
                }
                if (full_conf.get("cap-minus") == 'direct' && full_conf.has("max_temp_minus") && !Number.isNaN(full_conf.get("max_temp_minus"))){  //// ДЕАКТИВАЦИЯ DIRECT ПРИСОЕДИНЕНИЙ по ВЫБРАННОЙ ТЕМПЕРАТУРЕ
                    if (entr[1].get("max_temp") !== 'undefined' && entr[1].get("max_temp") < full_conf.get("max_temp_minus")){
                        $("label[for=minus-"+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ ПО ТЕМПЕРАТУРЕ ВАРИАНТЫ THREAD или FLANGE или HYGIENIC
                        $("#minus-"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                        if (typeof document.getElementById("err_minus-"+entr[0])!="undefined" && document.getElementById("err_minus-"+entr[0])!=null){
                            document.getElementById("err_minus-"+entr[0]).innerHTML += `<input type='checkbox' name='max_temp_err_cancel' value='' id='${full_conf.get("max_temp_minus")}_err_cancel${num}' checked class='custom-checkbox err-checkbox' onclick='uncheckMaxTemp("cap-minus")'><label for='${full_conf.get("max_temp_minus")}_err_cancel${num}'>Выбрана температура ${full_conf.get("max_temp_minus")}°C. Допуcкается до ${entr[1].get("max_temp")}°С</label>`;
                            num+=1;
                        }
                    }
                }
                // if (typeof full_conf.get("range")!=='undefined' && full_conf.get("cap-plus") == 'direct'){
                //     // console.log("name: ", entr[0], "range: ", entr[1].get("range"), "begin_range_kpa: ", entr[1].get("begin_range_kpa"), "end_range_kpa: ", entr[1].get("end_range_kpa"));
                //     if (typeof entr[1].get("range") !== 'undefined' && full_conf.get("range")<entr[1].get("range")){
                //         $("label[for="+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ по давлению БЕЗ КАПИЛЛЯРА ВАРИАНТЫ THREAD или FLANGE или HYGIENIC
                //         $("#"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                //         if (typeof document.getElementById("err_"+entr[0])!="undefined" && document.getElementById("err_minus-"+entr[0])!=null){
                //             document.getElementById("err_"+entr[0]).innerHTML += `<input type='checkbox' name='range_err_cancel' value='' id='${full_conf.get(con_type)}_err_cancel${num}' checked class='custom-checkbox err-checkbox' onclick='uncheckRange()'><label for='${full_conf.get(con_type)}_err_cancel${num}'>Выбранный диапазон. Минимальная ширина для непосредственного соединения ${entr[1].get("range")} кПа.</label>`;
                //             num+=1;
                //         }
                //     }
                // }
                // if (typeof full_conf.get("range")!=='undefined' && full_conf.get("cap-minus") == 'direct'){
                //     // console.log("name: ", entr[0], "range: ", entr[1].get("range"), "begin_range_kpa: ", entr[1].get("begin_range_kpa"), "end_range_kpa: ", entr[1].get("end_range_kpa"));
                //     if (typeof entr[1].get("range") !== 'undefined' && full_conf.get("range")<entr[1].get("range")){
                //         $("label[for=minus-"+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ по давлению БЕЗ КАПИЛЛЯРА ВАРИАНТЫ THREAD или FLANGE или HYGIENIC
                //         $("#minus-"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                //         if (typeof document.getElementById("err_minus-"+entr[0])!="undefined" && document.getElementById("err_minus-"+entr[0])!=null){
                //             document.getElementById("err_minus-"+entr[0]).innerHTML += `<input type='checkbox' name='range_err_cancel' value='' id='${full_conf.get(con_type)}_err_cancel${num}' checked class='custom-checkbox err-checkbox' onclick='uncheckRange()'><label for='${full_conf.get(con_type)}_err_cancel${num}'>Выбранный диапазон. Минимальная ширина для непосредственного соединения ${entr[1].get("range")} кПа.</label>`;
                //             num+=1;
                //         }
                //     }
                // }
                // if (typeof full_conf.get("range")!=='undefined' && full_conf.get("cap-plus") == 'capillary'){
                //     // console.log("name: ", entr[0], "range: ", entr[1].get("range"), "begin_range_kpa: ", entr[1].get("begin_range_kpa"), "end_range_kpa: ", entr[1].get("end_range_kpa"));
                //     if (typeof entr[1].get("range_c") !== 'undefined' && full_conf.get("range")<entr[1].get("range_c")){
                //         $("label[for="+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ по давлению  С КАПИЛЛЯРОМ ВАРИАНТЫ THREAD или FLANGE или HYGIENIC
                //         $("#"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                //     }
                // }
                // if (typeof full_conf.get("range")!=='undefined' && full_conf.get("cap-minus") == 'capillary'){
                //     // console.log("name: ", entr[0], "range: ", entr[1].get("range"), "begin_range_kpa: ", entr[1].get("begin_range_kpa"), "end_range_kpa: ", entr[1].get("end_range_kpa"));
                //     if (typeof entr[1].get("range") !== 'undefined' && full_conf.get("range")<entr[1].get("range")){
                //         $("label[for=minus-"+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ по давлению  С КАПИЛЛЯРОМ ВАРИАНТЫ THREAD или FLANGE или HYGIENIC
                //         $("#minus-"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                //     }
                // }
                if (typeof full_conf.get("material")!=='undefined'){
                    if (typeof entr[1].get("material")!='undefined' && !entr[1].get("material").includes(full_conf.get("material"))){
                        $("label[for="+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ по материалу ВАРИАНТЫ THREAD или FLANGE или HYGIENIC
                        $("#"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                        document.getElementById("err_" +entr[0]).innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("material")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("material")}_err_cancel${num}'>${$("label[for="+full_conf.get("material")+"]").text()}</label>`;
                        num+=1;
                        $("label[for=minus-"+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ по материалу ВАРИАНТЫ THREAD или FLANGE или HYGIENIC
                        $("#minus-"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                        if (typeof document.getElementById("err_minus-"+entr[0])!="undefined" && document.getElementById("err_minus-"+entr[0])!=null){
                            document.getElementById("err_minus-" +entr[0]).innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("material")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("material")}_err_cancel${num}'>${$("label[for="+full_conf.get("material")+"]").text()}</label>`;
                            num+=1;
                        }
                    }
                }
            }
        }
    }
    if (full_conf.get("main_dev")=="ctr"){  /// ПРОВЕРКА опций CTR

        if ($("input[name=ctr-electrical]:checked").length==0){
            $('.head-nohead-cabel').hide(0);
        }


        let  tlchecked = $("#thermocouple-list").is(":checked") ? 1 : 0;
        let  exchecked = $("#Ex").is(":checked") ? 1 : 0;
        let  checked4_20 = $("#4_20").is(":checked") ? 1 : 0;
        if ( tlchecked + exchecked + checked4_20 == 2 ){//// ОТКЛЮЧИТЬ ОДНОВРЕМЕННЫЙ ВЫБОР ТЕРМОПАРЫ, Ex и 4..20
            let arr_tec = [];
            for (let ids of ["thermocouple-list", "Ex", "4_20"]){
                if ($("#" + ids).is(":checked")){
                    arr_tec.push(ids);
                }
            }
            for (let ids of ["thermocouple-list", "Ex", "4_20"]){
                if (!$("#" + ids).is(":checked")) {
                    $("label[for="+ ids +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЙ
                    $("#" + ids).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНОГО
                    for (let el of arr_tec){
                        document.getElementById("err_" + ids).innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${el}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${el}_err_cancel${num}'>${$("label[for="+el+"]").text()}</label>`;
                        num+=1;
                    }
                }
            }
        }

        let nohdchecked = ($("#nohead-list").is(":checked") || $("#cabel-list").is(":checked")) ? 1 : 0;
        let transdchecked = ($("#4_20").is(":checked") || $("#4_20H").is(":checked")) ? 1 : 0;
        if ( tlchecked + nohdchecked + transdchecked == 2 ){//// ОТКЛЮЧИТЬ ОДНОВРЕМЕННЫЙ ВЫБОР ТЕРМОПАРЫ, БЕЗ ГОЛОВЫ и С ПРЕОБРАЗОВАТЕЛЕМ
            let arr_tnt = [];
            for (let ids of ["thermocouple-list", "nohead-list", "cabel-list", "4_20", "4_20H"]){
                if ($("#" + ids).is(":checked")){
                    arr_tnt.push(ids);
                }
            }
            for (let ids of ["thermocouple-list", "nohead-list", "cabel-list", "4_20", "4_20H"]){
                if (!$("#" + ids).is(":checked")) {
                    $("label[for="+ ids +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЙ
                    $("#" + ids).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНОГО
                    for (let el of arr_tnt){
                        if (el!="4_20H" && el!="nohead-list"){
                            document.getElementById("err_" + ids).innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${el}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${el}_err_cancel${num}'>${$("label[for="+el+"]").text()}</label>`;
                            num+=1;
                        }
                    }
                }
            }
        }


        if (typeof full_conf.get("approval")!=='undefined' && full_conf.get("approval")=="Exd"){ /// Если  Exd оставляем только DAO и ALW и температура до 450
            for (let entr of ["ctr-NA", "ctr-DA", "ctr-PZ", "nohead-list", "cabel-list"]){
                $("label[for="+ entr +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ в Exd типы температур
                $("#"+entr).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ Exd головки ЧЕКБОКСОВ
                document.getElementById("err_" +entr).innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("approval")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("approval")}_err_cancel${num}'>${$("label[for="+full_conf.get("approval")+"]").text()}</label>`;
                num+=1;
            }
            $("#cabel-select").prop("style", "display:none");
            $("#ctr-cabel-type-select-div").prop("style", "display:none");
            ctr_high_temp = 450 < ctr_high_temp ? 450 : ctr_high_temp;
            $("input[name=ctr-begin-range]").prop('min', ctr_low_temp).prop('max', ctr_high_temp);
            $("input[name=ctr-end-range]").prop('min', ctr_low_temp).prop('max', ctr_high_temp);
            document.getElementById("ctr-range_warning").innerHTML = `<img src='images/attention.png' style='width: 1.3em; height: 1.3em'> <span style='color:red'>Выберите диапазон от ${ctr_low_temp} до ${ctr_high_temp}°C</span>`;
            document.getElementById("err_ctr-range").innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("approval")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("approval")}_err_cancel${num}'>${$("label[for="+full_conf.get("approval")+"]").text()} (до 450°С)</label>`;
            num+=1;
        }
        if (typeof full_conf.get("output")!=="undefined" && full_conf.get("output")!=="4_20H"){ // ЕСЛИ не 4_20H - деакт ALW
            for (let entr of ["ctr-ALW"]){
                $("label[for="+ entr +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ
                $("#"+entr).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ
                document.getElementById("err_" +entr).innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("output")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("output")}_err_cancel${num}'>${$("label[for="+full_conf.get("output")+"]").text()}</label>`;
                num+=1;
            }
        }
        if (typeof full_conf.get("output")!=="undefined" && full_conf.get("output")!="no_trand"){ // ЕСЛИ с преобразователем - деакт кабельные
            for (let entr of ["cabel-list"]){
                $("label[for="+ entr +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ
                $("#"+entr).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ
                document.getElementById("err_" +entr).innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("output")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("output")}_err_cancel${num}'>${$("label[for="+full_conf.get("output")+"]").text()}</label>`;
                num+=1;
            }
            $("#cabel-select").prop("style", "display:none");
            $("#ctr-cabel-type-select-div").prop("style", "display:none");
            if (full_conf.get("output")=="4_20H"){  ////если HART - деактивировать без головы (раъемы)
                $("label[for=nohead-list]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ
                $("#nohead-list").prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ
                document.getElementById("err_nohead-list").innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("output")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("output")}_err_cancel${num}'>${$("label[for="+full_conf.get("output")+"]").text()}</label>`;
                num+=1;
            }
        }
        if (full_conf.has("cabel")){ // ЕСЛИ кабельное - деакт 4_20, 4_20H, Exd
            for (let entr of ["4_20", "4_20H", "Exd"]){
                $("label[for="+ entr +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ
                $("#"+entr).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ
                document.getElementById("err_" +entr).innerHTML += `<input type='checkbox' name='err_cancel' value='' id='cabel-list_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='cabel-list_err_cancel${num}'>${$("label[for=cabel-list]").text()}</label>`;
                num+=1;
            }
        }
        if (full_conf.has("nohead")){ // ДЕАКТИВАЦИЯ Exd и 4_20H для NoHead
            $("label[for=Exd]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ
            $("#Exd").prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ
            document.getElementById("err_Exd").innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("ctr-electrical")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("ctr-electrical")}_err_cancel${num}'>${$("label[for="+full_conf.get("ctr-electrical")+"]").text()}</label>`;
            num+=1;
            $("label[for=4_20H]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ
            $("#4_20H").prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ
            document.getElementById("err_4_20H").innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("ctr-electrical")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("ctr-electrical")}_err_cancel${num}'>${$("label[for="+full_conf.get("ctr-electrical")+"]").text()}</label>`;
            num+=1;
        }
        if (typeof full_conf.get("head")!="undefined" && full_conf.get("head")!="ctr-DAO" && full_conf.get("head")!="ctr-ALW"){///ДЕАКТИВИРОВАТЬ EXD ЕСЛИ ГОЛОВКА НЕ Exd
            $("label[for=Exd]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ
            $("#Exd").prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ
            document.getElementById("err_Exd").innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("head")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("head")}_err_cancel${num}'>${$("label[for="+full_conf.get("head")+"]").text()}</label>`;
            num+=1;
        }
        if (typeof full_conf.get("head")!=="undefined" && full_conf.get("head")=="ctr-ALW"){ // ЕСЛИ ALW - только 4-20H
            for (let entr of ["4_20", "no_trand"]){
                $("label[for="+ entr +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ
                $("#"+entr).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ
                document.getElementById("err_" +entr).innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("head")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("head")}_err_cancel${num}'>${$("label[for="+full_conf.get("head")+"]").text()}</label>`;
                num+=1;
            }
        }
        for (let sensor of ["thermoresistor", "thermocouple"]){
            if (full_conf.has(sensor) && typeof full_conf.get(sensor)!='undefined'){// ОГРАНИЧИТЬ ДИАПАЗОН ТЕМПЕРАТУР ЕСЛИ ВЫБРАНО thermoresistor, thermocouple
                if (full_conf.has("thermocouple")){
                    ctr_low_temp = window[sensor + "_restr_lst"].get(full_conf.get(sensor)).get("begin_range") > ctr_low_temp ? window[sensor + "_restr_lst"].get(full_conf.get(sensor)).get("begin_range") : ctr_low_temp;
                    ctr_high_temp = window[sensor + "_restr_lst"].get(full_conf.get(sensor)).get("end_range") < ctr_high_temp ? window[sensor + "_restr_lst"].get(full_conf.get(sensor)).get("end_range") : ctr_high_temp;
                    $("input[name=ctr-begin-range]").prop('min', ctr_low_temp).prop('max', ctr_high_temp);
                    $("input[name=ctr-end-range]").prop('min', ctr_low_temp).prop('max', ctr_high_temp);
                    document.getElementById("ctr-range_warning").innerHTML = `<img src='images/attention.png' style='width: 1.3em; height: 1.3em'> <span style='color:red'>Выберите диапазон от ${ctr_low_temp} до ${ctr_high_temp}°C</span>`;
                    document.getElementById("err_ctr-range").innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("thermocouple")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("thermocouple")}_err_cancel${num}'>${$("label[for="+full_conf.get("thermocouple")+"]").text()} (${window[sensor + "_restr_lst"].get(full_conf.get(sensor)).get("begin_range")}...${window[sensor + "_restr_lst"].get(full_conf.get(sensor)).get("end_range")}°C)</label>`;
                    num+=1;
                }
                if (full_conf.has("thermoresistor")){
                    if (typeof full_conf.get("sensor_accuracy_tr")==="undefined"){
                        ctr_low_temp = window[sensor + "_restr_lst"].get(full_conf.get(sensor)).get("begin_range_c") > ctr_low_temp ? window[sensor + "_restr_lst"].get(full_conf.get(sensor)).get("begin_range_c") : ctr_low_temp;
                        ctr_high_temp = window[sensor + "_restr_lst"].get(full_conf.get(sensor)).get("end_range_c") < ctr_high_temp ? window[sensor + "_restr_lst"].get(full_conf.get(sensor)).get("end_range_c") : ctr_high_temp;
                        $("input[name=ctr-begin-range]").prop('min', ctr_low_temp).prop('max', ctr_high_temp);
                        $("input[name=ctr-end-range]").prop('min', ctr_low_temp).prop('max', ctr_high_temp);
                        document.getElementById("ctr-range_warning").innerHTML = `<img src='images/attention.png' style='width: 1.3em; height: 1.3em'> <span style='color:red'>Выберите диапазон от ${ctr_low_temp} до ${ctr_high_temp}°C</span>`;
                        document.getElementById("err_ctr-range").innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("thermoresistor")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("thermoresistor")}_err_cancel${num}'>${$("label[for="+full_conf.get("thermoresistor")+"]").text()} (${window[sensor + "_restr_lst"].get(full_conf.get(sensor)).get("begin_range_c")}...${window[sensor + "_restr_lst"].get(full_conf.get(sensor)).get("end_range_c")}°C)</label>`;
                        num+=1;
                    }else{
                        ctr_low_temp = window[sensor + "_restr_lst"].get(full_conf.get(sensor)).get("begin_range_"+ full_conf.get("sensor_accuracy_tr").toLowerCase()) > ctr_low_temp ? window[sensor + "_restr_lst"].get(full_conf.get(sensor)).get("begin_range_"+ full_conf.get("sensor_accuracy_tr").toLowerCase()) : ctr_low_temp;
                        ctr_high_temp = window[sensor + "_restr_lst"].get(full_conf.get(sensor)).get("end_range_"+ full_conf.get("sensor_accuracy_tr").toLowerCase()) < ctr_high_temp ? window[sensor + "_restr_lst"].get(full_conf.get(sensor)).get("end_range_"+ full_conf.get("sensor_accuracy_tr").toLowerCase()) : ctr_high_temp;
                        $("input[name=ctr-begin-range]").prop('min', ctr_low_temp).prop('max', ctr_high_temp);
                        $("input[name=ctr-end-range]").prop('min', ctr_low_temp).prop('max', ctr_high_temp);
                        document.getElementById("ctr-range_warning").innerHTML = `<img src='images/attention.png' style='width: 1.3em; height: 1.3em'> <span style='color:red'>Выберите диапазон от ${ctr_low_temp} до ${ctr_high_temp}°C</span>`;
                        document.getElementById("err_ctr-range").innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("thermoresistor")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("thermoresistor")}_err_cancel${num}'>${$("label[for="+full_conf.get("thermoresistor")+"]").text()} (${window[sensor + "_restr_lst"].get(full_conf.get(sensor)).get("begin_range_"+ full_conf.get("sensor_accuracy_tr").toLowerCase())}...${window[sensor + "_restr_lst"].get(full_conf.get(sensor)).get("end_range_"+ full_conf.get("sensor_accuracy_tr").toLowerCase())}°C для класса ${full_conf.get("sensor_accuracy_tr")})</label>`;
                        num+=1;
                    }
                }
                $("input[name=material]").each(function() { //// ДЛЯ ВЫБРАННОГО СЕНСОРА thermoresistor, thermocouple ПОМЕЧАЕМ НЕДОСТУПНЫЕ МАТЕРИАЛЫ
                    if (typeof window[sensor + "_restr_lst"].get(full_conf.get(sensor)).get("material")!="undefined" && !window[sensor + "_restr_lst"].get(full_conf.get(sensor)).get("material").includes($(this).attr("id"))){
                        $("label[for="+$(this).attr("id")+"]").addClass('disabled');  ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ МАТЕРИАЛЫ
                        $(this).prop('disabled', true);                               //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ MATERIAL
                        document.getElementById("err_" + $(this).attr("id")).innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get(sensor)}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get(sensor)}_err_cancel${num}'>${$("label[for="+full_conf.get(sensor)+"]").text()}</label>`;
                        num+=1;
                    }
                })
            }
        }
        if (full_conf.has("thermocouple") && typeof full_conf.get("thermocouple")!='undefined'){ ///ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ КЛАССОВ ТОЧНОСТИ ТЕРМОПАР
            let classes_arr = window["thermocouple_restr_lst"].get(full_conf.get("thermocouple")).get("class");
            $("#sensor-accuracy-tc option").each(function(){
                if ($(this).val()!='not_selected'){
                    if (!(classes_arr.includes(parseInt($(this).val())))){
                        $(this).attr('disabled', 'disabled');
                        $(this).prop('selected', false);
                    }
                }
            })
        }
        if (full_conf.has("material") && typeof full_conf.get("material")!='undefined'){//// ОГРАНИЧЕНИЕ end-range и ДЕАКТИВАЦИЯ СЕНСОРОВ ЕСЛИ ВЫБРАНО material
            ctr_high_temp = window["material_restr_lst"].get(full_conf.get("material")).get("end_range") < ctr_high_temp ? window["material_restr_lst"].get(full_conf.get("material")).get("end_range") : ctr_high_temp;
            $("input[name=ctr-end-range]").prop('min', ctr_low_temp).prop('max', ctr_high_temp);
            document.getElementById("ctr-range_warning").innerHTML = `<img src='images/attention.png' style='width: 1.3em; height: 1.3em'> <span style='color:red'>Выберите диапазон от ${ctr_low_temp} до ${ctr_high_temp}°C</span>`;
            document.getElementById("err_ctr-range").innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("material")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("material")}_err_cancel${num}'>${$("label[for="+full_conf.get("material")+"]").text()} (до ${window["material_restr_lst"].get(full_conf.get("material")).get("end_range")}°C)</label>`;
            num+=1;
            for (let sensor of ["thermoresistor", "thermocouple"]){
                for (let entr of window[sensor + "_restr_lst"].entries()){
                    if (typeof full_conf.get("material")!=='undefined'){
                        if (typeof entr[1].get("material")!='undefined' && !entr[1].get("material").includes(full_conf.get("material"))){
                            $("label[for="+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ СЕНОСОРЫ по материалу
                            $("#"+entr[0]).prop('disabled', true);                  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ
                            document.getElementById("err_" +entr[0]).innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("material")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("material")}_err_cancel${num}'>${$("label[for="+full_conf.get("material")+"]").text()}</label>`;
                            num+=1;
                        }
                    }
                }
            }
        }

        for (let entr of window["thermocouple_restr_lst"].entries()){   // ДЕКАТИВАЦИЯ  thermocouple по  ТЕМПЕРАТУРЕ
            if ((typeof entr[1].get("begin_range") !== 'undefined' && full_conf.get("ctr_begin_range")<entr[1].get("begin_range")) || (typeof entr[1].get("end_range") !== 'undefined' && full_conf.get("ctr_end_range")>entr[1].get("end_range"))){
                $("label[for="+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ  thermocouple
                $("#"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ thermocouple по  ТЕМПЕРАТУРЕ
                document.getElementById("err_"+entr[0]).innerHTML += `<input type='checkbox' name='range_err_cancel' value='' id='${full_conf.get("thermocouple")}_err_cancel${num}' checked class='custom-checkbox err-checkbox' onclick='uncheckCTRRange()'><label for='${full_conf.get("thermocouple")}_err_cancel${num}'>Температура. Допускается ${entr[1].get("begin_range")}...${entr[1].get("end_range")}°C.</label>`;
                num+=1;
            }
        }

        for (let entr of window["thermoresistor_restr_lst"].entries()){   // ДЕКАТИВАЦИЯ  THERMORESISTOR по  ТЕМПЕРАТУРЕ
            if (typeof full_conf.get("sensor_accuracy_tr")==="undefined"){
                if ((typeof entr[1].get("begin_range_c") !== 'undefined' && full_conf.get("ctr_begin_range")<entr[1].get("begin_range_c")) || (typeof entr[1].get("end_range_c") !== 'undefined' && full_conf.get("ctr_end_range")>entr[1].get("end_range_c"))){
                    $("label[for="+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ THERMORESISTOR
                    $("#"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THERMORESISTOR по  ТЕМПЕРАТУРЕ
                    document.getElementById("err_"+entr[0]).innerHTML += `<input type='checkbox' name='range_err_cancel' value='' id='${full_conf.get("thermoresistor")}_err_cancel${num}' checked class='custom-checkbox err-checkbox' onclick='uncheckCTRRange()'><label for='${full_conf.get("thermoresistor")}_err_cancel${num}'>Температура. Допускается ${entr[1].get("begin_range_c")}...${entr[1].get("end_range_c")}°C.</label>`;
                    num+=1;
                }
            }else{
                if ((typeof entr[1].get("begin_range_"+ full_conf.get("sensor_accuracy_tr").toLowerCase()) !== 'undefined' && full_conf.get("ctr_begin_range")<entr[1].get("begin_range_"+ full_conf.get("sensor_accuracy_tr").toLowerCase())) || (typeof entr[1].get("end_range_"+ full_conf.get("sensor_accuracy_tr").toLowerCase()) !== 'undefined' && full_conf.get("ctr_end_range")>entr[1].get("end_range_"+ full_conf.get("sensor_accuracy_tr").toLowerCase()))){
                    $("label[for="+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ THERMORESISTOR
                    $("#"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THERMORESISTOR по  ТЕМПЕРАТУРЕ
                    document.getElementById("err_"+entr[0]).innerHTML += `<input type='checkbox' name='range_err_cancel' value='' id='${full_conf.get("thermoresistor")}_err_cancel${num}' checked class='custom-checkbox err-checkbox' onclick='uncheckCTRRange()'><label for='${full_conf.get("thermoresistor")}_err_cancel${num}'>Температура. Допускается ${entr[1].get("begin_range_"+ full_conf.get("sensor_accuracy_tr").toLowerCase())}...${entr[1].get("end_range_"+ full_conf.get("sensor_accuracy_tr").toLowerCase())}°C.</label>`;
                    num+=1;
                }
            }
        }

        for (let entr of window["material_restr_lst"].entries()){   // ДЕКАТИВАЦИЯ material по ТЕМПЕРАТУРЕ
            if (typeof entr[1].get("end_range") !== 'undefined' && full_conf.get("ctr_end_range")>entr[1].get("end_range")){
                $("label[for="+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ по ТЕМПЕРАТУРЕ material
                $("#"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ material
                document.getElementById("err_"+entr[0]).innerHTML += `<input type='checkbox' name='range_err_cancel' value='' id='${full_conf.get("end_range")}_err_cancel${num}' checked class='custom-checkbox err-checkbox' onclick='uncheckCTRRange()'><label for='${full_conf.get("end_range")}_err_cancel${num}'>Температура. Допускается до ${entr[1].get("end_range")}°C.</label>`;
                num+=1;
            }
        }

        for (let entr of window["cabel_restr_lst"].entries()){   // ДЕКАТИВАЦИЯ cabel по ТЕМПЕРАТУРЕ
            if (typeof entr[1].get("end_range") !== 'undefined' && full_conf.get("ctr_end_range")>entr[1].get("end_range")){
                $("label[for="+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ по ТЕМПЕРАТУРЕ cabel
                $("#"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ cabel
                document.getElementById("err_"+entr[0]).innerHTML += `<input type='checkbox' name='range_err_cancel' value='' id='${full_conf.get("end_range")}_err_cancel${num}' checked class='custom-checkbox err-checkbox' onclick='uncheckCTRRange()'><label for='${full_conf.get("end_range")}_err_cancel${num}'>Температура. Допускается до ${entr[1].get("end_range")}°C.</label>`;
                num+=1;
            }
        }

        if (typeof full_conf.get("ctr_end_range")!='undefined' && full_conf.get("ctr_end_range")>450){///ДЕАКТИВАЦИЯ Exd для темп >450
            $("label[for=Exd]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЙ Exd
            $("#Exd").prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ Exd
            document.getElementById("err_Exd").innerHTML += `<input type='checkbox' name='range_err_cancel' value='' id='${full_conf.get("ctr_end_range")}_err_cancel${num}' checked class='custom-checkbox err-checkbox' onclick='uncheckCTRRange()'><label for='${full_conf.get("ctr_end_range")}_err_cancel${num}'>Температура. Допускается до 450°C.</label>`;
            num+=1;
        }

        if (typeof full_conf.get("ctr-electrical")==="undefined" || (typeof full_conf.get("ctr-electrical")!="undefined" && full_conf.has("head")  && typeof full_conf.get("head")==="undefined") || (typeof full_conf.get("head")!="undefined" && full_conf.get("head")!="ctr-ALW")){// ОТКЛ 3мм для исполнения HEAD кроме CTR-ALW
            if ((!full_conf.has("thermoresistor") && !full_conf.has("thermocouple")) || (full_conf.has("thermocouple") && typeof full_conf.get("thermocouple")==="undefined") || (typeof full_conf.get("thermocouple")!="undefined" && full_conf.get("thermocouple")!="tha" && full_conf.get("thermocouple")!="tzk") || (full_conf.has("thermoresistor") && full_conf.get("sensor_quantity")=="2")){
                console.log("ОТКЛ 3мм");
                $("#ctr-diameter option[value=3]").attr('disabled', 'disabled').prop("selected", false);
            }
        }

        if (full_conf.get("approval")=="Exd" && full_conf.get("head")=="ctr-DAO"){///ОТКЛ ДИАМЕТР 3,8 для DAO/Exd
            $("#ctr-diameter option[value=3]").attr('disabled', 'disabled');
            $("#ctr-diameter option[value=8]").attr('disabled', 'disabled');
        }

        if (typeof full_conf.get("sensor_quantity")!="undefined" && full_conf.get("sensor_quantity")=="2"){//деактивация ALW для 2-х сенсоров
            $("label[for=ctr-ALW]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ ctr-ALW
            $("#ctr-ALW").prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ctr-ALW
            document.getElementById("err_ctr-ALW").innerHTML += `<input type='checkbox' name='alw_2sens_err_cancel' value='' id='${full_conf.get("sensor_quantity")}_err_cancel${num}' checked class='custom-checkbox err-checkbox' onclick='changeSensorQuantity()'><label for='${full_conf.get("sensor_quantity")}_err_cancel${num}'>Количество сенсоров: 2.</label>`;
            num+=1;
        }

        if (typeof full_conf.get("sensor_quantity")!="undefined" && full_conf.get("sensor_quantity")=="2"){//деактивация 4..20мА для 2-х сенсоров
            $("label[for=4_20]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ ctr-ALW
            $("#4_20").prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ctr-ALW
            document.getElementById("err_4_20").innerHTML += `<input type='checkbox' name='alw_2sens_err_cancel' value='' id='${full_conf.get("sensor_quantity")}_err_cancel${num}' checked class='custom-checkbox err-checkbox' onclick='changeSensorQuantity()'><label for='${full_conf.get("sensor_quantity")}_err_cancel${num}'>Количество сенсоров: 2.</label>`;
            num+=1;
        }

        if (typeof full_conf.get("material")!="undefined" && full_conf.get("material")!="aisi316" && full_conf.get("material")!="inconel"){//деактивация ALW для НЕПОДХОДЯЩИХ МАТЕРИАЛОВ
            $("label[for=ctr-ALW]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ ctr-ALW
            $("#ctr-ALW").prop('disabled', true).prop("checked", false);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ctr-ALW
            document.getElementById("err_ctr-ALW").innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("material")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("material")}_err_cancel${num}'>${$("label[for="+full_conf.get("material")+"]").text()}</label>`;
            num+=1;
        }

        if (typeof full_conf.get("material")!="undefined" && (full_conf.get("material")=="sialon" || full_conf.get("material")=="ceramic")){//ЕСЛИ СИАЛОН КОРУНД - оставить только DA
            for (let els of ["nohead-list", "cabel-list", "ctr-NA", "ctr-DAO", "ctr-PZ"]){
                $("label[for=" + els + "]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ
                $("#" + els).prop('disabled', true).prop("checked", false);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ
                document.getElementById("err_" + els).innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("material")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("material")}_err_cancel${num}'>${$("label[for="+full_conf.get("material")+"]").text()}</label>`;
                num+=1;
            }
        }

        if (typeof full_conf.get("sensor-type")!="undefined"){ //деактивация ALW если не PT100 и не терм K
            let sens_typ = full_conf.get("sensor-type").slice(0,-5);
            if (typeof full_conf.get(sens_typ)!="undefined" && (full_conf.get(sens_typ)!="tha" && full_conf.get(sens_typ)!="pt100")){
                $("label[for=ctr-ALW]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ ctr-ALW
                $("#ctr-ALW").prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ctr-ALW
                document.getElementById("err_ctr-ALW").innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get(sens_typ)}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get(sens_typ)}_err_cancel${num}'>${$("label[for="+full_conf.get(sens_typ)+"]").text()}</label>`;
                num+=1;
            }
        }

        if (typeof full_conf.get("head")!="undefined" && full_conf.get("head")=="ctr-ALW"){// ОТКЛ 2 сенсора и классы В, С для CTR-ALW
            $("#sensor-quantity option[value=2]").prop('selected', false).attr('disabled', 'disabled');
            $("#sensor-accuracy-tr option[value=B]").prop('selected', false).attr('disabled', 'disabled');
            $("#sensor-accuracy-tr option[value=C]").prop('selected', false).attr('disabled', 'disabled');
            $("#sensor-accuracy-tc option[value=2]").prop('selected', false).attr('disabled', 'disabled');
            $("#sensor-accuracy-tc option[value=3]").prop('selected', false).attr('disabled', 'disabled');
        }

        if (typeof full_conf.get("output")!="undefined" && full_conf.get("output")=="4_20"){// ОТКЛ 2 сенсора  для 4..20мА
            $("#sensor-quantity option[value=2]").prop('selected', false).attr('disabled', 'disabled');
        }


        if ($("#sensor-quantity").val()=="2"){/// ОТКЛЮЧАЕМ 4-провода для двух сенсоров
            if ($("#sensor-wiring-tr").val()=="4"){
                $("#sensor-wiring-tr option[value='not_selected']").prop('selected', true);
            }
            $("#sensor-wiring-tr option[value=4]").attr('disabled', 'disabled');
        }
        if ($("#sensor-wiring-tr").val()=="4"){// ОТКЛЮЧАЕМ 2 сенсора для 4-х проводов
            if ($("#sensor-quantity").val()=="2"){
                $("#sensor-quantity option[value='not_selected']").prop('selected', true);
            }
            $("#sensor-quantity option[value=2]").attr('disabled', 'disabled');
        }
        if ($("select#sensor-accuracy-tr option:selected").val()=="A"){/// ОТКЛЮЧАЕМ 2-провода для класса A
            if ($("select#sensor-wiring-tr option:selected").val()=="2"){
                $("select#sensor-wiring-tr option[value='not_selected']").prop('selected', true);
            }
            $("select#sensor-wiring-tr option[value=2]").attr('disabled','disabled');
        }
        if ($("select#sensor-wiring-tr option:selected").val()=="2"){/// ОТКЛЮЧАЕМ класс A для 2-проводных
            if ($("select#sensor-accuracy-tr option:selected").val()=="A"){
                $("select#sensor-accuracy-tr option[value='not_selected']").prop('selected', true);
            }
            $("select#sensor-accuracy-tr option[value=A]").attr('disabled','disabled');
        }


        if(typeof full_conf.get("head")!="undefined" && full_conf.get("head")=="ctr-ALW"){ // ДЕАКТИВАЦИЯ СЕНСОРОВ для CTR-ALW (кроме K и Pt100)
            for (let sensor of ["thermoresistor", "thermocouple"]){
                $("input[name="+ sensor +"]").each(function(){
                    if ($(this).prop("id")!="pt100" && $(this).prop("id")!="tha"){
                        $("label[for="+ $(this).prop("id") +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ СЕНОСОРЫ по материалу
                        $("#"+$(this).prop("id")).prop('disabled', true);                  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ
                        document.getElementById("err_" +$(this).prop("id")).innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("head")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("head")}_err_cancel${num}'>${$("label[for="+full_conf.get("head")+"]").text()}</label>`;
                        num+=1;
                    }
                })
            }
            if (full_conf.has("thermocouple")){
                ctr_low_temp = -40 > ctr_low_temp ? -40 : ctr_low_temp;
                ctr_high_temp = 550 < ctr_high_temp ? 550 : ctr_high_temp;
                $("input[name=ctr-begin-range]").prop('min', ctr_low_temp).prop('max', ctr_high_temp);
                $("input[name=ctr-end-range]").prop('min', ctr_low_temp).prop('max', ctr_high_temp);
                document.getElementById("ctr-range_warning").innerHTML = `<img src='images/attention.png' style='width: 1.3em; height: 1.3em'> <span style='color:red'>Выберите диапазон от ${ctr_low_temp} до ${ctr_high_temp}°C</span>`;
                document.getElementById("err_ctr-range").innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("head")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("head")}_err_cancel${num}'>${$("label[for="+full_conf.get("head")+"]").text()} (мин -40°С)</label>`;
                num+=1;
            }
            if (full_conf.has("thermoresistor")){
                ctr_low_temp = -196 > ctr_low_temp ? -196 : ctr_low_temp;
                ctr_high_temp = 420 < ctr_high_temp ? 420 : ctr_high_temp;
                $("input[name=ctr-begin-range]").prop('min', ctr_low_temp).prop('max', ctr_high_temp);
                $("input[name=ctr-end-range]").prop('min', ctr_low_temp).prop('max', ctr_high_temp);
                document.getElementById("ctr-range_warning").innerHTML = `<img src='images/attention.png' style='width: 1.3em; height: 1.3em'> <span style='color:red'>Выберите диапазон от ${ctr_low_temp} до ${ctr_high_temp}°C</span>`;
                document.getElementById("err_ctr-range").innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("head")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("head")}_err_cancel${num}'>${$("label[for="+full_conf.get("head")+"]").text()} (до 420°С)</label>`;
                num+=1;
            }
        }

        if (typeof full_conf.get("ctr_diameter")!="undefined" && full_conf.get("ctr_diameter")!="22"){ // ДЕАКТИВАЦИЯ СИАЛОН если выбран диаметер не 22мм
            $("label[for=sialon]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ
            $("#sialon").prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ
            document.getElementById("err_sialon").innerHTML += `<input type='checkbox' name='ctr_diameter_err_cancel' value='' id='ctr_diameter_err_cancel${num}' checked class='custom-checkbox err-checkbox' onclick='changeDiameterTo22()'><label for='ctr_diameter_err_cancel${num}'>Диаметр. Доступно только 22мм.</label>`;
            num+=1;
        }

        if (typeof full_conf.get("head")!="undefined" && full_conf.get("head")!="ctr-DA"){ // ДЕАКТИВАЦИЯ СИАЛОН и КОРУНД ЕСЛИ ВЫБРАНА ГОЛОВКА НЕ DA
            $("label[for=sialon]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ
            $("#sialon").prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ
            $("label[for=ceramic]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ
            $("#ceramic").prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ
            document.getElementById("err_sialon").innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("head")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("head")}_err_cancel${num}'>${$("label[for="+full_conf.get("head")+"]").text()}</label>`;
            num+=1;
            document.getElementById("err_ceramic").innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("head")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("head")}_err_cancel${num}'>${$("label[for="+full_conf.get("head")+"]").text()}</label>`;
            num+=1;
        }

        if (typeof full_conf.get("ctr-electrical")!="undefined" && full_conf.get("ctr-electrical")!="head-list"){ // ДЕАКТИВАЦИЯ СИАЛОН и КОРУНД ЕСЛИ ВЫБРАНО БЕЗ ГОЛОВКИ ИЛИ КАБЕЛЬ
            $("label[for=sialon]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ
            $("#sialon").prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ
            $("label[for=ceramic]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ
            $("#ceramic").prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ
            document.getElementById("err_sialon").innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("ctr-electrical")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("ctr-electrical")}_err_cancel${num}'>${$("label[for="+full_conf.get("ctr-electrical")+"]").text()}</label>`;
            num+=1;
            document.getElementById("err_ceramic").innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("ctr-electrical")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("ctr-electrical")}_err_cancel${num}'>${$("label[for="+full_conf.get("ctr-electrical")+"]").text()}</label>`;
            num+=1;
        }

        if (typeof full_conf.get("material")!="undefined" && full_conf.get("material")=="sialon"){/// ДЛЯ СИАЛОНА ДИАМЕТР ТОЛЬКО 22 и БЕЗ ПРИСОЕДИНЕНИЯ
            $("#ctr-diameter option").each(function(){
                if ($(this).val()!="22" && $(this).val()!="not_selected"){
                    $(this).attr("disabled", "disabled");
                }
            })
            for (let lst of ["thread", "flange", "hygienic"]){
                $("label[for=ctr-"+lst+"-list]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ
                $("#ctr-"+lst+"-list").prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ
                document.getElementById("err_ctr-"+lst+"-list").innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("material")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("material")}_err_cancel${num}'>${$("label[for="+full_conf.get("material")+"]").text()}</label>`;
                num+=1;
                $("#ctr-"+lst+"-select").prop("style", "display:none");
            }
            $("#ctr-connection-type-select option[value='not_selected']").each(function(){
                $(this).prop('selected', true);
            })
        }

        if (typeof full_conf.get("material")!="undefined" && full_conf.get("material")=="ceramic"){ //// ДЛЯ КОРУНДА только 10 или 15 и БЕЗ ПРИСОЕДИНЕНИЯ
            $("#ctr-diameter option").each(function(){
                if ($(this).val()!="15" && $(this).val()!="10" && $(this).val()!="not_selected"){
                    $(this).attr("disabled", "disabled");
                }
            })
            for (let lst of ["thread", "flange", "hygienic"]){
                $("label[for=ctr-"+lst+"-list]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ
                $("#ctr-"+lst+"-list").prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ
                document.getElementById("err_ctr-"+lst+"-list").innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("material")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("material")}_err_cancel${num}'>${$("label[for="+full_conf.get("material")+"]").text()}</label>`;
                num+=1;
                $("#ctr-"+lst+"-select").prop("style", "display:none");
            }
            $("#ctr-connection-type-select option[value='not_selected']").each(function(){
                $(this).prop('selected', true);
            })
        }

        if (typeof full_conf.get("ctr-connection-type")!="undefined" && full_conf.get("ctr-connection-type")!="ctr-no-connection"){///ДЕАКТИВАЦИЯ СИАЛОН И КОРУНД ЕСЛИ ВЫБРАНЫ ПРИСОЕДИНЕНИЯ
            for (let lst of ["ceramic", "sialon"]){
                $("label[for="+lst+"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ
                $("#"+lst).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ
                document.getElementById("err_"+lst).innerHTML += `<input type='checkbox' name='err_cancel' value='' id='${full_conf.get("ctr-connection-type")}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='${full_conf.get("ctr-connection-type")}_err_cancel${num}'>${$("label[for="+full_conf.get("ctr-connection-type")+"]").text()}</label>`;
                num+=1;
            }
        }

        if (typeof full_conf.get("ctr_diameter")!="undefined" && full_conf.get("ctr_diameter")!="10" && full_conf.get("ctr_diameter")!="15"){ // ДЕАКТИВАЦИЯ КОРУНД если выбран диаметер не 10 и не 15 мм
            $("label[for=ceramic]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ
            $("#ceramic").prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ
            document.getElementById("err_ceramic").innerHTML += `<input type='checkbox' name='ctr_diameter_err_cancel' value='' id='ctr_diameter_err_cancel${num}' checked class='custom-checkbox err-checkbox' onclick='changeDiameterTo22()'><label for='ctr_diameter_err_cancel${num}'>Диаметр. Доступно только 10 или 15 мм.</label>`;
            num+=1;
        }
        if(typeof full_conf.get("ctr_cabel_type")!="undefined"){///ОГРАНИЧИТЬ ТЕМПЕРАТУРУ В ЗАВИСИМОСТИ ОТ КАБЕЛЯ
            let cabel_max_temp = window["cabel_restr_lst"].get("ctr-" + full_conf.get("ctr_cabel_type").toLowerCase()).get("end_range");
            ctr_high_temp = cabel_max_temp < ctr_high_temp ? cabel_max_temp : ctr_high_temp;
            $("input[name=ctr-begin-range]").prop('min', ctr_low_temp).prop('max', ctr_high_temp);
            $("input[name=ctr-end-range]").prop('min', ctr_low_temp).prop('max', ctr_high_temp);
            document.getElementById("ctr-range_warning").innerHTML = `<img src='images/attention.png' style='width: 1.3em; height: 1.3em'> <span style='color:red'>Выберите диапазон от ${ctr_low_temp} до ${ctr_high_temp}°C</span>`;
            document.getElementById("err_ctr-range").innerHTML += `<input type='checkbox' name='err_cancel' value='' id='ctr-${full_conf.get("ctr_cabel_type").toLowerCase()}_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='ctr-${full_conf.get("ctr_cabel_type").toLowerCase()}_err_cancel${num}'>${$("label[for=ctr-"+full_conf.get("ctr_cabel_type").toLowerCase()+"]").text()}</label>`;
            num+=1;
        }

        if ($("input[name=ctr-ALW-type]:checked").val()=="WW"){ //// Для WW диаметр только 6мм
            $("#ctr-diameter option").each(function(){
                if ($(this).val()!="6"){
                    $(this).attr("disabled", "disabled");
                    if ($(this).is(":selected")){
                        $("#ctr-diameter option[value='not_selected']").prop('selected', true);
                    }
                }
            })
            $("#ctr-diameter option[value='not_selected']").removeAttr("disabled");
            $("input[name=material]").each(function(){  ////////// ДЛЯ WW только AISI316 или ALLOY600
                if ($(this).prop("id")!="aisi316" && $(this).prop("id")!="inconel"){
                    $("label[for="+ $(this).prop("id") +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ по ТЕМПЕРАТУРЕ material
                    $("#"+$(this).prop("id")).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ material
                    document.getElementById("err_"+$(this).prop("id")).innerHTML += `<input type='checkbox' name='err_cancel' value='' id='WW_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='WW_err_cancel${num}'>${$("label[for=WW]").text()}</label>`;
                    num+=1;
                }
            })
        }
        if ($("input[name=ctr-ALW-type]:checked").val()=="KO"){ //// Для KO диаметрЫ только 9мм и 11мм
            $("#ctr-diameter option").each(function(){
                if ($(this).val()!="6" && $(this).val()!="9" && $(this).val()!="11"){
                    $(this).attr("disabled", "disabled");
                    if ($(this).is(":selected")){
                        $("#ctr-diameter option[value='not_selected']").prop('selected', true);
                    }
                }
            })
            $("#ctr-diameter option[value='not_selected']").removeAttr("disabled");
            $("input[name=material]").each(function(){  ////////// ДЛЯ KO только AISI316
                if ($(this).prop("id")!="aisi316"){
                    $("label[for="+ $(this).prop("id") +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ по ТЕМПЕРАТУРЕ material
                    $("#"+$(this).prop("id")).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ material
                    document.getElementById("err_"+$(this).prop("id")).innerHTML += `<input type='checkbox' name='err_cancel' value='' id='KO_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='KO_err_cancel${num}'>${$("label[for=KO]").text()}</label>`;
                    num+=1;
                }
            })
        }
        if ($("input[name=ctr-ALW-type]:checked").val()=="GN"){ //// Для GN диаметрЫ только 3мм и 6мм
            $("#ctr-diameter option").each(function(){
                if ($(this).val()!="3" && $(this).val()!="6"){
                    $(this).attr("disabled", "disabled");
                    if ($(this).is(":selected")){
                        $("#ctr-diameter option[value='not_selected']").prop('selected', true);
                    }
                }
            })
            $("#ctr-diameter option[value='not_selected']").removeAttr("disabled");
            $("input[name=material]").each(function(){  ////////// ДЛЯ GN только AISI316 или ALLOY600
                if ($(this).prop("id")!="aisi316" && $(this).prop("id")!="inconel"){
                    $("label[for="+ $(this).prop("id") +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ по ТЕМПЕРАТУРЕ material
                    $("#"+$(this).prop("id")).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ material
                    document.getElementById("err_"+$(this).prop("id")).innerHTML += `<input type='checkbox' name='err_cancel' value='' id='GN_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='GN_err_cancel${num}'>${$("label[for=GN]").text()}</label>`;
                    num+=1;
                }
            })
        }

        if (typeof full_conf.get("ctr_diameter")!="undefined" && full_conf.get("ctr_diameter")!="6"){ // ДЕАКТИВАЦИЯ WW если выбран диаметер не 6 мм
            $("label[for=WW]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ
            $("#WW").prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ
            document.getElementById("err_WW").innerHTML += `<input type='checkbox' name='ctr_diameter_err_cancel' value='' id='ctr_diameter_err_cancel${num}' checked class='custom-checkbox err-checkbox' onclick='changeDiameterTo22()'><label for='ctr_diameter_err_cancel${num}'>Диаметр. Доступно только 6 мм.</label>`;
            num+=1;
        }
        if (typeof full_conf.get("ctr_diameter")!="undefined" && full_conf.get("ctr_diameter")!="6" && full_conf.get("ctr_diameter")!="9" && full_conf.get("ctr_diameter")!="11"){ // ДЕАКТИВАЦИЯ KO если выбран диаметер не 6, 9 или 11 мм
            $("label[for=KO]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ
            $("#KO").prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ
            document.getElementById("err_KO").innerHTML += `<input type='checkbox' name='ctr_diameter_err_cancel' value='' id='ctr_diameter_err_cancel${num}' checked class='custom-checkbox err-checkbox' onclick='changeDiameterTo22()'><label for='ctr_diameter_err_cancel${num}'>Диаметр. Доступно только 9 или 11 мм.</label>`;
            num+=1;
        }
        if (typeof full_conf.get("ctr_diameter")!="undefined" && full_conf.get("ctr_diameter")!="3" && full_conf.get("ctr_diameter")!="6"){ // ДЕАКТИВАЦИЯ GN если выбран диаметер не 3 или 6 мм
            $("label[for=GN]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ
            $("#GN").prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ
            document.getElementById("err_GN").innerHTML += `<input type='checkbox' name='ctr_diameter_err_cancel' value='' id='ctr_diameter_err_cancel${num}' checked class='custom-checkbox err-checkbox' onclick='changeDiameterTo22()'><label for='ctr_diameter_err_cancel${num}'>Диаметр. Доступно только 3 или 6 мм.</label>`;
            num+=1;
        }
        // ################################################################################################################################################################################
    }

    ///СКРЫТИЕ И ПОКАЗ SPECIAL
    if (full_conf.get("main_dev") == "pc-28" || full_conf.get("main_dev") == "pr-28"){
        $("label[for=0_16]").prop("style", "display:block");
        $("label[for=hi_load]").prop("style", "display:block");
        $("label[for=time_response]").prop("style", "display:block");
        $("label[for=ct_spec]").prop("style", "display:block");
        $("label[for=minus_20]").prop("style", "display:block");
        $("label[for=minus_30]").prop("style", "display:block");
    }else{
        $("label[for=0_16]").prop("style", "display:none");
        $("label[for=hi_load]").prop("style", "display:none");
        $("label[for=time_response]").prop("style", "display:none");
        $("label[for=ct_spec]").prop("style", "display:none");
        $("label[for=minus_20]").prop("style", "display:none");
        $("label[for=minus_30]").prop("style", "display:none");
    }
    if (full_conf.get("main_dev") == "pr-28"){
        $("label[for=0_16]").prop("style", "display:none");
        $("label[for=hi_load]").prop("style", "display:none");
    }
    if (full_conf.get("main_dev") == "apc-2000" || full_conf.get("main_dev") == "apr-2000"){
        $("label[for=0_05]").prop("style", "display:block");
        $("label[for=spec_pd]").prop("style", "display:block");
        $("label[for=spec_ip67]").prop("style", "display:block");
        $("label[for=SN]").prop("style", "display:block");
        $("label[for=hart7]").prop("style", "display:block");
        $("label[for=hs]").prop("style", "display:block");
        $("label[for=minus_40]").prop("style", "display:block");
    }else{
        $("label[for=0_05]").prop("style", "display:none");
        $("label[for=spec_pd]").prop("style", "display:none");
        $("label[for=spec_ip67]").prop("style", "display:none");
        $("label[for=SN]").prop("style", "display:none");
        $("label[for=hart7]").prop("style", "display:none");
        $("label[for=hs]").prop("style", "display:none");
        $("label[for=minus_40]").prop("style", "display:none");
    }
    if (full_conf.get("main_dev") == "apc-2000"){
        $("label[for=minus_50]").prop("style", "display:block");
        $("label[for=minus_60]").prop("style", "display:block");
    }else{
        $("label[for=minus_50]").prop("style", "display:none");
        $("label[for=minus_60]").prop("style", "display:none");
    }
    if (full_conf.get("main_dev") == "ctr"){
        $("input[name=special]").each(function(){
            if ($(this).prop('id')=="spec_lvk" || $(this).prop('id')=="spec_38" || $(this).prop('id')=="spec_375" || $(this).prop('id')=="spec_ip67" || $(this).prop('id')=="SN"){
                $("label[for="+$(this).prop('id')+"]").prop("style", "display:block");
            }else{
                $("label[for="+$(this).prop('id')+"]").prop("style", "display:none");
            }
        })
    }else{
        $("label[for=spec_lvk]").prop("style", "display:none");
        $("label[for=spec_38]").prop("style", "display:none");
        $("label[for=spec_375]").prop("style", "display:none");
    }


    /// ПРОВЕРКА SPECIAL
    if (full_conf.get("main_dev") != "pc-28" || typeof full_conf.get("range") == 'undefined' || full_conf.get("range") < 40 || $("#hi_load").is(":checked") || full_conf.get("output") == "4_20H" || full_conf.get("output") == "modbus" || typeof full_conf.get("output")=='undefined'){ //проверка 0,16
        $("label[for=0_16]").addClass('disabled');
        $("#0_16").prop('disabled', true);
    }
    if (full_conf.get("main_dev") != "pc-28" || full_conf.get("output") != "4_20" || $("#0_16").is(":checked")){ // проверка H
        $("label[for=hi_load]").addClass('disabled');
        $("#hi_load").prop('disabled', true);
    }
    if ((((full_conf.get("main_dev") == "pc-28" || full_conf.get("main_dev") == "apc-2000") && (!(full_conf.has("thread")) || (full_conf.get("thread") != "M" && full_conf.get("thread") != "G1_2")))) || ((full_conf.get("main_dev") == "pr-28" || full_conf.get("main_dev") == "apr-2000") && ((!full_conf.has("flange")) || full_conf.get("flange") != "c-pr") || typeof full_conf.get("range")=="undefined" || full_conf.get("begin_range")<-0.5 || full_conf.get("end_range")>100) || $("#minus_20").is(":checked") || $("#minus_30").is(":checked")  || $("#minus_40").is(":checked") || $("#minus_50").is(":checked") || $("#minus_60").is(":checked")){ // проверка Кислород
        $("label[for=oxygen]").addClass('disabled');
        $("#oxygen").prop('disabled', true);
    }
    if (full_conf.get("main_dev") != "pc-28" || full_conf.get("output") != "4_20" || typeof full_conf.get("electrical") == 'undefined' || full_conf.get("electrical") == "ALW" || full_conf.get("electrical") == "ALW2"){//проверка TR
        $("label[for=time_response]").addClass('disabled');
        $("#time_response").prop('disabled', true);
    }
    if (full_conf.get("main_dev") == "apc-2000" || full_conf.get("main_dev") == "apr-2000" || full_conf.get("output") == "4_20H" || full_conf.get("output") == "modbus" || $("#minus_30").is(":checked") || $("#ct_spec").is(":checked") || $("#oxygen").is(":checked")){ //проверка (-20)
        $("label[for=minus_20]").addClass('disabled');
        $("#minus_20").prop('disabled', true);
    }
    if (full_conf.get("main_dev") == "apc-2000" || full_conf.get("main_dev") == "apr-2000" || full_conf.get("output") == "4_20H" || full_conf.get("output") == "modbus"  || $("#minus_20").is(":checked") || $("#ct_spec").is(":checked") || $("#oxygen").is(":checked")){ //проверка (-30)
        $("label[for=minus_30]").addClass('disabled');
        $("#minus_30").prop('disabled', true);
    }
    if (full_conf.get("pressure_type") != "ABS" || full_conf.get("output") == "4_20H" || full_conf.get("output") == "modbus" || $("#minus_30").is(":checked")  || $("#minus_20").is(":checked")){ // проверка CT
        $("label[for=ct_spec]").addClass('disabled');
        $("#ct_spec").prop('disabled', true);
    }
    if (full_conf.get("cap-or-not") == "direct" || ((full_conf.get("cap-or-not") == "capillary" || typeof full_conf.get("cap-or-not") == 'undefined') && (!full_conf.has("flange") || typeof full_conf.get("flange")=="undefined")) || (typeof full_conf.get("flange")!="undefined" && full_conf.get("flange").slice(0,4)!="s_p_" && full_conf.get("flange").slice(0,4)!="s_t_" && full_conf.get("flange").slice(0,4)!="s_ch")){ // проверка rad_cap
        $("label[for=rad_cap]").addClass('disabled');
        $("#rad_cap").prop('disabled', true);
    }
    if ((full_conf.get("main_dev") == "apc-2000" && full_conf.get("end_range_kpa")>30000) || (full_conf.get("main_dev") == "apr-2000" && full_conf.get("end_range_kpa")>1600) || full_conf.get("pressure_type")=="ABS" || full_conf.get("material") == "hastelloy" || typeof full_conf.get("range")=='undefined' || (full_conf.has("thread") && !(full_conf.get("thread")=="P" || full_conf.get("thread")=="GP" || full_conf.get("thread")=="1_2NPT")) || (full_conf.get("main_dev")=="apr-2000" && ((typeof full_conf.get("thread")!='undefined' && full_conf.get("thread").startsWith("s_")) || (typeof full_conf.get("flange")!="undefined" && full_conf.get("flange").startsWith("s_")) || full_conf.has("hygienic")))){ // проверка HS
        $("label[for=hs]").addClass('disabled');
        $("#hs").prop('disabled', true).prop('checked', false);
    }
    if ((full_conf.get("main_dev") == "apc-2000" && ((full_conf.get("end_range_kpa")<=2.5 && full_conf.get("begin_range_kpa")>=-2.5) && full_conf.get("range")<=5) && full_conf.get("pressure_type")=="") || (main_dev == "APR-2000" && ((full_conf.get("end_range_kpa")<=2.5 || full_conf.get("begin_range_kpa")>=-2.5) && full_conf.get("range")<=5))){ // принудительное включение HS для низких диапазонов и отключение недоступных штуцеров
        // $("label[for=hs]").addClass('disabled');
        $("#hs").prop('checked', true).prop('disabled', true);
        $("label[for=hastelloy]").addClass('disabled');
        $("#hastelloy").prop('disabled', true).prop('checked', false);
        document.getElementById("err_hastelloy").innerHTML += `<input type='checkbox' name='range_err_cancel' value='' id='${full_conf.get("range")}_err_cancel${num}' checked class='custom-checkbox err-checkbox' onclick='uncheckRange()'><label for='${full_conf.get("range")}_err_cancel${num}'>Выбранный диапазон. Допускается ширина диапазона более 5кПа.</label>`;
        num+=1;
        for (let cons of ["M", "G1_2", "g1_4", "m12_1"]){
            $("label[for=" + cons + "]").addClass('disabled');
            $("#" + cons).prop('disabled', true);
            document.getElementById("err_" + cons).innerHTML += `<input type='checkbox' name='range_err_cancel' value='' id='${full_conf.get("range")}_err_cancel${num}' checked class='custom-checkbox err-checkbox' onclick='uncheckRange()'><label for='${full_conf.get("range")}_err_cancel${num}'>Выбранный диапазон. Допускается ширина диапазона более 5кПа.</label>`;
            num+=1;
        }
    }
    if (!(full_conf.get("electrical")=="APCALW" || full_conf.get("head")=="ctr-ALW")){ // проверка специсполнения PD, SN, -50..80, HART7
        $("label[for=spec_pd]").addClass('disabled');
        $("#spec_pd").prop('disabled', true).prop('checked', false);
        $("label[for=SN]").addClass('disabled');
        $("#SN").prop('disabled', true).prop('checked', false);
        $("label[for=minus_50]").addClass('disabled');
        $("#minus_50").prop('disabled', true).prop('checked', false);
        $("label[for=hart7]").addClass('disabled');
        $("#hart7").prop('disabled', true).prop('checked', false);
    }
    if ($("#spec_ip67").is(":checked")){
        $("#spec_pd").prop('disabled', true);
        $("#spec_pd").prop('checked', false);
        $("label[for=spec_pd]").addClass('disabled');
    }
    if (!((full_conf.get("electrical")=="APCALW" || full_conf.get("head")=="ctr-ALW") && (full_conf.get("pressure_type")=="ABS" || full_conf.get("main_dev") == "apr-2000" || full_conf.get("main_dev") == "ctr")) || $("#spec_pd").is(":checked")){ // проверка специсполнения IP67
        $("label[for=spec_ip67]").addClass('disabled');
        $("#spec_ip67").prop('disabled', true).prop('checked', false);
    }
    if (full_conf.get("electrical")!="APCALW" || full_conf.get("range")<1.5){ // проверка специсполнения 0.05
        $("label[for=0_05]").addClass('disabled');
        $("#0_05").prop('disabled', true);
        $("#0_05").prop('checked', false);
    }
    if ((full_conf.get("main_dev") != "apc-2000" && full_conf.get("main_dev") != "apr-2000") || (full_conf.get("main_dev") == "apc-2000" && !(full_conf.get("electrical")=="PD" || full_conf.get("electrical")=="PZ")) || $("#minus_60").is(":checked") || $("#oxygen").is(":checked")){ // проверка специсполнения -40
        $("label[for=minus_40]").addClass('disabled');
        $("#minus_40").prop('disabled', true);
        $("#minus_40").prop('checked', false);
    }
    if (full_conf.get("main_dev") != "apc-2000" || (full_conf.get("main_dev") == "apc-2000" && full_conf.get("electrical")!="PZ") || $("#minus_40").is(":checked") || $("#oxygen").is(":checked")){ // проверка специсполнения -60
        $("label[for=minus_60]").addClass('disabled');
        $("#minus_60").prop('disabled', true);
        $("#minus_60").prop('checked', false);
    }
    if (typeof full_conf.get("ctr_diameter")==='undefined' || (full_conf.get("thermoresistor")==="undefined" && full_conf.get("thermocouple")==="undefined") || (typeof full_conf.get("ctr_diameter")!='undefined' && full_conf.get("ctr_diameter") != "3" && full_conf.get("ctr_diameter") != "6") || (typeof full_conf.get("thermocouple")!="undefined" && full_conf.get("thermocouple")!="tha" && full_conf.get("thermocouple")!="tzk") || typeof full_conf.get("material")==='undefined' || (typeof full_conf.get("material")!='undefined' && full_conf.get("material")!="aisi316" & full_conf.get("material")!="inconel") || (typeof full_conf.get("ctr-electrical")!="undefined" && full_conf.get("ctr-electrical")!="head-list") || $("input#KO").is(":checked")){ // проверка специсполнения Lvk
        $("label[for=spec_lvk]").addClass('disabled');
        $("#spec_lvk").prop('disabled', true);
        $("#spec_lvk").prop('checked', false);
    }

    if (typeof full_conf.get("output")==='undefined' || (typeof full_conf.get("output")!='undefined' && full_conf.get("output")=="no_trand") || (typeof full_conf.get("output")!='undefined' && full_conf.get("output")=="4_20H" && (typeof full_conf.get("head")!='undefined' && full_conf.get("head")!="ctr-ALW" || (typeof full_conf.get("head")=='undefined')))){ // проверка специсполнения 3.8мА
        $("label[for=spec_38]").addClass('disabled');
        $("#spec_38").prop('disabled', true);
        $("#spec_38").prop('checked', false);
    }
    if (typeof full_conf.get("output")==='undefined' || (typeof full_conf.get("output")!='undefined' && full_conf.get("output")!="4_20H") || (typeof full_conf.get("output")!='undefined' && full_conf.get("output")=="4_20H" && typeof full_conf.get("head")!='undefined' && full_conf.get("head")=="ctr-ALW")){ // проверка специсполнения 3.75мА
        $("label[for=spec_375]").addClass('disabled');
        $("#spec_375").prop('disabled', true);
        $("#spec_375").prop('checked', false);
    }

    if (full_conf.get("approval")=="Exd" && full_conf.get("ctr_diameter")=="6" && !$("input#KO").is(":checked")){//ПРИНУДИТЕЛЬНОЕ ВКЛЮЧЕНИЕ Lvk для Exd d=6
        $("#spec_lvk").prop('disabled', true);
        $("#spec_lvk").prop('checked', true);
        document.getElementById("dialog2-confirm-p").innerHTML = `БУДУТ ОТМЕНЕНЫ СЛЕДУЮЩИЕ ОПЦИИ:
        <br>
        <input type='checkbox' name='err_cancel' value='' id='exdxx_err_cancel${num}' checked disabled class='custom-checkbox err-checkbox' onclick='uncheckExd()'><label for='exdxx_err_cancel${num}'>${$("label[for=Exd]").text()}</label>
        <input type='checkbox' name='ctr_diameter_err_cancel' value='' id='ctr_diameter_err_cancel${num}' checked disabled class='custom-checkbox err-checkbox' onclick='changeDiameterTo22()'><label for='ctr_diameter_err_cancel${num}'>Диаметр защитного корпуса 6мм.</label>`;
        num+=2;
    }
    if (full_conf.has("thermoresistor") && full_conf.get("sensor_quantity")=="2" && full_conf.get("ctr_diameter")=="6" && full_conf.has("head")){//ПРИНУДИТЕЛЬНОЕ ВКЛЮЧЕНИЕ Lvk d=6 и 2 сенсора
        $("#spec_lvk").prop('disabled', true);
        $("#spec_lvk").prop('checked', true);
        document.getElementById("dialog2-confirm-p").innerHTML = `БУДУТ ОТМЕНЕНЫ СЛЕДУЮЩИЕ ОПЦИИ:
        <br>
        <input type='checkbox' name='err_cancel' value='' id='sensor_quantity_err_cancel${num}' checked disabled class='custom-checkbox err-checkbox' onclick='changeSensorQuantity()'><label for='sensor_quantity_err_cancel${num}'>${$("label[for=sensor-quantity]").text()} 2шт.</label>
        <input type='checkbox' name='ctr_diameter_err_cancel' value='' id='ctr_diameter_err_cancel${num}' checked disabled class='custom-checkbox err-checkbox' onclick='changeDiameterTo22()'><label for='ctr_diameter_err_cancel${num}'>Диаметр защитного корпуса 6мм.</label>`;
        num+=2;
    }
    if (full_conf.get("ctr_diameter")=="3" && full_conf.has("head")){//ПРИНУДИТЕЛЬНОЕ ВКЛЮЧЕНИЕ Lvk для Exd d=3
        $("#spec_lvk").prop('disabled', true);
        $("#spec_lvk").prop('checked', true);
        document.getElementById("dialog2-confirm-p").innerHTML = `БУДУТ ОТМЕНЕНЫ СЛЕДУЮЩИЕ ОПЦИИ:
        <br>
        <input type='checkbox' name='ctr_diameter_err_cancel' value='' id='ctr_diameter_err_cancel${num}' checked disabled class='custom-checkbox err-checkbox' onclick='changeDiameterTo22()'><label for='ctr_diameter_err_cancel${num}'>Диаметр защитного корпуса 3мм.</label>`;
        num+=1;
    }
    if ($("input[name=ctr-ALW-type]:checked").val()=="WW" || $("input[name=ctr-ALW-type]:checked").val()=="GN"){//ПРИНУДИТЕЛЬНОЕ ВКЛЮЧЕНИЕ Lvk для WW или GN
        let $err_id = $("input[name=ctr-ALW-type]:checked").prop("id");
        console.log($err_id);
        $("#spec_lvk").prop('disabled', true);
        $("#spec_lvk").prop('checked', true);
        document.getElementById("dialog2-confirm-p").innerHTML = `БУДУТ ОТМЕНЕНЫ СЛЕДУЮЩИЕ ОПЦИИ:
        <br>
        <input type='checkbox' name='ctr_alw_err_cancel' value='' id='${$("input[name=ctr-ALW-type]:checked").prop("id")}_err_cancel${num}' checked disabled class='custom-checkbox err-checkbox' onclick='uncheckWWGN(${$("input[name=ctr-ALW-type]:checked").prop("id")})'><label for='${$("input[name=ctr-ALW-type]:checked").prop("id")}_err_cancel${num}'>${$("label[for="+$("input[name=ctr-ALW-type]:checked").prop("id")+"]").text()}.</label>`;
        num+=1;
    }

    if ($("#spec_lvk").is(":checked")){//ОГРАНИЧЕНИЯ МАТЕРИАЛОВ если ВЫБРАНО Lvk
        console.log("ОГРАНИЧЕНИЯ МАТЕРИАЛОВ если ВЫБРАНО Lvk");
        $("input[name=material]").each(function() {
            if ($(this).prop("id")!="aisi316" && $(this).prop("id")!="inconel"){
                $("label[for="+$(this).attr("id")+"]").addClass('disabled');  ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ МАТЕРИАЛЫ
                $(this).prop('disabled', true);                               //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ MATERIAL
                if ($(this).is(":checked")){
                    $(this).prop("checked", false).closest("div.active-option-to-select-list").prev("div.option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
                }
                document.getElementById("err_" + $(this).attr("id")).innerHTML += `<input type='checkbox' name='err_cancel' value='' id='spec_lvk_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='spec_lvk_err_cancel${num}'>Открытый (заменяемый) измерительный вкладыш</label>`;
                num+=1;
            }
            if (typeof full_conf.get("thermocouple")!="undefined" && full_conf.get("thermocouple")=="tha" && $(this).prop("id")=="aisi316"){
                $("label[for=aisi316]").addClass('disabled'); ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ МАТЕРИАЛЫ
                $("#aisi316").prop('disabled', true);         //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ MATERIAL
                document.getElementById("err_" + $(this).attr("id")).innerHTML += `<input type='checkbox' name='err_cancel' value='' id='spec_lvk_err_cancel${num}' checked class='custom-checkbox err-checkbox'><label for='spec_lvk_err_cancel${num}'>Открытый (заменяемый) измерительный вкладыш</label>`;
                num+=1;
            }
        })
    }

    if ($("#ctr-ALW").is(":checked")){
        $("#ctr-ALW-type").prop("style", "display:block; margin-left: 1.5em");
    }else{
        $("#ctr-ALW-type").prop("style", "display:none");
        $("input[name=ctr-ALW-type]:checked").prop("checked", false);
    }

    $("div.color-mark-field.special.unselected").removeClass("unselected");

    ///ПРОВЕРКА ПОЛНОТЫ КОНФИГУРАЦИИ
    for (let x of full_conf.values()){
        if (typeof x === 'undefined'){
            check_flag = false;
            console.log("НЕПОЛНАЯ КОНФИГУРАЦИЯ!");
            document.getElementById("code").value = "";
            try{
                document.querySelector("table").remove();
            }catch (err){console.log(err);}
            break;
        }
    }
    if (check_flag == true){
        console.log("КОНФИГУРИРОВАНИЕ ЗАВЕРШЕНО!!!");
        $("fieldset#special-select-field div[id^='err_']").each(function(){  ////ERR_CANCEL для SPECIAL
            $(this).prop("innerHTML", "");
        })
        if (full_conf.get("main_dev") == "apc-2000" || full_conf.get("main_dev") == "apr-2000" || full_conf.get("main_dev") == "pc-28" || full_conf.get("main_dev") == "pr-28"){
            get_code_info(full_conf);
        }
        if (full_conf.get("main_dev") == "ctr"){
            get_ctr_code_info(full_conf);
        }
    }else{
        $("fieldset#special-select-field div[id^='err_']").each(function(){  ////ERR_CANCEL для SPECIAL
            $(this).prop("innerHTML", "&emsp;&nbsp;<img src='images/attention.png' style='width: 1.3em; height: 1.3em'><span style='color: red'>&nbsp;Завершите конфигурирование!</span>");
        })
    }
    ctrShowHideErrSpan();
    $("div[id^='err_']").each(function(){  ////ПРЯЧЕМ ВСЕ ERR_CANCEL ЧЕКБОКСЫ
        if (($(this).find("input[name=err_cancel]:checked").length==0) || ($(this).closest("div.active-option-to-select-list").css("display")!="block")){
            $(this).prop("style", "display:none");
        }
    })
}


//
// function validate_option(name_to_check, option_name, valid_list){ /// (id выбранной опции, id проверяемой опции, подходящие варианты проверяемой опции)
//     $("input[name="+ option_name +"]").each(function() {
//         let option_1 = $("#"+ this.name +"-select").prev(".option-to-select").find(".option-to-select-header span").text();
//         let option_2 = $("#"+ name_to_check +"-select").prev(".option-to-select").find(".option-to-select-header span").text();
//         let option_2_text = $("label[for="+$("input[name="+ name_to_check +"]:checked").attr("id")+"]").text();
//         if (valid_list.includes(this.value) || valid_list.length == 0){
//             if ($(this).is(':checked')){
//                 alert(option_1 + " " + $("label[for="+$(this).attr("id")+"]").text() + " и " + option_2.toLowerCase() + " " + option_2_text + " несовместимы! \nВыберите " + option_1.toLowerCase() + " заново.");
//             }
//         }
//     })
// }

$(function (){
    $("input:checkbox").click(function(){ /// СКРЫВАЕМ АКТИВНУЮ ОПЦИЮ ПОСЛЕ ВЫБОРА, ОТКРЫВАЕМ СЛЕДУЮЩУЮ
        if ($(this).is(':checked') && this.name!="special") { /// ТОЛЬКО ОДИН ОТМЕЧЕННЫЙ ЧЕКБОКС (кроме special)
            $(this).siblings("input:checkbox").prop('checked', false);
            if (this.name=="max-static"){
                MaxStaticChecked();
                return;
            }
            if ($(this).prop("id")=="c-pr" || $(this).prop("id")=="minus-c-pr"){ //$(this).prop("id")=="P" ||  || $(this).prop("id")=="minus-P"
                CorPSelected($(this).prop("id"), true);
                return;
            }
            console.log("1");
        }
        else{
            if(this.name=="head" || this.name=="nohead" || this.name=="cabel"){//ПРИ СНЯТИИ ГАЛКИ типа датчика температуры
                $(this).closest("div.active-option-to-select-list").prev("div.option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
                disable_invalid_options();
                return;
            }
            if (this.name=="ctr-ALW-type"){ //ПРИ СНЯТИИ ГАЛКИ
                $(this).closest("div.active-option-to-select-list").prev("div.option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
                disable_invalid_options();
                return;
            }

            if (this.name=="ctr-cabel-type"){//СКРЫТЬ ВЫБОР ДЛИНЫ КАБЕЛЯ при отмене К1-К6
                $("#ctr-cabel-length-span").prop("style", "display:none");
                $("input[id=ctr-cabel-length]").prop("value", "");
            }

            if (this.name=="special"){
                disable_invalid_options();
                return;
            }
            if ($("#connection-type-select input:checkbox:checked").length==0){/// ЕСЛИ НЕ ВЫБРАНО тип и размер - скрыть список thread-flange-hygienic
                $('.thread-flange-hygienic').hide(0);
                console.log("2");
            }
            if ($("#minus-connection-type-select input:checkbox:checked").length==0){/// ЕСЛИ НЕ ВЫБРАНО тип и размер - скрыть список minus-thread-flange-hygienic
                $('.minus-thread-flange-hygienic').hide(0);
                console.log("2-minus");
            }
            if (this.name=="sensor-type"){/// при снятии галки термосопротивление или термопара - скрыть список, сбросить выбор
                $("#quantity-accuracy-wiring").slideUp();
                $("#sensor-quantity-span").prop('style', 'display:none');
                $("#sensor-accuracy-tc-span").prop('style', 'display:none');
                $("#sensor-accuracy-tr-span").prop('style', 'display:none');
                $("#sensor-wiring-tr-span").prop('style', 'display:none');
                $("select#sensor-quantity option[value='not_selected']").prop('selected', true);
                $("select#sensor-accuracy-tc option[value='not_selected']").prop('selected', true);
                $("select#sensor-accuracy-tr option[value='not_selected']").prop('selected', true);
                $("select#sensor-wiring-tr option[value='not_selected']").prop('selected', true);
                $('.thermoresistor-thermocouple').hide(0);
                $(".thermoresistor-thermocouple").find("input:checkbox:checked").prop('checked', false);
                $(".thermoresistor-thermocouple").find("label").prop('style', 'display:block')
                console.log("thermoresistor-thermocouple hide");
            }

            if (this.name=="thermoresistor" || this.name=="thermocouple"){
                $(".thermoresistor-thermocouple").find("label").slideDown();
                $(this).closest("div.option-to-select-list").prev("div.option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
            }
            if (this.name=="ctr-electrical"){
                console.log("спрятать head или nohead или cabel");
                $(this).closest("div.active-option-to-select-list").prev("div.option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
                $(".head-nohead-cabel").find("input:checkbox:checked").prop('checked', false);
                $('.head-nohead-cabel').hide(0);
                //СКРЫТЬ ВЫБОР ДЛИНЫ КАБЕЛЯ
                $("#ctr-cabel-type-select-div").prop("style", "display:none").removeClass("active-option-to-select");
                $("#ctr-cabel-type-select").removeClass("active-option-to-select-list").prev("div.option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
                $("input[name=ctr-cabel-type]:checked").prop("checked", false);
                $("#ctr-cabel-length-span").prop("style", "display:none");
                $("input[id=ctr-cabel-length]").prop("value", "");
            }
            if (this.name=="ctr-connection-type"){ /// ПРИ ОТМЕНЕ ПРИСОЕДИНЕНИЯ CTR СПРЯТАТЬ ВСЕ СПИСКИ, отметить красным, выбор not_selected
                console.log('Спрятать все списки ctr-connection-type, пометить красным');
                $("div.ctr-thread-flange-hygienic").each(function(){
                    $(this).prop("style", "display:none");
                })
                $("div#ctr-connection-type-select").find("select option[value='not_selected']").prop('selected', true);
                $("div#ctr-connection-type-select").prev("div.option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
            }
            var $this = $(this.parentElement.parentElement); /// ПРИ СНЯТИИ ЧЕКБОКСА - ВЫДЕЛЯТЬ КРАСНЫМ
            $this.prev(".option-to-select").find(".color-mark-field").removeClass("selected");
            $this.prev(".option-to-select").find(".color-mark-field").addClass("unselected");
            if (this.name=="cap-or-not" || this.name=="cap-plus" || this.name=="cap-minus"){
                document.getElementById(this.name + "-radiator-select").hidden = true;
                document.getElementById(this.name + "-length-span").hidden = true;
                document.getElementById(this.name + "-radiator-select-err").hidden = true;
                document.getElementById(this.name + "-length-span-err").hidden = true;
                $("input[name=" + this.name + "-mes-env-temp]").val("");
                console.log("СНЯТИЕ ВЫБОРА ПРИСОЕДИНЕНИЯ");
                let data;
                if (this.name=="cap-minus"){
                    $("#direct-cap-minus").prop('checked', false).prop('disabled', false);
                    $("#capillary-cap-minus").prop('checked', false).prop('disabled', false);
                    data="minus";
                }else{
                    $("#capillary-cap-plus").prop('checked', false).prop('disabled', false);
                    $("#direct-cap-plus").prop('checked', false).prop('disabled', false);
                    data="";
                }
                uncheckAllConnections(data);
            }
            if (this.name=="flange"){
                $("#flange-select-field > span").each(function(){
                    $(this).prop("style", "display:none");
                    $(this).find("select option[value='not_selected']").prop('selected', true);
                })
            }
            if (this.name=="minus-flange"){
                $("#minus-flange-select-field > span").each(function(){
                    $(this).prop("style", "display:none");
                    $(this).find("select option[value='not_selected']").prop('selected', true);
                })
            }
            if (this.name=="max-static"){
                for (let plmin of ["","minus-"]){          ////////СНЯТЬ ОТМЕТКИ СО ВСЕХ ПРИСОЕДИНЕНИЙ при снятии галки MAX-STATIC
                    for (let cons of ["thread", "flange", "hygienic", "connection-type"]){
                        $("input[name=" + plmin + cons + "]").each(function(){
                            // $("label[for="+ $(this).prop("id") +"]").addClass('disabled');
                            $(this).prop('checked', false);
                        })
                        $("#"+ plmin + cons + "-select").prev(".option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
                    }
                    $("#" + plmin + "flange-list").prop('checked', false);
                }
                $('.thread-flange-hygienic').hide(0);
                $('.minus-thread-flange-hygienic').hide(0);
                $("#cap-plus-select").prev(".option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
                $("#cap-minus-select").prev(".option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
                $("#direct-cap-plus").prop('checked', false).prop('disabled', false);
                $("#direct-cap-minus").prop('checked', false).prop('disabled', false);
                $("#capillary-cap-plus").prop('checked', false).prop('disabled', false);
                $("#capillary-cap-minus").prop('checked', false).prop('disabled', false);
                console.log("max-static unchecked");
            }
            if ($(this).prop("id")=="c-pr" || $(this).prop("id")=="minus-c-pr"){//$(this).prop("id")=="P" || $(this).prop("id")=="minus-P" ||
                CorPSelected($(this).prop("id"), false);
                return;
            }
            console.log("3");
            if (this.name=="thread" || this.name=="flange" || this.name=="hygienic" || this.name=="minus-thread" || this.name=="minus-flange" || this.name=="minus-hygienic"){
                ///СКРЫТЬ ВЫБОР МАНОМЕТРИЧЕСКОЙ ЖИДКОСТИ при ОТМЕНЕ ПРИСОЕДИНЕНИЯ
                if ($(this).prop('id').startsWith('s_') || $(this).prop('id').startsWith('minus-s_')){
                    console.log("скрыть выбор манометрической жидкости при отмене");
                    $("div.option-to-select.fluid-select-div").each(function(){
                        $(this).prop("style", "display: none").removeClass("active-option-to-select");
                        $(this).next("div.option-to-select-list").prop("style", "display: none").removeClass("active-option-to-select-list");
                    });
                    $("input[name=fluid]").each(function(){
                        $(this).prop('checked', false);
                    })
                    $("div.fluid-select-div").find(".color-mark-field").removeClass("selected").addClass("unselected");
                }
                var $this = $(this.parentElement.parentElement.parentElement);
                $this.prev(".option-to-select").find(".color-mark-field").removeClass("selected");
                $this.prev(".option-to-select").find(".color-mark-field").addClass("unselected");
                //// СНИМАЕМ ОГРАНИЧЕНИЯ ДАВЛЕНИЯ при снятии выбора присоединения
                low_press = -101;       // начало диапазона избыт, кПа
                hi_press = 100000;      // конец диапазона избыт, кПа
                min_range = main_dev=="apc-2000" ? 0.1 : 2.5;        // мин ширина диапазона избыт, кПа
                low_press_abs = 0;      // начало диапазона абс, кПа
                hi_press_abs = 10000;    // конец диапазона абс, кПа
                min_range_abs = main_dev=="apc-2000" ? 10 : 20.0;   // мин ширина диапазона абс, кПа
                document.getElementById("range_warning1").innerHTML = low_press.toLocaleString() + " ... " + hi_press.toLocaleString() + " кПа и минимальная ширина " + min_range + "кПа (избыточное давление).";
                document.getElementById("range_warning2").innerHTML = low_press_abs.toLocaleString() + " ... " + hi_press_abs.toLocaleString() + " кПа и минимальная ширина " + min_range_abs + "кПа (абсолютное давление).";;
                console.log("33");
            }
            if (this.name=="connection-type" || this.name=="minus-connection-type"){
                $("input[name="+ $(this).prop("id").slice(0,-5) +"]:checked").prop('checked', false);
                $('.' + this.name.slice(0,-15) + 'thread-flange-hygienic').hide(0);
                console.log("4");
                $("div.option-to-select.fluid-select-div").each(function(){
                    $(this).prop("style", "display: none").removeClass("active-option-to-select");
                    $(this).next("div.option-to-select-list").prop("style", "display: none").removeClass("active-option-to-select-list");
                });
                $("input[name=fluid]").each(function(){
                    $(this).prop('checked', false);
                })
                $("div.fluid-select-div").find(".color-mark-field").removeClass("selected").addClass("unselected");
            }
            disable_invalid_options();
            console.log("5");
            return;
        }

        if (this.name=="sensor-type"){/// ПРИ ВЫБОРЕ ТЕРМОПАРЫ ИЛИ ТЕРМОСОПРОТИВЛЕНИЯ ПОКАЗЫВАЕМ их список, СКРЫВАЕМ И СБРАСЫВАЕМ ОСТАЛЬНОЕ, ОТМЕТКУ КРАСНЫМ
            $(this).closest("div.option-to-select-list").prev("div.option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
            $(".thermoresistor-thermocouple").find("label").prop('style', 'display:block')
            $("#sensor-quantity-span").prop('style', 'display:none');
            $("#sensor-accuracy-tc-span").prop('style', 'display:none');
            $("#sensor-accuracy-tr-span").prop('style', 'display:none');
            $("#sensor-wiring-tr-span").prop('style', 'display:none');
            $("select#sensor-quantity option[value='not_selected']").prop('selected', true);
            $("select#sensor-accuracy-tc option[value='not_selected']").prop('selected', true);
            $("select#sensor-accuracy-tr option[value='not_selected']").prop('selected', true);
            $("select#sensor-wiring-tr option[value='not_selected']").prop('selected', true);
            let target = $('#' + $(this).prop("id").slice(0,-5) + '-select');
            console.log("show-hide sensors list");
            $(".thermoresistor-thermocouple").find("input:checkbox:checked").prop('checked', false);
            if ($("#sensor-type-select input:checkbox:checked").length==0){
                $('.thermoresistor-thermocouple').hide(0);
                console.log("9");
            }else{
                $('.thermoresistor-thermocouple').not(target).hide(0);
                target.fadeIn(500);
                console.log("10");
            }
            $("#quantity-accuracy-wiring").slideUp();
            disable_invalid_options();
            return;
        }
        if (this.name=="thermoresistor" || this.name=="thermocouple"){ //После выбора терморезистора или термопары СКРЫТЬ НЕ ВЫБРАННЫЕ, отобразить остальные опции
            $("div[id^='err_']:visible").each(function(){  ////ПРЯЧЕМ ВСЕ ERR_CANCEL ЧЕКБОКСЫ
                $(this).slideUp();//.prop("style", "display:none");
            })
            $("input[name=" + this.name + "]:not(:checked)").each(function(){
                $("label[for="+$(this).prop('id')+"]").slideUp(); //.prop("style", "display:none");
            })
            $("span."+ this.name).each(function(){
                $(this).prop("style", "display:block");
            })
            $("#quantity-accuracy-wiring").slideDown();//.prop("style", "display:block");
            showHideSensorOpts();
            return;
        }

        if(this.name=="ctr-electrical"){
            console.log("отобразить head или nohead или cabel");
            let target = $('#' + $(this).prop("id").slice(0,-5) + '-select');
            $(this).closest("div.active-option-to-select-list").prev("div.option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
            $(".head-nohead-cabel").find("input:checkbox:checked").prop('checked', false);
            if ($("#ctr-electrical-select input:checkbox:checked").length==0){
                $('.head-nohead-cabel').hide(0);
                console.log("ctr-electrical");
            }else{
                $('.head-nohead-cabel').not(target).hide(0);
                target.fadeIn(500);
            }
            if ($(this).val()=="cabel"){
                console.log("Показать выбор типа и длины кабеля");
                $("#ctr-cabel-type-select-div").prop("style", "display:block").addClass("active-option-to-select");
                $("#ctr-cabel-type-select").addClass("active-option-to-select-list");
            }else{
                console.log("Скрыть выбор длины кабеля");
                $("#ctr-cabel-type-select-div").prop("style", "display:none").removeClass("active-option-to-select");
                $("#ctr-cabel-type-select").removeClass("active-option-to-select-list").prev("div.option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
                $("input[name=ctr-cabel-type]:checked").prop("checked", false);
                $("#ctr-cabel-length-span").prop("style", "display:none");
                $("input[id=ctr-cabel-length]").prop("value", "");
            }
            disable_invalid_options();
            return;
        }

        if(this.name=="head" || this.name=="nohead" || this.name=="cabel"){//ПРИ ВЫБОРЕ СКРЫТЬ СПИСОК, ПОКАЗАТЬ СЛЕДУЮЩИЙ
            if ($(this).prop("id")=="ctr-ALW"){
                $(this).closest("div.active-option-to-select-list").prev("div.option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
                $("#sensor-quantity option[value=1]").prop('selected', true);
                $("#sensor-accuracy-tr option[value=A]").prop('selected', true);
                $("#sensor-accuracy-tc option[value=1]").prop('selected', true);
                disable_invalid_options();
                return;
            }
            expand_next_div($(this).prop("id"));
            disable_invalid_options();
            return;
        }

        if (this.name=="ctr-ALW-type"){
            expand_next_div("ctr-ALW");
            disable_invalid_options();
            return;
        }

        if (this.name=="ctr-cabel-type"){//ПОКАЗАТЬ ВЫБОР ДЛИНЫ КАБЕЛЯ
            console.log("показать длину и пометку красным");
            $(this).closest("div.active-option-to-select-list").prev("div.active-option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
            $("#ctr-cabel-length-span").prop("style", "display:block");
            $("input[id=ctr-cabel-length]").prop("value", "");
            disable_invalid_options();
            return;
        }

        if (this.name=="ctr-connection-type" && $(this).prop("id")!="ctr-no-connection"){ ///ПОКАЗАТЬ ВЫБОР ПРИСОЕДИНЕНИЯ CTR, скрыть другие, пометить красным
            console.log("ПОКАЗАТЬ ВЫБОР ПРИСОЕДИНЕНИЯ CTR");
            let target = $(this).prop("id").slice(0,-4) + "select";
            $("div.ctr-thread-flange-hygienic").each(function(){
                if ($(this).prop("id")!=target){
                    $(this).prop("style", "display:none");
                    $(this).find("select option[value='not_selected']").prop('selected', true);
                }else{
                    $(this).prop("style", "display:block").prop("style", "margin-top: 0.4em").prop("style", "margin-bottom: 0.4em");
                }
            })
            $("#"+$(this).prop("id").slice(0,-4)+"select").prop("style", "display:block");
            $(this).closest("div.active-option-to-select-list").prev("div.active-option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
            disable_invalid_options();
            return;
        }
        if (this.name=="ctr-connection-type" && $(this).prop("id")=="ctr-no-connection"){
            $("input#ctr-outlength").prop('value', '0');
            $("div.ctr-thread-flange-hygienic").each(function(){
                $(this).prop("style", "display:none");
                $(this).find("select option[value='not_selected']").prop('selected', true);
            })
        }

        if (this.name=="thread" || this.name=="flange" || this.name=="hygienic" || this.name=="minus-thread" || this.name=="minus-flange" || this.name=="minus-hygienic") {///СКРЫВАЕМ ВЫБОР ПРИСОЕДИНЕНИЯ И ПОМЕЧАЕМ ЗЕЛЕНЫМ
            /// ПОКАЗАТЬ ВЫБОР МАНОМЕТРИЧЕСКОЙ ЖИДКОСТИ
            if ($(this).prop('id').startsWith('s_') || $(this).prop('id').startsWith('minus-s_')){
                // console.log("ПОКАЗАТЬ выбор манометрической жидкости при выборе");
                $("div.option-to-select.fluid-select-div").each(function(){
                    $(this).prop("style", "display: block").addClass("active-option-to-select");
                    $(this).next("div.option-to-select-list").addClass("active-option-to-select-list");
                });
            }else{
                let condition = true;
                for (let plmin of ["","minus-"]){          //////// Ищем отмеченные разделители
                    for (let cons of ["thread", "flange", "hygienic"]){
                        if (typeof $("input[name=" + plmin + cons + "]:checked").prop("id")!='undefined' && $("input[name=" + plmin + cons + "]:checked").prop("id").startsWith(plmin + "s_")){
                            condition = false;
                        }
                    }
                }
                if(condition===true){
                    // console.log("СКРЫТЬ выбор манометрической жидкости при выборе если нет других выбранных разделителей");
                    $("div.option-to-select.fluid-select-div").each(function(){
                        $(this).prop("style", "display: none").removeClass("active-option-to-select");
                        $(this).next("div.option-to-select-list").prop("style", "display: none").removeClass("active-option-to-select-list");
                    });
                    $("input[name=fluid]").each(function(){
                        $(this).prop('checked', false);
                    })
                    $("div.fluid-select-div").find(".color-mark-field").removeClass("selected").addClass("unselected");
                }
            }
            let add_n = this.name.startsWith("minus") ? "minus-" : "";
            if ($(this).prop("id")=="s_t_dn50" || $(this).prop("id")=="s_t_dn80" || $(this).prop("id")=="s_t_dn100" || $(this).prop("id")=="s_tk_wash_dn100" || $(this).prop("id")=="minus-s_t_dn50" || $(this).prop("id")=="minus-s_t_dn80" || $(this).prop("id")=="minus-s_t_dn100" || $(this).prop("id")=="minus-s_tk_wash_dn100"){
                let target = $(this).prop("id")  + "-cilinder-select";
                console.log(add_n);
                console.log(target);
                $("#" + add_n + "flange-select-field > span").each(function(){
                    if ($(this).prop("id")!=target){
                        $(this).prop("style", "display: none");
                        $(this).find("select option[value='not_selected']").prop('selected', true);
                        // console.log('Установка длины тубуса как не выбрано при переключении на другой');
                    }else{
                        $(this).prop("style", "display: inline");
                    }
                })
                disable_invalid_options();
                console.log("13");
                return;
            }else{
                let num = $("body .active-option-to-select").index($(".active")) + 1;
                let next_expand = $("body .active-option-to-select").eq(num);
                $("#" + add_n + "flange-select-field > span").each(function(){
                    $(this).prop("style", "display:none");
                    $(this).find("select option[value='not_selected']").prop('selected', true);
                })
                var $this = $(this.parentElement.parentElement.parentElement).prev();
                $this.removeClass("active");
                $this.next("div.option-to-select-list").slideUp("slow");
                $this.find(".color-mark-field").removeClass("unselected");
                $this.find(".color-mark-field").addClass("selected");
                next_expand.addClass("active");
                next_expand.next().slideToggle("slow");
                disable_invalid_options();
                console.log("6");
                return;
            }
        }

        if ($(this).val()=="capillary") { // ПОКАЗЫВАЕМ ВЫБОР ДЛИНЫ КАПИЛЛЯРА
            let target_name = $(this.parentElement).prop("id").slice(0,-12);
            let data = $(this.parentElement).prop("id").slice(4,-13);
            data = data =="minus" ? "minus" : "";
            uncheckAllConnections(data);
            document.getElementById(target_name + "radiator-select").hidden = true;
            document.getElementById(target_name + "length-span").hidden = false;
            document.getElementById(target_name + "radiator-select-err").hidden = true;
            var $this = $(this.parentElement.parentElement);
            $this.prev(".option-to-select").find(".color-mark-field").removeClass("selected");
            $this.prev(".option-to-select").find(".color-mark-field").addClass("unselected");
            $("input[name=" + target_name + "mes-env-temp]").val("");
            disable_invalid_options();
            console.log("7");
            return;
        }

        if ($(this).val()=="direct" && !$("#25-max-static").is(":checked")) { // ПОКАЗЫВАЕМ ВЫБОР РАДИАТОРА
            let target_name = $(this.parentElement).prop("id").slice(0,-12);
            let data = $(this.parentElement).prop("id").slice(4,-13);
            data = data =="minus" ? "minus" : "";
            uncheckAllConnections(data);
            // console.log(target_name);
            document.getElementById(target_name + "radiator-select").hidden = false;
            document.getElementById(target_name + "length-span").hidden = true;
            document.getElementById(target_name + "length-span-err").hidden = true;
            var $this = $(this.parentElement.parentElement);
            $this.prev(".option-to-select").find(".color-mark-field").removeClass("selected");
            $this.prev(".option-to-select").find(".color-mark-field").addClass("unselected");
            $("input[name=" + target_name + "capillary-length]").val("");
            disable_invalid_options();
            console.log("12");
            return;
        }
        if ($(this).val()=="direct" && $("#25-max-static").is(":checked")){
            let target_name = $(this.parentElement).prop("id").slice(0,-12);
            document.getElementById(target_name + "length-span").hidden = true;
            document.getElementById(target_name + "length-span-err").hidden = true;
            console.log("ВКЛЮЧИТЬ ТИП С!!!!!!!!!!!!!!!!");
            if ($("#c-pr").prop("checked", false)){CorPSelected("c-pr", true);}

        }

        if (this.name=="connection-type" || this.name=="minus-connection-type") { //// ПОКАЗЫВАЕМ ВЫБОР ДОСТУПНЫХ РАЗМЕРОВ РЕЗЬБЫ ИЛИ ФЛАНЦА ИЛИ ГИГИЕНИЧЕСКОГО ПРИСОЕДИНЕНИЯ
            let target = $('#' + $(this).prop("id").slice(0,-5) + '-select');
            console.log("8");
            let add_name= this.name.slice(0,-15);
            var $this = $(this.parentElement.parentElement);
            $this.prev(".option-to-select").find(".color-mark-field").removeClass("selected");
            $this.prev(".option-to-select").find(".color-mark-field").addClass("unselected");
            $("." + add_name + "thread-flange-hygienic").find("input:checkbox:checked").prop('checked', false);
            disable_invalid_options();
            if ($("#" + add_name + "connection-type-select input:checkbox:checked").length==0){
                $('.' + add_name + 'thread-flange-hygienic').hide(0);
                console.log("9");
            }else{
                $('.' + add_name + 'thread-flange-hygienic').not(target).hide(0);
                target.fadeIn(500);
                console.log("10");
            }
        }
        else{
            document.getElementById("cap-or-not-length-span-err").hidden = true;
            var $this = $(this.parentElement.parentElement);
            let num = $("body .active-option-to-select").index($(".active")) + 1;
            let next_expand = $("body .active-option-to-select").eq(num);
            $this.slideToggle("slow").siblings("div.option-to-select-list").slideUp("slow");
            $this.prev(".option-to-select").removeClass("active");
            $this.prev(".option-to-select").find(".color-mark-field").removeClass("unselected");
            $this.prev(".option-to-select").find(".color-mark-field").addClass("selected");
            next_expand.addClass("active");
            next_expand.next().slideToggle("slow");
            disable_invalid_options();
            console.log("11");
        }
    })
})

function range_selected(){ //ПРОВЕРКА ДИАПАЗОНА + СКРЫВАЕТ ДИАПАЗОН ЕСЛИ ВСЕ ОК
    let begin_range = parseFloat(document.querySelector("#begin-range").value);
    let end_range = parseFloat(document.querySelector("#end-range").value);
    let units = document.querySelector("#pressure-unit-select").value;
    let press_type = document.querySelector("#pressure-type").value;
    if (units!='not_selected' && press_type!='not_selected' && !Number.isNaN(begin_range) && !Number.isNaN(end_range) && end_range!=begin_range){
        let full_conf = get_full_config();
        let num = $("body .active-option-to-select").index($(".active")) + 1;
        let next_expand = $("body .active-option-to-select").eq(num);

        if (press_type == "" && full_conf.get("begin_range_kpa")>=low_press && full_conf.get("end_range_kpa")<=hi_press && full_conf.get("range")>=min_range){
            next_expand.addClass("active").next().slideToggle("slow");
            $("#range-select").prev().removeClass("active");
            $("#range-select").prev().find(".color-mark-field").removeClass("unselected");
            $("#range-select").prev().find(".color-mark-field").addClass("selected");
            $("#range-select").slideUp("slow");
            disable_invalid_options();
            return;
        }
        if (press_type == "ABS" && full_conf.get("begin_range_kpa")>=low_press_abs && full_conf.get("end_range_kpa")<=hi_press_abs && full_conf.get("range")>=min_range_abs){
            next_expand.addClass("active").next().slideToggle("slow");
            $("#range-select").prev().removeClass("active");
            $("#range-select").prev().find(".color-mark-field").removeClass("unselected");
            $("#range-select").prev().find(".color-mark-field").addClass("selected");
            $("#range-select").slideUp("slow");
            disable_invalid_options();
            return;
        }
        if(press_type == "diff" && full_conf.get("begin_range_kpa")>=low_press_diff && full_conf.get("end_range_kpa")<=hi_press_diff && full_conf.get("range")>=min_range_diff){
            next_expand.addClass("active").next().slideToggle("slow");
            $("#range-select").prev().removeClass("active");
            $("#range-select").prev().find(".color-mark-field").removeClass("unselected");
            $("#range-select").prev().find(".color-mark-field").addClass("selected");
            $("#range-select").slideUp("slow");
            disable_invalid_options();
            return;
        }
        else{
            $("#range-select").prev().find(".color-mark-field").removeClass("selected");
            $("#range-select").prev().find(".color-mark-field").addClass("unselected");
            document.getElementById("codeError").innerHTML = "Код заказа некорректный или неполный";
            document.getElementById("code").value = "";
            try{
                document.querySelector("table").remove();
            }catch (err){console.log(err);}
            return;
            // disable_invalid_options();
        }
    }else{
        $("#range-select").prev().find(".color-mark-field").removeClass("selected");
        $("#range-select").prev().find(".color-mark-field").addClass("unselected");
        document.getElementById("codeError").innerHTML = "Код заказа некорректный или неполный";
        document.getElementById("code").value = "";
        try{
            document.querySelector("table").remove();
        }catch (err){console.log(err);}
        return;
        // disable_invalid_options();
    }

}


$(function(){  //// СКРЫВАЕТ ДАННУЮ ОПЦИЮ и ОТОБРАЖАЕТ СЛЮДУЮЩУЮ ПРИ НАЖАТИИ НА КНОПКУ ОК ПРИ ВВОДЕ ДЛИНЫ КАПИЛЛЯРА
    $("input[id*=capillary-length-button-ok]").click(function(){
        let num = $("body .active-option-to-select").index($(".active")) + 1;
        let next_expand = $("body .active-option-to-select").eq(num);
        let target_name = $(this).prop("id").slice(0,-26);
        let capillary_length = parseInt(document.getElementById(target_name + "capillary-length").value);
        if (Number.isNaN(capillary_length)){
            document.getElementById(target_name + "length-span-err").hidden = false;
            return;
        }if (capillary_length < 1 || capillary_length > 9){
            document.getElementById(target_name + "length-span-err").hidden = false;
            return;
        }else{
            document.getElementById(target_name + "length-span-err").hidden = true;
            $("#" + target_name + "select").prev().removeClass("active");
            $("#" + target_name + "select").prev().find(".color-mark-field").removeClass("unselected");
            $("#" + target_name + "select").prev().find(".color-mark-field").addClass("selected");
            $("#" + target_name + "select").slideToggle("slow");
            next_expand.addClass("active");
            next_expand.next().slideToggle("slow");
            disable_invalid_options();
        }
    })
})


$(function(){  //// СКРЫВАЕТ ДАННУЮ ОПЦИЮ и ОТОБРАЖАЕТ СЛЮДУЮЩУЮ ПРИ НАЖАТИИ НА КНОПКУ ОК при выборе РАДИАТОРА
    $("input[id*=radiator-select-button-ok]").click(function(){
        let num = $("body .active-option-to-select").index($(".active")) + 1;
        let next_expand = $("body .active-option-to-select").eq(num);
        let target_name = $(this).prop("id").slice(0,-25);
        let max_temp = parseInt(document.querySelector("#" + target_name + "mes-env-temp").value);
        let min = parseInt($("input[name=" + target_name + "mes-env-temp]").prop('min'));
        let max = parseInt($("input[name=" + target_name + "mes-env-temp]").prop('max'));
        if (Number.isNaN(max_temp) || max_temp>max || max_temp<min){
            document.getElementById(target_name + "radiator-select-err").hidden = false;
            $("#" + target_name + "select").prev().find(".color-mark-field").addClass("unselected");
            $("#" + target_name + "select").prev().find(".color-mark-field").removeClass("selected");
            return;
        }else{
            document.getElementById(target_name + "radiator-select-err").hidden = true;
            $("#" + target_name + "select").prev().removeClass("active");
            $("#" + target_name + "select").prev().find(".color-mark-field").removeClass("unselected");
            $("#" + target_name + "select").prev().find(".color-mark-field").addClass("selected");
            $("#" + target_name + "select").slideToggle("slow");
            next_expand.addClass("active");
            next_expand.next().slideToggle("slow");
            disable_invalid_options();
        }
    })
})

$(function(){
    $("input[id*=capillary-length]").change(function(){
        let target_name = $(this).prop("id").slice(0,-16);
        console.log(target_name);
        let max_temp = parseInt(document.querySelector("#" + target_name + "capillary-length").value);
        let min = parseInt($("input[name=" + target_name + "capillary-length]").prop('min'));
        let max = parseInt($("input[name=" + target_name + "capillary-length]").prop('max'));
        if (Number.isNaN(max_temp) || max_temp>max || max_temp<min){
            document.getElementById(target_name + "length-span-err").hidden = false;
            $("#" + target_name + "select").prev().find(".color-mark-field").addClass("unselected");
            $("#" + target_name + "select").prev().find(".color-mark-field").removeClass("selected");
            return;
        }else{
            document.getElementById(target_name + "length-span-err").hidden = true;
            $("#" + target_name + "select").prev().find(".color-mark-field").removeClass("unselected");
            $("#" + target_name + "select").prev().find(".color-mark-field").addClass("selected");
            disable_invalid_options();
        }
    })
})

$(function(){
    $("input[name*=mes-env-temp]").change(function(){
        let max_temp = parseInt($(this).val());
        let temp_name = this.name.slice(0,-13);
        let min = parseInt($("input[name="+ temp_name +"-mes-env-temp]").prop('min'));
        let max = parseInt($("input[name="+ temp_name +"-mes-env-temp]").prop('max'));
        if (Number.isNaN(max_temp) || max_temp>max || max_temp<min){
            document.getElementById(temp_name +"-radiator-select-err").hidden = false;
            $("#"+ temp_name +"-select").prev().find(".color-mark-field").addClass("unselected");
            $("#"+ temp_name +"-select").prev().find(".color-mark-field").removeClass("selected");
            return;
        }else{
            document.getElementById(temp_name +"-radiator-select-err").hidden = true;
            $("#"+ temp_name +"-select").prev().find(".color-mark-field").removeClass("unselected");
            $("#"+ temp_name +"-select").prev().find(".color-mark-field").addClass("selected");
            disable_invalid_options();
        }
    })
})

$(function(){
    $("select[id*='cilinder-length']").change(function(){
        if ($(this).val()!="not_selected"){
            var $this = $(this.parentElement.parentElement.parentElement.parentElement).prev();
            $this.removeClass("active");
            $this.next("div.option-to-select-list").slideUp("slow");
            $this.find(".color-mark-field").removeClass("unselected");
            $this.find(".color-mark-field").addClass("selected");
            $("div#special-select").slideDown("Slow");
            $("div#special-select").prev("div").addClass("active");
            disable_invalid_options();
            console.log("14");
            return;
        }else{
            var $this = $(this.parentElement.parentElement.parentElement.parentElement).prev();
            $this.find(".color-mark-field").addClass("unselected");
            $this.find(".color-mark-field").removeClass("selected");
            disable_invalid_options();
            console.log("15");
        }
    })
})
$(function(){
    $(".main-dev").click(function(){/// ПРИ ВЫБОРЕ ТИПА ПРИБОРА ОТОБРАЗИТЬ ТОЛЬКО НУЖНЫЕ option to select
        $("#advanced-code-descr").prop("style", "display:none");
        $(this.parentElement).slideUp("slow");
        $(this).addClass("main-dev-selected");
        $(this).siblings(".main-dev").removeClass("main-dev-selected");
        $("."+$(".main-dev-selected").prop("id").slice(9,)+"-panel-container").addClass("active-panel-container");
        // console.log($(".main-dev-selected").prop("id").slice(9,));
        if ($(".main-dev-selected").prop("id").slice(9,)=="pr-28"){
            for (let cons of ["minus-thread", "minus-flange", "minus-hygienic"]){
                $("input[name="+cons+"]").each(function(){
                    if ($(this).prop("id").startsWith("minus-s_")){
                        $(this).prop("style", "display:none");
                        $("label[for="+$(this).prop('id')+"]").prop("style", "display:none");
                    }
                })
            }
            $("label[for=capillary-cap-minus]").prop("style", "display:none");
            $("label[for=minus-hygienic-list]").prop("style", "display:none");
        }else{
            for (let cons of ["minus-thread", "minus-flange", "minus-hygienic"]){
                $("input[name="+cons+"]").each(function(){
                    if ($(this).prop("id").startsWith("minus-s_")){
                        // $(this).prop("style", "display:block");
                        $("label[for="+$(this).prop('id')+"]").prop("style", "display:block");
                    }
                })
            }
            $("label[for=capillary-cap-minus]").prop("style", "display:block");
            $("label[for=minus-hygienic-list]").prop("style", "display:block");
        }
        if ($(".main-dev-selected").prop("id").slice(9,)=="pr-28" || $(".main-dev-selected").prop("id").slice(9,)=="apr-2000"){
            $("#con_header_plus").prop("hidden", false);
        }else{
            $("#con_header_plus").prop("hidden", true);
        }
        // console.log($("div.option-to-select." + $(".main-dev-selected").prop("id").slice(9,)));
        $("div.option-to-select." + $(".main-dev-selected").prop("id").slice(9,)).each(function(){
            $(this).prop("style", "display: block");
            $(this).addClass("active-option-to-select");
            $(this).next("div.option-to-select-list").addClass("active-option-to-select-list");
        })

        let ctr_materials = ["aisi304", "aisi310", "aisi316", "aisi321", "inconel", "ceramic",  "sialon"]
        if ($(".main-dev-selected").prop("id").slice(9,)=="ctr"){
            $("#pressure-material-header").prop("style", "display:none");
            $("#ctr-material-header").prop("style", "display:block");
            $("input[name=material]").next("label").each(function(){
                if (ctr_materials.includes($(this).prop("for"))){
                    $(this).prop("style", "display:block");
                }else{
                    $(this).prop("style", "display:none");
                }
            })

        }else{
            $("#pressure-material-header").prop("style", "display:block");
            $("#ctr-material-header").prop("style", "display:none");
            $("input[name=material]").next("label").each(function(){
                if (ctr_materials.includes($(this).prop("for"))){
                    $(this).prop("style", "display:none");
                }else{
                    $(this).prop("style", "display:block");
                }
            })
            $("label[for=aisi316]").prop("style", "display:block");
        }

        $("."+$(".main-dev-selected").prop("id").slice(9,)+"-panel-container").slideDown("slow");
        setTimeout(() => {  $($(".active-option-to-select-list")[0]).slideDown("slow"); }, 300);
        $($(".active-option-to-select-list")[0]).prev("div").addClass("active");
        disable_invalid_options();
    })
})

$(function(){       // ПРИ ВОЗВРАТЕ В ГЛАВНОЕ МЕНЮ
    $(".back-to-main-dev-select").click(function(){
        if ($("div.color-mark-field.selected").length>0){
            $( "#dialog-confirm" ).dialog({
                resizable: false,
                height: "auto",
                width: 600,
                modal: true,
                dialogClass: 'custom-ui-widget-header-warning',
                buttons: {
                    Продолжить: function() {
                        $(".active-panel-container").slideUp("slow");
                        $("#main-dev-select").slideDown("slow");
                        $(".active-panel-container").removeClass("active-panel-container");
                        resetConfig();
                        $("div.option-to-select.active").next("div.option-to-select-list").slideUp("slow");
                        $("div.option-to-select.active").removeClass("active");
                        $( this ).dialog( "close" );
                        $("#approval-select").slideUp("slow");
                        $("div.option-to-select").each(function(){
                            $(this).prop("style", "display:none");
                        })
                        $("div.active-option-to-select").removeClass("active-option-to-select");
                        $("div.active-option-to-select-list").removeClass("active-option-to-select-list");
                        // setTimeout(() => {  $("#advanced-code-descr").prop("style", "display:block"); }, 600);
                    },
                    Отмена: function() {
                        $( this ).dialog( "close" );
                    }
                }
            })
        }else{
            $(".active-panel-container").slideUp("slow");
            $("#main-dev-select").slideDown("slow");
            $(".active-panel-container").removeClass("active-panel-container");
            resetConfig();
            $("div.option-to-select.active").next("div.option-to-select-list").slideUp("slow");
            $("div.option-to-select.active").removeClass("active");
            $("#approval-select").slideUp("slow");
            $("div.option-to-select").each(function(){
                $(this).prop("style", "display:none");
            })
            $("div.active-option-to-select").removeClass("active-option-to-select");
            $("div.active-option-to-select-list").removeClass("active-option-to-select-list");
            // setTimeout(() => {  $("#advanced-code-descr").prop("style", "display:block"); }, 600);
        }
    })
})

function resetConfig(){///СБРОС КОНФИГУРАТОРА
    console.log("СБРОС КОНФИГУРАТОРА");
    for (let classes of ['.thread-flange-hygienic', '.minus-thread-flange-hygienic', '.thermoresistor-thermocouple', '.head-nohead-cabel']) {
        $(classes).hide(0);
    }
    $('body input:checkbox:checked').each(function(){
        $(this).prop("checked", false);
    })
    $('body input:checkbox:disabled').each(function(){
        $(this).prop("disabled", false);
    })
    for (let ids of ["cap-or-not-radiator-select", "cap-plus-radiator-select", "cap-minus-radiator-select", "cap-or-not-length-span", "cap-plus-length-span", "cap-minus-length-span", "cap-or-not-radiator-select-err", "cap-plus-radiator-select-err", "cap-minus-radiator-select-err", "cap-or-not-length-span-err", "cap-plus-length-span-err", "cap-minus-length-span-err"]){
        document.getElementById(ids).hidden = true;
    }
    for (let ids of ["ctr-flange-select", "ctr-thread-select", "ctr-hygienic-select", "quantity-accuracy-wiring"]){
        $("#"+ids).prop("style", "display:none");
    }
    $("select option[value='not_selected']").each(function(){
        $(this).prop('selected', true);
    })
    $(":input[type=number]").each(function(){
        $(this).prop('value', '');
    })
    $("div.color-mark-field").each(function(){
        $(this).removeClass("selected").addClass("unselected");
    })
    $("div.option-to-select-list").each(function(){
        $(this).prop("style", "display:none");
    })
    $("label").removeClass('disabled');
    $("#code-entered-button-ok").prop("style", "display:inline-block");
    $("#reset-config").prop("style", "display:none");
    document.getElementById("code").value = "";
    document.getElementById("codeError").innerHTML = "";
    document.getElementById("codeDescription").innerHTML = "";
    setTimeout(() => {  $($(".active-option-to-select-list")[0]).slideDown("slow"); }, 300);
    $($(".active-option-to-select-list")[0]).prev("div").addClass("active");
}


function MaxStaticChecked(){

    if (($("input[name=max-static]:checked").val()=="25" && $("input#minus-c-pr").is(":checked")) || ($("input[name=max-static]:checked").val()=="4" && $("input#minus-P").is(":checked"))){
        // console.log("НЕ СНИМАТЬ ОТМЕТКУ ПРИСОЕДИНЕНИЯ!");
        document.getElementById("cap-plus-length-span-err").hidden = true;
        document.getElementById("cap-plus-length-span").hidden = true;
        document.getElementById("cap-minus-length-span-err").hidden = true;
        document.getElementById("cap-minus-length-span").hidden = true;
    }
    else{
        for (let plmin of ["","minus-"]){          ////////СНЯТЬ ОТМЕТКИ СО ВСЕХ ПРИСОЕДИНЕНИЙ
            for (let cons of ["thread", "flange", "hygienic", "connection-type"]){
                $("input[name=" + plmin + cons + "]").each(function(){
                    $(this).prop('checked', false);
                })
                $("#"+ plmin + cons + "-select").prev(".option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
            }
            $("#" + plmin + "flange-list").prop('checked', false);
        }

        $('.thread-flange-hygienic').hide(0);
        $('.minus-thread-flange-hygienic').hide(0);
        $("#cap-plus-select").prev(".option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
        $("#cap-minus-select").prev(".option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
        $("#direct-cap-plus").prop('checked', false).prop('disabled', false);
        $("#direct-cap-minus").prop('checked', false).prop('disabled', false);
        $("#capillary-cap-plus").prop('checked', false).prop('disabled', false);
        $("#capillary-cap-minus").prop('checked', false).prop('disabled', false);

    }

    var $this = $("#max-static-select");
    let num = $("body .active-option-to-select").index($(".active")) + 1;
    let next_expand = $("body .active-option-to-select").eq(num);
    $this.slideToggle("slow").siblings("div.option-to-select-list").slideUp("slow");
    $this.prev(".option-to-select").removeClass("active");
    $this.prev(".option-to-select").find(".color-mark-field").removeClass("unselected");
    $this.prev(".option-to-select").find(".color-mark-field").addClass("selected");
    next_expand.addClass("active");
    next_expand.next().slideToggle("slow");
    console.log("max-static checked");

    if ($("input[name=max-static]:checked").length>0 && ($("input[name=max-static]:checked").val()=="32" || $("input[name=max-static]:checked").val()=="41"  || $("input[name=max-static]:checked").val()=="70")){/// ЕСЛИ MAX-STATIC равно 32,41,70 - откл все, кроме "С"
        console.log("ВКЛЮЧИТЬ ТИП С");
        for (let plmin of ["","minus-"]){////////присоединения плюс и минус полностью отметить ТИП С, отключить другие      ////////////////////////////////
            for (let cons of ["thread", "flange", "hygienic", "connection-type"]){
                $("input[name=" + plmin + cons + "]").each(function(){
                    $("label[for="+ $(this).prop("id") +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ ВАРИАНТЫ THREAD или FLANGE или HYGIENIC
                    $(this).prop('disabled', true);                                     //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                })
                $("#"+ plmin + cons + "-select").prev(".option-to-select").find(".color-mark-field").removeClass("unselected").addClass("selected");
            }
        }
        for (let plmin of ["","minus-"]){
            $('input#' + plmin + 'flange-list').prop('checked', true).prop('disabled', true);
            $('input#' + plmin + 'c-pr').prop('checked', true).prop('disabled', false);
            $('#' + plmin + 'flange-select').prop('style', "display=block");
            $("label[for="+ plmin +"c-pr]").removeClass('disabled');
            $("label[for="+ plmin +"flange-list]").removeClass('disabled');
        }
        $("#cap-plus-select").prev(".option-to-select").find(".color-mark-field").removeClass("unselected").addClass("selected");
        $("#cap-minus-select").prev(".option-to-select").find(".color-mark-field").removeClass("unselected").addClass("selected");
        $("#direct-cap-plus").prop('checked', true).prop('disabled', true);
        $("#capillary-cap-plus").prop('checked', false).prop('disabled', true);
        $("label[for=capillary-cap-plus]").addClass('disabled');
        $("#direct-cap-minus").prop('checked', true).prop('disabled', true);
        $("#capillary-cap-minus").prop('checked', false).prop('disabled', true);
        $("label[for=capillary-cap-minus]").addClass('disabled');
        $("input[name=material]").each(function(){///ДЕАКТИВАЦИЯ МАТЕРИАЛОВ ДЛЯ типа С
            if (!($(this).prop("id")=="aisi316" || $(this).prop("id")=="hastelloy" || $(this).prop("id")=="tantal")){
                $(this).prop("disabled", true);
                $("label[for="+ $(this).prop("id") +"]").addClass('disabled');
            }
        })
        document.getElementById("cap-plus-length-span-err").hidden = true;
        document.getElementById("cap-plus-length-span").hidden = true;
        document.getElementById("cap-minus-length-span-err").hidden = true;
        document.getElementById("cap-minus-length-span").hidden = true;
    }

    disable_invalid_options();
}

function uncheckAllConnections(plmin){////////СНЯТЬ ОТМЕТКИ СО ВСЕХ ПРИСОЕДИНЕНИЙ при снятии галки кап или директ
    if (plmin=="minus"){
        plminn = "minus-";
        $('.minus-thread-flange-hygienic').hide(0);
        $("#cap-minus-select").prev(".option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");

    }else{
        plminn = "";
        $('.thread-flange-hygienic').hide(0);
        $("#cap-plus-select").prev(".option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");

    }
    for (let cons of ["thread", "flange", "hygienic", "connection-type"]){
        $("input[name=" + plminn + cons + "]").each(function(){
            // $("label[for="+ $(this).prop("id") +"]").addClass('disabled');
            $(this).prop('checked', false);
        })
        $("#"+ plminn + cons + "-select").prev(".option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
    }
    $("#" + plminn + "flange-list").prop('checked', false);
}

$(function(){
    $(document).on("click", "label.disabled", function(){
        $("#err_" + $(this).prop('for')).prop("style", "display:block").siblings("div[id^='err_']").prop("style", "display:none");
        // $("#err_" + $(this).prop('for')).siblings("div[id^='err_']").prop("style", "display:none");
    }) ///////// ДОБАВИТЬ СКРЫТИЕ ДРУГИХ ВИДИМЫХ  div[id^='err_']")
})

$(function(){
    $(document).on("click", "input[name='err_cancel']", function(){
        let check_state = $(this).is(":checked");
        let $this_id = $(this).prop('id').slice(0,-14);
        if ($("#"+$this_id).prop('name')=="thermoresistor" || $("#"+$this_id).prop('name')=="thermocouple"){
            $("select#sensor-accuracy-tr option[value='not_selected']").prop('selected', true);
            $("select#sensor-accuracy-tc option[value='not_selected']").prop('selected', true);
            $(".thermoresistor-thermocouple").hide(0);
            $("#quantity-accuracy-wiring").hide(0);
            $("input[name=sensor-type]:checked").prop("checked", false);
        }
        if ($("#"+$this_id).prop('name')=="thermocouple"){
            $("select#sensor-accuracy-tc option[value='not_selected']").prop('selected', true);
        }
        if ( $this_id=="spec_lvk" && $("#spec_lvk:checked").prop('disabled')){///ПРИ ОТМЕНЕ ЗАБЛОКИРОВАННОГО Lvk из ДРУГОЙ ОПЦИИ
            console.log("КЛИК НА ЗАБЛОКИРОВАННЫЙ #spec_lvk");
            disableLvk();
            return;
        }
        // console.log($this_id);
        if ($this_id=="c-pr" || $this_id=="minus-c-pr"){
            CorPSelected("c-pr", false);
        }else{
            $("input#" + $this_id).prop("checked", check_state);
        }
        // console.log($(this).closest("div"));
        // console.log(document.getElementById($this_id).parentElement.parentElement.previousElementSibling.querySelector(".color-mark-field"));
        let $color_mark_field = document.getElementById($this_id).closest(".active-option-to-select-list").previousElementSibling.querySelector(".color-mark-field");
        let $this_checked_length = $("input[name="+$("input#" + $this_id).prop("name")+"]:checked").length;
        if ($this_checked_length == 0){
            $($color_mark_field).removeClass("selected").addClass("unselected");
        }else{
            $($color_mark_field).removeClass("unselected").addClass("selected");
        }
        disable_invalid_options();
    })
})

function uncheckRange(){
    document.getElementById("begin-range").value="";
    document.getElementById("end-range").value="";
    document.getElementById("pressure-unit-select").value="not_selected";
    $("#range-select").prev().find(".color-mark-field").removeClass("selected").addClass("unselected");
    disable_invalid_options();
}

function uncheckMaxTemp(data){
    console.log("uncheckMaxTemp: " + data);
    document.getElementById(data + "-mes-env-temp").value="";
    $("#" + data + "-select").prev().find(".color-mark-field").removeClass("selected").addClass("unselected");
    disable_invalid_options();
}

function showHideSensorOpts(){
    let no_check = false;
    $("#quantity-accuracy-wiring span:visible select").each(function(){
        if ($(this).val()=='not_selected'){
            no_check = true;
        }
    })
    if($("input[name=thermoresistor]:checked").length==0 && $("input[name=thermocouple]:checked").length==0){
        no_check = true;
    }
    if (no_check==true){///ЕСЛИ НЕ ВЫБРАНО КЛАСС, КОЛ_ВО , ПРОВОДА - STOP, пометить красным
        $("#quantity-accuracy-wiring").closest("div.option-to-select-list").prev("div.option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
        disable_invalid_options();
        return;
    }else{///ИНАЧЕ ПОМЕТИТЬ ЗЕЛЕНЫМ, СКРЫТЬ, ОТКРЫТЬ СЛЕД. РАЗДЕЛ
        expand_next_div("quantity-accuracy-wiring");
        disable_invalid_options();
        return;
    }
}

$(function(){ /// ПОКАЗАТЬ КАРТИНКУ ДЛЯ ВЫБИРАЕМОЙ ОПЦИИ ПРИ НАВЕДЕНИИ и УДЕРЖАНИИ
    var delayed_function;
    var delayed_function2
    var tooltip_id;
    var mouse;
    var img_path;
    $("div.option-to-select-list label.tooltiped").hover(function (e) {
        // over
            tooltip_id = $(this).prop("htmlFor");
            // console.log(`/images/tooltips/${tooltip_id}_tooltip.jpg`);
            img_path = `/images/tooltips/${tooltip_id}_tooltip.jpg`;// + ${/(jpg$|png$)/};
            mouse = $(this);
            $.ajax({
                type: "HEAD",
                url: img_path,
                data: "data",
                dataType: "dataType",
                success: function (response) {
                    delayed_function = setTimeout(function(){
                        // Calculate the position of the image tooltip
                        x = e.pageX - mouse.offset().left;
                        y = e.pageY - mouse.offset().top;
                        let tooltip = document.createElement('div');
                        tooltip.className = "tooltip";
                        tooltip.id = tooltip_id + "_tooltip";
                        document.querySelector("label[for="+tooltip_id+"]").appendChild(tooltip);
                        $("label[for="+tooltip_id+"]").css('z-index','999999');
                        $("#" + tooltip_id+ "_tooltip").css({'top':y - 80, 'left':x + 30, 'display':'block', 'position':'absolute', 'width':250, 'height':250, 'background':'#ffff url('+ img_path +') center no-repeat', 'background-size':'cover', 'box-shadow':'5px 5px 30px rgba(0, 0, 0, 1)', 'border-radius':'15px'});
                    }, 300);
                    delayed_function2 = setTimeout(() => $(".tooltip").each(function(){$(this).remove()}), 2500);
                },
            });
        }, function () {
            // out
            clearTimeout(delayed_function);
            clearTimeout(delayed_function2);
            $(".tooltip").each(function(){$(this).remove()});
            $(this).css('z-index','');
        }
    ).mousemove(function(e){
        // $(".tooltip").each(function(){
        //     $(this).remove();
        // })

        x = e.pageX - mouse.offset().left;
        y = e.pageY - mouse.offset().top;
        $("#" + tooltip_id+ "_tooltip").css({'top':y - 80, 'left':x + 30, 'display':'block', 'position':'absolute', 'width':250, 'height':250, 'background':'#eee url('+ img_path +') center no-repeat', 'background-size':'cover', 'box-shadow':'5px 5px 30px rgba(0, 0, 0, 1)', 'border-radius':'15px'});;

    })
})

$(function(){
    $("input[name=ctr-cabel-length]").change(function(){
        let cabel_length = parseInt($(this).val());
        if (Number.isNaN(cabel_length) || cabel_length<=0 || cabel_length>100 || $("input[name=ctr-cabel-type]:checked").length==0){
            $(this).closest("div.option-to-select-list").prev("div.option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
            return;
        }else{
            $(this).closest("div.option-to-select-list").prev("div.option-to-select").find(".color-mark-field").removeClass("unselected").addClass("selected");
            disable_invalid_options();
        }
    })
})

$(function(){
    $("input[id=ctr-cabel-length-button-ok]").click(function(){
        let cabel_length = parseInt($("input[name=ctr-cabel-length]").val());
        if (Number.isNaN(cabel_length) || cabel_length<=0 || cabel_length>100 || $("input[name=ctr-cabel-type]:checked").length==0){
            $(this).closest("div.option-to-select-list").prev("div.option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
            return;
        }else{
            expand_next_div("ctr-cabel-length-button-ok");
            disable_invalid_options();
        }
    })
})

function ctr_range_selected(){ /// ПРОВЕРКА ВЫБРАННОГО ДИАПАЗОНА ТЕМПЕРАТУРЫ CTR
    console.log("ctr_range_selected");
    let ctr_begin_range = parseInt($("#ctr-begin-range").val());
    let ctr_end_range = parseInt($("#ctr-end-range").val());
    let ctr_pressure = parseInt($("#ctr-pressure").val());
    if (Number.isNaN(ctr_begin_range) || Number.isNaN(ctr_end_range)){
        $("#ctr-range_warning").prop("style", "display:block");
        if ($("#err_ctr-range").children("input").length>0){
            $("#err_ctr-range").prop("style", "display:block");
        }
        $("#ctr-end-range").closest("div.active-option-to-select-list").prev(".active-option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
        disable_invalid_options();
        return;
    }
    if (!Number.isNaN(ctr_begin_range) && !Number.isNaN(ctr_end_range)){
        if(ctr_begin_range < ctr_low_temp || ctr_end_range > ctr_high_temp || ctr_begin_range > ctr_high_temp || ctr_end_range < ctr_low_temp || ctr_begin_range==ctr_end_range){
            // console.log("ДИАПАЗОН НЕ В ДОПУСКЕ!");
            $("#ctr-range_warning").prop("style", "display:block");
            if ($("#err_ctr-range").children("input").length>0){
                $("#err_ctr-range").prop("style", "display:block");
            }
            $("#ctr-end-range").closest("div.active-option-to-select-list").prev(".active-option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
            disable_invalid_options();
            return;
        }else{
            // console.log("ДИАПАЗОН В ДОПУСКЕ!");
            $("#ctr-range_warning").prop("style", "display:none");
            $("#err_ctr-range").prop("style", "display:none");
            disable_invalid_options();
        }
    }
    if (Number.isNaN(ctr_pressure)){
        $("#eerr_ctr-pressure").prop("style", "display:block");
        $("#ctr-end-range").closest("div.active-option-to-select-list").prev(".active-option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
        return;
    }else{
        $("#eerr_ctr-pressure").prop("style", "display:none");
    }
    expand_next_div("ctr-end-range");
    disable_invalid_options();
}

function expand_next_div(id){/// СКРЫТЬ ТЕКУЩИЙ СПИСОК, РАСКРЫТЬ СЛЕДУЮЩИЙ

    console.log("ФУНКЦИЯ expand_next_div");
    var $this = $("#" + id).closest("div.active-option-to-select-list");
    let num = $("body .active-option-to-select").index($(".active")) + 1;
    let next_expand = $("body .active-option-to-select").eq(num);
    $this.slideToggle("slow").siblings("div.active-option-to-select-list").slideUp("slow");
    $this.prev(".active-option-to-select").removeClass("active").find(".color-mark-field").removeClass("unselected").addClass("selected");
    next_expand.addClass("active").next().slideToggle("slow");
}

function checkCTRDimensions(){ /// ПРОВЕРКА РАЗМЕРОВ CTR
    let temp = !Number.isNaN(parseInt($("#ctr-end-range").val())) ? parseInt($("#ctr-end-range").val()) : 66;
    ctr_rec_outlength = 130*Math.log(temp)-550>ctr_min_outlength ? 130*Math.log(temp)-550 : ctr_min_outlength;
    let no_check = true;
    if (!Number.isNaN(parseInt($("#ctr-length").val())) && parseInt($("#ctr-length").val())>=ctr_min_length && parseInt($("#ctr-length").val())<=ctr_max_length){
        $("#ctr-length_warning").prop("style", "display:none");
    }else{
        $("#ctr-length").closest("div.active-option-to-select-list").prev(".active-option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
        document.getElementById("ctr-length_warning").innerHTML = `<img src='images/attention.png' style='width: 1.3em; height: 1.3em'> <span style='color:red; font-size: 85%;'>Допускается от ${ctr_min_length} до ${ctr_max_length} мм</span>`;
        $("#ctr-length_warning").prop("style", "display:block");
        no_check = false;
    }
    if (!Number.isNaN(parseInt($("#ctr-outlength").val())) && parseInt($("#ctr-outlength").val())>=ctr_min_outlength && parseInt($("#ctr-outlength").val())<=ctr_max_outlength){
        $("#ctr-outlength_warning").prop("style", "display:none");
    }else{
        $("#ctr-outlength").closest("div.active-option-to-select-list").prev(".active-option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
        let add_descrs = ($("#4_20").is(":checked") || $("#4_20H").is(":checked")) ? "Рекомендуется не менее " + Math.round(ctr_rec_outlength / 10) * 10 + " мм." : "";
        document.getElementById("ctr-outlength_warning").innerHTML = `<img src='images/attention.png' style='width: 1.3em; height: 1.3em'> <span style='color:red; font-size: 85%;'>Допускается от ${ctr_min_outlength} до ${ctr_max_outlength} мм. ${ add_descrs}</span>`;
        $("#ctr-outlength_warning").prop("style", "display:block");
        no_check = false;
    }
    if ($("#ctr-diameter").val()=="not_selected"){
        $("#ctr-outlength").closest("div.active-option-to-select-list").prev(".active-option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
        no_check = false;
    }
    if (no_check == false){
        $("#ctr-outlength").closest("div.active-option-to-select-list").prev(".active-option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
        // disable_invalid_options();
        return;
    }else{
        $("#ctr-outlength").closest("div.active-option-to-select-list").prev(".active-option-to-select").find(".color-mark-field").removeClass("unselected").addClass("selected");
        if ($("#ctr-dimensions-select").prev("div").hasClass("active")){
            expand_next_div("ctr-outlength");
        }
        // disable_invalid_options();
    }
}

function ctr_connection_selected(){
    if ($("#ctr-connection-type-select-field select:visible:has(option[value=not_selected]:selected)").length>0){
        $("#ctr-connection-type-select-field").closest("div.active-option-to-select-list").prev(".active-option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
        disable_invalid_options();
        return false;
    }else{
        $("#ctr-connection-type-select-field").closest("div.active-option-to-select-list").prev(".active-option-to-select").find(".color-mark-field").removeClass("unselected").addClass("selected");
        // expand_next_div("ctr-connection-type-select-field");
        disable_invalid_options();
        return true;
    }
}

function ctr_connection_button_ok(){
    let check = ctr_connection_selected();
    if (check == true){
        expand_next_div("ctr-connection-type-select-field");
    }
}

// $(function(){
//     $(document).on("change", {
//         // type: "change"
//     }, function (event, arg1) {
//         let err_count = $("#err_ctr-range").children("input").length;
//         console.log("Количество input: ", err_count);
//         return err_count;
//     })
// })

function ctrShowHideErrSpan(){ /// ПРОВЕРКА ВЫБРАННОГО ДИАПАЗОНА ТЕМПЕРАТУРЫ CTR
    console.log("ctrShowHideErrSpan");
    let ctr_begin_range = parseInt($("#ctr-begin-range").val());
    let ctr_end_range = parseInt($("#ctr-end-range").val());
    if (Number.isNaN(ctr_begin_range) || Number.isNaN(ctr_end_range)){
        $("#ctr-range_warning").prop("style", "display:block");
        if ($("#err_ctr-range").children("input").length>0){
            $("#err_ctr-range").prop("style", "display:block");
        }
        return;
    }
    if (!Number.isNaN(ctr_begin_range) && !Number.isNaN(ctr_end_range)){
        if(ctr_begin_range < ctr_low_temp || ctr_end_range > ctr_high_temp || ctr_begin_range > ctr_high_temp || ctr_end_range < ctr_low_temp || ctr_begin_range==ctr_end_range){
            // console.log("ДИАПАЗОН НЕ В ДОПУСКЕ!");
            $("#err_ctr-range").closest("div.active-option-to-select-list").prev("div.option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
            $("#ctr-range_warning").prop("style", "display:block");
            if ($("#err_ctr-range").children("input").length>0){
                $("#err_ctr-range").prop("style", "display:block");
            }
            return;
        }else{
            // console.log("ДИАПАЗОН В ДОПУСКЕ!");
            $("#err_ctr-range").closest("div.active-option-to-select-list").prev("div.option-to-select").find(".color-mark-field").removeClass("unselected").addClass("selected");
            $("#ctr-range_warning").prop("style", "display:none");
            $("#err_ctr-range").prop("style", "display:none");
        }
    }
}

function uncheckCTRRange(){
    document.getElementById("ctr-begin-range").value="";
    document.getElementById("ctr-end-range").value="";
    $("#ctr-range-select").prev().find(".color-mark-field").removeClass("selected").addClass("unselected");
    disable_invalid_options();
}

function changeSensorQuantity(){//меняем количество сенсоров с 2 на 1 (для CRT-ALW)
    $("#sensor-quantity option[value=2]").prop('selected', false);
    $("#sensor-quantity option[value=1]").prop('selected', true);
    disable_invalid_options();
}

function disableLvk(){///ЗАПРОС ПОДТВЕРЖДЕНИЯ ОТКЛЮЧЕНИЯ Lvk
    console.log("ОТКЛЮЧИТЬ LVK или НЕТ?");
    $( "#dialog2-confirm" ).dialog({
        resizable: false,
        height: "auto",
        width: 600,
        modal: true,
        dialogClass: 'custom-ui-widget-header-warning',
        buttons: {
            Продолжить: function() {
                $("#dialog2-confirm input").each(function(){
                    console.log($(this).attr('onclick'));
                    eval($(this).attr('onclick'));
                })
                $( this ).dialog( "close" );

            },
            Отмена: function() {
                $( this ).dialog( "close" );
                disable_invalid_options();
            }
        }
    })
}

function resetButton(){///ЗАПРОС ПОДТВЕРЖДЕНИЯ СБРОСА
    console.log("СБРОСИТЬ КОНФИГ?");
    $( "#dialog3-confirm" ).dialog({
        resizable: false,
        height: "auto",
        width: 600,
        modal: true,
        dialogClass: 'custom-ui-widget-header-warning',
        buttons: {
            Продолжить: function() {
                resetConfig();
                $( this ).dialog( "close" );
            },
            Отмена: function() {
                $( this ).dialog( "close" );
            }
        }
    })
}

 $(function(){//ПРИ клике на заблокированный Lvk
    $(document).on("click", "label[for='spec_lvk']", function(){
        if ($("#spec_lvk").is(":checked:disabled")){
            disableLvk();
        }
    })
 })

 function uncheckExd(){
    $("#Exd").prop("checked", false).closest("div.active-option-to-select-list").prev("div.option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
 }

 function changeDiameterTo22(){
    $("#ctr-diameter option[value=not_selected]").prop('selected', true).closest("div.active-option-to-select-list").prev("div.option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
    disable_invalid_options();
 }
 function uncheckWWGN(params) {///отмена WW и GN
    $(params).prop("checked", false).prop('selected', true).closest("div.active-option-to-select-list").prev("div.option-to-select").find(".color-mark-field").removeClass("selected").addClass("unselected");
    disable_invalid_options();
 }

 $(function(){/// ТЕСТ  ADVANCED - РАСШИФРОВКИ КОДА
    $("input[id=code-test-button-ok]").click(function(){
        let code = $("#code-test").val();
        main_dev = code.split("/")[0].toLowerCase().startsWith("pc-28") ? "pc-28" :
                    code.split("/")[0].toLowerCase().startsWith("pr-28") ? "pr-28" :
                    code.split("/")[0].toLowerCase().startsWith("apc-2") ? "apc-2000" :
                    code.split("/")[0].toLowerCase().startsWith("apr-2") ? "apr-2000" :
                    code.split("/")[0].toLowerCase().startsWith("ct") ? "ctr" :
        "";
        if (main_dev!=""){
            $("#advanced-code-descr").prop("style", "display:none");
            $("#main-dev-" + main_dev).trigger("click");
            $(".active-option-to-select-list").each(function(){
                for (let opts of code.split("/")){
                    console.log($(this).find("input"));
                    console.log(opts);
                }
            })
        }
    })
})
