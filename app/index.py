from app import app, socketio
from flask import render_template, request, jsonify
from flask_socketio import send, emit
import app.utils as utils
import random

clients = {}
id_roms = []

@socketio.on('message')
def handlesMessage(json):
    global clients
    print('Message: ' + json.get('msg'))
    username = clients.get(json.get('sid'))
    emit(
        'message', 
        {
            'msg': json.get('msg'),
            'username': username
        }, 
        room=json.get('pid')
    )
    emit(
        'message', 
        {
            'msg': json.get('msg'),
            'username': username
        }, 
        room=json.get('sid')
    )

@socketio.on('login')
def login(json):
    print('User login:', json.get('username'))
    global clients
    clients[request.sid] = json.get('username')
    emit('users', {'user_count': len(clients)}, broadcast=True)

@socketio.on('connect')
def connect():
    global clients
    print('user connect, has {} connection'.format(len(clients)))

@socketio.on('disconnect')
def disconnect():
    global clients
    print('user disconnect, has {} connection'.format(len(clients)))
    clients.pop(request.sid)
    emit('users', {'user_count': len(clients)}, broadcast=True)

@socketio.on('create_room')
def handles(json):
    if json.get('header') == 'init_g_p':
        pass
    elif json.get('header') == 'share_key':
        emit('create_room', json, room=json.get('pid'))

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/get_list_users')
def get_list_users():
    return jsonify(clients)

@app.route('/api/create_room', methods=['POST'])
def create_room():
    global id_roms
    id_rom = random.randint(1, 100)
    while(id_rom in id_roms):
        id_rom = random.randint(1, 100)

    g = utils.generate_big_prime(8)
    p = utils.generate_big_prime(8)

    print('g: {}, p: {}'.format(g, p))

    sid = request.form.get('sid')
    pid = request.form.get('pid')
    print(sid, pid)
    emit('create_room', { 'header': 'init_g_p', 'id_room': id_rom, 'g': g, 'p': p , 'pid': pid}, namespace='/', room=sid)
    emit('create_room', { 'header': 'init_g_p', 'id_room': id_rom, 'g': g, 'p': p , 'pid': sid}, namespace='/', room=pid)
    return jsonify({'code': 200})
    

