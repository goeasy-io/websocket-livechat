const goEasy = getApp().globalData.goEasy;
const pubSub = goEasy.pubsub;

Page({
	data: {
		currentRoom: null,
		// 道路展示
		propDisplay: {
			showPropType: 0,
			play: false,
			timer: null
		},
		newMessageContent: "",
		// 道具类型
		Prop: {
			HEART: 0,//桃心
			ROCKET: 1//火箭
		},
		// 消息类型
		MessageType: {
			CHAT: 0,//文字聊天
			PROP: 1//道具
		}
	},
	onLoad: function(options) {
		let roomToken = JSON.parse(options.roomToken);
		// 初始化room
		this.setData({
			currentRoom: {
				roomId: roomToken.roomId,
				roomName: roomToken.roomName,
				onlineUsers: {
					count: 0,
					users: []
				},
				messages: [],
				currentUser: {
					id: roomToken.userId,
					nickname: roomToken.nickname,
					avatar: roomToken.avatar
				}
			}
		});
		wx.setNavigationBarTitle({
			title: roomToken.roomName
		});
		// 连接goEasy
		this.connectGoEasy();
		// 监听用户上下线
		this.listenUsersOnlineOffline();
		// 监听新消息
		this.listenNewMessage();
	},
	onUnload(){
		// 退出聊天室
		goEasy.disconnect({
			onSuccess(){
				console.log("GoEasy disconnect successfully");
			},
			onFailed(error){
				console.log("GoEasy disconnect failed"+JSON.stringify(error));
			}
		});
	},
	// 连接goEasy
	connectGoEasy(){
		let self = this;
		let userData = {
			avatar: this.data.currentRoom.currentUser.avatar,
			nickname: this.data.currentRoom.currentUser.nickname
		}
		goEasy.connect({
			id : this.data.currentRoom.currentUser.id,
			data : userData,
			onSuccess: function(){
				console.log("GoEasy connect successfully.")
				// 加载在线用户列表
				self.loadOnlineUsers();
				// 加载最后10条消息历史
				self.loadHistory();
			},
			onFailed: function(error){
				console.log("Failed to connect GoEasy, code:"+error.code+ ",error:"+error.content);
			},
			onProgress: function(attempts){
				console.log("GoEasy is connecting", attempts);
			}
		});
	},
	// 监听用户上下线
	listenUsersOnlineOffline(){
		let self = this;
		let roomId = this.data.currentRoom.roomId;
		pubSub.subscribePresence({
			channel: roomId,
			onPresence: function (presenceEvents) {
				self.setData({
					"currentRoom.onlineUsers.count": presenceEvents.clientAmount
				});
				presenceEvents.events.forEach(function (event) {
					let userData = event.data;
					if (event.action === "join" || event.action === "online") {
						//进入房间
						let userId = event.id;
						let avatar = userData.avatar;
						let nickname = userData.nickname;
						let user = {
							id: userId,
							avatar: avatar,
							nickname: nickname
						};
						// 添加新用户
                        self.data.currentRoom.onlineUsers.users.push(user);
						self.setData({
							"currentRoom.onlineUsers.users": self.data.currentRoom.onlineUsers.users
						});
						// 添加进入房间的消息
						let message = {
							content: " 进入房间",
							senderUserId: userId,
							senderNickname: nickname,
							type: self.data.MessageType.CHAT
						};
						self.data.currentRoom.messages.push(message);
						self.setData({
							"currentRoom.messages": self.data.currentRoom.messages
						});
					} else {
						//退出房间
						self.data.currentRoom.onlineUsers.users.forEach((user, index) => {
							if (event.id === user.id) {
								// 删除当前聊天室列表中离线的用户
								let offlineUser = self.data.currentRoom.onlineUsers.users.splice(index, 1);
								self.setData({
									"currentRoom.onlineUsers.users": self.data.currentRoom.onlineUsers.users
								});
								let message = {
									content: " 退出房间",
									senderUserId: offlineUser[0].id,
									senderNickname: offlineUser[0].nickname,
									type: self.data.MessageType.CHAT
								};
								self.data.currentRoom.messages.push(message);
								self.setData({
									"currentRoom.messages": self.data.currentRoom.messages
								});
							}
						});
					}
					self.scrollBottom();
				});
			},
			onSuccess : function () {
				console.log("用户上下线监听成功")
			},
			onFailed : function (error) {
				if (error.code === 401) {
					console.log("监听用户上下线失败,默认不开通，付费应用，可以在我的应用->查看详情，高级功能里自助开通");
				} else {
					console.log("监听用户上下线失败, code:"+error.code+ ",content:"+error.content);
				}
			}
		})
	},
	// 监听新消息
	listenNewMessage(){
		// 监听当前聊天室的消息
		let self = this;
		let roomId = this.data.currentRoom.roomId;
		pubSub.subscribe({
			channel: roomId,
			onMessage : function (message) {
				let messageContent = "";
				let content = JSON.parse(message.content);
				//聊天消息
				if(content.type === self.data.MessageType.CHAT) {
					messageContent = content.content;
				}
				//道具消息
				if(content.type === self.data.MessageType.PROP) {
					if (content.content === self.data.Prop.ROCKET) {
						messageContent = "送出了一枚大火箭";
					}
					if (content.content === self.data.Prop.HEART) {
						messageContent = "送出了一个大大的比心";
					}
				}
				//添加消息
				let newMessage = {
					content: messageContent,
					senderUserId: content.senderUserId,
					senderNickname: content.senderNickname,
					type: self.data.MessageType.CHAT
				};
                self.data.currentRoom.messages.push(newMessage);
                self.setData({
                    "currentRoom.messages": self.data.currentRoom.messages
                });
				if (content.type === self.data.MessageType.PROP) {
					self.propAnimation(parseInt(content.content))
				}
				self.scrollBottom();
			},
			onSuccess : function () {
				console.log("监听新消息成功")
			},
			onFailed : function(error) {
				console.log("订阅消息失败, code:"+error.code+ ",错误信息:"+error.content);
			}
		})
	},
	// 加载在线用户列表
	loadOnlineUsers(){
		let self = this;
		let roomId = this.data.currentRoom.roomId;
		pubSub.hereNow({
			channels : [roomId],
			includeUsers : true,
			distinct : true,
			onSuccess:function (result) {
				let users = [];
				let currentRoomOnlineUsers = result.content.channels[roomId];
				currentRoomOnlineUsers.users.forEach(function(onlineUser) {
					let userData = onlineUser.data;
					let user = {
						id: onlineUser.id,
						nickname: userData.nickname,
						avatar: userData.avatar
					};
					users.push(user);
				});
				self.setData({
					"currentRoom.onlineUsers": {
						users: users,
						count: currentRoomOnlineUsers.clientAmount
					}
				});
			},
			onFailed: function (error) {
				//获取失败
				if(error.code === 401){
					console.log("获取在线用户失败,默认不开通，付费应用，可以在我的应用->查看详情，高级功能里自助开通");
				}else{
					console.log("获取在线用户失败, code:" + error.code + ",错误信息:" + error.content);
				}
			}
		})
	},
	// 加载最后10条消息历史
	loadHistory(){
		let self = this;
		let roomId = this.data.currentRoom.roomId;
		pubSub.history({
			channel: roomId, //必需项
			limit: 10, //可选项，返回的消息条数
			onSuccess:function(response) {
				let messages = [];
				response.content.messages.map(message => {
					let historyMessage = JSON.parse(message.content);
					//道具消息
					if (historyMessage.type === self.data.MessageType.PROP) {
						if (historyMessage.content === self.data.Prop.ROCKET) {
							historyMessage.content = "送出了一枚大火箭";
						}
						if (historyMessage.content === self.data.Prop.HEART) {
							historyMessage.content = "送出了一个大大的比心";
						}
					}
					messages.push(historyMessage);
				});
				self.setData({
					"currentRoom.messages": messages
				});
			},
			onFailed: function (error) {
				//获取失败
				if(error.code === 401){
					console.log("获取历史消息失败,默认不开通，付费应用，可以在我的应用->查看详情，高级功能里自助开通");
				}else{
					console.log("获取历史消息失败, code:" + error.code + ",错误信息:" + error.content);
				}
			}
		});
	},
	onInputMessage(event) { //双向绑定消息 兼容
		this.setData({
			newMessageContent: event.detail.value
		})
	},
	sendMessage(event) {
		//发送消息
		let content = event.target.dataset.content;
		let messageType = event.target.dataset.messagetype;
		if(messageType === this.data.MessageType.CHAT){
			if(this.data.newMessageContent === ""){
				return;
			}else {
				content = this.data.newMessageContent;
			}
		}
		let message = {
			senderNickname: this.data.currentRoom.currentUser.nickname,
			senderUserId: this.data.currentRoom.currentUser.id,
			type: messageType,
			content: content
		};
		pubSub.publish({
			channel : this.data.currentRoom.roomId,
			message : JSON.stringify(message),
			onSuccess : function () {
				console.log("发送成功");
			},
			onFailed : function (error) {
				console.log("消息发送失败，错误编码：" + error.code + " 错误信息：" + error.content);
			}
		});
		this.setData({
			newMessageContent: ""
		});
	},
	propAnimation(type) { //道具动画
		//动画的实现
		if (this.data.propDisplay.timer) {
			return;
		}
		this.setData({
			'propDisplay.showPropType': type,
			'propDisplay.play': true,
			'propDisplay.timer': setTimeout(() => {
				this.setData({
					'propDisplay.play': false,
					'propDisplay.timer': null
				})
			}, 2000)
		});
	},
	scrollBottom(){
		// 滑动到最底部
		wx.pageScrollTo({
			scrollTop : 200000,
			duration :10
		});
	}
});
