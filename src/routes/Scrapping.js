const express = require('express');
const app = express();
const axios = require('axios');
const cheerio = require('cheerio');
const requestPromise = require('request-promise');
const bankMegaUrl = 'https://www.bankmega.com/promolainnya.php';
const ajaxUrl = 'https://www.bankmega.com/ajax.promolainnya.php?product=0';
const imageUrl = 'https://www.bankmega.com/';

let setCategories = [];
let setImage = [];

const options = {
    url: bankMegaUrl,
    transform: function(body){
        return cheerio.load(body);
    }
}

requestPromise(options)
    .then(($) => {
        app.get('/scrapping', function(req,res){

            axios.get(bankMegaUrl)
            .then((response) => {
                if (response.status === 200) {
                    $('#subcatpromo div').each(function (i, value) {
                        let image = $(value).find('img');
                        let url = ajaxUrl + "&subcat=" + (i + 1);
                        setCategories.push(image[0].attribs['title']);
                        setImage.push(imageUrl + image[0].attribs['src']);
                    });

                    var setObject = {};
                    setCategories.map(function (a) {
                        setObject[a] = { 
                            title: "sesuatu",
                            image: setImage
                        }

                    });

                    return res.send(setObject);
                }
            }, (error) => console.log(error));
        });
        
    })
    .catch(function (err) {
        console.log(err);
    });


module.exports = app;