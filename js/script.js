
var thread_restr_lst = new Map();// ОГРАНИЧЕНИЯ РЕЗЬБ
var restr_conf_lst; // МАССИВ ОГРАНИЧЕНИЙ
var option_names = ["approval", "output", "electrical", "material", "thread"]; // НАЗВАНИЯ ОПЦИЙ для проверки доступности , "cap-or-not", , "display"
var low_press = -101;
var hi_press = 100000;
var min_range = 20.0;


async function fetchRestrictions() { /// ПОЛУЧЕНИЕ СПИСКА ОГРАНИЧЕНИЙ ИЗ JSON
    const data = await Promise.all(option_names.map(async url => {
        const resp = await fetch("/json/"+ url +".json");
        return resp.json();
    }));
    return data;
}
fetchRestrictions().then((data) => {
    let restr_conf_list = new Map([]);
    let restr_option_list = new Map([]);
    for (el in data){
        for (let value of Object.values(data[el])){////// ПЕРЕБИРАЕМ ЛИСТЫ ОГРАНИЧЕНИЙ JSON
            let my_lst = new Map([]);
            for (let opt in option_names){
                if (option_names[opt]!=option_names[el]){
                    // console.log(value["name"], " - ", option_names[opt], " - ", value[option_names[opt]]);
                    if (value.hasOwnProperty(option_names[opt])){//// УЗНАЁМ ОПРЕДЕЛЕНО ли свойство option option_names[opt] в позиции объекте из массива json
                        my_lst.set(option_names[opt], value[option_names[opt]]);
                        // console.log(option_names[opt], value[option_names[opt]]);
                    }
                }
            }
            restr_option_list.set(value["name"], my_lst);
        }
       restr_conf_list.set(option_names[el], restr_option_list);
    }

    data[4].forEach(obj => {                    ////ИНДЕКС THREAD В МАССИВЕ option_names
        let dat = new Map(Object.entries(obj));
        thread_restr_lst.set(obj["name"], dat);
      });;
    restr_conf_lst = restr_conf_list;
    console.log("Массив ограничений: ", restr_conf_lst);
}).catch(error => {console.log(error);// один из запросов завершился с ошибкой
})


