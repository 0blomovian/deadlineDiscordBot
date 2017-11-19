'use strict';
const Discord = require('discord.js');
const client = new Discord.Client();
const moment = require('moment');
const cron = require('cron');
const token = require('./token.js');
const MongoClient = require('mongodb').MongoClient, assert = require('assert');
const url = require('./url.js'); 
const collectionName = 'deadlines';

client.on('ready', () => {
	console.log('Ready to some serious action!');
	let scheduler = new cron.CronJob('00 59 14 * * *', function(){deadlinesInFiveDays();}, null, true);
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
			MongoClient.connect(url, function(err, db){
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
		deadlinesInFiveDays();
	}
});

client.login(token.token);
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
	MongoClient.connect(url, function(err, db) {
		if(err) throw err;
		let query = { pvm : { $in: [formatTodayDate(0), formatTodayDate(1), formatTodayDate(2), formatTodayDate(3), formatTodayDate(4)]}}; 
		db.collection(collectionName).find(query).toArray(function(err, result) {
		if(err) throw err;
		let stripResults = 'Tulevat deadlinet: \n ';
		let channel = client.channels.get('357091902081859595'); 
		for(let i = 0; i < result.length; i++){
			stripResults = stripResults + result[i]['pvm']+': '+ result[i]['name']+ '\n';	
		}
		channel.send(stripResults);
		db.close();
		});
	});
}
