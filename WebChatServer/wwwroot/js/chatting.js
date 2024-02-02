"use strict";

// Initialize SignalR connection
var connection = new signalR.HubConnectionBuilder().withUrl("/chat").build();
var isReconnecting = false;

// User's nickname
var userNickname = '';
// 방 코드 변수 추가 (사용자가 방에 입장했을 때 설정)
var currentRoomCode = '';


// Assign DOM elements to variables

// 채팅관련
var chatContainer = document.getElementById("chatContainer");
var sendButton = document.getElementById("sendButton");
var fileInputButton = document.getElementById("fileInputButton");
var reconnectButton = document.getElementById("reconnectButton");
var messagesList = document.getElementById("messagesList");
var messageInput = document.getElementById("messageInput");
var roomCode = document.getElementById('roomCode');
// 유저리스트메뉴
var menuButton = document.getElementById("menuButton");
var userListMenu = document.getElementById("userList");
var userListItems = document.getElementById("userListItems");

// 닉네임 입력 관련
var nicknamePrompt = document.getElementById("nicknamePrompt");
var nicknameInput = document.getElementById("nicknameInput");
var startChatButton = document.getElementById("startChatButton");

// 룸 관련
var roomEntry = document.getElementById("roomEntry");
var roomCodeInput = document.getElementById("roomCodeInput");
var joinRoomButton = document.getElementById("joinRoomButton");


function toggleUIForConnection(connected) {
	sendButton.style.display = connected ? 'block' : 'none';
	fileInputButton.style.display = connected ? 'block' : 'none';
	messageInput.style.display = connected ? 'block' : 'none';
	reconnectButton.style.display = connected ? 'none' : 'block';
}

function toggleMenu(isShow) {
	userListMenu.style.display = isShow ? 'block' : 'none';
}

function showNicknamePrompt() {
	nicknamePrompt.style.display = 'flex';
	roomEntry.style.display = 'none';
	chatContainer.style.display = 'none';

	nicknameInput.value = '';
}

function showRoomEntry() {
	nicknamePrompt.style.display = 'none';
	roomEntry.style.display = 'flex';
	chatContainer.style.display = 'none';

	// 룸 보여줄때 메시지도 전부 클리어
	roomCodeInput.value = '';
	messagesList.innerHTML = '';
}

function showChatContainer() {
	nicknamePrompt.style.display = 'none';
	roomEntry.style.display = 'none';
	chatContainer.style.display = 'block';
}

function updateRoomCode(newCode) {
	roomCode.textContent = newCode;
	currentRoomCode = newCode;
	console.log('RoomCode: ' + newCode);
}

function displaySystemMessage(message) {
	var messageContainer = document.createElement("div");
	messageContainer.classList.add("system-message");
	var li = document.createElement("li");
	li.textContent = `- ${message} -`;
	messageContainer.appendChild(li);
	messagesList.appendChild(messageContainer);
	messagesList.scrollTop = messagesList.scrollHeight;
}

function onClickImg(e) {
	const modal = document.getElementById('imageModal');
	const modalImg = document.getElementById('modalImage');
	const captionText = document.getElementById('caption');
	modal.style.display = "block";
	modalImg.src = e.src;
	captionText.innerHTML = e.alt;
}

function addMessageToChat(user, data, name, messageType, timestamp) {
	var messageContainer = document.createElement("div");
	messageContainer.classList.add("message-container");

	// 닉네임 라벨 추가
	var nicknameLabel = document.createElement("div");
	nicknameLabel.textContent = user;
	nicknameLabel.classList.add("nickname-label");
	messageContainer.appendChild(nicknameLabel);

	var li = document.createElement("li");
	console.log(messageType);
	if (messageType === "Image") {
		var img = document.createElement("img");
		img.src = data; // Base64 이미지 데이터
		img.title = name;
		img.style.maxWidth = "200px"; // 이미지 크기 조정
		img.style.cursor = "pointer"; // 커서를 포인터로 변경하여 클릭 가능함을 나타냅니다.
		img.alt = "Uploaded image"; // 접근성을 위한 대체 텍스트
		li.appendChild(img);

		// 이미지 클릭 시 모달을 열어 큰 이미지 보기
		img.onclick = function () { onClickImg(this); }

	} else if (messageType === "File") {
		var link = document.createElement("a");
		link.href = data; // 파일 URL 또는 Base64 데이터
		link.textContent = name; // 링크 텍스트로 파일 이름 사용
		link.download = name; // 다운로드할 파일 이름 설정
		li.appendChild(link);
	} else if (messageType === "Text") {
		var messageText = document.createTextNode(data);
		li.appendChild(messageText);
	}

	// Check if the message is from the current user
	if (user === userNickname) {
		messageContainer.classList.add("my-message");
	} else {
		messageContainer.classList.add("other-message");
	}

	// 타임스탬프 처리
	var timeSpan = document.createElement("span");
	timeSpan.classList.add("timestamp");
	var messageTime = new Date(timestamp).toLocaleTimeString();
	timeSpan.textContent = messageTime;
	li.appendChild(timeSpan);
	messageContainer.appendChild(li);

	messagesList.appendChild(messageContainer);
	messagesList.scrollTop = messagesList.scrollHeight;
}


