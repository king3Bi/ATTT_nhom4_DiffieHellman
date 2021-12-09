// https://big-primes.ue.r.appspot.com/primes?digits=3

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

function isPrime(num) {
    testCount = 10000;

    if (num == 1) {
        return false;
    }
    
    if (testCount >= num) {
        testCount = num.subtract(1);
    }

    for (let x = 0; x < testCount; x++ ) {
        const val = bigInt.randBetween(bigInt(1), bigInt(num.subtract(1)));
        if (val.modPow(num.subtract(1), num) != 1) {
            return false;
        }
    }
    return true;
}

function generateBigPrime(n) {
    const foundPrime = false;
    while (!foundPrime) {
        const begin = bigInt(2).pow(n-1);
        const end = bigInt(2).pow(n);
        const p = bigInt.randBetween(begin, end);
        if (isPrime(p)) {
            return p;
        }
    }
}
