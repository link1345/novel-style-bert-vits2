
function read_text(element_label , text = []){
    
    if(element_label == "novel_subtitle"){
        element_item = document.body.getElementsByClassName(element_label);
        element_item = Array.from(element_item);
        element_item.forEach((element1) => {
                //console.log("test : " , element1.textContent);
                text.push(element1.textContent);
                text_elements.push(element1);
        });
    }else{
        element_item = document.body.getElementsByClassName(element_label);
        element_item_array = Array.from(element_item);
        element_item_array.forEach((element1) => {
            element1_array = Array.from(element1.children);
            element1_array.forEach((element2) => {
                if(element2.textContent != ""){
                    //console.log("test : " , element2.textContent);            
                    text.push(element2.textContent);
                    text_elements.push(element2);
                }
            })
        });
    }
    return text;
}

function synthesis_request_json(text, moraToneList, model="jvnv-F1-jp", modelFile=`model_assets\\\\jvnv-F1-jp\\\\jvnv-F1-jp_e160_s14000.safetensors`, speaker="jvnv-F1-jp"){    
    json_data = `{
        "text": "${text}",
        "model": "${model}",
        "modelFile": "${modelFile}",
        "style": "Neutral",
        "speaker": "${speaker}",
        "moraToneList": ${moraToneList},
        "styleWeight": 5,
        "assistText": "",
        "assistTextWeight": 1,
        "speed": 1,
        "noise": 0.6,
        "noisew": 0.8,
        "sdpRatio": 0.2,
        "language": "JP",
        "silenceAfter": 0.5,
        "pitchScale": 1,
        "intonationScale": 1
    }`;
    console.log(json_data);
    return json_data;
}

async function wait(second) {
    return new Promise(resolve => setTimeout(resolve, 1000 * second));
}

async function request(text_line, number){

    //await wait(3);

    var item = await fetch("http://localhost:8000/api/g2p", {
        "credentials": "include",
        "headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
            "Accept": "*/*",
            "Accept-Language": "ja,en-US;q=0.7,en;q=0.3",
            "Content-Type": "application/json",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "Pragma": "no-cache",
            "Cache-Control": "no-cache"
        },
        "referrer": "http://localhost:8000/",
        "body": `{"text":"${text_line}"}`,
        "method": "POST",
        "mode": "cors"
    });

    if(item.ok){
        var item2 = JSON.stringify(await item.json());
        console.log(item2);
        g2p_text.push(item2);
        g2p_getCount += 1;

        await synthesis_request(text_line, number);
    }else{
        console.error("g2p Error " , (await item.text()) );
    }
}

async function synthesis_request(text_line, number){
    
    await wait(5);

    var item = await fetch("http://localhost:8000/api/synthesis", {
        "credentials": "include",
        "headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
            "Accept": "*/*",
            "Accept-Language": "ja,en-US;q=0.7,en;q=0.3",
            "Content-Type": "application/json",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "Pragma": "no-cache",
            "Cache-Control": "no-cache"
        },
        "referrer": "http://localhost:8000/",
        "body": synthesis_request_json(text_line, g2p_text[number]),
        "method": "POST",
        "mode": "cors"
    });

    if(item.ok){
        var item2 = await item.blob();
        console.log(item2);
        speake.push(URL.createObjectURL(item2));
        speake_getCount += 1;
    }else{        
        stop_flag = true;
        console.error("synthesis Error");
    }
}

var text_elements = []
var text = []
var g2p_getCount = 0;
var g2p_text = [];
var speake_getCount = 0;
var speake = [];
var reader_getCount = 0;
const audio_item = new Audio();
audio_item.controls = true;
audio_item.volume = 1;
audio_item.addEventListener("ended", async (event) => {
    //console.log("second start!");
    while(true){
        if( reader_getCount >= speake.length-1 ){
            await wait(1);
        }else break;
    }
    //console.log("second audio!");

    text_elements[reader_getCount].style.backgroundColor = "";
    URL.revokeObjectURL(speake[reader_getCount])
    reader_getCount += 1;
    text_elements[reader_getCount].style.backgroundColor = "LightSkyBlue";

    if( reader_getCount <= text.length){   
        //console.log("second run!");
        await wait(2);
        if(!stop_flag) audio_element(speake[reader_getCount]);  
    }
    
});

async function audio_element(speake_item){
    if(stop_flag){
        console.log("stop flag!");
        audio_item.pause();
        return;
    }

    console.log(speake_item);
    audio_item.src = speake_item;
    audio_item.currentTime = 0;
    console.log("run audio!");
    audio_item.load();
    await audio_item.play();

}

async function audio_play(){
    while(true){
        if(speake.length == 0){
            await wait(1);
        }else break;
    }
    audio_element(speake[reader_getCount]);
}

var running_flag = false;
var stop_flag = false;

async function init (){
    const box_div = document.createElement("div");
    box_div.style.position = "fixed";
    box_div.style.top = "5rem";
    box_div.style.right = "5rem";

    const button_item = document.createElement("button");
    button_item.textContent = "Read!";

    button_item.addEventListener("click", async (event) => {

        if(running_flag == false){
            running_flag = true;
            stop_flag = false;

            g2p_getCount = 0;
            g2p_text = [];
            speake_getCount = 0;
            speake = [];
            reader_getCount = 0;

            // 読み上げ
            _ = audio_play(speake[0]);
            button_item.textContent = "Stop!";

            console.log("AUDIO RUN");

            // 読み上げ文字列の作成
            text = read_text("novel_subtitle");
            text = read_text("novel_view", text);

            // 読み上げデータ作成
            for(var i = 0; i < text.length; i++){
                if(stop_flag) break;
                await request(text[i], i);
            }
        }else{
            stop_flag = true;
            running_flag = false;
            audio_item.pause();
            for (let index = 0; index < text_elements.length; index++) {
                text_elements[index].style.backgroundColor = "";
            }
        }

    });

    box_div.appendChild(button_item);
    document.body.appendChild(box_div);
}

init();