let socket = io()

//Elements
let msgForm = document.getElementById('msgForm')
let btnSend = document.getElementById('btnSend')
let btnCamera = document.getElementById('btnCamera')
let btnLocation = document.getElementById('btnLocation')
let inputMsg = document.getElementById('msg')
let messages = document.getElementById('messages')
let sidebar = document.getElementById('sidebar')
let sidebarToggleMenu = document.getElementById('sidebarToggleMenu')
let typingStatus = document.getElementById('typing-status')
let liveVideo = document.getElementById('liveVideo')
let btnFlipCamera = document.getElementById('btnFlipCamera')
let btnCapture = document.getElementById('btnCapture')
let btnSendLivePhoto = document.getElementById('btnSendLivePhoto')
let btnCancelCamera = document.getElementById('btnCancelCamera')
let btnCloseModal = document.getElementById('btnCloseModal')
let capturedPhoto = document.getElementById('capturedPhoto')
let front = true
let stream = null
let constraintObj = { video: true };

//Templates
let isTypingTemplate = document.getElementById('isTyping-template').innerHTML
let messageTemplate = document.getElementById('message-template').innerHTML
let locationTemplate = document.getElementById('location-template').innerHTML
let imageTemplate = document.getElementById('image-template').innerHTML
let liveImageTemplate = document.getElementById('live-image-template').innerHTML
let sidebarTemplate = document.getElementById('sidebar-template').innerHTML

//Options

const { username, room } = Qs.parse(location.search, {ignoreQueryPrefix : true})

const autoscroll = () => {
    // new message element
    let newMessage = messages.lastElementChild
    // height of new message
    let newMessageStyles = getComputedStyle(newMessage)
    let newMessageMargin = parseInt(newMessageStyles.marginBottom)
    let newMessageHeight = newMessage.offsetHeight + newMessageMargin
    // visible height
    let visibleHeight = messages.offsetHeight
    // height of messages container
    let containerHeight = messages.scrollHeight
    // how far have I scrolled
    let scrollOffset = messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset) {
        messages.scrollTop = messages.scrollHeight
    }
}

let imageData

const capture = () => {
    constraintObj.video = { facingMode: front ? 'user' : 'environment' }
    if(constraintObj.video.facingMode == "user") {
        liveVideo.classList.add('flip')
    }
    
    if(constraintObj.video.facingMode == "environment") {
        liveVideo.classList.remove('flip')
    }
  navigator.mediaDevices.getUserMedia(constraintObj)
    .then(function(_stream) {
      stream  = _stream;
      liveVideo.srcObject = stream;
      liveVideo.play();
    })
    .catch(function(err) {
      console.log(err)
    });
}

const uploadFile = (imageTag) => {
    const file = imageTag.files[0]
    if(!file) return
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
        if(file.size <= 1000000) {
            imageData = event.target.result
            return
        }
        const imgElement = document.createElement('img')
        imgElement.src = event.target.result
        imgElement.onload = (e) => {
            const canvas = document.createElement('canvas')
            const MAX_WIDTH = 250
            const scaleSize = MAX_WIDTH / e.target.width
            canvas.width = MAX_WIDTH
            canvas.height = e.target.height * scaleSize
            const ctx = canvas.getContext('2d')
            ctx.drawImage(e.target, 0, 0, canvas.width, canvas.height)
            const srcEncoded = ctx.canvas.toDataURL(e.target, 'image/jpeg')
            console.log(srcEncoded)
            imageData = srcEncoded
        }
    }
}

const isTyping = () => {
    socket.emit('isTyping', {})
}

const stopStream = () => {
    liveVideo.pause()
    liveVideo.src = null
    stream.getTracks()[0].stop()
    capturedPhoto.src = ""
}

setInterval(() => {
    typingStatus.innerHTML = ""
},3000)

socket.on('isTyping', (data) => {
    const html = Mustache.render(isTypingTemplate, {
        username: data.username
    })
    typingStatus.innerHTML = html
})

socket.on('message', (data) => {
    const html = Mustache.render(messageTemplate, {
        username : data.username,
        message : data.text,
        createdAt : moment(data.createdAt).format('h:mm A')
    })
    
    if(!data.text) {
        return
    }
    messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('imageMessage', (data) => {
    const html = Mustache.render(imageTemplate, {
        username : data.username,
        src : data.src,
        createdAt :  moment(data.createdAt).format('h:mm A')
    })
    
    if(!data.src) {
        return
    }
    messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('liveImageMessage', (data) => {
    const html = Mustache.render(liveImageTemplate, {
        username : data.username,
        src : data.src,
        createdAt :  moment(data.createdAt).format('h:mm A')
    })
    
    if(!data.src) {
        return
    }
    messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (data) => {
    const html = Mustache.render(locationTemplate, {
        username : data.username,
        location : data.url,
        createdAt :  moment(data.createdAt).format('h:mm A')
    })
    messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', (data) => {
    const html = Mustache.render(sidebarTemplate, {
        users : data.users,
        room : data.room.toUpperCase()
    })
    sidebar.innerHTML = html
    sidebarToggleMenu.innerHTML = html
})
btnSend.onclick = () => {
    let msg = inputMsg.value
    if(!msg && !imageData) {
        return
    }
        
    socket.emit('sendImage', {
        src: imageData,
        createdAt: new Date().getTime()
    }, () => {
        imageData = null
    })

    btnSend.setAttribute('disabled', 'disabled')
    inputMsg.value = ''
    inputMsg.focus()
    socket.emit('sendMessage', {
        text: msg,
        createdAt: new Date().getTime()
    }, () => {
        btnSend.removeAttribute('disabled')
    })
}

btnCamera.onclick = () => {
    capture()
}

btnFlipCamera.onclick = () => {
    if( stream == null ) return
    stream.getTracks().forEach(t => {
      t.stop();
    });
    front = !front;
    console.log(constraintObj)
    capture();
}

let liveImageData

btnCapture.onclick = () => {
    const canvas = document.createElement('canvas')
    canvas.width = liveVideo.videoWidth
    canvas.height = liveVideo.videoHeight
    let ctx = canvas.getContext('2d')
    ctx.scale(-1,1)
    console.log(canvas.width + " " + canvas.height)
    if(canvas.width && canvas.height) {
        ctx.drawImage(liveVideo, 0, 0, canvas.width*-1, canvas.height)
        liveImageData = canvas.toDataURL('image/png')
        capturedPhoto.setAttribute('src', liveImageData)
    }
}

btnSendLivePhoto.onclick = () => {
    console.log('here')
    if(!liveImageData) return
    console.log('hereee')
    socket.emit('sendLiveImage', {
        src: liveImageData,
        createdAt: new Date().getTime()
    }, () => {
        liveImageData = null
    })
    stopStream()
}

btnCancelCamera.onclick = () => {
    stopStream()
}

btnCloseModal.onclick = () => {
    stopStream()
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
        })
    }, null, {
        enableHighAccuracy: true,
        timeout: 5000
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
