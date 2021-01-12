const puppeteer = require('puppeteer');
const $ = require('cheerio');
var moment = require('moment');


const assert = require('assert');
// Connection URL
const mUrl = 'mongodb://dridy:fkawk1@ds121906.mlab.com:21906/danang';

// Database Name
const dbName = 'danang';

const request = require('request');


const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://dridy:fkawk1@cluster0.etzbx.mongodb.net/dridy?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


//https://www.googleapis.com/youtube/v3/search?part=snippet&key=AIzaSyByPiFzLn8FcE16Wh-BmZ1aSwmiJ8g7bbQ

function getYoutubuID(searchKey) {
    // AIzaSyBGu85TOi7MwBtN-lLOxAPV7uTl4DR1B00
    return new Promise(function (resolve, reject) {   //AIzaSyBGu85TOi7MwBtN-lLOxAPV7uTl4DR1B00
        
        //AIzaSyBGu85TOi7MwBtN-lLOxAPV7uTl4DR1B00
        request('https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&key=AIzaSyDRIPDts8-cysM3uUtcPdsTo4ep4CdkSaM&q=' + searchKey, function (error, response, body) {
            // in addition to parsing the value, deal with possible erroårs
            if (error) return reject(error);
            try {
                // JSON.parse() can throw an exception if not valid JSON
                resolve(JSON.parse(body));
            } catch (e) {
                reject(e);
            }
        });
    });
    //https://www.googleapis.com/youtube/v3/search?part=snippet&key=AIzaSyAWSOT_GvJQXcY0fkXJ1ulaxWLCbjW19Gg&q='+searchKey
}

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    });
}

async function printConsole(content) {
    
    const body = $.load(content);
    // console.log('body', body)
    const anchorsSelector = ' ol.chart-list__elements > li';
    var anchors = [];
    var title, price, url, elA;

    var list = [];

    var rank, title, artist, videoId, image, update_dt;
    body(anchorsSelector).each(function () {
        anchors.push($(this));
    });
    if (anchors.length > 0) {

        var i = 0;

        for (const el of anchors) {
            
            rank = el.find('.chart-element__rank__number').text().trim();

            if (rank == '') continue;
            console.log(el.find('.chart-element__rank__number').text())
            title = el.find('button > span:nth-child(2) > span:nth-child(1)').text().trim();
            console.log(el.find('button > span:nth-child(2) > span:nth-child(1)').text().trim())
            artist = el.find('button > span:nth-child(2) > span:nth-child(2)').text().trim();
            console.log(el.find('button > span:nth-child(2) > span:nth-child(2)').text().trim())

            //list.push({ 'rank': rank, 'title': title, 'artist': artist, 'image': "img", 'videoId': "a", 'update_dt': moment().format('YYYY-MM-DD HH:mm:ss') })

            
            console.log(el.find('.chart-element__information__artist text--truncate color--secondary').text())
            var t = getYoutubuID(el.find('button > span:nth-child(2) > span:nth-child(1)').text().trim() + '-' + el.find('button > span:nth-child(2) > span:nth-child(2)').text().trim())

            getYoutubuID(el.find('button > span:nth-child(2) > span:nth-child(1)').text().trim() + '-' + el.find('button > span:nth-child(2) > span:nth-child(2)').text().trim()).then(function (val) {
              
                videoId = val.items[0].id.videoId;
                image = val.items[0].snippet.thumbnails.high.url;

                console.log(val.items[0].id.videoId);
                console.log(val.items[0].snippet.thumbnails.high.url);


                list.push({ 'rank': rank, 'title': title, 'artist': artist, 'image': image, 'videoId': videoId, 'update_dt': moment().format('YYYY-MM-DD HH:mm:ss') })

            }).catch(function (err) {
                console.log(err);
            });

            await sleep(1000)

        }

        client.connect(err => {
            const collection = client.db("dridy").collection("stock");
                 collection.remove({}, function (err1, result) {

                console.log(result);

                try {
                    collection.insertMany(list, function(err,res){
                        client.close();
                    })
                    
                } catch (e) {
                    console.log(e);
                }
            });
           

          });

    }
}



(async () => {
    const browser = await puppeteer.launch({
        headless: true
    });
    const page = await browser.newPage();

    
    
    await page.goto("https://www.billboard.com/charts/hot-100", { waitUntil: "networkidle2" });
    const content = await page.content();

    
    await printConsole(content);
    await browser.close();
})();

