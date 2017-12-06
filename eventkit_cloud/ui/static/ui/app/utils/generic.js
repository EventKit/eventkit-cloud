import detector from 'detect-browser';

export function isBrowserValid() {
    const browser = detector.detect();
    const { name } = browser;
    if (name === 'ie') {
        const { version } = browser;
        const majorVersion = version.split('.')[0];
        if (Number(majorVersion) < 10) {
            return false;
        }
    }
    return true;
}

export function isMgrsString(c){ 
	var split = c.split('');
  var gzdNumber, squareId;
  if(isNumeric(split[0])){
  	if(isNumeric(split[1])){
    	if(isValidZoneLetter(split[2])){
            //Check letter/number quantities
      	    if(!isValidLetterNumberCombo(2, split)){
        	    return false;
            }
            var zoneNumber = split[0] + split[1];
            if(isValidZoneNumber(zoneNumber)){
                gzdNumber = split.slice(0,3)
            }
      }
    }
    if(isValidZoneLetter(split[1])){
        //Check letter/number quantities
    	if(!isValidLetterNumberCombo(1, split)){
        	return false;
        }
    	var zoneNumber = split[0];
        var zoneLetter = split[1];
    	if(isValidZoneNumber(zoneNumber) && isValidZoneLetter(split[1])){
        	gzdNumber = split.slice(0,2);
        }
    }
    if(!gzdNumber){
    	return false;
    }
    else if(gzdNumber.length !== split.length){
    	split = split.slice(gzdNumber.length, split.length);
    	if(isValidZoneLetter(split[0]), isValidZoneLetter(split[1])){
    		squareId = split.slice(0,2);
    	}
    	if(!squareId){
	    	return false;
        }
    }
    return true;
  }
  else{
    return false;
  }
}

function isNumeric(c) { return /\d/.test(c); }

function isValidZoneNumber(n){
  return n > 0 && n < 61;
}

function isValidZoneLetter(c){
	return c.length === 1 && c.match(/[a-z]/i) && (alphabetPosition(c) > 1 && alphabetPosition(c) < 25);
}

function alphabetPosition(text) {
  return text.toLowerCase().replace(/[^a-z]/g, '')
        .replace(/./g, ([c]) => ' ' + (c.charCodeAt(0) - 'a'.charCodeAt(0) + 1))
        .substr(1);
}

function isValidLetterNumberCombo(initialDigitCount, cArr){
	var validLength = (parseInt(cArr.length-initialDigitCount) <= 13 && parseInt(cArr.length-initialDigitCount) % 2 === 1) && !isNaN(cArr.slice(initialDigitCount+3, cArr.length).join(''));
  return validLength;
}