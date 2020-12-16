let socket = io()

//Elements
let msgForm = document.getElementById('msgForm')
let btnSend = document.getElementById('btnSend')
let btnLocation = document.getElementById('btnLocation')
let inputMsg = document.getElementById('msg')
let messages = document.getElementById('messages')

//Templates
let messageTemplate = document.getElementById('message-template').innerHTML
let locationTemplate = document.getElementById('location-template').innerHTML

//Options
const { username, room } = Qs.parse(location.search, {ignoreQueryPrefix : true})

socket.on('message', (data) => {
    console.log(data.text)
    const html = Mustache.render(messageTemplate, {
        username : data.username,
        message : data.text,
        createdAt : moment(data.createdAt).format('h:mm A')
    })
    messages.insertAdjacentHTML('beforeend', html)
})

socket.on('locationMessage', (data) => {
    const html = Mustache.render(locationTemplate, {
        username : data.username,
        location : data.url,
        createdAt :  moment(data.createdAt).format('h:mm A')
    })
    messages.insertAdjacentHTML('beforeend', html)
})

btnSend.onclick = () => {
    let msg = inputMsg.value
    btnSend.setAttribute('disabled', 'disabled')
    inputMsg.value = ''
    inputMsg.focus()
    socket.emit('msgSent', {
        text: msg,
        createdAt: new Date().getTime()
    }, (messgae) => {
        btnSend.removeAttribute('disabled')
        console.log('Message has been delivered!', messgae)
    })
}

btnLocation.onclick = () => {
    if(!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }
    btnLocation.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude : position.coords.latitude,
            longitude : position.coords.longitude
        }, (messgae) => {
            btnLocation.removeAttribute('disabled')
            console.log('Location has been shared!', messgae)
        })
    })
}

socket.emit('join', {
    username, room
}, (error) => {
    if(error) {
        alert(error)
        location.href = '/'
    }
})
