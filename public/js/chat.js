const socket = io();

const $messageForm = document.querySelector('#msg-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
const $sidebar = document.querySelector('#sidebar');
// const $locationUrl = document.querySelector('#locationUrl')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationUrlTemplate = document.querySelector('#location-msg-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
    // New message element 
    const $newMessage = $messages.lastElementChild;

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    // Visible height 
    const visibleHeight = $messages.offsetHeight;

    // Height of message container
    const containerHeight = $messages.scrollHeight;

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (msg) => {
    console.log(msg);
    const html = Mustache.render(messageTemplate, {
        username: msg.username,
        msg: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
})

socket.on('sendLocation', (locationData) => {
    console.log('Location :',locationData);
    const urlHTML = Mustache.render(locationUrlTemplate, {
        username: locationData.username,
        locationURL: locationData.url,
        createdAt: moment(locationData.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', urlHTML);
    autoscroll();
})

socket.on('roomData', ({room, users}) => {
    const sidebarHTML = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    $sidebar.innerHTML = sidebarHTML;
})

$messageForm.addEventListener('submit', (e) =>{
    e.preventDefault();
    // disable the form button
    $messageFormButton.setAttribute('disabled', 'disabled');

    const message = e.target.elements.message.value; 
    socket.emit('sendMessage', message, (error) => {
        // enable the form button
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();
        if(error){
            return console.log(error);
        }
        console.log('Message delivered!');
    });
})

$sendLocationButton.addEventListener('click', () => {
    if(!navigator.geolocation){
        return alert('GeoLocation is not supported by your browser.');
    }
    $sendLocationButton.setAttribute('disabled', 'disabled');
    
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude, 
            longitude: position.coords.longitude
        }, (msg) => {
            if(msg){
                console.log(msg);
                $sendLocationButton.removeAttribute('disabled');
            }
        });
    })
})

socket.emit('join', { username, room }, (error) => {
    if(error){
        alert(error);
        location.href = '/';
    }
});


