// https://big-primes.ue.r.appspot.com/primes?digits=3
// Khai báo username
var username = prompt('Tên bạn là gì:');

// khai báo sources id, và destination id của socket
var sid, pid;

// khai báo căn nguyên thủy công khai và số nguyên tố công khai
var g, p;

// khai báo khóa riêng của a, khóa công khai của a và khóa công khai của B
var a, A, B;

// khóa bí mật được tính ra bằng thuật toán diffie hellman
var K;

// danh sách user online
var listUsers;

// hàm kiểm tra số nguyên tố
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

// hàm sinh số nguyên theo số bit
function generateBigInt(n) {
    const begin = bigInt(2).pow(n-1);
    const end = bigInt(2).pow(n);
    return bigInt.randBetween(begin, end);
}

// hàm sinh số nguyên tố lớn theo số bit
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

$(document).ready(function() {
    document.getElementById('username').innerText = username;

    var socket = io('http://127.0.0.1:5000');

    socket.on('connect', function(json) {
        socket.emit('login', {username: username})
    })

    socket.on('login', function(json) {
        sid = json.sid;
    })

    window.addEventListener("beforeunload", function() {
        socket.emit('logout', {username: username});
    });

    socket.on('users', function(json) {
        document.getElementById('count').innerText = json.user_count;

        // lấy danh sách user
        listUsers = json.list_users;
        document.getElementById('list-user').innerHTML = '';
        for (let user in listUsers) {
            if (user != sid) {
                var item = document.createElement('li');
                item.classList.add('item-user');
                item.innerText = listUsers[user];

                // gắn sự kiện tạo phòng lên mỗi item trong list users
                item.addEventListener("click", function() {
                    document.getElementById('sent-to-username').innerText = listUsers[user];
                    document.getElementById('message').innerHTML = '';

                    // khỏi tạo phòng (g, p) rồi gửi đến user muốn tạo phòng
                    socket.emit(
                        'create_room', 
                        {
                            header: 'init_g_p', 
                            sid: sid, 
                            pid: user,
                            g: generateBigPrime(16).toJSON(),
                            p: generateBigPrime(16).toJSON()

                        }
                    );
                });
                $("#list-user").append(item);
            }
        }
    });

    // khi nhận được yêu cầu tạo phòng từ một user khác
    socket.on('create_room', function(json) {
        // nếu là khởi tạo phòng
        if (json.header == 'init_g_p') {
            // lưu lại g, p, và id của người gửi
            g = bigInt(json.g);
            p = bigInt(json.p);
            pid = json.pid;

            document.getElementById('sent-to-username').innerText = listUsers[pid];

            // tạo khóa riêng tư a, tính khóa công khai A
            a = generateBigInt(8);
            A = g.modPow(a, p);

            // gửi A cho user muốn tạo phòng
            socket.emit(
                'create_room', 
                { 
                    header: 'share_key', 
                    key: A.toJSON(), 
                    sid: sid, 
                    pid: pid
                }
            );
        } 
        // nếu là khóa công khai
        else if (json.header == 'share_key') {
            // lưu lại khóa công khai của người muốn tạo phòng 
            B = bigInt(json.key);

            // tính khóa bí mật chung
            K = B.modPow(a, p);

            const li = document.createElement('li');
            li.innerText = `Đã thực hiện trao đổi khóa bằng thuật toán Diffie Hellman.\n` + 
                `Có:\n` + 
                `Căn nguyên thủy công khai(g): ${g}\n` + 
                `Số nguyên tố công khai(p): ${p}\n` + 
                `Khóa riêng của bạn(a): ${a}\n ` + 
                `Khóa công khai của bạn(A): ${A}\n` + 
                `Khóa công khai của ${listUsers[pid]}(B): ${B}\n` + 
                `Khóa bí mật được tính ra từ thuật toán(K): ${K}`;
            $('#message').append(li);

            // mã hóa tin nhắn trước khi gửi đến user khác
            $('#sendBtn').on('click', function() {
                var msg = $('#myMessage').val();
                console.log(`Plaintext: ${msg}`);

                var encrypted = CryptoJS.AES.encrypt(msg, K.toString());
                console.log(`Ciphertext: ${encrypted.toString()}`);

                socket.emit(
                    'message', 
                    {
                        msg: encrypted.toString(),
                        sid: sid,
                        pid: pid
                    }
                );
                $('#myMessage').val('');
                $('#myMessage').focus();
            });
        }
    });

    // giải mã tin nhắn bị mã hóa
    socket.on('message', function(json) {
        console.log(`Ciphertext: ${json.msg}`);

        var decrypted = CryptoJS.AES.decrypt(json.msg, K.toString());
        console.log(`Plaintext: ${decrypted.toString(CryptoJS.enc.Utf8)}`);

        var message = document.createElement('li');
        message.innerHTML = `<i style="font-size: 13px;"><u>${json.time}</u></i>: ` + 
                            `<strong>${json.username}</strong>: ` + 
                            `${decrypted.toString(CryptoJS.enc.Utf8)}`;
        $('#message').append(message);

        const objDiv = document.getElementById('contain-message')
        objDiv.scrollTop = objDiv.scrollHeight;
    });
})

