const bankMegaUrl = 'https://www.bankmega.com/promolainnya.php';
const ajaxUrl = 'https://www.bankmega.com/ajax.promolainnya.php?product=0';
const imageUrl = 'https://www.bankmega.com';
const cheerio = require('cheerio');
const request = require("request");
const Promise = require("bluebird");
const fs = require('fs');
let jsonResult = {};
let setCategories = [];

main();
function getData(options) {
    return new Promise(function(resolve, reject) {
    	// Do async job
        request.get(options, function(err, resp, body) {
            if (err) {
                reject(err);
            } else {
                resolve(body);
            }
        })
    })
}    

function setPromoItemData($,tag, promoIndex) {
    let promoitem = [];                
    tag.parent().find("li").each(function(promoItemIndex,value){
        let a = $(value).find('a');
        let img = $(value).find('img');
        let href = a[0].attribs['href'];
        let promotitle = img[0].attribs['title'];
        let src = img[0].attribs['src'];

        // Populate category item on first page
        promoitem.push ({
            title : promotitle,
            imageUrl : imageUrl+"/"+src,
            link : href
        });     
    });

    // check if category already has promoItem, if not empty, concat the array
    let existingPromoitem = jsonResult[setCategories[promoIndex]];
    if(existingPromoitem) {
        existingPromoitem = existingPromoitem.concat(promoitem);
    } else {
        existingPromoitem = promoitem;
    }
    jsonResult[setCategories[promoIndex]] = existingPromoitem;   
}

async function main() {
    let catPromise = [];
    let catPagingPromise = [];

    // Get main categories and subcat url
    await getData(bankMegaUrl).then(function(result) {
        let $ = cheerio.load(result);
        $('#subcatpromo div').each(function (i, value) {
            let image = $(value).find('img');
            setCategories.push(image[0].attribs['title']);
            catPromise.push(getData(ajaxUrl + "&subcat=" + (i + 1)+"&page=1"));
        });    
    });    
    console.log("Load Main URL Done !");

    // Load each category on first page, Promisefy all
    await Promise.all(catPromise).then(function(catResult) {
        let $ = cheerio.load('<html>'+catResult+'</html>');
        $('#promolain').each(function (promoIndex, value) { 
            setPromoItemData($,$(this),promoIndex);          
        });  
        // Find the latest page and load each page
        $('.tablepaging').each(function (promoIndex, value) {

            let maxPage = 1;
            $(this).find('a').each(function (pageIndex, value) {
                let page = parseInt($(this).attr('page'));
                if(page > maxPage) {
                    maxPage = page;
                }
            });

            // Search all the pagination until lastPage except the category has only 1 page
            if(maxPage > 1) {
                for(i=2;i<=maxPage;i++) {
                    catPagingPromise.push({
                        "url" : ajaxUrl + "&subcat=" + (promoIndex + 1)+"&page="+i,
                        "page" : i,
                        "promoIndex" : promoIndex
                    });
                }
            }
        });
    });    
    console.log("Load category and paging Done!!");
    // Load page 2 - last page  per CATEGORY
    for(const paging of catPagingPromise) {
        //console.log(paging);
        await getData(paging.url).then(function(catPagingResult) {
            let $ = cheerio.load('<html>'+catPagingResult+'</html>');
            $('#promolain').each(function (i, value) { 
                setPromoItemData($,$(this),paging.promoIndex);          
            });   
        });     
    }
    console.log("Load subcat per page Done!!!");

    // Load image from promo detail

    for(const catName of setCategories) {
        let index = 0;
        const jsonArr = jsonResult[catName];
        for(const json of jsonArr) {
            let link = json.link;
            // Not all promo linked to promo_detail.php
            if(link.includes("promo_detail.php")) {
                const promoDetailUrl = imageUrl+"/"+json.link;
                await getData(promoDetailUrl).then(function(detailResult) {
                    let $ = cheerio.load(detailResult);
                    let img = $('.keteranganinside').find('img');
                    let imgSrc = img.attr('src');
                    link = imageUrl+imgSrc;
                });  
            }
            json.imageUrl = link;
            jsonResult[catName][index] = json;
            index++;
        }
    }
    console.log("Load promo detail done!!!!");


    fs.writeFile('result.json', JSON.stringify(jsonResult), function (err) {
        if (err) throw err;
    });

}