$(function(){        ///////////////ИЗМЕНЯЕМЫЕ ПАНЕЛИ
    $(".panel-left").resizable({
        handleSelector: ".splitter",
        resizeHeight: false
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

function get_full_config(){  ///// ПОЛУЧАЕМ МАССИВ ПОЛНОЙ КОНФИГУРАЦИИ
    let capillary_length = parseInt(document.getElementById("capillary-length").value);
    let begin_range = parseFloat(document.querySelector("#begin-range").value);
    let end_range = parseFloat(document.querySelector("#end-range").value);
    let units = document.querySelector("#pressure-unit-select").value;
    let press_type = document.querySelector("#pressure-type").value;
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
    let options = ["approval", "output", "electrical", "cap-or-not", "material", "connection-type"]; //, "display"
    for (let el of options){
        full_conf.set(el, $("input[name="+ el +"]:checked").prop("id"));
    }
    if (!Number.isNaN(capillary_length)){
        full_conf.set("capillary_length", capillary_length);
    }
    if ($("input[name=cap-or-not]:checked").prop("id")=="direct"){
        full_conf.delete("capillary_length");
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
    if ($("input[name=cap-or-not]:checked").prop("id")=="capillary" && !full_conf.has("capillary_length")){
        full_conf.set("capillary_length");
    }
    return full_conf;
}

function get_code_info(data){ // ПОЛУЧЕНИЕ КОДА ЗАКАЗА И ОПИСАНИЯ ОПЦИЙ принимает full_config
    let code = "";
    let out = data.get("output");
    let appr = data.get("approval");
    let dev_type = out == "4_20" ? "PC-28/" : out == "4_20H" ? "PC-28.Smart/" : out == "modbus" ? "PC-28.Modbus/" : out == "0_10" ? "PC-28/" : "PC-28.B/";
    let output = out == "0_2" ? "0...2В/" : out == "04_2" ? "0,4...2В/" : out == "0_10" ? "0...10В/" : "";
    let approval = appr =="Ex" ? "Ex/" : appr == "Exd" ? "Exd/" : "";
    let connection = data.has("thread") ? data.get("thread") : data.has("flange") ? data.get("flange") : data.has("hygienic") ? data.get("hygienic") : "";
    let material = $("input[name=material]:checked").val();
    console.log($("#"+data.get("electrical")).val());
    code = dev_type + approval + material + data.get("begin_range") + "..." + data.get("end_range") + data.get("units") + data.get("pressure_type") + "/" + $("#"+data.get("electrical")).val() + "/" + output + $("#" + connection).val();
    if (data.get("cap-or-not") == "capillary"){
        code = code + "-K="+ data.get("capillary_length") + "м";
    }
    document.getElementById("code").innerHTML = code;
}

function disable_invalid_options(){
    let check_flag = true;
    let full_conf = get_full_config();
    console.log("Выбранная конфигурация ", full_conf);
    for (let opt in option_names){ ///СНЯТИЕ ВСЕХ ОГРАНИЧЕНИЙ
            $("#"+ option_names[opt] + "-select-field").find("label.disabled").removeClass('disabled'); /// СНИМАЕМ ОТМЕТКУ СЕРЫМ со всех чекбоксов
            $("input[name="+ option_names[opt] +"]").each(function() {
                    $(this).prop('disabled', false);                                                    /// АКТИВАЦИЯ ВСЕХ ЧЕКБОКСОВ
            })
    }
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

    if (full_conf.has("thread") && typeof full_conf.get("thread")!='undefined'){// ОГРАНИЧИТЬ ДИАПАЗОН ЕСЛИ ВЫБРАНО ПРИСОЕДИНЕНИЕ THREAD
        console.log("ОГРАНИЧИТЬ ДИАПАЗОН ПО ВЫБРАННОМУ ПРИСОЕДИНЕНИЮ ");
        low_press = thread_restr_lst.get(full_conf.get("thread")).get("begin_range_kpa");
        hi_press = thread_restr_lst.get(full_conf.get("thread")).get("end_range_kpa");
        // min_range = thread_restr_lst.get(full_conf.get("thread")).get("range");
        min_range = typeof thread_restr_lst.get(full_conf.get("thread")).get("range_c") != 'undefined' ? thread_restr_lst.get(full_conf.get("thread")).get("range_c") : thread_restr_lst.get(full_conf.get("thread")).get("range");
        document.getElementById("range_warning").style.display = "block";
        document.getElementById("range_warning").innerHTML = "Выберите давление в диапазоне " + low_press+ "..." + hi_press + "кПа и минимальной шириной диапазона " + min_range + "кПа.";
    }else{
        document.getElementById("range_warning").style.display = "none";
        document.getElementById("range_warning").innerHTML = "";
    }

    for (let entr of thread_restr_lst.entries()){   // ДЕКАТИВАЦИЯ THREAD ПО ДАВЛЕНИЮ и КАПИЛЛЯРУ
        if ((typeof entr[1].get("range") !== 'undefined' && full_conf.get("range")<entr[1].get("range")) || full_conf.get("begin_range_kpa")<entr[1].get("begin_range_kpa") || full_conf.get("end_range_kpa")>entr[1].get("end_range_kpa")){
            $("label[for="+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ по давлению THREAD
            $("#"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD
        }
        if (full_conf.get("cap-or-not") == 'capillary'){
            if (entr[1].get("cap-or-not") !== 'undefined' && entr[1].get("cap-or-not") == 'direct'){
                $("label[for="+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ с капилляром ВАРИАНТЫ THREAD
                $("#"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD
            }
        }
        if (typeof full_conf.get("range")!=='undefined' && full_conf.get("cap-or-not") == 'direct'){
            // console.log("name: ", entr[0], "range: ", entr[1].get("range"), "begin_range_kpa: ", entr[1].get("begin_range_kpa"), "end_range_kpa: ", entr[1].get("end_range_kpa"));
            if ((typeof entr[1].get("range") !== 'undefined' && full_conf.get("range")<entr[1].get("range")) || full_conf.get("begin_range_kpa")<entr[1].get("begin_range_kpa") || full_conf.get("end_range_kpa")>entr[1].get("end_range_kpa")){
                $("label[for="+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ по давлению БЕЗ КАПИЛЛЯРА ВАРИАНТЫ THREAD
                $("#"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD
            }
        }
        if (typeof full_conf.get("range")!=='undefined' && full_conf.get("cap-or-not") == 'capillary'){
            // console.log("name: ", entr[0], "range: ", entr[1].get("range"), "begin_range_kpa: ", entr[1].get("begin_range_kpa"), "end_range_kpa: ", entr[1].get("end_range_kpa"));
            if ((typeof entr[1].get("range_c") !== 'undefined' && full_conf.get("range")<entr[1].get("range_c")) || full_conf.get("begin_range_kpa")<entr[1].get("begin_range_kpa") || full_conf.get("end_range_kpa")>entr[1].get("end_range_kpa")){
                $("label[for="+ entr[0] +"]").addClass('disabled');     ////ПОМЕЧАЕМ СЕРЫМ НЕДОСТУПНЫЕ по давлению  С КАПИЛЛЯРОМ ВАРИАНТЫ THREAD
                $("#"+entr[0]).prop('disabled', true);  //// ДЕАКТИВАЦИЯ НЕДОСТУПНЫХ ЧЕКБОКСОВ THREAD
            }
        }
    }

    for (let x of full_conf.values()){
        if (typeof x === 'undefined'){
            check_flag = false;
            console.log("НЕПОЛНАЯ КОНФИГУРАЦИЯ!");
            document.getElementById("code").innerHTML = "Для получения кода заказа необходимо выбрать все обязательные опции";
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
        if ($(this).is(':checked')) { /// ТОЛЬКО ОДИН ОТМЕЧЕННЫЙ ЧЕКБОКС
            $(this).siblings("input:checkbox").prop('checked', false);
            console.log("1");
        }
        else{
            if ($("#connection-type-select input:checkbox:checked").length==0){/// ЕСЛИ НЕ ВЫБРАНО тип и размер - скрыть список thread-flange-hygienic
                $('.thread-flange-hygienic').hide(0);
                console.log("2");
            }
            var $this = $(this.parentElement.parentElement); /// ПРИ СНЯТИИ ЧЕКБОКСА - ВЫДЕЛЯТЬ КРАСНЫМ
            $this.prev(".option-to-select").find(".color-mark-field").removeClass("selected");
            $this.prev(".option-to-select").find(".color-mark-field").addClass("unselected");
            console.log("3");
            if (this.name=="thread" || this.name=="flange" || this.name=="hygienic"){
                var $this = $(this.parentElement.parentElement.parentElement);
                $this.prev(".option-to-select").find(".color-mark-field").removeClass("selected");
                $this.prev(".option-to-select").find(".color-mark-field").addClass("unselected");
                //// ДОПИСАТЬ СНЯТИЕ ОГРАНИЧЕНИЯ ДАВЛЕНИЯ
                hi_press = 100000;
                low_press = -101;
                min_range = 2.5;
                console.log("33");
            }
            if (this.name=="connection-type"){
                $("input[name="+ $(this).prop("id").slice(0,-5) +"]:checked").prop('checked', false);
                console.log("4");
            }
            disable_invalid_options();
            console.log("5");
            return;
        }

        if (this.name=="thread" || this.name=="flange" || this.name=="hygienic") {///СКРЫВАЕМ ВЫБОР ПРИСОЕДИНЕНИЯ И ПОМЕЧАЕМ ЗЕЛЕНЫМ
            var $this = $(this.parentElement.parentElement.parentElement).prev();
            $this.next("div.option-to-select-list").slideUp("slow")
            $this.removeClass("active");
            $this.next(".option-to-select").addClass("active");
            $this.find(".color-mark-field").removeClass("unselected");
            $this.find(".color-mark-field").addClass("selected");
            disable_invalid_options();
            console.log("6");
            return;
        }

        if (this.value=="capillary") { // ПОКАЗЫВАЕМ ВЫБОР ДЛИНЫ КАПИЛЛЯРА
            document.getElementById("cap-length-span").hidden = false;
            var $this = $(this.parentElement.parentElement);
            $this.prev(".option-to-select").find(".color-mark-field").removeClass("selected");
            $this.prev(".option-to-select").find(".color-mark-field").addClass("unselected");
            console.log("7");
            return;
        }
        if (this.name=="connection-type") { //// ПОКАЗЫВАЕМ ВЫБОР ДОСТУПНЫХ РАЗМЕРОВ РЕЗЬБЫ ИЛИ ФЛАНЦА ИЛИ ГИГИЕНИЧЕСКОГО ПРИСОЕДИНЕНИЯ
            let target = $('#' + $(this).prop("id").slice(0,-5) + '-select');
            console.log("8");
            var $this = $(this.parentElement.parentElement);
            $this.prev(".option-to-select").find(".color-mark-field").removeClass("selected");
            $this.prev(".option-to-select").find(".color-mark-field").addClass("unselected");
            $(".thread-flange-hygienic").find("input:checkbox:checked").prop('checked', false);
            disable_invalid_options();
            if ($("#connection-type-select input:checkbox:checked").length==0){
                $('.thread-flange-hygienic').hide(0);
                console.log("9");
            }else{
                $('.thread-flange-hygienic').not(target).hide(0);
                target.fadeIn(500);
                console.log("10");
            }
        }
        else{
            document.getElementById("cap-length-span-err").hidden = true;
            var $this = $(this.parentElement.parentElement);
            $this.slideToggle("slow").siblings("div.option-to-select-list").slideUp("slow");
            $this.prev(".option-to-select").removeClass("active");
            $this.prev(".option-to-select").find(".color-mark-field").removeClass("unselected");
            $this.prev(".option-to-select").find(".color-mark-field").addClass("selected");
            $this.next(".option-to-select").addClass("active");
            $this.next(".option-to-select").next().slideToggle("slow");
            disable_invalid_options();
            console.log("11");
        }
    })
})

function range_selected(){ //ПРОВЕРКА ДИАПАЗОНА + СКРЫВАЕТ ДИАПАЗОН И ЕДИНИЦЫ ИЗМЕРЕНИЯ ПРИ ЗАПОЛНЕНИИ ВСЕХ ПОЛЕЙ
    let begin_range = parseFloat(document.querySelector("#begin-range").value);
    let end_range = parseFloat(document.querySelector("#end-range").value);
    let units = document.querySelector("#pressure-unit-select").value;
    let press_type = document.querySelector("#pressure-type").value;
    if (units!='not_selected' && press_type!='not_selected' && !Number.isNaN(begin_range) && !Number.isNaN(end_range) && end_range!=begin_range && begin_range>=low_press && end_range<=hi_press){
        let full_conf = get_full_config();
        if (!full_conf.has("thread")){
            min_range = press_type == "ABS" ? 20: 2.5;
            console.log("ПРИСОЕДИНЕНИЕ НЕ ВЫБРАНО - ОГРАНИЧЕНИЕ, kPa: ", min_range);
        }
        if (full_conf.get("begin_range_kpa")>=low_press && full_conf.get("end_range_kpa")<=hi_press && full_conf.get("range")>=min_range){
            console.log("ДАВЛЕНИЕ В НОРМЕ");
            $("#range-select").prev().removeClass("active");
            $("#range-select").prev().find(".color-mark-field").removeClass("unselected");
            $("#range-select").prev().find(".color-mark-field").addClass("selected");
            $("#range-select").slideUp("slow");
            $("#material-select").slideDown("slow");
            $("#material-select").prev().addClass("active");
            disable_invalid_options();
        }else{
            console.log("ДАВЛЕНИЕ НЕ В ДИАПАЗОНЕ!!!");
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
    $("#capillary-length-button-ok").click(function(){
        let capillary_length = parseInt(document.getElementById("capillary-length").value);
        if (Number.isNaN(capillary_length)){
            document.getElementById("cap-length-span-err").hidden = false;
            return;
        }if (capillary_length < 1 || capillary_length > 9){
            document.getElementById("cap-length-span-err").hidden = false;
            return;
        }else{
            document.getElementById("cap-length-span-err").hidden = true;
            $("#cap-or-not-select").prev().removeClass("active");
            $("#cap-or-not-select").prev().find(".color-mark-field").removeClass("unselected");
            $("#cap-or-not-select").prev().find(".color-mark-field").addClass("selected");
            $("#cap-or-not-select").slideToggle("slow");
            $("#range-select").slideToggle("slow");
            $("#range-select").prev().addClass("active");
            disable_invalid_options();
        }
    })
})
