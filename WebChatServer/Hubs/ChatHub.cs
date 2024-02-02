using Microsoft.AspNetCore.SignalR;
using System.Linq;

namespace WebChatServer.Hubs
{
	public class User
	{
		public string ConnectionId { get; set; } = string.Empty;
		public string NickName { get; set; } = string.Empty;
		public string RoomCode { get; set; } = string.Empty;
	}

	public class ChatHub : Hub
	{
		private static readonly Dictionary<string, User> Users = new Dictionary<string, User>();
		private static readonly Dictionary<string, Dictionary<string, User>> Rooms = new Dictionary<string, Dictionary<string, User>>();

		public async Task<string> CreateRoom()
		{
			var generateRoomCode = () =>
			{
				var random = new Random();
				var code = "";
				do
				{
					code = "";
					for (int i = 0; i < 6; i++)
					{
						code += random.Next(0, 10).ToString();
					}
				} while (Rooms.ContainsKey(code));
				return code;
			};


			var user = Users[Context.ConnectionId];

			var roomCode = generateRoomCode();
			Rooms.Add(roomCode, new Dictionary<string, User>()
			{
				{ user.ConnectionId, user }
			});
			user.RoomCode = roomCode;

			await Groups.AddToGroupAsync(Context.ConnectionId, roomCode);
			await Clients.Group(roomCode).SendAsync("ReceiveSystemMessage", $"{user.NickName} 접속함", DateTime.UtcNow.ToString("o"));

			// 추가적인 방 생성 로직
			return roomCode;
		}

		public async Task<bool> JoinRoom(string roomCode)
		{
			if (Rooms.ContainsKey(roomCode))
			{
				var user = Users[Context.ConnectionId];
				user.RoomCode = roomCode;
				Rooms[roomCode].Add(user.ConnectionId, user);

				await Groups.AddToGroupAsync(Context.ConnectionId, roomCode);
				await Clients.Group(roomCode).SendAsync("ReceiveSystemMessage", $"{user.NickName} 접속함", DateTime.UtcNow.ToString("o"));
				return true;
			}

			// 방이 존재하지 않는 경우의 처리
			await Clients.Caller.SendAsync("ReceiveAlertMessage", "방이 존재하지 않습니다.", DateTime.UtcNow.ToString("o"));
			return false;
		}

		public async Task<string> ReconnectJoinRoom(string roomCode)
		{
			var user = Users[Context.ConnectionId];
			user.RoomCode = roomCode;

			if (false == Rooms.ContainsKey(roomCode))
			{
				Rooms.Add(roomCode, new Dictionary<string, User>()
				{
					{ user.ConnectionId, user }
				});
			}
			else
			{
				Rooms[roomCode].Add(user.ConnectionId, user);
			}

			await Groups.AddToGroupAsync(Context.ConnectionId, roomCode);
			await Clients.Group(roomCode).SendAsync("ReceiveSystemMessage", $"{user.NickName} 접속함", DateTime.UtcNow.ToString("o"));
			return roomCode;
		}
		public List<string> UserList(string roomCode)
		{
			if (false == Rooms.ContainsKey(roomCode))
			{
				return new List<string>();
			}

			var room = Rooms[roomCode];

			var list = new List<string>();
			foreach (var user in room.Values)
			{
				list.Add(user.NickName);
			}
			return list;
		}

		public void SetNickname(string nickname)
		{
			var connectionId = Context.ConnectionId;

			Users[connectionId] = new User()
			{
				ConnectionId = connectionId,
				NickName = nickname
			};

			return;
		}


		public override async Task OnDisconnectedAsync(Exception? exception)
		{
			var connectionId = Context.ConnectionId;
			if (Users.TryGetValue(connectionId, out var user))
			{
				if (false == string.IsNullOrEmpty(user.RoomCode))
				{
					if (Rooms.ContainsKey(user.RoomCode))
					{
						await Clients.Group(user.RoomCode).SendAsync("ReceiveSystemMessage", $"{user.NickName} 퇴장함", DateTime.UtcNow.ToString("o"));
						Rooms[user.RoomCode].Remove(user.ConnectionId);

						if (Rooms[user.RoomCode].Count <= 0)
						{
							Rooms.Remove(user.RoomCode);
						}
					}
				}
				Users.Remove(connectionId);
			}
			await base.OnDisconnectedAsync(exception);
		}

		public async Task SendMessage(string roomCode, string user, string message, string time)
		{
			if (Rooms.ContainsKey(roomCode))
			{
				await Clients.Group(roomCode).SendAsync("ReceiveMessage", user, message, time);
				return;
			}

			await Clients.Caller.SendAsync("ReceiveAlertMessage", "방이 존재하지 않습니다.", DateTime.UtcNow.ToString("o"));
		}
	}

}

