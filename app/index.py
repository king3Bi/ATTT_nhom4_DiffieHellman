from app import app, socketio
from flask import render_template, request, jsonify
from flask_socketio import send, emit
import app.utils as utils
import random

clients = {}

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
    emit(
        'users', 
        {
            'user_count': len(clients),
            'list_users': clients
        }, 
        broadcast=True
    )

@socketio.on('logout')
def logout(json):
    print('User logout:', json.get('username'))
    global clients
    clients.pop(request.sid)
    emit(
        'users', 
        {
            'user_count': len(clients),
            'list_users': clients
        }, 
        broadcast=True
    )

@socketio.on('connect')
def connect():
    global clients
    print('user connect, has {} connection'.format(len(clients)))

@socketio.on('disconnect')
def disconnect():
    global clients
    print('user disconnect, has {} connection'.format(len(clients)))
    emit(
        'users', 
        {
            'user_count': len(clients),
            'list_users': clients
        }, 
        broadcast=True
    )

@socketio.on('create_room')
def handles(json):
    if json.get('header') == 'init_g_p':
        sid = json.get('sid')
        pid = json.get('pid')

        g = json.get('g')
        p = json.get('p')
        print('g: {}, p: {}'.format(g, p))
        
        emit(
            'create_room', 
            {
                'header': json.get('header'), 
                'g': g,
                'p': p,
                'pid': pid
            }, 
            namespace='/', 
            room=sid
        )
        emit(
            'create_room', 
            {
                'header': json.get('header'), 
                'g': g,
                'p': p,
                'pid': sid
            }, 
            namespace='/', 
            room=pid
        )
        
    elif json.get('header') == 'share_key':
        print('Share key {}: {}'.format(clients.get(request.sid), json.get('key')))
        emit('create_room', json, room=json.get('pid'))

@app.route('/')
def index():
    return render_template('index.html')



