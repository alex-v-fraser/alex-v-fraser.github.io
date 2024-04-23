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
var low_press_diff = -2500; // начало диапазона перепад, кПа
var hi_press_diff = 2500;   // конец диапазона перепад, кПа
var min_range_diff = 1.6;   // мин ширина диапазона перепад, кПа






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
            if ((code[i].slice(-5)=="CG1.1" && code[i+1].slice(0,1)=="2") || (code[i].slice(-1)=="1" && code[i+1].slice(0,4)=="2NPT") || (code[i].slice(-2)=="G1" && code[i+1].slice(0,1)=="4") || (code[i].slice(-2)=="G1" && code[i+1].slice(0,1)=="2") || (code[i].slice(-2)=="G3" && code[i+1].slice(0,1)=="4")){
                code.splice(i, 2, code[i] + "/" + code[i+1]);
            }
        }
    }
    for (let i=0; i<code.length; i++){
        if (code[i].toLowerCase().startsWith("s-")){
            let temp = code[i].split("-");
            code[i]= temp[0];
            let x=i+1;
            for (let j=1; j<temp.length; j++){
                code.splice(x, 0, temp[j]);
                x+=1;
            }
        }
    }

    let full_description = new Map([]);
    for (let i=0; i<code.length; i++){// ЗДЕСЬ ПОИСК ОПИСАНИЯ И ДОБАВЛЕНИЕ В MAP name + description
        let condition1 = (code[i].includes("...") && (code[i].endsWith("Па") || code[i].endsWith("кПа") || code[i].endsWith("бар") || code[i].endsWith("МПа") || code[i].endsWith("мH2O") || code[i].endsWith("ммH2O") || code[i].endsWith("кгс/см2") || code[i].endsWith("psi")  || code[i].endsWith("ABS")));
        let condition2 = (i>0 && code[i-1].includes("...") && (code[i-1].endsWith("Па") || code[i-1].endsWith("кПа") || code[i-1].endsWith("бар") || code[i-1].endsWith("МПа") || code[i-1].endsWith("мH2O") || code[i-1].endsWith("ммH2O") || code[i-1].endsWith("кгс/см2") || code[i-1].endsWith("psi")  || code[i-1].endsWith("ABS")));
        let condition3 = (i<code.length-1 && code[i+1].includes("...") && (code[i+1].endsWith("Па") || code[i+1].endsWith("кПа") || code[i+1].endsWith("бар") || code[i+1].endsWith("МПа") || code[i+1].endsWith("мH2O") || code[i+1].endsWith("ммH2O") || code[i+1].endsWith("кгс/см2") || code[i+1].endsWith("psi")  || code[i+1].endsWith("ABS")));

        if (condition1 && !condition2 && !condition3){
            if (code[i].split("...")[1].match(/[a-zA-Zа-яА-я]+/g)[0].endsWith("ABS")){
                full_description.set(code[i], "Диапазон измерения от " + code[i].split("...")[0] + " до " + code[i].split("...")[1].match(/\d+(\,\d+)?/g)[0] + " " + code[i].split("...")[1].match(/[a-zA-Zа-яА-я]+/g)[0].slice(0,-3) + " абсолютного давления.");
            }else{
                full_description.set(code[i], "Диапазон измерения от " + code[i].split("...")[0] + " до " + code[i].split("...")[1].match(/\d+(\,\d+)?/g)[0] + " " + code[i].split("...")[1].match(/[a-zA-Zа-яА-я]+/g)[0] + " избыточного давления.");
            }
        }

        if (condition1 && condition3){
            if (code[i].split("...")[1].match(/[a-zA-Zа-яА-я]+/g)[0].endsWith("ABS")){
                full_description.set(code[i], "Основной диапазон измерения от " + code[i].split("...")[0] + " до " + code[i].split("...")[1].match(/\d+(\,\d+)?/g)[0] + " " + code[i].split("...")[1].match(/[a-zA-Zа-яА-я]+/g)[0].slice(0,-3) + " абсолютного давления.");
                full_description.set(code[i+1], "Установленный диапазон измерения от " + code[i+1].split("...")[0] + " до " + code[i+1].split("...")[1].match(/\d+(\,\d+)?/g)[0] + " " + code[i+1].split("...")[1].match(/[a-zA-Zа-яА-я]+/g)[0].slice(0,-3) + " абсолютного давления.");
            }else{
                full_description.set(code[i], "Основной диапазон измерения от " + code[i].split("...")[0] + " до " + code[i].split("...")[1].match(/\d+(\,\d+)?/g)[0] + " " + code[i].split("...")[1].match(/[a-zA-Zа-яА-я]+/g)[0] + " избыточного давления.");
                full_description.set(code[i+1], "Установленный диапазон измерения от " + code[i+1].split("...")[0] + " до " + code[i+1].split("...")[1].match(/\d+(\,\d+)?/g)[0] + " " + code[i+1].split("...")[1].match(/[a-zA-Zа-яА-я]+/g)[0] + " избыточного давления.");
            }
        }

        if (code[i].slice(0,2) == "K="){
            full_description.set(code[i], "Длина капилляра разделителя " + code[i].match(/\d+(\,\d+)?/g) + " м.");
        }

        if (code[i].slice(0,2) == "T="){
            full_description.set(code[i], "Длина цилиндрической части разделителя " + code[i].match(/\d+(\,\d+)?/g) + " мм.");
        }

        if (code[i].toLowerCase()=="s"){             //КОНСТРУКТОР ОПИСАНИЯ РАЗДЕЛИТЕЛЯ
            let temp_code_i1 = code[i+1];
            let add_descr = " В сборе с разделителем.";
            let add_letter = "";
            if (temp_code_i1.endsWith("K")){
                add_descr += " K - cоединение разделителя через капилляр.";
                temp_code_i1 = temp_code_i1.slice(0,-1);
                add_letter = "K";
            }
            if (temp_code_i1.endsWith("R") && temp_code_i1.length>1){
                add_descr += " R - c радиатором для сред измерения до 200°С.";
                temp_code_i1 = temp_code_i1.slice(0,-1);
                add_letter = "R";
            }
            if (temp_code_i1.endsWith("R2") && temp_code_i1.length>2){
                add_descr += " R2 - c радиатором для сред измерения до 250°С.";
                temp_code_i1 = temp_code_i1.slice(0,-2);
                add_letter = "R2";
            }
            if (temp_code_i1.endsWith("R3") && temp_code_i1.length>2){
                add_descr += " R3 - c радиатором для сред измерения до 310°С.";
                temp_code_i1 = temp_code_i1.slice(0,-2);
                add_letter = "R3";
            }

            let temp_code_v1 = code[i]+ "-" + temp_code_i1 + "-" + code[i+2] + "-" + code[i+3];
            let temp_code_v2 = code[i]+ "-" + temp_code_i1 + "-" + code[i+2];
            let temp_code_v3 = code[i]+ "-" + temp_code_i1;
            let temp_codes =[temp_code_v1, temp_code_v2, temp_code_v3];
            let repeat_cycle = true;
            let num_cut = 4;
            for (els of temp_codes){
                for (item of search_names){
                    for (el of window[item + "_restr_lst"].values()){
                        if (repeat_cycle === true && el.get("code_name") === els){
                            code.splice(i, num_cut, els);
                            let temp_desc = el.get("description") + add_descr;
                            let arr = code[i].split("-");
                            arr[1] = arr[1] + add_letter;
                            code[i] = arr.join("-");
                            full_description.set(code[i], temp_desc);
                            // console.log("СРАБОТАЛО: " + code[i], temp_desc);
                            repeat_cycle = false;
                            break;
                        }
                    }
                }
                num_cut-=1;
            }
        }

        for (item of search_names){
            for (el of window[item + "_restr_lst"].values()){
                if (el.get("name")==code[i] || el.get("code_name")==code[i]){
                    if (code[i].includes("PC-28") && !(code[i]=="PC-28.Modbus" || code[i]=="PC-28.Smart") && !(code.includes("0...10В") || code.includes("0,4...2В") || code.includes("0...2В"))){
                        full_description.set(code[i], el.get("description") + "<br>Выходной сигнал 4...20мА.");
                        break;
                    }
                    full_description.set(code[i], el.get("description"));
                }
            }
        }
    }

    // console.log(full_description);
    // console.log(code);

    if (code.length>2 && full_description.size == code.length){
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
                    td.innerHTML = (full_description.get(code[i]));
                    tr.appendChild(td);
                }
            }
        }
        myTableDiv.appendChild(table);                  // ТАБЛИЦА ГОТОВА
        document.getElementById("mytable").border= "1";
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
    let max_static = $("input[name=max-static]:checked").val();
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
    // console.log();  $(".main-dev-selected div.prod-name").prop("innerText")
    let options = ["approval", "output", "electrical", "cap-or-not", "material", "connection-type"]; //, "display"
    if (main_dev=="pr-28" || main_dev=="apr-2000"){
        full_conf.set("max-static", max_static);
        full_conf.set("cap-plus", $("input[name=cap-plus]:checked").val());
        full_conf.set("cap-minus", $("input[name=cap-minus]:checked").val());
        full_conf.set("capillary_length_plus", capillary_length_plus);
        full_conf.set("capillary_length_minus", capillary_length_minus);
        options.push("minus-connection-type");
        for (let i = options.length - 1; i >= 0; i--) {
            if (options[i] == "cap-or-not") {
                options.splice(i, 1);
            }
        }
    }else{
        console.log(options);
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
    return full_conf;
}

