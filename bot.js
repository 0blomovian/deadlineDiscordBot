'use strict';
const Discord = require('discord.js');
const moment = require('moment');
const cron = require('cron');
const MongoClient = require('mongodb').MongoClient, assert = require('assert');
const info = require('./info');
const collectionName = 'deadlines';
const client = new Discord.Client();
const testikanava = '175457375933693952';
const nea17spc = '357091902081859595';
const format = 'DD.MM.YYYY';
client.on('ready', () => {
	console.log('Ready to some serious action!');
	let scheduler = new cron.CronJob('00 30 15 * * *', function(){deadlinesInFiveDays();}, null, true);
});
client.on('message', message => {
	if(message.content.toString().startsWith('!help')|| message.content.toString().startsWith('!commands')){
		message.reply('Avaible commands are: \n !add (Inserts new deadline to database. Format: DD.MM.YYYY deadline) \n !show (Prints deadlines for next five days.)');
	}
});

client.on('message', message => {
	if(message.content.toString().startsWith('!add')){
		let modifiedString = message.content.toString().split(' ').slice(1);
		let dateString = modifiedString[0];
		if(dateString == null){
			message.reply('Syntax error #85928. Use command !help to get more information.');
			return;
		}
		let deadlineString = modifiedString.slice(1);
		deadlineString = deadlineString.toString().replace(/\,/g,' ');
		if(checkIfDateIsValid(dateString)) {
			message.reply('Syntax Error #2102. Use command !help to get more information.');
		}else{
			//insert to db
			MongoClient.connect(info.dbUrl(), function(err, db){
				if(err) throw err;
				var toDb =  { name: deadlineString, pvm: dateString };
				db.collection(collectionName).insertOne(toDb, function(err, res) {
				if(err) throw err;
				message.reply('new deadline added to database.');
			});
			db.close();
			});
		}
	}
});

client.on('message', message => {
	if(message.content.toString().startsWith('!show')){
		getAllData(message);	
	}
});

client.login(info.token());
function formatTodayDate(adder) {
	let pvm = moment();
	pvm = moment(pvm).add(adder, 'days').format("DD.MM.YYYY")
	return pvm;	
}

function checkIfDateIsValid(dateString){
	let dateArray = dateString.split('.');
	if(dateString.length !== 10 || dateArray[0].toString().length !== 2 || dateArray[1].toString().length !== 2 || dateArray[2].toString().length !== 4 ||
	parseInt(dateArray[0],10) > 31 || parseInt(dateArray[1],10) > 12 || parseInt(dateArray[2],10) < 2017 || parseInt(dateArray[2],10) > 2100) {
		return true;
	}else {
		return false;
	}
}

function deadlinesInFiveDays() {
	MongoClient.connect(info.dbUrl(), function(err, db) {
		if(err) throw err;
		db.collection(collectionName).find({}).toArray(function(err,result){
			if(err) throw err;
			for(let i=0; i < result.length; i++){
				result[i]['pvm'] = moment(result[i]['pvm'], format);
			}
			result.sort(sortDate);
			let printableArray = 'Next five deadlines:\n';
			let counter = 0;
			if(result.length < 5){
				counter = result.length;	
			}else {
				counter = 5;
			}
			for(let i=0; i < counter; i++){
				printableArray = printableArray + result[i]['pvm'].format('dddd, MMMM Do YYYY') + ': ' +result[i]['name'] + '\n';
			}
			let channel = client.channels.get(nea17spc); 
			channel.send(printableArray);
			db.close();
		});
	});
}

//function deadlinesInFiveDays() {
//	MongoClient.connect(info.dbUrl(), function(err, db) {
//		if(err) throw err;
//		let query = { pvm : { $in: [formatTodayDate(0), formatTodayDate(1), formatTodayDate(2), formatTodayDate(3), formatTodayDate(4)]}}; 
//		db.collection(collectionName).find(query).toArray(function(err, result) {
////			if(err) throw err;
//			let stripResults = 'Tulevat deadlinet: \n ';
//			let channel = client.channels.get(testikanava); 
//			for(let i = 0; i < result.length; i++){
//				stripResults = stripResults + result[i]['pvm']+': '+ result[i]['name']+ '\n';	
//			}
//			channel.send(stripResults);
//			db.close();
//		});
//	});
//}

function getAllData(message){
	MongoClient.connect(info.dbUrl(), function(err, db) {
		if(err) throw err;
		db.collection(collectionName).find({}).toArray(function(err,result){
			if(err) throw err;
			//käsittele data
			for(let i=0; i < result.length; i++){
				result[i]['pvm'] = moment(result[i]['pvm'], format);
			}
			result.sort(sortDate);
			let printableArray = 'All deadlines:\n';
			for(let i=0; i < result.length; i++){
				printableArray = printableArray + result[i]['pvm'].format('dddd, MMMM Do YYYY') + ': ' +result[i]['name'] + '\n';
			}
			message.reply(printableArray);
			db.close();
		});
	});

}
function sortDate(a,b){
	if(a['pvm'].isBefore(b['pvm'])){
		return -1;
	}
	if(a['pvm'].isAfter(b['pvm'])){
		return 1;
	}
	if(a['pvm'].isSame(b['pvm'])){
		return 0;
	}
}