//function addMessageToChat(user, message, timestamp) {
//	var messageContainer = document.createElement("div");
//	messageContainer.classList.add("message-container");
//
//	// Create and append the nickname label
//	var nicknameLabel = document.createElement("div");
//	nicknameLabel.textContent = user;
//	nicknameLabel.classList.add("nickname-label");
//	messageContainer.appendChild(nicknameLabel); // Append nickname label to the container
//
//	var li = document.createElement("li");
//	var messageText = document.createTextNode(message);
//	li.appendChild(messageText);
//
//	// Check if the message is from the current user
//	if (user === userNickname) {
//		messageContainer.classList.add("my-message");
//	} else {
//		messageContainer.classList.add("other-message");
//	}
//
//	var timeSpan = document.createElement("span");
//	timeSpan.classList.add("timestamp");
//	var messageTime = new Date(timestamp).toLocaleTimeString(); // Format the timestamp
//	timeSpan.textContent = messageTime;
//
//	li.appendChild(timeSpan); // Append timestamp to the message list item
//	messageContainer.appendChild(li); // Append the list item to the message container
//
//	messagesList.appendChild(messageContainer); // Append the message container to the messages list
//	messagesList.scrollTop = messagesList.scrollHeight; // Auto-scroll to the newest message
//}

function sendMessage() {
	var message = messageInput.value.trim();
	var timestamp = new Date().toISOString();
	if (message && currentRoomCode) {
		connection.invoke("SendMessage", currentRoomCode, userNickname, message, timestamp).catch(err => console.error(err.toString()));
		messageInput.value = '';
	}
}

function sendImage(imageData) {
	var timestamp = new Date().toISOString();
	if (imageData && currentRoomCode) {
		console.log(imageData.target.result);
		connection.invoke("SendImage", currentRoomCode, userNickname, imageData.target.result, timestamp).catch(err => console.error(err.toString()));
	}
}

function setNickname() {
	userNickname = nicknameInput.value.trim();
	if (userNickname) {
		startConnection();
	} else {
		alert("Please enter a nickname to continue.");
	}
}

function updateUserList(users) {
	userListItems.innerHTML = ""; // 기존 목록을 초기화

	users.forEach(function (user) {
		var li = document.createElement("li");
		li.textContent = user; // 사용자 닉네임 설정
		userListItems.appendChild(li);
	});
}



////////////////////////////////////////////////////////
// SignalR
////////////////////////////////////////////////////////

async function startConnection() {
	if (connection.state === signalR.HubConnectionState.Disconnected) {
		try {
			await connection.start();
			console.log(isReconnecting ? "Reconnection successful" : "Connection established");

			if (!userNickname) {
				userNickname = nicknameInput.value.trim();
			}

			if (userNickname) {
				await connection.invoke("SetNickname", userNickname);
				if (isReconnecting) {
					// 재접속 관련 로직
					await reconnectJoin();
				} else {
					// 신규 접속 관련 로직
					showRoomEntry();
				}
				console.log("Nickname set: ", userNickname);
			} else {
				showNicknamePrompt();
				console.log("Nickname is required.");
			}

		} catch (err) {
			console.error('Connection failed to start:', err);
			displaySystemMessage("서버 접속 실패");
			toggleUIForConnection(false);
		} finally {
			isReconnecting = false;
		}
	}
}

async function createRoom() {
	const roomCode = await connection.invoke('CreateRoom');

	// UI업데이트
	updateRoomCode(roomCode);
	showChatContainer();
	toggleUIForConnection(true);
}
async function joinRoom() {
	const roomCode = document.getElementById('roomCodeInput').value.trim();
	if (roomCode) {
		const result = await connection.invoke('JoinRoom', roomCode);
		if (result) {
			// 방 입장 후 UI 업데이트
			updateRoomCode(roomCode);
			showChatContainer();
			toggleUIForConnection(true);
		}
	}
}

