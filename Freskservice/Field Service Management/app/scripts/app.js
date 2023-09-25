let geocoder;
let map;
let agents = []
let schedules = []
const calendarEl = document.getElementById('calendar');
const mapEl = document.getElementById('initMap')
const colors = ['#FF5733', '#FFA500', '#FFD700', '#4CAF50', '#1976D2', '#9C27B0', '#E91E63', '#000000', '#FFFFFF', '#808080'];
// const options = {
//   placement: 'right',
//   offset: 10
// };
document.onreadystatechange = function () {
  if (document.readyState === 'interactive') renderApp();

  function renderApp() {
    let onInit = app.initialized();
    onInit
      .then(function getClient(_client) {
        window.client = _client;
        client.events.on('app.activated', onActivated);
      })
      .catch(handleErr);
  }
};

async function onActivated() {
  agents = await getAllAgent()
  schedules = await getAllScheduled()
  const formatSchedule = mappingScheduled(schedules)
  generateAgent("calendar_agents", agents)
  generateAgent("map_agent", agents)
  initCalendar(formatSchedule)
  initMap(formatSchedule)
}

async function initCalendar(events) {
  let calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    height: 'auto',
    navLinks: true,
    editable: true,
    dayMaxEvents: true,
    eventStartEditable: false,
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    events: events,
    eventClick: function (event) {
      if (event.event.url) {
        event.jsEvent.preventDefault();
        window.open(event.event.url, "_blank");
      }
    },
    eventDidMount: function (info) {
      new Tooltip(info.el, {
        title: info.event.title,
        placement: 'top',
        trigger: 'hover',
        container: 'body'
      });
    },
  });

  calendar.render();
}

function initMap(list) {
  geocoder = new google.maps.Geocoder();
  map = new google.maps.Map(document.getElementById('initMap'), {
    zoom: 11
  });

  list?.forEach((element, index) => {
    codeAddress(element, index)
  });
};

function codeAddress(data, index) {
  geocoder.geocode({ 'address': data.address }, function (results, status) {
    var latLng = results[0].geometry.location;
    if (status == 'OK') {
      if (index === 0) map.setCenter(latLng)
      const marker = new google.maps.Marker({
        position: latLng,
        map: map,
        title: data.address
      });
      const contentString = generateTooltip(data)
      const infoWindow = new google.maps.InfoWindow({
        content: contentString,
        ariaLabel: data.title,
      });
      marker.addListener("click", () => {
        infoWindow.open({
          anchor: marker,
          map,
        });
      });
    } else {
      console.log('Geocode was not successful for the following reason: ' + status);
    }
  });
}

function generateTooltip(data) {
  const { id, title, start, end, agent_name } = data
  const contentString = `
  <div class="text-sm text-gray-500 bg-white">
    <div class="px-1">
        <h3 class="font-semibold text-gray-900 dark:text-white">${title}</h3>
        <div class="my-2">
          <p>Agent: ${agent_name}</p>
          <p>From: ${moment(start).format('DD/MM/yyyy HH:mm')}</p>
          <p>To: ${moment(end).format('DD/MM/yyyy HH:mm')}</p>
        </div>
        <a target="_blank" href="https://trusisor.freshservice.com/a/tickets/${id}" class="flex items-center font-medium text-blue-700 hover:underline">
          Read more 
          <svg class="w-2 h-2 ml-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4"/>
          </svg>
        </a>
    </div>
  </div>`
  return contentString
}

async function getAllScheduled() {
  const res = await client.request.invokeTemplate("getAllScheduled", {});
  const data = JSON.parse(res.response)
  return data?.records
}

function mappingScheduled(list) {
  const uniqueAgentsList = Array.from(new Set(list.map(item => item.data.agent_email)));

  return list?.map(item => {
    const { object_id: id, title, address, agent_email, agent_name } = item.data
    const agentIndex = uniqueAgentsList.indexOf(agent_email);
    const color = colors[agentIndex % colors.length];

    return {
      id: id,
      title: `[${id}] ${title}`,
      start: item.data.from_date_time.replace('Z', ''),
      end: item.data.to_date_time.replace('Z', ''),
      color,
      url: `https://trusisor.freshservice.com/a/tickets/${id}`,
      address: address,
      agent_name: agent_name,
      agent_email: agent_email,
      allDay: false
    };
  });
}

async function getAllAgent() {
  try {
    const res = await client.request.invokeTemplate("getAllAgent", {});
    const data = JSON.parse(res.response);
    return data.agents
  } catch (error) {
    console.log(error)
  }
}

function generateAgent(container, list) {
  list.forEach((item) => {
    const { first_name, last_name, email } = item;
    const option = document.createElement('option')
    option.value = email
    option.text = `${first_name || ''} ${last_name || ''} <${email}>`;
    document.getElementById(container).append(option)
  });
}

function handleErr(error) {
  console.log(error);
}