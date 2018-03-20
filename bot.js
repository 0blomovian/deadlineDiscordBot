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
const skene = require('./ruoka.js');

client.on('ready', () => {
	console.log('Ready for some serious action!');
	let scheduler = new cron.CronJob('00 30 15 * * *', function(){deadlinesInFiveDays();}, null, true);
	client.user.setGame('Cisco NetAcad');
});

client.on('message', message => {
	if(message.content.toString().startsWith('!help')|| message.content.toString().startsWith('!commands')){
		message.reply('Avaible commands are: \n !add (Inserts new deadline to database. Format: DD.MM.YYYY deadline) \n !show (Prints all deadlines in database)');
	}
});

client.on('message', message => {
	if(message.content.toString().startsWith('!iiro')) {
		let channel = client.channels.get(nea17spc); 
		channel.send('<@124803977014542339> sinua kaivataan todella paljon, en minä vaan '+message.author );

	}
});

client.on('message', message => {
	if(message.content.toString().startsWith('!skene')){
		let channel = client.channels.get(nea17spc);
		//channel.send(skene.getSkeneList() );
		skene.getSkeneList((data) => {
			channel.send(data);	
		});
	}	
});

client.on('message', message => {
	if(message.content.toString().startsWith('!ty')) {
		let channel = client.channels.get(nea17spc);
		channel.send('Kiitokset!\n-Ruokalista: Jesse\n-Valokuitu: Pomarkun kunta\n-Laitteet: Cisco Systems');
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
				result[i]['pvm'].hours(22);
			}
			result = result.filter(function (item) {
				return item['pvm'] >= moment()
			});
			result.sort(sortDate);
			let printableArray = '';
			
			switch(result.length){
				case 0:
					printableArray = '!iiro feed me!!!\n';
					break;
				case 1:
					printableArray = 'Next deadline:\n';
					break;
				case 2:
					printableArray = 'Next ' + result.length + ' deadlines:\n';
					break;
				default:
					printableArray = 'Next 5 deadlines:\n';
					break;
			}
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

function formatTodayDate(adder) {
	let pvm = moment();
	pvm = moment(pvm).add(adder, 'days').format("DD.MM.YYYY")
	return pvm;	
}

function getAllData(message){
	MongoClient.connect(info.dbUrl(), function(err, db) {
		if(err) throw err;
		db.collection(collectionName).find({}).toArray(function(err,result){
			if(err) throw err;
			//käsittele data
			for(let i=0; i < result.length; i++){
				result[i]['pvm'] = moment(result[i]['pvm'], format);
			}
			result = result.filter(function (item) {
				return item['pvm'] > moment()
			});
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