function get_code_info(data){ // ПОЛУЧЕНИЕ КОДА ЗАКАЗА - принимает full_config
    let code = "";
    let special = "";
    let out = data.get("output");
    let appr = data.get("approval");
    let main_dev = data.get("main_dev").toUpperCase();
    let dev_type = out == "4_20" ? "PC-28/" : out == "4_20H" ? "PC-28.Smart/" : out == "modbus" ? "PC-28.Modbus/" : out == "0_10" ? "PC-28/" : "PC-28.B/";
    let output = out == "0_2" ? "0...2В/" : out == "04_2" ? "0,4...2В/" : out == "0_10" ? "0...10В/" : $("#hart7").is(':checked') ? "Hart7/" : "";
    let approval = appr =="Ex" ? "Ex/" : appr == "Exd" ? "Exd/" : "";
    let connection = data.has("thread") ? $("input[name=thread]:checked").val() : data.has("flange") ? $("input[name=flange]:checked").val() : data.has("hygienic") ? $("input[name=hygienic]:checked").val() : "";
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
    main_range = "";
    if (dev_type == "PC-28.Smart/" || dev_type == "PC-28.Modbus/" || main_dev == "APC-2000"){
        if (data.get("pressure_type")==""){
            let min_main_range = [-200000, 200000, ""];
            for (el of main_ranges){
                if (data.get("begin_range_kpa")>=el[0] && data.get("end_range_kpa")<=el[1]){
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
                if (data.get("begin_range_kpa")>=el[0] && data.get("end_range_kpa")<=el[1]){
                    if (Math.abs(el[1]-el[0])< Math.abs(min_main_range[1]-min_main_range[0])){
                        min_main_range = el;
                    }
                }
            }
            main_range = min_main_range[2] + "/";
        }
    }

    if (main_dev == "APC-2000" && data.get("end_range_kpa")<=2.5 && data.get("pressure_type")==""){
        const main_hs_ranges = [
            [-2.5, 2.5, "-2,5...2,5кПа"],
            [-0.7, 0.7, "-0,7...0,7кПа"]
        ]
        let min_main_range = [-200000, 200000, "-200000...20000кПа"];
        for (el of main_hs_ranges){
            if (data.get("begin_range_kpa")>=el[0] && data.get("end_range_kpa")<=el[1]){
                if (Math.abs(el[1]-el[0])< Math.abs(min_main_range[1]-min_main_range[0])){
                    min_main_range = el;
                }
            }
        }
        main_range = min_main_range[2] + "/";
        $("#hs").prop('checked', true);
    }
    range = (dev_type!="PC-28.Modbus/") ? (data.get("begin_range")).toString().split('.').join(',') + "..." + (data.get("end_range")).toString().split('.').join(',') + data.get("units") + data.get("pressure_type") + "/" : "";
    range = ((dev_type=="PC-28.Smart/" || main_dev == "APC-2000") && range==main_range) ? "" : range;

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

    if (data.get("thread")== "P" || data.get("thread")== "GP" || data.get("thread") == "CM30_2" || data.get("thread") == "CG1" || data.get("thread") == "CG1_S38" || data.get("thread") == "CG1_2"  || data.get("thread") == "G1_2"){
        material = data.get("material")=="aisi316" ? "" : $("input[name=material]:checked").val()+"/";
    }else{
        material = "";
    }
    $("input[name=special]").each(function() {/// ПЕРЕБИРАЕМ отмеченные SPECIAL, добавляем в код
        if ($(this).is(":checked") && $(this).val()!="rad_cap"  && $(this).val()!="Hart7"){
            special = special + $(this).val() + "/";
        }
    })
    if (main_dev!="APC-2000"){
        code = dev_type + approval + material + special + main_range + range + $("#"+data.get("electrical")).val() + "/" + output + connection;
    }else{
        code = main_dev + $("#"+data.get("electrical")).val() + "/" + approval + material + special + main_range + range + output + connection;
    }
    // document.getElementById("code").innerHTML = code;
    document.getElementById("code").value = code;
    $('#code').autoGrowInput({ /// ИЗМЕНЯЕМ ДЛИНУ ПОЛЯ ВВОДА
        minWidth: 200,
        maxWidth: function(){return $('.code-input-container').width()-8; },
        comfortZone: 5
    })
    addDescription();
}

function disable_invalid_options(){
    let check_flag = true;
    let full_conf = get_full_config();
    console.log("Выбранная конфигурация ", full_conf);
    let opt_names = ["main_dev", "approval", "output", "electrical", "material", "cap-or-not", "cap-plus", "cap-minus", "thread", "flange", "hygienic", "minus-thread", "minus-flange", "minus-hygienic", "max-static"]; //ДОБАВИТЬ hygienic когда они появятся
    for (let opt_name of opt_names){ ///СНЯТИЕ ВСЕХ ОГРАНИЧЕНИЙ
        $("#"+ opt_name + "-select-field").find("label.disabled").removeClass('disabled'); /// СНИМАЕМ ОТМЕТКУ СЕРЫМ со всех чекбоксов
        $("input[name="+ opt_name +"]").each(function() {
            $(this).prop('disabled', false);                                                    /// АКТИВАЦИЯ ВСЕХ ЧЕКБОКСОВ
        })
    }

    $("input[name=special]").each(function() {/// АКТИВАЦИЯ ВСЕХ ЧЕКБОКСОВ SPECIAL
        $(this).prop('disabled', false);
        $("label[for="+$(this).attr("id")+"]").removeClass('disabled');
    })

    let caps = ["cap-or-not", "cap-plus", "cap-minus"];
    for (let els of caps){
        $("input[name="+ els +"-mes-env-temp]").prop('max', 300);// СНЯТЬ ОГРАНИЧЕНИЕ ТЕМПЕРАТУРЫ
        $("input[name="+ els +"-mes-env-temp]").prop('placeholder', "-40...300");
        document.getElementById(els +"-radiator-select-err").innerHTML = "<br/>Введите температуру от -40 до 300°C и нажмите \"OK\"";
    }

    //СНЯТИЕ ОГРАНИЧЕНИЙ ПО ДАВЛЕНИЮ
    low_press = -101;                               // начало диапазона избыт, кПа
    hi_press = 100000;                              // конец диапазона избыт, кПа
    min_range = main_dev=="apc-2000" ? 0.1 : 2.5;   // мин ширина диапазона избыт, кПа
    low_press_abs = 0;                              // начало диапазона абс, кПа
    hi_press_abs = 10000;                           // конец диапазона абс, кПа
    min_range_abs = main_dev=="apc-2000" ? 10 : 20.0;   // мин ширина диапазона абс, кПа
    low_press_diff = -2500;                         // начало диапазона перепад, кПа
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


    //ПРОВЕРКА ЭЛЕКТРИЧЕСКОЙ ЧАСТИ
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
                        }
                    })
                }
            }
        }
    }

    // ПРОВЕРКА MAX-STATIC
    if (full_conf.get("main_dev")=='pr-28' || full_conf.get("main_dev")=='apr-2000'){
        if (full_conf.get("range")>1600){
            $("input[name=max-static]").each(function(){
                if (($(this).val()!="4")){
                    $(this).prop('disabled', true);
                    $("label[for="+$(this).prop('id')+"]").addClass('disabled');
                }
            })
        }
        if (full_conf.get("max-static")!="4"){
            low_press_diff = -1600;
            hi_press_diff = 1600;
            document.getElementById("range_warning1").innerHTML = low_press_diff.toLocaleString() + " ... " + hi_press_diff.toLocaleString() + " кПа и минимальная ширина " + min_range_diff + " кПа (перепад давления).";
        }
        $("input[name=thread]").each(function(){
            if (this.value=="1/4NPT(F)" || this.value=="P" || this.value.startsWith("S-")){
                $(this).prop('hidden', false);
                $("label[for="+$(this).prop('id')+"]").prop('hidden', false);
            }else{
                $(this).prop('hidden', true);
                $("label[for="+$(this).prop('id')+"]").prop('hidden', true);
            }
        })
        $("#c-pr").prop('hidden', false);
        $("label[for=c-pr]").prop('hidden', false);
    }else{
        $("input[name=thread]").each(function(){
            if (this.value=="1/4NPT(F)"){
                $(this).prop('hidden', true);
                $("label[for="+$(this).prop('id')+"]").prop('hidden', true);
            }else{
                $(this).prop('hidden', false);
                $("label[for="+$(this).prop('id')+"]").prop('hidden', false);
            }
        })
        $("#c-pr").prop('hidden', true);
        $("label[for=c-pr]").prop('hidden', true);
    }

    if (full_conf.get("main_dev")=="apc-2000" || full_conf.get("main_dev")=="pc-28"){  /// РАБОТАЕТ!!! НЕ ТРОГАТЬ!!!
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

                min_range_diff = min_range_abs;  // ОГРАНИЧЕНИЕ МИНИМАЛЬНОЙ ШИРИНЫ ПЕРЕПАДА????????????????????????
                hi_press_diff = hi_press_abs;    // ОГРАНИЧЕНИЕ МАКСИМАЛЬНОГО ДАВЛЕНИЯ ПЕРЕПАДА????????????????????
                low_press_diff = -hi_press_diff;

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
                    }
                })
                if (window[con_type + "_restr_lst"].get(full_conf.get(con_type)).has("cap-or-not") && window[con_type + "_restr_lst"].get(full_conf.get(con_type)).get("cap-or-not") == "direct"){//ОГРАНИЧЕНИЕ  cap-or-not для DIRECT ONLY
                    $("label[for=capillary]").addClass('disabled');  ////ПОМЕЧАЕМ СЕРЫМ capillary
                    $("#capillary").prop('disabled', true);          //// ДЕАКТИВАЦИЯ capillary
                }

                let max_temp = window[con_type + "_restr_lst"].get(full_conf.get(con_type)).get("max_temp");
                if (typeof max_temp!='undefined' && !window[con_type + "_restr_lst"].has("radiator")){
                    $("input[name=cap-or-not-mes-env-temp]").prop('max', max_temp);// ОГРАНИЧЕНИЕ ТЕМПЕРАТУРЫ для DIRECT для выбранного присоединения
                    $("input[name=cap-or-not-mes-env-temp]").prop('placeholder', "-40..." + max_temp);
                    document.getElementById("cap-or-not-radiator-select-err").innerHTML = "<br/>Введите температуру от -40 до "+ max_temp + "°C и нажмите \"OK\"";
                }
            }

            for (let entr of window[con_type + "_restr_lst"].entries()){   // ДЕКАТИВАЦИЯ THREAD или FLANGE или HYGIENIC ПО ДАВЛЕНИЮ, КАПИЛЛЯРУ и МАТЕРИАЛУ и ТЕМПЕРАТУРЕ
                if ((typeof entr[1].get("range") !== 'undefined' && full_conf.get("range")<entr[1].get("range")) || full_conf.get("begin_range_kpa")<entr[1].get("begin_range_kpa") || full_conf.get("end_range_kpa")>entr[1].get("end_range_kpa")){
                    $("label[for="+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ по давлению THREAD или FLANGE или HYGIENIC
                    $("#"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                }
                if (typeof full_conf.get("cap-or-not") != 'undefined'){
                    if (typeof entr[1].get("cap-or-not") != 'undefined' && entr[1].get("cap-or-not") != full_conf.get("cap-or-not")){
                        $("label[for="+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ с капилляром ВАРИАНТЫ THREAD или FLANGE или HYGIENIC
                        $("#"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                    }
                }
                if (full_conf.get("cap-or-not") == 'direct' && full_conf.has("max_temp") && !Number.isNaN(full_conf.get("max_temp"))){  //// ДЕАКТИВАЦИЯ DIRECT ПРИСОЕДИНЕНИЙ по ВЫБРАННОЙ ТЕМПЕРАТУРЕ
                    if (entr[1].get("max_temp") !== 'undefined' && entr[1].get("max_temp") < full_conf.get("max_temp")){
                        $("label[for="+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ ПО ТЕМПЕРАТУРЕ ВАРИАНТЫ THREAD или FLANGE или HYGIENIC
                        $("#"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                    }
                }
                if (typeof full_conf.get("range")!=='undefined' && full_conf.get("cap-or-not") == 'direct'){
                    // console.log("name: ", entr[0], "range: ", entr[1].get("range"), "begin_range_kpa: ", entr[1].get("begin_range_kpa"), "end_range_kpa: ", entr[1].get("end_range_kpa"));
                    if ((typeof entr[1].get("range") !== 'undefined' && full_conf.get("range")<entr[1].get("range")) || full_conf.get("begin_range_kpa")<entr[1].get("begin_range_kpa") || full_conf.get("end_range_kpa")>entr[1].get("end_range_kpa")){
                        $("label[for="+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ по давлению БЕЗ КАПИЛЛЯРА ВАРИАНТЫ THREAD или FLANGE или HYGIENIC
                        $("#"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                    }
                }
                if (typeof full_conf.get("range")!=='undefined' && full_conf.get("cap-or-not") == 'capillary'){
                    // console.log("name: ", entr[0], "range: ", entr[1].get("range"), "begin_range_kpa: ", entr[1].get("begin_range_kpa"), "end_range_kpa: ", entr[1].get("end_range_kpa"));
                    if ((typeof entr[1].get("range_c") !== 'undefined' && full_conf.get("range")<entr[1].get("range_c")) || full_conf.get("begin_range_kpa")<entr[1].get("begin_range_kpa") || full_conf.get("end_range_kpa")>entr[1].get("end_range_kpa")){
                        $("label[for="+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ по давлению  С КАПИЛЛЯРОМ ВАРИАНТЫ THREAD или FLANGE или HYGIENIC
                        $("#"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                    }
                }
                if (typeof full_conf.get("material")!=='undefined'){
                    if (typeof entr[1].get("material")!='undefined' && !entr[1].get("material").includes(full_conf.get("material"))){
                        $("label[for="+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ по материалу ВАРИАНТЫ THREAD или FLANGE или HYGIENIC
                        $("#"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                    }
                }
            }
        }
    }


/////////////////// ПРОВЕРКА PR и APR //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    if (full_conf.get("main_dev")=="apr-2000" || full_conf.get("main_dev")=="pr-28"){
        for (let con_type of connection_types){
            if (full_conf.has(con_type) && typeof full_conf.get(con_type)!='undefined'){// ОГРАНИЧИТЬ ДИАПАЗОН и МАТЕРИАЛ и ТЕМПЕРАТУРУ ЕСЛИ ВЫБРАНО ПРИСОЕДИНЕНИЕ THREAD или FLANGE или HYGIENIC
                console.log("100");
                // low_press = window[con_type + "_restr_lst"].get(full_conf.get(con_type)).get("begin_range_kpa");
                // hi_press = window[con_type + "_restr_lst"].get(full_conf.get(con_type)).get("end_range_kpa");
                if (typeof full_conf.get("cap-plus")!='undefined' && full_conf.get("cap-plus")=="capillary"){
                    min_range_diff = typeof window[con_type + "_restr_lst"].get(full_conf.get(con_type)).get("range_c") != 'undefined' ? window[con_type + "_restr_lst"].get(full_conf.get(con_type)).get("range_c") : window[con_type + "_restr_lst"].get(full_conf.get(con_type)).get("range");
                    console.log("101");
                    console.log("min_range capillary ", min_range);
                }
                if (typeof full_conf.get("cap-plus")!='undefined' && full_conf.get("cap-plus")=="direct"){
                    min_range_diff = typeof window[con_type + "_restr_lst"].get(full_conf.get(con_type)).get("range") != 'undefined' ? window[con_type + "_restr_lst"].get(full_conf.get(con_type)).get("range") : min_range;
                    console.log("102");
                    console.log("min_range direct ", min_range);
                }

                low_press_diff = -hi_press_diff;
                document.getElementById("range_warning1").innerHTML = low_press_diff.toLocaleString() + " ... " + hi_press_diff.toLocaleString() + " кПа и минимальная ширина " + min_range_diff + " кПа (перепад давления).";
                document.getElementById("range_warning2").innerHTML = "";

                $("input[name=material]").each(function() {
                    if (!window[con_type + "_restr_lst"].get(full_conf.get(con_type)).get("material").includes($(this).attr("id"))){
                        $("label[for="+$(this).attr("id")+"]").addClass('disabled');  ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ МАТЕРИАЛЫ
                        $(this).prop('disabled', true);                               //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ MATERIAL
                        console.log("103");
                    }
                })
                if (window[con_type + "_restr_lst"].get(full_conf.get(con_type)).has("cap-or-not") && window[con_type + "_restr_lst"].get(full_conf.get(con_type)).get("cap-or-not") == "direct"){//ОГРАНИЧЕНИЕ  cap-or-not для DIRECT ONLY
                    $("label[for=capillary-cap-plus]").addClass('disabled');  ////ПОМЕЧАЕМ СЕРЫМ capillary
                    $("#capillary-cap-plus").prop('disabled', true);          //// ДЕАКТИВАЦИЯ capillary
                    console.log("104");
                }

                let max_temp = window[con_type + "_restr_lst"].get(full_conf.get(con_type)).get("max_temp");
                if (typeof max_temp!='undefined' && !window[con_type + "_restr_lst"].has("radiator")){
                    $("input[name=cap-plus-mes-env-temp]").prop('max', max_temp);// ОГРАНИЧЕНИЕ ТЕМПЕРАТУРЫ для DIRECT для выбранного присоединения
                    $("input[name=cap-plus-mes-env-temp]").prop('placeholder', "-40..." + max_temp);
                    document.getElementById("cap-plus-radiator-select-err").innerHTML = "<br/>Введите температуру от -40 до "+ max_temp + "°C и нажмите \"OK\"";
                    console.log("105");
                }
            }

            if (full_conf.has("minus-" + con_type) && typeof full_conf.get("minus-" + con_type)!='undefined'){// ОГРАНИЧИТЬ ДИАПАЗОН и МАТЕРИАЛ и ТЕМПЕРАТУРУ ЕСЛИ ВЫБРАНО ПРИСОЕДИНЕНИЕ THREAD или FLANGE или HYGIENIC
                console.log("106");
                // low_press = window[con_type + "_restr_lst"].get(full_conf.get(con_type)).get("begin_range_kpa");
                // hi_press = window[con_type + "_restr_lst"].get(full_conf.get(con_type)).get("end_range_kpa");
                if (typeof full_conf.get("cap-minus")!='undefined' && full_conf.get("cap-minus")=="capillary"){
                    min_range_diff = typeof window[con_type + "_restr_lst"].get(full_conf.get("minus-" + con_type)).get("range_c") != 'undefined' ? window[con_type + "_restr_lst"].get(full_conf.get("minus-" + con_type)).get("range_c") : window[con_type + "_restr_lst"].get(full_conf.get("minus-" + con_type)).get("range");
                    console.log("min_range capillary ", min_range);
                    console.log("107");
                }
                if (typeof full_conf.get("cap-minus")!='undefined' && full_conf.get("cap-minus")=="direct"){
                    min_range_diff = typeof window[con_type + "_restr_lst"].get(full_conf.get("minus-" + con_type)).get("range") != 'undefined' ? window[con_type + "_restr_lst"].get(full_conf.get("minus-" + con_type)).get("range") : min_range;
                    console.log("min_range direct ", min_range);
                    console.log("108");
                }

                low_press_diff = -hi_press_diff;
                document.getElementById("range_warning1").innerHTML = low_press_diff.toLocaleString() + " ... " + hi_press_diff.toLocaleString() + " кПа и минимальная ширина " + min_range_diff + " кПа (перепад давления).";
                document.getElementById("range_warning2").innerHTML = "";

                $("input[name=material]").each(function() {
                    if (!window[con_type + "_restr_lst"].get(full_conf.get("minus-" + con_type)).get("material").includes($(this).attr("id"))){
                        $("label[for="+$(this).attr("id")+"]").addClass('disabled');  ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ МАТЕРИАЛЫ
                        $(this).prop('disabled', true);                               //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ MATERIAL
                        console.log("109");
                    }
                })
                if (window[con_type + "_restr_lst"].get(full_conf.get("minus-" + con_type)).has("cap-or-not") && window[con_type + "_restr_lst"].get(full_conf.get("minus-" + con_type)).get("cap-or-not") == "direct"){//ОГРАНИЧЕНИЕ  cap-or-not для DIRECT ONLY
                    $("label[for=capillary-cap-minus]").addClass('disabled');  ////ПОМЕЧАЕМ СЕРЫМ capillary
                    $("#capillary-cap-minus").prop('disabled', true);          //// ДЕАКТИВАЦИЯ capillary
                    console.log("110");
                }

                let max_temp = window[con_type + "_restr_lst"].get(full_conf.get("minus-" + con_type)).get("max_temp");
                if (typeof max_temp!='undefined' && !window[con_type + "_restr_lst"].has("radiator")){
                    $("input[name=cap-minus-mes-env-temp]").prop('max', max_temp);// ОГРАНИЧЕНИЕ ТЕМПЕРАТУРЫ для DIRECT для выбранного присоединения
                    $("input[name=cap-minus-mes-env-temp]").prop('placeholder', "-40..." + max_temp);
                    document.getElementById("cap-minus-radiator-select-err").innerHTML = "<br/>Введите температуру от -40 до "+ max_temp + "°C и нажмите \"OK\"";
                    console.log("111");
                }
            }

            for (let entr of window[con_type + "_restr_lst"].entries()){   // ДЕКАТИВАЦИЯ THREAD или FLANGE или HYGIENIC ПО ДАВЛЕНИЮ, КАПИЛЛЯРУ и МАТЕРИАЛУ и ТЕМПЕРАТУРЕ
                if (typeof entr[1].get("range") !== 'undefined' && full_conf.get("range")<entr[1].get("range")){
                    $("label[for="+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ по давлению THREAD или FLANGE или HYGIENIC
                    $("#"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                    $("label[for=minus-"+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ по давлению THREAD или FLANGE или HYGIENIC
                    $("#minus-"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                    console.log("112");
                }
                if (typeof full_conf.get("cap-plus") != 'undefined'){
                    console.log("113");
                    if (typeof entr[1].get("cap-or-not") != 'undefined' && entr[1].get("cap-or-not") != full_conf.get("cap-plus")){
                        $("label[for="+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ с капилляром ВАРИАНТЫ THREAD или FLANGE или HYGIENIC
                        $("#"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                        console.log("114");
                    }
                }
                if (typeof full_conf.get("cap-minus") != 'undefined'){
                    if (typeof entr[1].get("cap-or-not") != 'undefined' && entr[1].get("cap-or-not") != full_conf.get("cap-minus")){
                        $("label[for=minus-"+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ с капилляром ВАРИАНТЫ THREAD или FLANGE или HYGIENIC
                        $("#minus-"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                        console.log("115");
                    }
                }
                if (full_conf.get("cap-plus") == 'direct' && full_conf.has("max_temp_plus") && !Number.isNaN(full_conf.get("max_temp_plus"))){  //// ДЕАКТИВАЦИЯ DIRECT ПРИСОЕДИНЕНИЙ по ВЫБРАННОЙ ТЕМПЕРАТУРЕ
                    if (entr[1].get("max_temp") !== 'undefined' && entr[1].get("max_temp") < full_conf.get("max_temp_plus")){
                        $("label[for="+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ ПО ТЕМПЕРАТУРЕ ВАРИАНТЫ THREAD или FLANGE или HYGIENIC
                        $("#"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                        console.log("116");
                    }
                }
                if (full_conf.get("cap-minus") == 'direct' && full_conf.has("max_temp_minus") && !Number.isNaN(full_conf.get("max_temp_minus"))){  //// ДЕАКТИВАЦИЯ DIRECT ПРИСОЕДИНЕНИЙ по ВЫБРАННОЙ ТЕМПЕРАТУРЕ
                    if (entr[1].get("max_temp") !== 'undefined' && entr[1].get("max_temp") < full_conf.get("max_temp_minus")){
                        $("label[for=minus-"+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ ПО ТЕМПЕРАТУРЕ ВАРИАНТЫ THREAD или FLANGE или HYGIENIC
                        $("#minus-"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                        console.log("117");
                    }
                }
                if (typeof full_conf.get("range")!=='undefined' && full_conf.get("cap-plus") == 'direct'){
                    // console.log("name: ", entr[0], "range: ", entr[1].get("range"), "begin_range_kpa: ", entr[1].get("begin_range_kpa"), "end_range_kpa: ", entr[1].get("end_range_kpa"));
                    if (typeof entr[1].get("range") !== 'undefined' && full_conf.get("range")<entr[1].get("range")){
                        $("label[for="+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ по давлению БЕЗ КАПИЛЛЯРА ВАРИАНТЫ THREAD или FLANGE или HYGIENIC
                        $("#"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                        console.log("118");
                    }
                }
                if (typeof full_conf.get("range")!=='undefined' && full_conf.get("cap-minus") == 'direct'){
                    // console.log("name: ", entr[0], "range: ", entr[1].get("range"), "begin_range_kpa: ", entr[1].get("begin_range_kpa"), "end_range_kpa: ", entr[1].get("end_range_kpa"));
                    if (typeof entr[1].get("range") !== 'undefined' && full_conf.get("range")<entr[1].get("range")){
                        $("label[for=minus-"+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ по давлению БЕЗ КАПИЛЛЯРА ВАРИАНТЫ THREAD или FLANGE или HYGIENIC
                        $("#minus-"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                        console.log("118");
                    }
                }
                if (typeof full_conf.get("range")!=='undefined' && full_conf.get("cap-plus") == 'capillary'){
                    // console.log("name: ", entr[0], "range: ", entr[1].get("range"), "begin_range_kpa: ", entr[1].get("begin_range_kpa"), "end_range_kpa: ", entr[1].get("end_range_kpa"));
                    if (typeof entr[1].get("range_c") !== 'undefined' && full_conf.get("range")<entr[1].get("range_c")){
                        $("label[for="+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ по давлению  С КАПИЛЛЯРОМ ВАРИАНТЫ THREAD или FLANGE или HYGIENIC
                        $("#"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                        console.log("119");
                    }
                }
                if (typeof full_conf.get("range")!=='undefined' && full_conf.get("cap-minus") == 'capillary'){
                    // console.log("name: ", entr[0], "range: ", entr[1].get("range"), "begin_range_kpa: ", entr[1].get("begin_range_kpa"), "end_range_kpa: ", entr[1].get("end_range_kpa"));
                    if (typeof entr[1].get("range_c") !== 'undefined' && full_conf.get("range")<entr[1].get("range_c")){
                        $("label[for=minus-"+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ по давлению  С КАПИЛЛЯРОМ ВАРИАНТЫ THREAD или FLANGE или HYGIENIC
                        $("#minus-"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                        console.log("120");
                    }
                }
                if (typeof full_conf.get("material")!=='undefined'){
                    if (typeof entr[1].get("material")!='undefined' && !entr[1].get("material").includes(full_conf.get("material"))){
                        $("label[for="+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ по материалу ВАРИАНТЫ THREAD или FLANGE или HYGIENIC
                        $("#"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                        $("label[for=minus-"+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ по материалу ВАРИАНТЫ THREAD или FLANGE или HYGIENIC
                        $("#minus-"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD или FLANGE или HYGIENIC
                        console.log("121");
                    }
                }
            }
        }
    }

    /// ПРОВЕРКА SPECIAL
    if (typeof full_conf.get("range") == 'undefined' || full_conf.get("range") < 40 || $("#hi_load").is(":checked") || full_conf.get("output") == "4_20H" || full_conf.get("output") == "modbus" || typeof full_conf.get("output")=='undefined'){ //проверка 0,16
        $("label[for=0_16]").addClass('disabled');
        $("#0_16").prop('disabled', true);
    }
    if (full_conf.get("output") != "4_20" || $("#0_16").is(":checked")){ // проверка H
        $("label[for=hi_load]").addClass('disabled');
        $("#hi_load").prop('disabled', true);
    }
    if (!full_conf.has("thread") || (full_conf.get("thread") != "M" && full_conf.get("thread") != "G1_2")){ // проверка Кислород
        $("label[for=oxygen]").addClass('disabled');
        $("#oxygen").prop('disabled', true);
    }
    if (full_conf.get("output") != "4_20" || typeof full_conf.get("electrical") == 'undefined' || full_conf.get("electrical") == "ALW" || full_conf.get("electrical") == "ALW2"){//проверка TR
        $("label[for=time_response]").addClass('disabled');
        $("#time_response").prop('disabled', true);
    }
    if (full_conf.get("main_dev") == "apc-2000" || full_conf.get("main_dev") == "apr-2000" || full_conf.get("output") == "4_20H" || full_conf.get("output") == "modbus" || $("#minus_30").is(":checked") || $("#ct_spec").is(":checked")){ //проверка (-20)
        $("label[for=minus_20]").addClass('disabled');
        $("#minus_20").prop('disabled', true);
    }
    if (full_conf.get("main_dev") == "apc-2000" || full_conf.get("main_dev") == "apr-2000" || full_conf.get("output") == "4_20H" || full_conf.get("output") == "modbus"  || $("#minus_20").is(":checked") || $("#ct_spec").is(":checked")){ //проверка (-30)
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
    if (full_conf.get("main_dev") != "apc-2000" || (full_conf.get("main_dev") == "apc-2000" && full_conf.get("end_range_kpa")>30000) || full_conf.get("pressure_type")=="ABS" || full_conf.get("material") == "hastelloy"  || typeof full_conf.get("range")=='undefined'){ // проверка HS
        $("label[for=hs]").addClass('disabled');
        $("#hs").prop('disabled', true);
        $("#hs").prop('checked', false);
    }
    if (full_conf.get("main_dev") == "apc-2000" && full_conf.get("end_range_kpa")<=2.5 && full_conf.get("pressure_type")==""){ // принудительное включение HS для низких диапазонов
        $("label[for=hs]").addClass('disabled');
        $("#hs").prop('checked', true);
        $("#hs").prop('disabled', true);
    }
    if (full_conf.get("electrical")!="APCALW"){ // проверка специсполнения PD, SN, -50..80, HART7
        $("label[for=spec_pd]").addClass('disabled');
        $("#spec_pd").prop('disabled', true);
        $("#spec_pd").prop('checked', false);
        $("label[for=SN]").addClass('disabled');
        $("#SN").prop('disabled', true);
        $("#SN").prop('checked', false);
        $("label[for=minus_50]").addClass('disabled');
        $("#minus_50").prop('disabled', true);
        $("#minus_50").prop('checked', false);
        $("label[for=hart7]").addClass('disabled');
        $("#hart7").prop('disabled', true);
        $("#hart7").prop('checked', false);
    }
    if (full_conf.get("electrical")!="APCALW" || full_conf.get("pressure_type")!="ABS"){ // проверка специсполнения IP67
        $("label[for=spec_ip67]").addClass('disabled');
        $("#spec_ip67").prop('disabled', true);
        $("#spec_ip67").prop('checked', false);
    }
    if (full_conf.get("electrical")!="APCALW" || full_conf.get("range")<1.5){ // проверка специсполнения 0.05
        $("label[for=0_05]").addClass('disabled');
        $("#0_05").prop('disabled', true);
        $("#0_05").prop('checked', false);
    }
    if (full_conf.get("main_dev") != "apc-2000" || (full_conf.get("main_dev") == "apc-2000" && !(full_conf.get("electrical")=="PD" || full_conf.get("electrical")=="PZ")) || $("#minus_60").is(":checked")){ // проверка специсполнения -40
        $("label[for=minus_40]").addClass('disabled');
        $("#minus_40").prop('disabled', true);
        $("#minus_40").prop('checked', false);
    }
    if (full_conf.get("main_dev") != "apc-2000" || (full_conf.get("main_dev") == "apc-2000" && full_conf.get("electrical")!="PZ") || $("#minus_40").is(":checked")){ // проверка специсполнения -60
        $("label[for=minus_60]").addClass('disabled');
        $("#minus_60").prop('disabled', true);
        $("#minus_60").prop('checked', false);
    }


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
        get_code_info(full_conf);
    }
}

// function validate_option(name_to_check, option_name, valid_list){ /// (id выбранной опции, id проверяемой опции, подходящие варианты проверяемой опции)
//     $("input[name="+ option_name +"]").each(function() {
//         let option_1 = $("#"+ this.name +"-select").prev(".option-to-select").find(".option-to-select-header span").text();
//         let option_2 = $("#"+ name_to_check +"-select").prev(".option-to-select").find(".option-to-select-header span").text();
//         let option_2_text = $("label[for="+$("input[name="+ name_to_check +"]:checked").attr("id")+"]").text();
//         if (valid_list.includes(this.value) || valid_list.length == 0){
//             // $(this).prop('disabled', false);
//             $("label[for="+$(this).attr("id")+"]").removeClass('disabled');
//         }
//         else{
//             // $(this).prop('disabled', true);
//             $("label[for="+$(this).attr("id")+"]").addClass('disabled');
//             if ($(this).is(':checked')){
//                 alert(option_1 + " " + $("label[for="+$(this).attr("id")+"]").text() + " и " + option_2.toLowerCase() + " " + option_2_text + " несовместимы! \nВыберите " + option_1.toLowerCase() + " заново.");
//                 $("#"+this.name+"-select").prev(".option-to-select").find(".color-mark-field").removeClass("selected");
//                 $("#"+this.name+"-select").prev(".option-to-select").find(".color-mark-field").addClass("unselected");
//                 $(this).prop('checked', false);
//             }
//         }
//     })
// }

$(function (){
    $("input:checkbox").click(function(){ /// СКРЫВАЕМ АКТИВНУЮ ОПЦИЮ ПОСЛЕ ВЫБОРА, ОТКРЫВАЕМ СЛЕДУЮЩУЮ
        if ($(this).is(':checked') && this.name!="special") { /// ТОЛЬКО ОДИН ОТМЕЧЕННЫЙ ЧЕКБОКС (кроме special)
            $(this).siblings("input:checkbox").prop('checked', false);
            if (this.name=="cap-or-not"){
                $(".thread-flange-hygienic").find("input:checkbox:checked").trigger('click');
            }
            if (this.name=="cap-minus"){
                $(".minus-thread-flange-hygienic").find("input:checkbox:checked").trigger('click');
            }
            console.log("1");
        }
        else{
            if ($("#connection-type-select input:checkbox:checked").length==0){/// ЕСЛИ НЕ ВЫБРАНО тип и размер - скрыть список thread-flange-hygienic
                $('.thread-flange-hygienic').hide(0);
                console.log("2");
            }
            if ($("#minus-connection-type-select input:checkbox:checked").length==0){/// ЕСЛИ НЕ ВЫБРАНО тип и размер - скрыть список minus-thread-flange-hygienic
                $('.minus-thread-flange-hygienic').hide(0);
                console.log("2-minus");
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
            }
            if (this.name=="flange"){
                $("#flange-select-field > span").each(function(){
                    $(this).prop("hidden", true);
                    $(this).find("select option[value='not_selected']").prop('selected', true);
                })
            }
            console.log("3");
            if (this.name=="thread" || this.name=="flange" || this.name=="hygienic" || this.name=="minus-thread" || this.name=="minus-flange" || this.name=="minus-hygienic"){
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
            }
            disable_invalid_options();
            console.log("5");
            return;
        }

        if (this.name=="thread" || this.name=="flange" || this.name=="hygienic" || this.name=="minus-thread" || this.name=="minus-flange" || this.name=="minus-hygienic") {///СКРЫВАЕМ ВЫБОР ПРИСОЕДИНЕНИЯ И ПОМЕЧАЕМ ЗЕЛЕНЫМ
            let add_n = this.name.startsWith("minus") ? "minus-" : "";
            if ($(this).prop("id")=="s_t_dn50" || $(this).prop("id")=="s_t_dn80" || $(this).prop("id")=="s_t_dn100" || $(this).prop("id")=="s_tk_wash_dn100" || $(this).prop("id")=="minus-s_t_dn50" || $(this).prop("id")=="minus-s_t_dn80" || $(this).prop("id")=="minus-s_t_dn100" || $(this).prop("id")=="minus-s_tk_wash_dn100"){
                let target = $(this).prop("id")  + "-cilinder-select";
                $("#" + add_n + "flange-select-field > span").each(function(){
                    if ($(this).prop("id")!=target){
                        document.getElementById($(this).prop("id")).hidden = true;
                        $(this).find("select option[value='not_selected']").prop('selected', true);
                        console.log('Установка длины тубуса как не выбрано при переключении на другой');
                    }else{
                        document.getElementById($(this).prop("id")).hidden = false;
                    }
                })
                disable_invalid_options();
                console.log("13");
                return;
            }else{
                let num = $("body .active-option-to-select").index($(".active")) + 1;
                let next_expand = $("body .active-option-to-select").eq(num);
                $("#" + add_n + "flange-select-field > span").each(function(){
                    $(this).prop("hidden", true);
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

        if (this.value=="capillary") { // ПОКАЗЫВАЕМ ВЫБОР ДЛИНЫ КАПИЛЛЯРА
            let target_name = $(this.parentElement).prop("id").slice(0,-12);
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

        if (this.value=="direct") { // ПОКАЗЫВАЕМ ВЫБОР РАДИАТОРА
            let target_name = $(this.parentElement).prop("id").slice(0,-12);
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

        if (this.name=="connection-type" || this.name=="minus-connection-type") { //// ПОКАЗЫВАЕМ ВЫБОР ДОСТУПНЫХ РАЗМЕРОВ РЕЗЬБЫ ИЛИ ФЛАНЦА ИЛИ ГИГИЕНИЧЕСКОГО ПРИСОЕДИНЕНИЯ
            let target = $('#' + $(this).prop("id").slice(0,-5) + '-select');
            console.log("8");
            let add_name= this.name.slice(0,-15);
            console.log(add_name);
            console.log(target);
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
    if (units!='not_selected' && press_type!='not_selected' && !Number.isNaN(begin_range) && !Number.isNaN(end_range) && end_range!=begin_range && begin_range>=low_press && end_range<=hi_press){
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
        }else{
            $("#range-select").prev().find(".color-mark-field").removeClass("selected");
            $("#range-select").prev().find(".color-mark-field").addClass("unselected");
            disable_invalid_options();
        }
    }else{
        $("#range-select").prev().find(".color-mark-field").removeClass("selected");
        $("#range-select").prev().find(".color-mark-field").addClass("unselected");
        disable_invalid_options();
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
        $(this.parentElement).slideUp("slow");
        $(this).addClass("main-dev-selected");
        $(this).siblings(".main-dev").removeClass("main-dev-selected");
        $("."+$(".main-dev-selected").prop("id").slice(9,)+"-panel-container").addClass("active-panel-container");
        // console.log($(".main-dev-selected").prop("id").slice(9,));
        if ($(".main-dev-selected").prop("id").slice(9,)=="pr-28"){
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
        $("."+$(".main-dev-selected").prop("id").slice(9,)+"-panel-container").slideDown("slow");
        setTimeout(() => {  $("#approval-select").slideDown("slow"); }, 300);
        $("#approval-select").prev("div").addClass("active");
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
                buttons: {
                    Продолжить: function() {
                        $(".active-panel-container").slideUp("slow");
                        $("#main-dev-select").slideDown("slow");
                        $(".active-panel-container").removeClass("active-panel-container");
                        $('body input:checkbox:checked').each(function(){
                            $(this).trigger("click");
                        });
                        for (ids of ["cap-or-not-capillary-length", "cap-plus-capillary-length", "cap-minus-capillary-length", "begin-range", "end-range"]){
                            document.getElementById(ids).value="";
                        }
                        document.getElementById("pressure-unit-select").value="not_selected";
                        document.getElementById("pressure-type").value="not_selected";
                        $("div.color-mark-field").each(function(){
                            $(this).removeClass("selected");
                            $(this).addClass("unselected");
                        })
                        let arr = ["thread", "flange", "hygienic", "special"];
                        for (cons of arr){
                            $("input[name="+ cons +"]:checked").prop("checked", false);
                        }
                        $("div.option-to-select.active").next("div.option-to-select-list").slideUp("slow");
                        $("div.option-to-select.active").removeClass("active");
                        $( this ).dialog( "close" );
                        $("#approval-select").slideUp("slow");

                        $("div.option-to-select").each(function(){
                            $(this).prop("style", "display:none");
                        });
                        $("div.option-to-select-list").each(function(){
                            $(this).prop("style", "display:none");
                        });

                        $("div.active-option-to-select").removeClass("active-option-to-select");
                        $("div.active-option-to-select-list").removeClass("active-option-to-select-list");
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
            $("div.option-to-select.active").next("div.option-to-select-list").slideUp("slow");
            $("div.option-to-select.active").removeClass("active");
            $("#approval-select").slideUp("slow");
            document.getElementById("pressure-type").value="not_selected";


            $("div.option-to-select").each(function(){
                $(this).prop("style", "display:none");
            });
            $("div.option-to-select-list").each(function(){
                $(this).prop("style", "display:none");
            });

            $("div.active-option-to-select").removeClass("active-option-to-select");
            $("div.active-option-to-select-list").removeClass("active-option-to-select-list");
        }
    })
})
