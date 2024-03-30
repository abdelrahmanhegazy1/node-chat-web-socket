const socket = io()

const $messageForm = document.querySelector('#message-form')
const $messageFormInput = document.querySelector('input')
const $messageFormButton = document.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector("#messages")

//Templates 
const messageTemplate = document.querySelector("#message-template").innerHTML
const messageURLTemplate = document.querySelector("#message-URL-template").innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
//Options 
const {username,room} =Qs.parse(location.search,{ignoreQueryPrefix:true})


const autoscroll = ()=> {
    //New Message elements 
    const $newMessage = $messages.lastElementChild

    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //Visible height
    const visibleHeight = $messages.offsetHeight

    //Height of messages container
    const ContainerHeight = $messages.scrollHeight

    const scrollOffset = $messages.scrollTop +visibleHeight

    if(ContainerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }


    console.log(newMessageMargin)
}

socket.on('message',(message)=> {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a'),
        username: message.username
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('locationMessage',(messageURL)=>{
    console.log(messageURL)
    const html = Mustache.render(messageURLTemplate,{
        messageURL: messageURL.url,
        createdAt: moment(messageURL.createdAt).format('h:mm a'),
        username: messageURL.username
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('roomData',({room , users})=> {
    const html = Mustache.render(sidebarTemplate, {
        room, 
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault()

    $messageFormButton.setAttribute('disabled','disabled')
    const messageData = e.target.elements.message.value

    socket.emit('sendMessage',messageData , (error)=> {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        if(error){
            return console.log(error)
        }

        console.log('The message deliverd')
    })
    $messageFormInput.textContent = ''

})

$sendLocationButton.addEventListener('click',(e)=>{
    if(!navigator.geolocation){
        return alert('Geo Location is not supported by your browser')
    }
    $sendLocationButton.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position)=>{
        console.log(position)
        socket.emit('sendLocation',{
            latitude: position.coords.longitude,
            longitude: position.coords.latitude
        },()=>{
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location Shared')
        })
        
    })
})

socket.emit('join',{username,room},(error)=>{

    if(error) {
        alert(error)
        location.href = '/'
    }

})