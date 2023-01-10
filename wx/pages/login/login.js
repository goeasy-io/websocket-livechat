Page({
	data: {
		avatarList: [
			{id: '1', imgUrl:'../../static/images/1.png'},
			{id: '2', imgUrl:'../../static/images/2.png'},
			{id: '3', imgUrl:'../../static/images/3.png'},
			{id: '4', imgUrl:'../../static/images/4.png'},
			{id: '5', imgUrl:'../../static/images/5.png'},
			{id: '6', imgUrl:'../../static/images/6.png'},
			{id: '7', imgUrl:'../../static/images/7.png'},
			{id: '8', imgUrl:'../../static/images/8.png'}
		],
		roomList: [
			{roomId: "001", name: "程序员集散地"},
			{roomId: "002", name: "舌尖上的中国"},
			{roomId: "003", name: "驴友之家"},
			{roomId: "004", name: "球迷乐翻天"}
		],
		nickname: '',
		selectedAvatar: {
			imgUrl:'',
			id: ''
		},
		selectedRoom: {
			roomId: null,
			roomName: '',
		}
	},
	onShow(){
	    // 初始化数据
		this.setData({
			nickname: "",
			selectedAvatar: {
				imgUrl:'',
				id: ''
			},
			selectedRoom: {
				roomId: null,
				roomName: '',
			}
		});
	},
	onInputUserName(event) {// 输入用户名
		this.setData({
			nickname:event.detail.value
		});
	},
	onSelectAvatar(event) {//选择头像
		let avatar = event.currentTarget.dataset.avatar;
		this.setData({
			selectedAvatar:avatar
		});
	},
	onSelectRoom(event) {//登录
		let room = event.target.dataset.room;
		if (this.data.selectedAvatar.imgUrl !== "" && this.data.nickname !== "") {
			let roomToken = {
				roomId: room.roomId,
				roomName: room.name,
				userId: (Math.random() * 1000).toString(),
				nickname: this.data.nickname,
				avatar: this.data.selectedAvatar.imgUrl
			};
			wx.navigateTo({
				url: `../chatRoom/chatRoom?roomToken=`+JSON.stringify(roomToken)
			})
		}else{
			wx.showToast({
				title: "请输入昵称，并选择头像",
				duration: 2000,
				icon: "none"
			});
		}
	}
});
