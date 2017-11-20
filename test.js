const moment = require('moment');
const pvm = '21.12.2017';
const pvm2 = '03.12.2017';
const format ='DD.MM.YYYY';
let pvmM = moment(pvm, format);
let pvm2M = moment(pvm2, format);

let pvmArr = [pvmM,pvm2M,moment('05.05.2017',format), moment('05.05.2017', format), moment('01.01.2018', format)];
console.log(pvmArr);
console.log(pvmArr.sort(sortDate));

function sortDate(a,b){
	if(a.isBefore(b)){
		return -1;
	}
	if(a.isAfter(b)){
		return 1;
	}
	if(a.isSame(b)){
		return 0;
	}
}
