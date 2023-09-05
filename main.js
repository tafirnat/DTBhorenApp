let beep,ttsAlpha, ttsDialogAlphe, endSound=false, ttsSpeed='0.45', fullTestTxt;

const testObj={},baseUrl= 'https://raw.githubusercontent.com/tafirnat/DTBhorenApp/main/',
      urls=[["dialogs",baseUrl+"dialogs.json"], ["main",baseUrl+"base.json"],["names",baseUrl+"names.json"],["dates", baseUrl+"date.json"]];

//temel ögelerin alinmasi
let itemLen = urls.length
for (let i = 0; i < itemLen; i++) {
    
    fetchRun(urls[i][1],urls[i][0], itemLen-1 == i)
}
//fetch islemi ile json verilerinin dahil edilmesi
async function fetchRun(url,status,item) {
    // console.log(status, url)
    // try {
        if(status){
           const response = await fetch(url);

            // console.log('>>', url)
            
           if (!response.ok){
               throw new Error('Status: ', status || 'mp3 ', 'ögeye erisilemedi! ', url);
           }
           let fetchData = await response.json()
           window[status] = status !=='dialogs'?fetchData[0]:fetchData;

          // console.log(fetchData)
          if(item) testCreator()
        }else{
           // await playAudio(url)
        }
        
    // } catch (error) {
    //     console.error('Fetch islemi sirasinda bir hata olustu! ', error);
    // }
}

    //rast gele sayi üretme: x max sayi degerini ifade eder, ...
    function getNums(min,adet=1,max) {
        let num;
        if(isNaN(max)){
            num= Math.floor(Math.random()*min) 
        }else{
            num =[]
            while (num.length < adet) {
                num.push(Math.floor(Math.random() * (max - min + 1)) + min);
            };
            num=num.join('')
        }
        return num;
    }

    //text/string-num: belirli sayida gruplandirilmasi 
    function splitor(str,splitor=2) {
        // Sayıyı ikişerli gruplar halinde birleştir
        const rgx=new RegExp(`.{${splitor}}`,'g')
        if(str.length%splitor){
            str+=getNums(1, splitor-(str.length%splitor),9) //- son rakamlar eger grup sayisindan eksik olur ise gruplamaya sayi eklenerek tamamlanir
        }
        return str.match(rgx)
    }

    //rastgele telefon numrasi üretir
    function getTelNum(){
        let base= getNums(1,2,9),
            restNum1 = getNums(1,3,9),
            restNum2 = getNums(1,4,9)
        return `(01${base}) ${restNum1} ${splitor(restNum2,2).join(' ')}`
    }
    //harf üretir
    function alpha(count,nonUmlaut=true) {
        let deChr = dates.alpha + (nonUmlaut?'':'ÄÖÜ'),
          chr = [];
        while (chr.length < count) {
          let rItem = getNums(deChr.length)// Math.floor(Math.random() * de.length),
          let rChr = deChr[rItem];
          if (!chr.includes(rChr)) chr.push(rChr);
        };
        return chr;
      }
    //siparis numarasi üretir
    function getAuftragNum(){
        //6 haneli 3 rakam ve 2 harften olusur
        let code=[]
        for (let i = 6; i >= 0; i--) {
            let num_char=getNums(0,1,99)
            let item = num_char%2 ? getNums(0,1,9) : alpha(1)[0]
            code[i]=item
        }
        return code
    }