async function reconnectJoin() {
	if (currentRoomCode) {
		const roomCode = await connection.invoke('ReconnectJoinRoom', currentRoomCode);
		// UI업데이트
		updateRoomCode(roomCode);
		toggleUIForConnection(true);
	}
}

async function userList() {
	if (currentRoomCode) {
		const users = await connection.invoke('UserList', currentRoomCode);
		updateUserList(users);
		toggleMenu(true);
	}
}

async function attemptReconnect() {
	displaySystemMessage("서버 접속 재시도 중");
	isReconnecting = true;

	try {
		await startConnection();
	} catch (error) {
		console.error('Failed to reconnect:', error);
		displaySystemMessage("서버 접속 실패");
		toggleUIForConnection(false);
		isReconnecting = false;
	}
}

connection.on("ReceiveMessage", addMessageToChat);
connection.on("ReceiveSystemMessage", (message, timestamp) => displaySystemMessage(message));
connection.on("ReceiveAlertMessage", (message, timestamp) => alert(message));
connection.onclose(error => {
	console.error('Connection lost:', error);
	displaySystemMessage("서버와의 연결이 종료됨");
	toggleUIForConnection(false);
});



////////////////////////////////////////////////////////
// Event
////////////////////////////////////////////////////////
document.getElementById("sendButton").addEventListener("click", sendMessage);
document.getElementById("reconnectButton").addEventListener('click', attemptReconnect);
document.getElementById("startChatButton").addEventListener('click', setNickname);


// 방 생성 요청
document.getElementById('createRoomButton').addEventListener('click', createRoom);
document.getElementById('joinRoomButton').addEventListener('click', joinRoom);

document.getElementById('menuButton').addEventListener('click', async function () {
	if (userListMenu.style.display == 'none') {
		await userList();
	} else {
		toggleMenu(false);
	}
});

document.getElementById('roomCode').addEventListener('click', function () {
	navigator.clipboard.writeText(this.textContent)
		.then(() => alert('방 코드가 복사되었습니다: ' + this.textContent))
		.catch(err => console.error('복사 실패', err));
});

document.getElementById("messageInput").addEventListener("keypress", function (event) {
	if (event.key === "Enter" && !event.shiftKey) {
		event.preventDefault();
		sendMessage();
	}
});
document.getElementById("nicknameInput").addEventListener("keypress", function (event) {
	if (event.key === "Enter") {
		event.preventDefault();
		startChatButton.click();
	}
});

document.getElementById("roomCodeInput").addEventListener("keypress", function (event) {
	if (event.key === "Enter") {
		event.preventDefault();
		joinRoomButton.click();
	}
});

document.getElementById('fileInput').addEventListener('change', function (event) {
	const files = Array.from(this.files);
	const progressBar = document.getElementById('uploadProgress');
	let totalSize = files.reduce((acc, file) => acc + file.size, 0);
	let loadedSize = 0;
	var timestamp = new Date().toISOString();

	progressBar.value = 0; // 프로그레스 바 초기화
	progressBar.style.display = 'block';

	files.forEach(file => {
		// 파일 유형에 따라 처리 방법을 구분합니다.
		if (file.type.startsWith('image/')) {
			// 이미지 파일 처리
			var reader = new FileReader();
			reader.onload = function (e) {
				// SignalR을 사용하여 서버로 이미지 파일 전송
				connection.invoke("SendImage", currentRoomCode, userNickname, e.target.result, file.name, timestamp)
					.catch(err => console.error(err.toString()));
			};
			reader.readAsDataURL(file);
		} else {
			// 비이미지 파일 처리
			var reader = new FileReader();
			reader.onload = function (e) {
				// SignalR을 사용하여 서버로 비이미지 파일 전송
				connection.invoke("SendFile", currentRoomCode, userNickname, e.target.result, file.name, timestamp)
					.catch(err => console.error(err.toString()));
			};
			reader.readAsDataURL(file);
		}

		reader.onprogress = function (event) {
			if (event.lengthComputable) {
				loadedSize += event.loaded;
				progressBar.value = (loadedSize / totalSize) * 100;
			}
		};

		reader.onloadend = function (e) {
			if (loadedSize >= totalSize) {
				setTimeout(() => {
					progressBar.value = 0; // 프로그레스 바 리셋
					progressBar.style.display = 'none'; // 업로드 완료 후 숨김
				}, 1000);
			}
		};
	});
});

// 시작
showNicknamePrompt();