//fetchData alinip TTS sonrasi ile yürütme siralamasinin olusturulmasi.
function testCreator(){
   //beep starter
    beep = main.beep[0]//alternatif ses dosyasi=> main.beep[1]
    testObj.names={
       name: names.name[getNums(37)],
       nachname: names.nachname[getNums(37)],
       alpha: function(){return splitor(this.nachname,1).join(' ')},
       full:function (){return this.name + " " + this.nachname}
    }
    testObj.tel=getTelNum()
    testObj.date=`Der ${dates.woche[getNums(3)]} ${dates.days[getNums(7)]} im ${dates.months[getNums(12)]}`
    testObj.auftrag = getAuftragNum()
    
    // console.log(names)
    // console.log(dates)
    // console.log(dialogs)
    // console.log(testObj)
    //TTS sesi rast gele secilir
    ttsAlpha = dates.alpha[getNums(7)]
    // console.log('ttsAlpha: ',ttsAlpha)

    
   let teil_1 = [
           googleTTS(main.teil_1_beginnt) +'%timeOut:10000',//teil-1 baslangic metni
       beep+'%timeOut:5000', //beep sesi
           googleTTS(main.nameTxt + testObj.names.full()), //isimin tam söylenmesi
           googleTTS(main.alphaTxt), //soyadin soylenmesi text
           splitor(testObj.names.nachname,1), //buchstabieren 
           //telefon numarasi
           googleTTS(main.telTxt),
           googleTTS(testObj.tel),
           //siparis tarihi
           googleTTS(main.dateTxt),
           googleTTS(testObj.date),
           //siparis kodu
           googleTTS(main.auftragTxt),
           testObj.auftrag, 
           //teil-1 bitirilmsi
           googleTTS(main.teil_1_endet) +'%timeOut:20000'
       ]

    let slctDialog= dialogs[getNums(dialogs.length)]
    testObj.dialog={
        voice:["",""] //ifadelerindeki herr/frau sayisina göre karsidaki kisinin cinsiyetinin tahimini yapilir [kadin,erkek]
    }
    testObj.dialog.thema = slctDialog.thema
    testObj.dialog.frage = slctDialog.frage
    testObj.dialog.antwort = slctDialog.antwort

    let allDialog = []
        Object.keys(slctDialog.dialog).forEach((key,i)=>{
            allDialog.push(slctDialog.dialog[key][0]+'# '+slctDialog.dialog[key][1])
            let match = slctDialog.dialog[key][1].match(/frau|herr/gmi)
            if(match) testObj.dialog.voice[i%2]+=match[0]
        })
    
       let teil_2 = [
           googleTTS(main.teil_2_beginnt) +'%timeOut:10000',//teil-2 baslangic metni
        beep+'%timeOut:5000', //beep sesi
           googleTTS(slctDialog.thema),
           allDialog,
           googleTTS(main.teil_2_endet) +'%timeOut:10000',
       ]

    testObj.dialog.text = allDialog;
    let allTest = [
                beep+'%timeOut:5000', //beep sesi
                    googleTTS(main.beginnt)+'%timeOut:10000', //test baslangic
                 // beep+'%timeOut:5000', //beep sesi
                    ...teil_1,
                 // beep+'%timeOut:5000', //beep sesi
                    ...teil_2,
                 beep+'%timeOut:30000', //beep sesi
                    googleTTS(main.benedet)
                  ]
    //console.log(allTest)
   playSequentially(allTest)
}

async function playSequentially(urls) {

    for (let i = 0; i < urls.length; i++) {
        
        if( typeof urls[i] == 'object'){
            if(urls[i][0].includes('# ')){
                let aTTS, bTTS
                if(testObj.dialog.voice[0]){
                    if(testObj.dialog.voice[0].match(/herr/gmi)){
                        aTTS = ttsDialogAlphe == "C" ? "F" :"C";
                        bTTS = ttsDialogAlphe == "B" ? "E" :"B";      
                    }else{
                        aTTS = ttsDialogAlphe == "B" ? "E" :"B";
                        bTTS = ttsDialogAlphe == "C" ? "F" :"C";
                    }
                }
                 if(testObj.dialog.voice[1]){
                    if(testObj.dialog.voice[1].match(/frau/gmi)){
                        aTTS = ttsDialogAlphe == "C" ? "F" :"C";
                        bTTS = ttsDialogAlphe == "B" ? "E" :"B";      
                    }else{
                        aTTS = ttsDialogAlphe == "B" ? "E" :"B";
                        bTTS = ttsDialogAlphe == "C" ? "F" :"C";
                    }
                }
                if(!aTTS || !bTTS){
                    aTTS = ttsDialogAlphe == "B" ? "E" :"B";
                    bTTS = ttsDialogAlphe == "C" ? "F" :"C";
                }
// console.log(aTTS, bTTS)
             //dialog
                for (let j=0; j<urls[i].length;j++) {
                    let txt = urls[i][j].split('# ')
                    ttsDialogAlphe = j%2==0 ?aTTS : bTTS;
                    await playAudio(googleTTS(txt[1]))
               }
           
            }else{
              //buchstabieren
              for (let j=0; j<urls[i].length;j++) {
               await playAudio(googleTTS(urls[i][j]), true)
              }
            }
        }else{
            await playAudio(urls[i]);
        }
    //console.log(urls[i])
    delete ttsDialogAlphe
    }
}

//TTS lininin olusturulmasi
function googleTTS(txt,customSpeed /*ttsSpeed-0.1*/){
    customSpeed = customSpeed ? .5-(0.55-ttsSpeed) : customSpeed;
    let tts = `https://www.google.com/speech-api/v1/synthesize?enc=mpeg&lang=de&speed=${customSpeed||ttsSpeed}&client=lr-language-tts&use_google_only_voices=1&name=de-DE-Wavenet-${ttsDialogAlphe || ttsAlpha}&text=`
    return tts + encodeURI(txt)
}
//ilgili TTS/ses dosyasinin tekil olarak promis altinda yürtülmesi
function playAudio(url,buchstabe) {
    let timeout = url.split('%timeOut:')[1]||1000
    url = url.split('%timeOut:')[0]
    return new Promise((resolve, reject) => {
        let audio = new Audio(url);
        audio.play();
        audio.addEventListener("ended", ()=>{
            setTimeout(resolve,buchstabe ? 0 : timeout)
        })
        audio.onerror = (error) => {reject(error)};
    });
}
